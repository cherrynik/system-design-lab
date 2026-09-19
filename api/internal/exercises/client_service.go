package exercises

import "system-design-lab/api/internal/domain"

const ClientReachesServiceRequirementID = "client-reaches-service"

func ClientService() domain.Exercise {
	return domain.Exercise{
		ID:          "connect-client-to-service",
		Title:       "Connect a client to a service",
		Description: "Build a directed request path from a client to a service. Intermediate load balancers are allowed.",
		Requirement: domain.Requirement{
			ID:          ClientReachesServiceRequirementID,
			Title:       "Client can reach a service",
			Description: "At least one directed path must exist from a client node to a service node.",
		},
	}
}
