Toshihiko is yet another simple Node.js ORM with cache layer.

<div id="teaser-home">
    <img src="toshihiko.jpeg" alt="Toshihiko | Yet another simple Node.js ORM" />
    <span>Toshihiko</span>
</div>

[Installation](getting-started.md)

> It only support MySQL so far.

## What Toshihiko Is

**Toshihiko** is a simple ORM, with cache layer and high performance query methods.

**Toshihiko** isn't a complex ORM, <span style="color: red;">**NO**</span>:

+ foreign key;
+ anything that is not CURD (like create table / update table structure);
+ relation between tables;
+ low performance query methods;
+ etc.

For performance, use Toshihiko as simple as you can.

> I believe that human being is much more reliable than machines. If not, try hard to make yourself more reliable than them!
>
> **So don't let ORM do too much things, like creating table.**

## Example Usage

```javascript
const T = require("toshihiko");
const toshihiko = new T.Toshihiko("mysql", {
    username: "root",
    password: "",
    database: "toshihiko"
});

// !!! create the table by yourself
const User = toshihiko.define("user", [
    { name: "username", type: T.Type.String, primaryKey: true },
    { name: "birthday", type: T.Type.Datetime }
]);

User.findById("Alice", function(err, user) {
    console.log(err, user);
});
```

## About Toshihiko's Name

If you're [Touhou](https://www.touhouwiki.net) fans, you may understand me.

***Toshihiko*** is a character in '[Touhou Warring States Nights](http://tieba.baidu.com/p/1386358409)' (TWSN) and TWSN is a collaborative content creation of Touhou.
