package main

import (
	"encoding/json"
	"log"
	"net/http"

	"system-design-lab/api/internal/evaluator"
	"system-design-lab/api/internal/exercises"
	"system-design-lab/api/internal/model"
)

type evaluateResponse struct {
	Results []model.ValidationResult `json:"results"`
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/exercise", getExercise)
	mux.HandleFunc("POST /api/evaluate", evaluate)

	server := &http.Server{
		Addr:    ":8080",
		Handler: withCORS(mux),
	}

	log.Printf("API listening on %s", server.Addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}

func getExercise(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, exercises.ClientService())
}

func evaluate(w http.ResponseWriter, r *http.Request) {
	var architecture model.Architecture
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&architecture); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid architecture payload"})
		return
	}

	writeJSON(w, http.StatusOK, evaluateResponse{Results: evaluator.Evaluate(architecture)})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("encode response: %v", err)
	}
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
