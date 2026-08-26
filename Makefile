TIMEOUT = 3000
MOCHA = ./node_modules/.bin/_mocha
MOCHA_OPTIONS = -t $(TIMEOUT) -r ./test/util/common.js --exit
UNIT_TESTS = test/*.js test/field_type/*.js test/yukari/*.js test/adapters/base.js
ISTANBUL = ./node_modules/.bin/istanbul
COVERALLS = ./node_modules/coveralls/bin/coveralls.js

clean:
	@rm -rf node_modules

install:
	@npm install -d --registry=https://registry.npmmirror.com/

debug-test:
	@NODE_ENV=test DEBUG=toshihiko:* $(MOCHA) $(MOCHA_OPTIONS) $(UNIT_TESTS)

test:
	@npm run test:unit

integration-test:
	@npm run test:integration

coverage:
	@NODE_ENV=test $(ISTANBUL) cover $(MOCHA) -- $(MOCHA_OPTIONS) $(UNIT_TESTS)

.PHONY: test integration-test coverage
