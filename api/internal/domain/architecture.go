package domain

type NodeKind string

const (
	NodeKindClient       NodeKind = "client"
	NodeKindLoadBalancer NodeKind = "load-balancer"
	NodeKindService      NodeKind = "service"
)

type Node struct {
	ID   string
	Kind NodeKind
}

type Edge struct {
	From string
	To   string
}

type Architecture struct {
	Nodes []Node
	Edges []Edge
}
