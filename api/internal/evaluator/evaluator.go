package evaluator

import (
	"system-design-lab/api/internal/exercises"
	"system-design-lab/api/internal/model"
)

func Evaluate(architecture model.Architecture) []model.ValidationResult {
	return []model.ValidationResult{evaluateClientReachesService(architecture)}
}

func evaluateClientReachesService(architecture model.Architecture) model.ValidationResult {
	clients := nodeIDsByKind(architecture.Nodes, model.NodeKindClient)
	services := nodeIDsByKind(architecture.Nodes, model.NodeKindService)

	if len(clients) == 0 {
		return failed("Add at least one client node.", nil)
	}

	if len(services) == 0 {
		return failed("Add at least one service node.", clients)
	}

	serviceSet := make(map[string]struct{}, len(services))
	for _, id := range services {
		serviceSet[id] = struct{}{}
	}

	adjacency := make(map[string][]string, len(architecture.Nodes))
	for _, edge := range architecture.Edges {
		adjacency[edge.From] = append(adjacency[edge.From], edge.To)
	}

	for _, clientID := range clients {
		if target, ok := reachableTarget(clientID, serviceSet, adjacency); ok {
			return model.ValidationResult{
				RequirementID: exercises.ClientReachesServiceRequirementID,
				Status:        model.ValidationStatusPassed,
				Message:       "A directed path exists from a client to a service.",
				InvolvedNodes: []string{clientID, target},
			}
		}
	}

	return failed("No directed path exists from a client to a service.", append(clients, services...))
}

func reachableTarget(start string, targets map[string]struct{}, adjacency map[string][]string) (string, bool) {
	queue := []string{start}
	visited := map[string]bool{start: true}

	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]

		if _, ok := targets[current]; ok {
			return current, true
		}

		for _, next := range adjacency[current] {
			if !visited[next] {
				visited[next] = true
				queue = append(queue, next)
			}
		}
	}

	return "", false
}

func nodeIDsByKind(nodes []model.Node, kind model.NodeKind) []string {
	ids := make([]string, 0)
	for _, node := range nodes {
		if node.Kind == kind {
			ids = append(ids, node.ID)
		}
	}
	return ids
}

func failed(message string, involvedNodes []string) model.ValidationResult {
	return model.ValidationResult{
		RequirementID: exercises.ClientReachesServiceRequirementID,
		Status:        model.ValidationStatusFailed,
		Message:       message,
		InvolvedNodes: involvedNodes,
	}
}
