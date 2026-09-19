package evaluator

import (
	"context"
	"errors"
	"reflect"
	"testing"

	"system-design-lab/api/internal/domain"
)

func TestEvaluateClientReachesService(t *testing.T) {
	t.Parallel()

	const requirementID = "client-reaches-service"
	tests := []struct {
		name              string
		architecture      domain.Architecture
		wantStatus        domain.ValidationStatus
		wantMessage       string
		wantInvolvedNodes []string
	}{
		{
			name: "direct path passes",
			architecture: domain.Architecture{
				Nodes: []domain.Node{{ID: "client", Kind: domain.NodeKindClient}, {ID: "service", Kind: domain.NodeKindService}},
				Edges: []domain.Edge{{From: "client", To: "service"}},
			},
			wantStatus:        domain.ValidationStatusPassed,
			wantMessage:       "A directed path exists from a client to a service.",
			wantInvolvedNodes: []string{"client", "service"},
		},
		{
			name: "intermediate load balancer passes",
			architecture: domain.Architecture{
				Nodes: []domain.Node{
					{ID: "client", Kind: domain.NodeKindClient},
					{ID: "lb", Kind: domain.NodeKindLoadBalancer},
					{ID: "service", Kind: domain.NodeKindService},
				},
				Edges: []domain.Edge{{From: "client", To: "lb"}, {From: "lb", To: "service"}},
			},
			wantStatus:        domain.ValidationStatusPassed,
			wantMessage:       "A directed path exists from a client to a service.",
			wantInvolvedNodes: []string{"client", "service"},
		},
		{
			name: "one reachable client is enough",
			architecture: domain.Architecture{
				Nodes: []domain.Node{
					{ID: "disconnected-client", Kind: domain.NodeKindClient},
					{ID: "connected-client", Kind: domain.NodeKindClient},
					{ID: "service", Kind: domain.NodeKindService},
				},
				Edges: []domain.Edge{{From: "connected-client", To: "service"}},
			},
			wantStatus:        domain.ValidationStatusPassed,
			wantMessage:       "A directed path exists from a client to a service.",
			wantInvolvedNodes: []string{"connected-client", "service"},
		},
		{
			name: "cycle with an exit to a service passes",
			architecture: domain.Architecture{
				Nodes: []domain.Node{
					{ID: "client", Kind: domain.NodeKindClient},
					{ID: "lb", Kind: domain.NodeKindLoadBalancer},
					{ID: "service", Kind: domain.NodeKindService},
				},
				Edges: []domain.Edge{{From: "client", To: "lb"}, {From: "lb", To: "client"}, {From: "lb", To: "service"}},
			},
			wantStatus:        domain.ValidationStatusPassed,
			wantMessage:       "A directed path exists from a client to a service.",
			wantInvolvedNodes: []string{"client", "service"},
		},
		{
			name: "disconnected nodes fail",
			architecture: domain.Architecture{
				Nodes: []domain.Node{{ID: "client", Kind: domain.NodeKindClient}, {ID: "service", Kind: domain.NodeKindService}},
			},
			wantStatus:        domain.ValidationStatusFailed,
			wantMessage:       "No directed path exists from a client to a service.",
			wantInvolvedNodes: []string{"client", "service"},
		},
		{
			name: "reversed edge fails",
			architecture: domain.Architecture{
				Nodes: []domain.Node{{ID: "client", Kind: domain.NodeKindClient}, {ID: "service", Kind: domain.NodeKindService}},
				Edges: []domain.Edge{{From: "service", To: "client"}},
			},
			wantStatus:        domain.ValidationStatusFailed,
			wantMessage:       "No directed path exists from a client to a service.",
			wantInvolvedNodes: []string{"client", "service"},
		},
		{
			name: "closed cycle terminates and fails",
			architecture: domain.Architecture{
				Nodes: []domain.Node{
					{ID: "client", Kind: domain.NodeKindClient},
					{ID: "lb", Kind: domain.NodeKindLoadBalancer},
					{ID: "service", Kind: domain.NodeKindService},
				},
				Edges: []domain.Edge{{From: "client", To: "lb"}, {From: "lb", To: "client"}},
			},
			wantStatus:        domain.ValidationStatusFailed,
			wantMessage:       "No directed path exists from a client to a service.",
			wantInvolvedNodes: []string{"client", "service"},
		},
		{
			name: "path through an undeclared node fails",
			architecture: domain.Architecture{
				Nodes: []domain.Node{{ID: "client", Kind: domain.NodeKindClient}, {ID: "service", Kind: domain.NodeKindService}},
				Edges: []domain.Edge{{From: "client", To: "ghost"}, {From: "ghost", To: "service"}},
			},
			wantStatus:        domain.ValidationStatusFailed,
			wantMessage:       "No directed path exists from a client to a service.",
			wantInvolvedNodes: []string{"client", "service"},
		},
		{
			name:              "missing client explains the failure",
			architecture:      domain.Architecture{Nodes: []domain.Node{{ID: "service", Kind: domain.NodeKindService}}},
			wantStatus:        domain.ValidationStatusFailed,
			wantMessage:       "Add at least one client node.",
			wantInvolvedNodes: nil,
		},
		{
			name:              "missing service identifies clients",
			architecture:      domain.Architecture{Nodes: []domain.Node{{ID: "client", Kind: domain.NodeKindClient}}},
			wantStatus:        domain.ValidationStatusFailed,
			wantMessage:       "Add at least one service node.",
			wantInvolvedNodes: []string{"client"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			results, err := New(requirementID).Evaluate(context.Background(), tt.architecture)
			if err != nil {
				t.Fatalf("Evaluate() error = %v", err)
			}
			if len(results) != 1 {
				t.Fatalf("Evaluate() returned %d results, want 1", len(results))
			}

			result := results[0]
			if result.RequirementID != requirementID {
				t.Errorf("RequirementID = %q, want %q", result.RequirementID, requirementID)
			}
			if result.Status != tt.wantStatus {
				t.Errorf("Status = %q, want %q", result.Status, tt.wantStatus)
			}
			if result.Message != tt.wantMessage {
				t.Errorf("Message = %q, want %q", result.Message, tt.wantMessage)
			}
			if !reflect.DeepEqual(result.InvolvedNodes, tt.wantInvolvedNodes) {
				t.Errorf("InvolvedNodes = %v, want %v", result.InvolvedNodes, tt.wantInvolvedNodes)
			}
		})
	}
}

func TestEvaluateHonorsCanceledContext(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	architecture := domain.Architecture{
		Nodes: []domain.Node{{ID: "client", Kind: domain.NodeKindClient}, {ID: "service", Kind: domain.NodeKindService}},
	}

	_, err := New("requirement").Evaluate(ctx, architecture)
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("Evaluate() error = %v, want context.Canceled", err)
	}
}
