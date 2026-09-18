package model

type ValidationStatus string

const (
	ValidationStatusPassed ValidationStatus = "passed"
	ValidationStatusFailed ValidationStatus = "failed"
)

type ValidationResult struct {
	RequirementID string           `json:"requirementId"`
	Status        ValidationStatus `json:"status"`
	Message       string           `json:"message"`
	InvolvedNodes []string         `json:"involvedNodeIds,omitempty"`
}
