.PHONY: dev build lint install

dev:
	npx vite --port 6688

build:
	npx vite build

lint:
	npx eslint src

install:
	npm install
