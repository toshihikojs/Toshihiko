# はじめに

既存の MySQL テーブルから始め、接続、Model 定義、挿入、検索、更新、削除までを実行します。

## 必要な環境

Toshihiko v2 には Node.js 22 以降が必要です。現在のパッケージは `2.0.0-alpha` プレリリース系列です。

## インストール

```bash
npm install toshihiko @toshihiko/mysql-adapter
```

MySQL Adapter は `mysql2` の Promise Pool を使用します。scoped Adapter をインストールすれば、`mysql` dialect 名を利用できます。

## テーブルを用意する

Toshihiko はテーブルを作成しません。既存の Schema またはマイグレーションツールを使用します。

```sql
CREATE TABLE `users` (
  `user_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `birthday` DATETIME NULL,
  PRIMARY KEY (`user_id`)
);
```

## 接続を作る

```typescript
import { Toshihiko, Type } from 'toshihiko';

const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  password: 'secret',
  port: 3306,
  username: 'root',
});
```

`MySQLAdapter` コンストラクターを直接注入することもできます。

## Model を定義する

```typescript
const User = database.define('users', [
  {
    name: 'id',
    column: 'user_id',
    type: Type.Integer,
    primaryKey: true,
    autoIncrement: true,
  },
  { name: 'name', type: Type.String },
  { name: 'birthday', type: Type.Datetime, allowNull: true },
]);
```

`name` はコード上のプロパティ、`column` はデータベース列です。この Schema から TypeScript の型も導出されます。

## 挿入して検索する

```typescript
const user = User.build({ name: 'Alice', birthday: null });
await user.insert();

const found = await User.findById(user.id);
console.log(found?.name);
```

`insert()` はフィールドを検証し、Adapter で保存し、自動採番 ID などの戻り値を同じオブジェクトに反映します。

```typescript
const users = await User
  .where({ id: { $gte: 1 }, name: { $like: 'A%' } })
  .orderBy({ id: 'desc' })
  .limit(20)
  .find();
```

## 更新して削除する

```typescript
const found = await User.findById(1);
if (found) {
  found.name = 'Updated Alice';
  await found.save();
  await found.delete();
}
```

検索された Yukari は元の値を保持します。`build()` した Yukari は挿入後も新規行なので、更新や削除の前に検索し直します。

## プレーンオブジェクトを返す

```typescript
const rows = await User.where({ name: 'Alice' }).find(true);
const row = await User.findById(1, true);
```

真偽値引数は JSON 変換を有効にします。たとえば `Date` は Field Type によって文字列へ変換されます。
