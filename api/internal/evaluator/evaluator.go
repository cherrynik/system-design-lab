package evaluator

import (
	"context"

	"system-design-lab/api/internal/domain"
)

type Evaluator struct {
	requirementID string
}

func New(requirementID string) Evaluator {
	return Evaluator{requirementID: requirementID}
}

func (e Evaluator) Evaluate(ctx context.Context, architecture domain.Architecture) ([]domain.ValidationResult, error) {
	result, err := e.evaluateClientReachesService(ctx, architecture)
	if err != nil {
		return nil, err
	}

	return []domain.ValidationResult{result}, nil
}

func (e Evaluator) evaluateClientReachesService(ctx context.Context, architecture domain.Architecture) (domain.ValidationResult, error) {
	clients := nodeIDsByKind(architecture.Nodes, domain.NodeKindClient)
	services := nodeIDsByKind(architecture.Nodes, domain.NodeKindService)

	if len(clients) == 0 {
		return e.failed("Add at least one client node.", nil), nil
	}

	if len(services) == 0 {
		return e.failed("Add at least one service node.", clients), nil
	}

	serviceSet := make(map[string]struct{}, len(services))
	for _, id := range services {
		serviceSet[id] = struct{}{}
	}

	nodeSet := make(map[string]struct{}, len(architecture.Nodes))
	for _, node := range architecture.Nodes {
		nodeSet[node.ID] = struct{}{}
	}

	adjacency := make(map[string][]string, len(architecture.Nodes))
	for _, edge := range architecture.Edges {
		if _, ok := nodeSet[edge.From]; !ok {
			continue
		}
		if _, ok := nodeSet[edge.To]; !ok {
			continue
		}
		adjacency[edge.From] = append(adjacency[edge.From], edge.To)
	}

	for _, clientID := range clients {
		target, ok, err := reachableTarget(ctx, clientID, serviceSet, adjacency)
		if err != nil {
			return domain.ValidationResult{}, err
		}
		if ok {
			return domain.ValidationResult{
				RequirementID: e.requirementID,
				Status:        domain.ValidationStatusPassed,
				Message:       "A directed path exists from a client to a service.",
				InvolvedNodes: []string{clientID, target},
			}, nil
		}
	}

	return e.failed("No directed path exists from a client to a service.", append(clients, services...)), nil
}

func reachableTarget(ctx context.Context, start string, targets map[string]struct{}, adjacency map[string][]string) (string, bool, error) {
	queue := []string{start}
	visited := map[string]bool{start: true}

	for index := 0; index < len(queue); index++ {
		if err := ctx.Err(); err != nil {
			return "", false, err
		}

		current := queue[index]

		if _, ok := targets[current]; ok {
			return current, true, nil
		}

		for _, next := range adjacency[current] {
			if !visited[next] {
				visited[next] = true
				queue = append(queue, next)
			}
		}
	}

	return "", false, nil
}

func nodeIDsByKind(nodes []domain.Node, kind domain.NodeKind) []string {
	ids := make([]string, 0)
	for _, node := range nodes {
		if node.Kind == kind {
			ids = append(ids, node.ID)
		}
	}
	return ids
}

func (e Evaluator) failed(message string, involvedNodes []string) domain.ValidationResult {
	return domain.ValidationResult{
		RequirementID: e.requirementID,
		Status:        domain.ValidationStatusFailed,
		Message:       message,
		InvolvedNodes: involvedNodes,
	}
}
