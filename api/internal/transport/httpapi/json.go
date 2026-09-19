package httpapi

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
)

type decodeErrorKind uint8

const (
	decodeErrorInvalid decodeErrorKind = iota
	decodeErrorTooLarge
)

type decodeError struct {
	kind  decodeErrorKind
	cause error
}

func (e *decodeError) Error() string {
	return fmt.Sprintf("decode JSON: %v", e.cause)
}

func (e *decodeError) Unwrap() error {
	return e.cause
}

func decodeJSON[T any](w http.ResponseWriter, r *http.Request, limit int64) (T, error) {
	var value T

	body := http.MaxBytesReader(w, r.Body, limit)
	decoder := json.NewDecoder(body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&value); err != nil {
		return value, classifyDecodeError(err)
	}

	var trailing any
	if err := decoder.Decode(&trailing); !errors.Is(err, io.EOF) {
		if err == nil {
			err = errors.New("request body must contain a single JSON value")
		}
		return value, classifyDecodeError(err)
	}

	return value, nil
}

func classifyDecodeError(err error) error {
	var maxBytesError *http.MaxBytesError
	if errors.As(err, &maxBytesError) {
		return &decodeError{kind: decodeErrorTooLarge, cause: err}
	}
	return &decodeError{kind: decodeErrorInvalid, cause: err}
}

func writeJSON(w http.ResponseWriter, status int, value any) error {
	var body bytes.Buffer
	if err := json.NewEncoder(&body).Encode(value); err != nil {
		return fmt.Errorf("encode JSON response: %w", err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if _, err := io.Copy(w, &body); err != nil {
		return fmt.Errorf("write JSON response: %w", err)
	}
	return nil
}
