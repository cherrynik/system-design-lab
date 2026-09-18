.PHONY: install dev-api dev-web test test-api test-web build build-api build-web

install:
	cd web && pnpm install

dev-api:
	cd api && go run ./cmd/server

dev-web:
	cd web && pnpm dev

test: test-api test-web

test-api:
	cd api && go test ./...

test-web:
	cd web && pnpm test

build: build-api build-web

build-api:
	cd api && go build ./cmd/server

build-web:
	cd web && pnpm build
