//go:build js && wasm

// The static build runs the same API handlers in a worker, without a server.
package main

import (
	"net/http/httptest"
	"strings"
	"syscall/js"

	"system-design-lab/api/internal/application"
	"system-design-lab/api/internal/evaluator"
	"system-design-lab/api/internal/exercises"
	"system-design-lab/api/internal/transport/httpapi"
)

func main() {
	exercise := exercises.ClientService()
	service := application.NewService(exercise, evaluator.New(exercise.Requirement.ID))
	handler := httpapi.New(service, nil, httpapi.Config{})

	request := js.FuncOf(func(_ js.Value, args []js.Value) any {
		req := httptest.NewRequest(args[0].String(), args[1].String(), strings.NewReader(args[2].String()))
		req.Header.Set("Content-Type", "application/json")
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, req)
		return map[string]any{"status": recorder.Code, "body": recorder.Body.String()}
	})
	js.Global().Set("systemDesignRequest", request)
	select {}
}
