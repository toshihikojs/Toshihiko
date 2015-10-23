# Toshihiko ChangeLog

## 2015-10-23, Version 0.6.0, @XadillaX

### Notable Changes

+ Remove [SugarJs](http://sugarjs.com/) dependency, and use [lodash](https://lodash.com/) insteaded. (My supervisor told that do not use invasive package)
  - Remove [SugarJs](http://sugarjs.com/) - see #26
  - Fix migration bugs - see 7458203

### Commits
  + [91b05b0532] - Remove [SugarJs](http://sugarjs.com/) dependency, and use [lodash](https://lodash.com/) insteaded.
  + [74582035e2] - Fix migration bugs.
  + [aa90281628, 58800abfdb, 586e7eaa61, 5de52a4226, 3f07a179d9, 1ff2887395, e506ee9254] - Update some test cases.

## 2015-10-19, Version 0.5.5, @XadillaX

### Notable Changes

+ Add warning output when defining a model without primary key(s) because of query cache optimization.

### Commits

+ [3a067ee30e] - Add warning output when defining a model without primary key(s).
