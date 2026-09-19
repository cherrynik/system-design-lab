package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	"system-design-lab/api/internal/application"
	"system-design-lab/api/internal/domain"
	"system-design-lab/api/internal/evaluator"
	"system-design-lab/api/internal/exercises"
)

func TestExerciseEndpointPreservesContract(t *testing.T) {
	t.Parallel()

	response := performRequest(newContractHandler(), http.MethodGet, "/api/exercise", "")
	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
	if got := response.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("Content-Type = %q, want application/json", got)
	}

	var got exerciseResponse
	decodeResponse(t, response, &got)
	want := toExerciseResponse(exercises.ClientService())
	if !reflect.DeepEqual(got, want) {
		t.Errorf("response = %#v, want %#v", got, want)
	}
}

func TestEvaluateEndpointPreservesContract(t *testing.T) {
	t.Parallel()

	body := `{"nodes":[{"id":"client","kind":"client"},{"id":"lb","kind":"load-balancer"},{"id":"service","kind":"service"}],"edges":[{"from":"client","to":"lb"},{"from":"lb","to":"service"}]}`
	response := performRequest(newContractHandler(), http.MethodPost, "/api/evaluate", body)
	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body = %s", response.Code, http.StatusOK, response.Body.String())
	}

	var got evaluateResponse
	decodeResponse(t, response, &got)
	want := evaluateResponse{Results: []validationResultResponse{{
		RequirementID: "client-reaches-service",
		Status:        domain.ValidationStatusPassed,
		Message:       "A directed path exists from a client to a service.",
		InvolvedNodes: []string{"client", "service"},
	}}}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("response = %#v, want %#v", got, want)
	}
}

func TestEvaluateRejectsInvalidJSON(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		body string
	}{
		{name: "empty body", body: ""},
		{name: "malformed body", body: `{"nodes":`},
		{name: "unknown field", body: `{"nodes":[],"edges":[],"unexpected":true}`},
		{name: "multiple values", body: `{"nodes":[],"edges":[]} {"nodes":[],"edges":[]}`},
		{name: "wrong top-level type", body: `[]`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			response := performRequest(newContractHandler(), http.MethodPost, "/api/evaluate", tt.body)
			assertErrorResponse(t, response, http.StatusBadRequest, "invalid architecture payload")
		})
	}
}

func TestEvaluateRejectsOversizedBody(t *testing.T) {
	t.Parallel()

	handler := New(successfulApplication(), discardLogger(), Config{MaxRequestBodySize: 8})
	response := performRequest(handler, http.MethodPost, "/api/evaluate", `{"nodes":[],"edges":[]}`)
	assertErrorResponse(t, response, http.StatusRequestEntityTooLarge, "architecture payload is too large")
}

func TestApplicationErrorsAreReturnedWithoutLeakingDetails(t *testing.T) {
	t.Parallel()

	privateError := errors.New("database password must never reach the client")
	tests := []struct {
		name        string
		application Application
		method      string
		path        string
		body        string
		wantMessage string
	}{
		{
			name: "exercise error",
			application: stubApplication{
				exercise: func(context.Context) (domain.Exercise, error) { return domain.Exercise{}, privateError },
			},
			method:      http.MethodGet,
			path:        "/api/exercise",
			wantMessage: "exercise could not be loaded",
		},
		{
			name: "evaluation error",
			application: stubApplication{
				evaluate: func(context.Context, domain.Architecture) ([]domain.ValidationResult, error) {
					return nil, privateError
				},
			},
			method:      http.MethodPost,
			path:        "/api/evaluate",
			body:        `{"nodes":[],"edges":[]}`,
			wantMessage: "architecture could not be evaluated",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			response := performRequest(New(tt.application, discardLogger(), Config{}), tt.method, tt.path, tt.body)
			assertErrorResponse(t, response, http.StatusInternalServerError, tt.wantMessage)
			if strings.Contains(response.Body.String(), privateError.Error()) {
				t.Fatalf("response leaked internal error: %s", response.Body.String())
			}
		})
	}
}

func TestCORSAndRouting(t *testing.T) {
	t.Parallel()

	const allowedOrigin = "http://localhost:5173"
	handler := New(successfulApplication(), discardLogger(), Config{AllowedOrigin: allowedOrigin})

	t.Run("preflight", func(t *testing.T) {
		response := performRequest(handler, http.MethodOptions, "/api/evaluate", "")
		if response.Code != http.StatusNoContent {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusNoContent)
		}
		if got := response.Header().Get("Access-Control-Allow-Origin"); got != allowedOrigin {
			t.Errorf("Access-Control-Allow-Origin = %q, want %q", got, allowedOrigin)
		}
		if got := response.Header().Get("Access-Control-Allow-Methods"); got != "GET, POST, OPTIONS" {
			t.Errorf("Access-Control-Allow-Methods = %q", got)
		}
	})

	t.Run("unsupported method", func(t *testing.T) {
		response := performRequest(handler, http.MethodPut, "/api/evaluate", "")
		if response.Code != http.StatusMethodNotAllowed {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusMethodNotAllowed)
		}
	})

	t.Run("unknown route", func(t *testing.T) {
		response := performRequest(handler, http.MethodGet, "/api/unknown", "")
		if response.Code != http.StatusNotFound {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusNotFound)
		}
	})
}

type stubApplication struct {
	exercise func(context.Context) (domain.Exercise, error)
	evaluate func(context.Context, domain.Architecture) ([]domain.ValidationResult, error)
}

func (s stubApplication) Exercise(ctx context.Context) (domain.Exercise, error) {
	if s.exercise == nil {
		return domain.Exercise{}, nil
	}
	return s.exercise(ctx)
}

func (s stubApplication) Evaluate(ctx context.Context, architecture domain.Architecture) ([]domain.ValidationResult, error) {
	if s.evaluate == nil {
		return nil, nil
	}
	return s.evaluate(ctx, architecture)
}

func successfulApplication() Application {
	return stubApplication{
		exercise: func(context.Context) (domain.Exercise, error) { return exercises.ClientService(), nil },
		evaluate: func(context.Context, domain.Architecture) ([]domain.ValidationResult, error) {
			return []domain.ValidationResult{}, nil
		},
	}
}

func newContractHandler() http.Handler {
	exercise := exercises.ClientService()
	service := application.NewService(exercise, evaluator.New(exercise.Requirement.ID))
	return New(service, discardLogger(), Config{})
}

func discardLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

func performRequest(handler http.Handler, method, path, body string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(method, path, strings.NewReader(body))
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	return response
}

func decodeResponse(t *testing.T, response *httptest.ResponseRecorder, target any) {
	t.Helper()
	if err := json.NewDecoder(response.Body).Decode(target); err != nil {
		t.Fatalf("decode response: %v", err)
	}
}

func assertErrorResponse(t *testing.T, response *httptest.ResponseRecorder, wantStatus int, wantMessage string) {
	t.Helper()
	if response.Code != wantStatus {
		t.Fatalf("status = %d, want %d; body = %s", response.Code, wantStatus, response.Body.String())
	}
	var got errorResponse
	decodeResponse(t, response, &got)
	if got.Error != wantMessage {
		t.Errorf("error = %q, want %q", got.Error, wantMessage)
	}
}
