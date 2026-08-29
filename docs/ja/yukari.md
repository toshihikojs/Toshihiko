# Yukari 行

Yukari は Model に結び付いた 1 行です。この名前はプロジェクトの人物設定に由来します。Toshihiko は八雲紫（Yakumo Yukari）の分身、すなわち彼女が別の身体に現れたインスタンスです。ORM のレコードも具体的なオブジェクトインスタンスとして表されるため、API はそれを `Yukari` と名付けました。

各 Yukari は、ローカル構築、検索結果、削除済みのいずれかの状態を保持します。名前の背景は[コアコンセプト](concepts.md#toshihiko-と-yukari-という名前の由来)を参照してください。

## 構築と挿入

```typescript
const user = User.build({ name: 'Alice', birthday: null });
await user.insert();
```

`insert()` は現在のフィールドを検証し、Field Type で保存値へ戻し、Adapter を呼び出し、自動採番 ID などを同じオブジェクトへコピーします。挿入しても新規 Yukari の状態は変わりません。

## 更新

```typescript
const found = await User.findById(1);
if (found) {
  found.name = 'Updated Alice';
  await found.update();
}
```

検索された Yukari は元のスナップショットを保持します。`update()` は現在値との差を計算し、元の主キーで行を特定し、成功後にスナップショットを更新します。

## 削除と保存

```typescript
if (found) await found.delete();

await User.build({ name: 'Alice' }).save(); // insert
if (found) await found.save();              // update
```

新規 Yukari では `update()` と `delete()` を呼べません。削除済み Yukari をその後の書き込みに再利用しないでください。

## 検証と JSON

`validateOne()` は 1 フィールド、`validateAll()` は存在するマッピング済みフィールドを検証します。`allowNull: true` の場合だけ `null` を許可します。

`toJSON()` は現在値、`toJSON(true)` は検索時の元のスナップショットをシリアライズし、Field Type が `Date` などの変換を制御します。
