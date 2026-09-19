package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"system-design-lab/api/internal/application"
	"system-design-lab/api/internal/config"
	"system-design-lab/api/internal/evaluator"
	"system-design-lab/api/internal/exercises"
	"system-design-lab/api/internal/transport/httpapi"
)

const (
	readHeaderTimeout = 5 * time.Second
	readTimeout       = 15 * time.Second
	writeTimeout      = 15 * time.Second
	idleTimeout       = 60 * time.Second
	shutdownTimeout   = 10 * time.Second
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := run(ctx, logger); err != nil {
		logger.Error("API stopped", "error", err)
		os.Exit(1)
	}
}

func run(ctx context.Context, logger *slog.Logger) error {
	configuration := config.Load()
	exercise := exercises.ClientService()
	evaluationService := evaluator.New(exercise.Requirement.ID)
	labService := application.NewService(exercise, evaluationService)

	handler := httpapi.New(labService, logger, httpapi.Config{
		AllowedOrigin: configuration.AllowedOrigin,
	})
	server := &http.Server{
		Addr:              configuration.Address,
		Handler:           handler,
		ErrorLog:          slog.NewLogLogger(logger.Handler(), slog.LevelError),
		ReadHeaderTimeout: readHeaderTimeout,
		ReadTimeout:       readTimeout,
		WriteTimeout:      writeTimeout,
		IdleTimeout:       idleTimeout,
	}

	serverErrors := make(chan error, 1)
	go func() {
		logger.Info("API listening", "address", server.Addr)
		serverErrors <- server.ListenAndServe()
	}()

	select {
	case err := <-serverErrors:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	case <-ctx.Done():
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		return err
	}

	err := <-serverErrors
	if !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	logger.Info("API stopped gracefully")
	return nil
}
