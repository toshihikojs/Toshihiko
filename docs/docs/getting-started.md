## Installation

Toshihiko is available via NPM.

```sh
$ npm install --save toshihiko

# Install adapter layer
#
# If you're using MySQL, you should install mysql2 or mysql (mysql2 is recommended)
$ npm install --save mysql2
$ npm install --save mysql

# If you want to use memcached / redis / aliyun OCS as your cache layer:
$ npm install --save toshihiko-memcached
$ npm install --save toshihiko-redis
$ npm install --save toshihiko-aliyun-ocs

# And if you don't want to use cache layer, just do nothing
```

## Setting Up a Connection

```javascript
const T = require("toshihiko");

const dialect = "mysql";    // it only supports MySQL so far
const options = {           // options for MySQL
    username: "root",
    password: "",
    database: "toshihiko",
    host: "localhost",
    port: 3306,
    charset: "utf8mb4_bin",
    connectionLimit: 10,
    showSql: true,

    cache: {
        // cache options, if have
    }
};
const toshihiko = new T.Toshihiko(dialect, options);

// You may implement your dialect
```

The Toshihiko constructor takes a whole slew of options that are available via the [API Reference](#).

## Your First Model

Models are defined with `toshihiko.define("name", [ fields ], { options })`.

```javascript
const User = toshihiko.define("user", [
    { name: "username", type: T.Type.String, primaryKey: true },
    { name: "birthday", type: T.Type.Datetime }
], {
    cache: {
        // local cache options, if have
    }
});
```

Many more options can be found in the [Model API Reference](#).

> For **Toshihiko** is simple enough, it even not provides methods like `sync` and so on. You should create table by yourself in other ways.

## Callback vs. Promise

Toshihiko's query methods support both callback and promise way.

```javascript
User.findById("Alice", function(err, user) {
    console.log(err, user);
});

// or

User.findById("Alice").then(function(user) {
    console.log(user);
}).error(function(e) {
    console.log(e);
});

// or

const user = yeild User.findById("Alice");
```

The promise object you got is implemented by [Bluebird](http://bluebirdjs.com/docs/api-reference.html).

> To compitable with [0.9](https://github.com/XadillaX/Toshihiko/blob/0.9.0/README.md#-ω-promise-liked), you can use `.method().$promise` as your promise object as well.
