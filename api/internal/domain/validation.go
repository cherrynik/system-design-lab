package domain

type ValidationStatus string

const (
	ValidationStatusPassed ValidationStatus = "passed"
	ValidationStatusFailed ValidationStatus = "failed"
)

type ValidationResult struct {
	RequirementID string
	Status        ValidationStatus
	Message       string
	InvolvedNodes []string
}
