TIMEOUT = 3000
MOCHA = ./node_modules/.bin/_mocha
MOCHA_OPTIONS = -t $(TIMEOUT) --recursive -r ./test/util/common.js --exit
ISTANBUL = ./node_modules/.bin/istanbul
COVERALLS = ./node_modules/coveralls/bin/coveralls.js

clean:
	@rm -rf node_modules

install:
	@npm install -d --registry=https://registry.npmmirror.com/

debug-test:
	@NODE_ENV=test DEBUG=toshihiko:* $(MOCHA) -t $(TIMEOUT) --recursive

test:
	@NODE_ENV=test $(MOCHA) $(MOCHA_OPTIONS)

coverage:
	@NODE_ENV=test $(ISTANBUL) cover $(MOCHA) -- $(MOCHA_OPTIONS)

before-test-travis: install
	@mysql -e 'create database toshihiko;' & \
		memcached -p 11211 -d

test-coveralls: install
	NODE_ENV=test $(ISTANBUL) cover $(MOCHA) \
		--report lcovonly \
		-- \
		$(MOCHA_OPTIONS) \
		-R spec && cat ./coverage/lcov.info | \
		\
		$(COVERALLS) && rm -rf ./coverage 

.PHONY: test coverage
