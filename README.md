# Toshihiko

A simple ORM for node.js in Huaban.

## Installation

```sh
$ npm install toshihiko
```

## Document

### Init

You should create a `Toshihiko` object to connect to MySQL:

```javascript
var Toshihiko = require("toshihiko").Toshihiko;
var toshihiko = new Toshihiko(database, username, password, options);
```

***Options*** can include these things:

+ `host`: hostname or IP of MySQL. Defaults to `localhost`.
+ `port`: port of MySQL. Defaults to `3306`.
+ `memcached`: if you want to memcached support, let it be an `Memcached` object which will be mentioned below. Defaults
  to undefined.
+ etc... (All options in module [mysql](https://www.npmjs.org/package/mysql#pool-options) will be OK)
