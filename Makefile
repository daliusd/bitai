.PHONY: run deploy build test

PORT ?= 9876
APPS := cholesterolis kraujospudis

run:
	npx --yes http-server . -p $(PORT) -c-1

build:
	for app in $(APPS); do \
		(cd apps/$$app && npm ci && npx vite build --outDir ../../$$app --emptyOutDir) || exit 1; \
	done

test:
	for app in $(APPS); do \
		(cd apps/$$app && npx vitest run) || exit 1; \
	done

deploy:
	kamal deploy
