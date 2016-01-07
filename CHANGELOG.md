## [0.7.0](https://github.com/XadillaX/Toshihiko/compare/0.6.4...v0.7.0) (2016-01-07)

### Features

* add commit message validation to git precommit hook ([8e178f2](https://github.com/XadillaX/Toshihiko/commit/8e178f2))
* re-add toshihiko-memcached as the default cache layout ([a84f93c](https://github.com/XadillaX/Toshihiko/commit/a84f93c))
* update package.json to v0.7.0 ([b57f469](https://github.com/XadillaX/Toshihiko/commit/b57f469))
* use ghooks instead of precommit-hooks ([0c3ebd4](https://github.com/XadillaX/Toshihiko/commit/0c3ebd4))

## 2016-01-05, Version 0.6.4, @XadillaX

### Notable Changes

  + Rename all `*.js` source files into underscore filenames. eg. `fieldType` to `field_type`. - see [#31](https://github.com/XadillaX/Toshihiko/pull/31)
  + Fix a bug that generated an invalid SQL while use `Array` in `$neq`. - see [#32](http://github.com/XadillaX/Toshihiko/pull/32)

### Commits
  + [[df37bd062e](https://github.com/XadillaX/Toshihiko/commit/df37bd062e)] - Make the code more friendly with scope.
  + [[c088f3f7eb](https://github.com/XadillaX/Toshihiko/commit/c088f3f7eb)] - Rename filenames to underscore ones.
  + [[3b319f71c2](https://github.com/XadillaX/Toshihiko/commit/3b319f71c2)] - Change the require order in source files. (System > Denpendencies > Local)
  + [[eda60efc38](https://github.com/XadillaX/Toshihiko/commit/eda60efc38)] - Fix a bug that generated an invalid SQL while use `Array` in `$neq`.

## 2015-12-15, Version 0.6.3, @XadillaX

### Notable Changes

  + Cancel error when `update` in `Yukari` without change. - see [#9d222d5367](https://github.com/XadillaX/Toshihiko/commit/9d222d53677970375feb13e861cfc80bee265998)

### Commits
  + [[9d222d5367](https://github.com/XadillaX/Toshihiko/commit/9d222d5367)] - Cancel error when `update` in `Yukari` without change.
  + [[466a4a59a4](https://github.com/XadillaX/Toshihiko/commit/466a4a59a4)] - Update dependencies.
  + [[268f6b1418](https://github.com/XadillaX/Toshihiko/commit/268f6b1418)] - Update devDependencies.

## 2015-11-24, Version 0.6.2, @Luicfer

### Notable Changes

  + Find in memcached first when `findById`. - see [#29](https://github.com/XadillaX/Toshihiko/pull/29)

### Commits
  + [[50b4a6e2c0](https://github.com/XadillaX/Toshihiko/commit/50b4a6e2c0)] - Optimize performance of `findById`.
  + [[b04d36b173](https://github.com/XadillaX/Toshihiko/commit/b04d36b173)] - Add a new test case.
  + [[b855545c1b](https://github.com/XadillaX/Toshihiko/commit/b855545c1b)] - Add precommit hook for git repo.

## 2015-11-2, Version 0.6.1, @XadillaX

### Notable Changes

  + Add **0** field type support. - see [#27](https://github.com/XadillaX/Toshihiko/pull/27)

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
