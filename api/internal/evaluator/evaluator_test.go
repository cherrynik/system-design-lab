package evaluator

import (
	"testing"

	"system-design-lab/api/internal/model"
)

func TestEvaluateClientReachesService(t *testing.T) {
	tests := []struct {
		name         string
		architecture model.Architecture
		wantStatus   model.ValidationStatus
	}{
		{
			name: "direct path passes",
			architecture: model.Architecture{
				Nodes: []model.Node{{ID: "client", Kind: model.NodeKindClient}, {ID: "service", Kind: model.NodeKindService}},
				Edges: []model.Edge{{From: "client", To: "service"}},
			},
			wantStatus: model.ValidationStatusPassed,
		},
		{
			name: "intermediate load balancer passes",
			architecture: model.Architecture{
				Nodes: []model.Node{
					{ID: "client", Kind: model.NodeKindClient},
					{ID: "lb", Kind: model.NodeKindLoadBalancer},
					{ID: "service", Kind: model.NodeKindService},
				},
				Edges: []model.Edge{{From: "client", To: "lb"}, {From: "lb", To: "service"}},
			},
			wantStatus: model.ValidationStatusPassed,
		},
		{
			name: "disconnected nodes fail",
			architecture: model.Architecture{
				Nodes: []model.Node{{ID: "client", Kind: model.NodeKindClient}, {ID: "service", Kind: model.NodeKindService}},
			},
			wantStatus: model.ValidationStatusFailed,
		},
		{
			name: "reversed edge fails",
			architecture: model.Architecture{
				Nodes: []model.Node{{ID: "client", Kind: model.NodeKindClient}, {ID: "service", Kind: model.NodeKindService}},
				Edges: []model.Edge{{From: "service", To: "client"}},
			},
			wantStatus: model.ValidationStatusFailed,
		},
		{
			name: "cycle terminates and fails",
			architecture: model.Architecture{
				Nodes: []model.Node{
					{ID: "client", Kind: model.NodeKindClient},
					{ID: "lb", Kind: model.NodeKindLoadBalancer},
					{ID: "service", Kind: model.NodeKindService},
				},
				Edges: []model.Edge{{From: "client", To: "lb"}, {From: "lb", To: "client"}},
			},
			wantStatus: model.ValidationStatusFailed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results := Evaluate(tt.architecture)
			if len(results) != 1 {
				t.Fatalf("expected one result, got %d", len(results))
			}
			if results[0].Status != tt.wantStatus {
				t.Fatalf("expected status %q, got %q (%s)", tt.wantStatus, results[0].Status, results[0].Message)
			}
		})
	}
}
