package domain

type Exercise struct {
	ID          string
	Title       string
	Description string
	Requirement Requirement
}

type Requirement struct {
	ID          string
	Title       string
	Description string
}
