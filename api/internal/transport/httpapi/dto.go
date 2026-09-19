package httpapi

import "system-design-lab/api/internal/domain"

type architectureRequest struct {
	Nodes []nodeRequest `json:"nodes"`
	Edges []edgeRequest `json:"edges"`
}

type nodeRequest struct {
	ID   string          `json:"id"`
	Kind domain.NodeKind `json:"kind"`
}

type edgeRequest struct {
	From string `json:"from"`
	To   string `json:"to"`
}

type exerciseResponse struct {
	ID          string              `json:"id"`
	Title       string              `json:"title"`
	Description string              `json:"description"`
	Requirement requirementResponse `json:"requirement"`
}

type requirementResponse struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type evaluateResponse struct {
	Results []validationResultResponse `json:"results"`
}

type validationResultResponse struct {
	RequirementID string                  `json:"requirementId"`
	Status        domain.ValidationStatus `json:"status"`
	Message       string                  `json:"message"`
	InvolvedNodes []string                `json:"involvedNodeIds,omitempty"`
}

func (request architectureRequest) toDomain() domain.Architecture {
	architecture := domain.Architecture{
		Nodes: make([]domain.Node, len(request.Nodes)),
		Edges: make([]domain.Edge, len(request.Edges)),
	}
	for index, node := range request.Nodes {
		architecture.Nodes[index] = domain.Node{ID: node.ID, Kind: node.Kind}
	}
	for index, edge := range request.Edges {
		architecture.Edges[index] = domain.Edge{From: edge.From, To: edge.To}
	}
	return architecture
}

func toExerciseResponse(exercise domain.Exercise) exerciseResponse {
	return exerciseResponse{
		ID:          exercise.ID,
		Title:       exercise.Title,
		Description: exercise.Description,
		Requirement: requirementResponse{
			ID:          exercise.Requirement.ID,
			Title:       exercise.Requirement.Title,
			Description: exercise.Requirement.Description,
		},
	}
}

func toEvaluateResponse(results []domain.ValidationResult) evaluateResponse {
	response := evaluateResponse{Results: make([]validationResultResponse, len(results))}
	for index, result := range results {
		response.Results[index] = validationResultResponse{
			RequirementID: result.RequirementID,
			Status:        result.Status,
			Message:       result.Message,
			InvolvedNodes: result.InvolvedNodes,
		}
	}
	return response
}
