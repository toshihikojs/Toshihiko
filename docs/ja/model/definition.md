# Model の定義

Model はテーブル名をフィールド一覧に対応付け、その Schema を実行時マッピングと TypeScript 推論の共通ソースとして使用します。

```typescript
const User = database.define('users', [
  {
    name: 'id',
    column: 'user_id',
    type: Type.Integer,
    primaryKey: true,
    autoIncrement: true,
  },
  { name: 'name', type: Type.String, defaultValue: 'anonymous' },
]);
```

## フィールドオプション

| オプション | 意味 |
|---|---|
| `name` | Model、Query、Yukari が使用する必須の論理名。 |
| `column` | データベース列名。既定値は `name`。 |
| `type` | Field Type。既定値は `Type.String`。 |
| `primaryKey` | 主キー。複合主キーにも対応。 |
| `autoIncrement` | 挿入後の読み戻しに使う自動生成フィールド。 |
| `allowNull` | `null` の検証と型推論を有効化。 |
| `defaultValue` | `build()` で省略された場合にコピーする値。 |
| `validators` | 順番に実行する 1 つ以上の Validator。 |

JavaScript 実行時は snake_case 別名も正規化します。TypeScript では表の camelCase 名を使用してください。

## 主キー

単一主キーは値を直接渡します。複合主キーはオブジェクトを渡します。

```typescript
await User.findById(1);
await Membership.findById({ userId: 1, teamId: 2 });
```

主キーのない Model も検索できますが、更新、削除、Cache に安定したロケーターがありません。可能なら明示的な主キーを定義してください。

## デフォルト値と Validator

フィールドの `defaultValue` は型のデフォルト値を上書きし、可変値は `build()` ごとにディープコピーされます。

```typescript
const Score = database.define('scores', [{
  name: 'value',
  type: Type.Integer,
  defaultValue: 0,
  validators: async (value) => {
    if (value < 0) return 'score must not be negative';
  },
}]);
```

空でないメッセージは `Error` になります。`validateAll()`、`insert()`、`update()` は非同期 Validator を待ちます。

## カスタム Model メソッド

```typescript
const User = database.define('users', userSchema, {
  methods: {
    findByName(name: string) {
      return this.where({ name }).findOne();
    },
    findByNameTwice(name: string) {
      return Promise.all([this.findByName(name), this.findByName(name)]);
    },
  },
});
```

`this` は Model とすべてのカスタムメソッドとして推論されます。メソッド短縮記法または通常の `function` を使います。動的な `this` が必要な場合はアロー関数を使わないでください。

JavaScript では `define()` 後の直接代入も引き続き動作します。ただし後からの代入で TypeScript の既存変数型を広げることはできません。

## Cache オプション

Model は Toshihiko の Cache を継承します。別の Cache で置換するか、`false` または `null` で無効化できます。

```typescript
const Audit = database.define('audit', auditSchema, { cache: false });
```

## 補助型

```typescript
type UserRow = InferModelRow<typeof User>;
type UserPrimaryKey = InferModelPrimaryKey<typeof User>;
```
