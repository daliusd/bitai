.PHONY: run deploy build test

PORT ?= 9876

run:
	npx --yes http-server . -p $(PORT) -c-1

build:
	cd apps/cholesterolis && npm ci && npx vite build --outDir ../../cholesterolis --emptyOutDir

test:
	cd apps/cholesterolis && npx vitest run

deploy:
	kamal deploy
