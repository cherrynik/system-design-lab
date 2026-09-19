.PHONY: install dev-api dev-web storybook test test-api test-web check check-api check-web build build-api build-web

GO ?= go

install:
	pnpm --dir web install

dev-api:
	$(GO) -C api run ./cmd/server

dev-web:
	pnpm --dir web dev

storybook:
	pnpm --dir web storybook

test: test-api test-web

test-api:
	$(GO) -C api test ./...

test-web:
	pnpm --dir web test:coverage

check: check-api check-web

check-api:
	$(GO) -C api test -race ./...
	$(GO) -C api vet ./...
	$(GO) -C api build ./...

check-web:
	pnpm --dir web check
	pnpm --dir web build
	pnpm --dir web storybook:build
	pnpm --dir web exec playwright test --workers=1

build: build-api build-web

build-api:
	$(GO) -C api build ./cmd/server

build-web:
	pnpm --dir web build
