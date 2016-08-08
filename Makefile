TIMEOUT = 3000
MOCHA = ./node_modules/.bin/_mocha
ISTANBUL = ./node_modules/.bin/istanbul
COVERALLS = ./node_modules/coveralls/bin/coveralls.js

clean:
	@rm -rf node_modules

install:
	@npm install -d --registry=http://registry.npm.taobao.org/

debug-test:
	@NODE_ENV=test DEBUG=toshihiko:* $(MOCHA) -t $(TIMEOUT) --recursive

test:
	@NODE_ENV=test $(MOCHA) -t $(TIMEOUT) --recursive

before-test-travis: install
	@mysql -e 'create database toshihiko;' & \
		memcached -p 11211 -d

test-coveralls: install
	NODE_ENV=test $(ISTANBUL) cover $(MOCHA) \
		--report lcovonly \
		-- \
		-t $(TIMEOUT) --recursive \
		-R spec && cat ./coverage/lcov.info | \
		\
		$(COVERALLS) && rm -rf ./coverage 

.PHONY: test
