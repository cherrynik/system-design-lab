package httpapi

import (
	"context"
	"errors"
	"log/slog"
	"net/http"

	"system-design-lab/api/internal/domain"
)

const defaultMaxRequestBodyBytes int64 = 1 << 20

type Application interface {
	Exercise(context.Context) (domain.Exercise, error)
	Evaluate(context.Context, domain.Architecture) ([]domain.ValidationResult, error)
}

type Config struct {
	AllowedOrigin      string
	MaxRequestBodySize int64
}

type handler struct {
	application        Application
	logger             *slog.Logger
	maxRequestBodySize int64
}

type errorResponse struct {
	Error string `json:"error"`
}

type httpError struct {
	status  int
	message string
	cause   error
}

func (e *httpError) Error() string {
	return e.message
}

func (e *httpError) Unwrap() error {
	return e.cause
}

func New(application Application, logger *slog.Logger, config Config) http.Handler {
	if logger == nil {
		logger = slog.Default()
	}
	if config.MaxRequestBodySize <= 0 {
		config.MaxRequestBodySize = defaultMaxRequestBodyBytes
	}

	h := &handler{
		application:        application,
		logger:             logger,
		maxRequestBodySize: config.MaxRequestBodySize,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/exercise", h.handle(h.getExercise))
	mux.HandleFunc("POST /api/evaluate", h.handle(h.evaluate))

	return withCORS(mux, config.AllowedOrigin)
}

type endpoint func(http.ResponseWriter, *http.Request) *httpError

func (h *handler) handle(endpoint endpoint) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := endpoint(w, r); err != nil {
			logArgs := []any{"method", r.Method, "path", r.URL.Path, "error", err.cause}
			if err.status >= http.StatusInternalServerError {
				h.logger.ErrorContext(r.Context(), "request failed", logArgs...)
			} else {
				h.logger.WarnContext(r.Context(), "request rejected", logArgs...)
			}
			h.writeError(w, err)
		}
	}
}

func (h *handler) getExercise(w http.ResponseWriter, r *http.Request) *httpError {
	exercise, err := h.application.Exercise(r.Context())
	if err != nil {
		return internalError("exercise could not be loaded", err)
	}

	if err := writeJSON(w, http.StatusOK, toExerciseResponse(exercise)); err != nil {
		return internalError("response could not be encoded", err)
	}
	return nil
}

func (h *handler) evaluate(w http.ResponseWriter, r *http.Request) *httpError {
	request, err := decodeJSON[architectureRequest](w, r, h.maxRequestBodySize)
	if err != nil {
		var decodeErr *decodeError
		if errors.As(err, &decodeErr) && decodeErr.kind == decodeErrorTooLarge {
			return &httpError{status: http.StatusRequestEntityTooLarge, message: "architecture payload is too large", cause: err}
		}
		return &httpError{status: http.StatusBadRequest, message: "invalid architecture payload", cause: err}
	}

	results, err := h.application.Evaluate(r.Context(), request.toDomain())
	if err != nil {
		return internalError("architecture could not be evaluated", err)
	}

	if err := writeJSON(w, http.StatusOK, toEvaluateResponse(results)); err != nil {
		return internalError("response could not be encoded", err)
	}
	return nil
}

func (h *handler) writeError(w http.ResponseWriter, requestError *httpError) {
	if err := writeJSON(w, requestError.status, errorResponse{Error: requestError.message}); err != nil {
		h.logger.Error("error response could not be written", "error", err)
	}
}

func internalError(message string, cause error) *httpError {
	return &httpError{status: http.StatusInternalServerError, message: message, cause: cause}
}
