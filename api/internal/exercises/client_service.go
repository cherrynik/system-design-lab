package exercises

const ClientReachesServiceRequirementID = "client-reaches-service"

type Exercise struct {
	ID          string      `json:"id"`
	Title       string      `json:"title"`
	Description string      `json:"description"`
	Requirement Requirement `json:"requirement"`
}

type Requirement struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

func ClientService() Exercise {
	return Exercise{
		ID:          "connect-client-to-service",
		Title:       "Connect a client to a service",
		Description: "Build a directed request path from a client to a service. Intermediate load balancers are allowed.",
		Requirement: Requirement{
			ID:          ClientReachesServiceRequirementID,
			Title:       "Client can reach a service",
			Description: "At least one directed path must exist from a client node to a service node.",
		},
	}
}
