# `Yukari`

Yukari は行単位の object です。Schema フィールドはインスタンス上の enumerable で直接読み書きできるプロパティになります。`Model.build()` または検索結果から得られます。

## 行の型

```typescript
type BuiltYukari<
  Name extends string,
  Schema extends SchemaDefinition,
  Input extends BuildInput<Schema>,
  AdapterInstance extends AdapterLike = Adapter,
> = Yukari<Name, Schema, AdapterInstance>
  & Omit<
    BuiltRowFromSchema<Schema, Input>,
    keyof Yukari<Name, Schema, AdapterInstance>
  >;

type QueriedYukari<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike = Adapter,
> = Yukari<Name, Schema, AdapterInstance>
  & Omit<
    Partial<RowFromSchema<Schema>>,
    keyof Yukari<Name, Schema, AdapterInstance>
  >;
```

`BuiltYukari` は入力済みフィールドと default field を既知にし、残りを optional にします。`QueriedYukari` は `fields()` による部分選択を表すため、Schema field が optional です。

## ライフサイクル

`build()` した行は `insert()` または `save()` に使い、検索した行は `update()`、`delete()`、`save()` に使います。ライフサイクルと元の値の snapshot は Toshihiko が内部で保持し、アプリケーション API には公開しません。

互換動作として、挿入後の built row は引き続き挿入用として扱われます。更新または削除の前に検索し直してください。

## 検証

```typescript
validateOne<Field extends FieldName<RowFromSchema<Schema>>>(
  name: Field,
  value: RowFromSchema<Schema>[Field],
): Promise<void>
validateAll(): Promise<void>
```

存在しないフィールド、null 非許可フィールドへの `null`、Validator が返した空でない文字列は rejection になります。`validateAll()` はマッピングされたフィールドを最大 10 件並行で検証します。

## 永続化

```typescript
insert(connection?: AdapterConnection<AdapterInstance> | null): Promise<this>
update(connection?: AdapterConnection<AdapterInstance> | null): Promise<this>
delete(connection?: AdapterConnection<AdapterInstance> | null): Promise<true>
save(connection?: AdapterConnection<AdapterInstance> | null): Promise<this>
```

- `insert()` は built row を検証して保存し、データベース生成値を同じ object に反映します。
- `update()` は現在値と内部 snapshot を比較し、元の主キーで行を特定します。
- `delete()` は元の主キーで 1 行を削除します。主キーがなければ元の全フィールドを使います。
- `save()` は built row なら insert、検索した row なら update を実行します。

## `toJSON()`

```typescript
toJSON(useOriginalData?: boolean): Partial<JsonRowFromSchema<Schema>>
```

各 Field Type の `toJSON()` でマッピング済みフィールドをシリアライズします。`true` は変更前 snapshot をシリアライズします。

アプリケーション向けの型は `BuiltYukari` と `QueriedYukari` です。`YukariFieldData` は Adapter 拡張契約専用です。
