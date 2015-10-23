TIMEOUT = 3000
MOCHA = ./node_modules/.bin/_mocha
ISTANBUL = ./node_modules/.bin/istanbul
COVERALLS = ./node_modules/coveralls/bin/coveralls.js

clean:
	@rm -rf node_modules

install:
	@npm install -d --registry=http://registry.npm.taobao.org/

test: install
	@NODE_ENV=test $(MOCHA) -t $(TIMEOUT)

before-test-travis: install
	@mysql -e 'create database myapp_test;' & \
		memcached -p 11211 -d & \
  		memcached -p 11212 -d & \
  		memcached -p 11213 -d

test-coveralls: install
	NODE_ENV=test $(ISTANBUL) cover $(MOCHA) \
		--report lcovonly \
		-- \
		-t $(TIMEOUT) \
		-R spec && cat ./coverage/lcov.info | \
		\
		$(COVERALLS) && rm -rf ./coverage 

.PHONY: test
