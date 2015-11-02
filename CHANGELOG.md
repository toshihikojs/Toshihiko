# Toshihiko ChangeLog

## 2015-11-2, Version 0.6.1, @XadillaX

### Notable Changes

+ Add **Boolean** field type support. - see [#27](https://github.com/XadillaX/Toshihiko/pull/27)

### Commits
  + [[fca5f18744](https://github.com/XadillaX/Toshihiko/commit/fca5f18744)] - Add **Boolean** field type support and test cases.
  + [[7ee1c910cb](https://github.com/XadillaX/Toshihiko/commit/7ee1c910cb)] - Remove `npm-shrinkwrap.json`.

## 2015-10-23, Version 0.6.0, @XadillaX

### Notable Changes

+ Remove [SugarJs](http://sugarjs.com/) dependency, and use [lodash](https://lodash.com/) insteaded. (My supervisor told that do not use invasive package)
  - Remove [SugarJs](http://sugarjs.com/) - see [#26](https://github.com/XadillaX/Toshihiko/pull/26)
  - Fix migration bugs - see [7458203](https://github.com/XadillaX/Toshihiko/commit/7458203)

### Commits
  + [[b7c230455e](https://github.com/XadillaX/Toshihiko/commit/b7c230455e)] - Add the `Makefile`.
  + [[91b05b0532](https://github.com/XadillaX/Toshihiko/commit/91b05b0532)] - Remove [SugarJs](http://sugarjs.com/) dependency, and use [lodash](https://lodash.com/) insteaded.
  + [[74582035e2](https://github.com/XadillaX/Toshihiko/commit/74582035e2)] - Fix migration bugs.
  + [[aa90281628](https://github.com/XadillaX/Toshihiko/commit/aa90281628), [58800abfdb](https://github.com/XadillaX/Toshihiko/commit/58800abfdb), [586e7eaa61](https://github.com/XadillaX/Toshihiko/commit/586e7eaa61), [5de52a4226](https://github.com/XadillaX/Toshihiko/commit/5de52a4226), [3f07a179d9](https://github.com/XadillaX/Toshihiko/commit/3f07a179d9), [1ff2887395](1ff2887395), [e506ee9254](https://github.com/XadillaX/Toshihiko/commit/e506ee9254)] - Update some test cases.

## 2015-10-19, Version 0.5.5, @XadillaX

### Notable Changes

+ Add warning output when defining a model without primary key(s) because of query cache optimization.

### Commits

+ [3a067ee30e] - Add warning output when defining a model without primary key(s).
