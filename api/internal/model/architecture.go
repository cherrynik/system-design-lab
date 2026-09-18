package model

type NodeKind string

const (
	NodeKindClient       NodeKind = "client"
	NodeKindLoadBalancer NodeKind = "load-balancer"
	NodeKindService      NodeKind = "service"
)

type Node struct {
	ID   string   `json:"id"`
	Kind NodeKind `json:"kind"`
}

type Edge struct {
	From string `json:"from"`
	To   string `json:"to"`
}

type Architecture struct {
	Nodes []Node `json:"nodes"`
	Edges []Edge `json:"edges"`
}
