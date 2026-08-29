---
layout: home

hero:
  name: Toshihiko
  text: Node.js 向けの、もうひとつのシンプルな ORM。
  image:
    src: /logo.png
    alt: Toshihiko
  actions:
    - theme: brand
      text: はじめる
      link: /ja/getting-started
    - theme: alt
      text: コアコンセプト
      link: /ja/concepts

features:
  - title: Schema からの型推論
    details: フィールド、主キー、検索条件、Yukari 行、JSON 出力を 1 つの Model 定義から導出します。
  - title: Model API
    details: define()、where()、find()、findById()、build()、save() が Model・Query・Yukari の操作フローを構成します。
  - title: ネイティブ Promise API
    details: クエリ、Adapter、Cache、Validator、書き込み、トランザクションはネイティブ Promise を使用します。
---

## 最初の Model

```typescript
import { Toshihiko, Type } from 'toshihiko';

const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  password: 'secret',
  username: 'root',
});

const User = database.define('users', [
  {
    name: 'id',
    column: 'user_id',
    type: Type.Integer,
    primaryKey: true,
    autoIncrement: true,
  },
  { name: 'name', type: Type.String },
], {
  methods: {
    findByName(name: string) {
      return this.where({ name }).findOne();
    },
  },
});

const user = User.build({ name: 'Alice' });
await user.insert();

const found = await User.findByName('Alice');
```

Schema は実行時マッピングと TypeScript の入力を兼ねます。フィールド値、主キー、検索条件、行プロパティ、カスタム Model メソッドのために別のインターフェースを保守する必要はありません。

::: warning プロジェクトの状態
Toshihiko v2 は開発中です。現在のパッケージはプレリリース版で、Node.js 22 以降が必要です。
:::

## 読み進め方

- [はじめに](getting-started.md)：MySQL で CRUD を一通り実行します。
- [コアコンセプト](concepts.md)：Toshihiko、Model、Query、Yukari、Adapter、Cache を理解します。
- [Model の定義](model/definition.md)：フィールド、主キー、Validator、デフォルト値、カスタムメソッドを説明します。
- [クエリ](querying.md)：条件、順序、フィールド選択、件数制限、戻り値を説明します。
- [v1 からの移行](migration-v1.md)：既存アプリケーションを v2 に移行します。
- [API リファレンス](api.md)：公開クラス、メソッド、補助型を確認します。
