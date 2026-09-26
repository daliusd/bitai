.PHONY: run deploy

PORT ?= 9876

run:
	npx --yes http-server . -p $(PORT) -c-1

deploy:
	kamal deploy
