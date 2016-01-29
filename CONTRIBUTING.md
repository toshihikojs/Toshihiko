# Contributing to Toshihiko

## Code of Conduct

🐣 Under writing.

## Issue Contributions

When opening new issues or commenting on existing issues on this repository please make sure discussions are related to concrete technical issues with [Toshihiko](https://github.com/XadillaX/Toshihiko).

## Code Contributions

This document will guide you through the contribution process.

### Step 1: Fork

Fork the project on [Github](https://github.com/XadillaX/Toshihiko) and check out your copy locally.

```sh
$ git clone git@github.com:username/Toshihiko.git
$ cd Toshihiko
$ git remote add upstream git://github.com/XadillaX/Toshihiko.git
```

#### Which branch?

For developing new features and bug fixes, the `develop` branch should be pulled and built upon.

### Step 2: Branch

Create a feature branch and start hacking:

```sh
$ git checkout -b feature/your_feature_name -t origin/develop
```

### Step 3: Commit

Make sure git knows your name and email address:

```sh
$ git config --global user.name "O. Random Orz"
$ git config --global user.email "o.random.user@orz.com"
```

Writing good commit logs is important. A commit log should describe what changed and why. Follow these [guidelines](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit#heading=h.greljkmo14y0) when writing one.

If you need a Chinese one, please go [here](http://www.ruanyifeng.com/blog/2016/01/commit_message_change_log.html).

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

For an example:

```
docs(README.md): update contributor
```

### Step 4: Rebase

Use `git rebase` (not `git merge`) to sync your work from time to time.

```sh
$ git fetch upstream
$ git rebase upstream/develop
```

### Step 5: Test

Bug fixes and features should come with tests.

For features, add test cases in files under `./test`. And for bug fixes, open an issue and add test cases in `./test/issues.js`.

#### Prepare

To build your test environment, you should do these steps:

* Install MySQL on localhost and leave user `root`'s password blank. Start it.
* Make sure you have no `test` database because test cases will create it at the beginning and drop it after done.
* Create a empty database called `myapp_test`.
* Install [Memcached](http://memcached.org/) on localhost.
* Start 3 memcached instances and listening on port 11211, 11212 and 11213.
  - `$ memcached -d`
  - `$ memcached -d -p 11212`
  - `$ memcached -d -p 11213`
  - if you don't want them to start in daemon mode, remove flag `-d`.

> **Note:** Those steps were created very early by [@luicfer](https://github.com/luicfer) and never optimized. We will someday optimize those test steps to make them easy to test.

#### Run

After you finish your test cases, you may run the tests via command:

```sh
$ make test
```

### Step 6: Push

```sh
$ git push origin feature/your_feature_name
```

Go to https://github.com/yourusername/Toshihiko and select your feature branch. Click the 'Pull Request' button and fill out the form.

Pull requests are usually reviewed within a few days. If there are comments to address, apply your changes in a separate commit and push that to your feature branch. Post a comment in the pull request afterwards; GitHub does not send out notifications when you add commits.

## Developer's Certificate of Origin 1.0

By making a contribution to this project, I certify that:

* (a) The contribution was created in whole or in part by me and I have the right to submit it under the open source license indicated in the file; or
* (b) The contribution is based upon previous work that, to the best of my knowledge, is covered under an appropriate open source license and I have the right under that license to submit that work with modifications, whether created in whole or in part by me, under the same open source license (unless I am permitted to submit under a different license), as indicated in the file; or
* (c) The contribution was provided directly to me by some other person who certified (a), (b) or (c) and I have not modified it.
