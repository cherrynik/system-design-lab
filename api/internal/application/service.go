package application

import (
	"context"

	"system-design-lab/api/internal/domain"
)

// Evaluator is the application port implemented by the deterministic evaluator.
// Keeping the port here lets the use case remain independent from its implementation.
type Evaluator interface {
	Evaluate(context.Context, domain.Architecture) ([]domain.ValidationResult, error)
}

type Service struct {
	exercise  domain.Exercise
	evaluator Evaluator
}

func NewService(exercise domain.Exercise, evaluator Evaluator) *Service {
	return &Service{exercise: exercise, evaluator: evaluator}
}

func (s *Service) Exercise(context.Context) (domain.Exercise, error) {
	return s.exercise, nil
}

func (s *Service) Evaluate(ctx context.Context, architecture domain.Architecture) ([]domain.ValidationResult, error) {
	return s.evaluator.Evaluate(ctx, architecture)
}
