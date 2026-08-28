import { escape, escapeLike } from '@toshihiko/sql-utils';

export { Type, type JsonValue } from './field-types';
export { Toshihiko, type ToshihikoOptions } from './toshihiko';

export const Escaper = { escape, escapeLike };

export type {
  Cache,
  CacheDeleteKeysResult,
  CacheDeleteResult,
  CacheKey,
  CacheModule,
  CacheOptions,
  CacheSetResult,
  CacheSource,
} from './contracts/cache';
export type {
  BuiltYukari,
  QueriedYukari,
  Yukari,
  YukariFieldData,
  YukariSource,
} from './yukari';
export type {
  Adapter,
  AdapterConnection,
  AdapterCommitResult,
  AdapterConstructor,
  AdapterCountQueryType,
  AdapterData,
  AdapterDeleteQueryType,
  AdapterDeleteByQueryResult,
  AdapterExecuteArguments,
  AdapterExecuteResult,
  AdapterFindOptions,
  AdapterFindResult,
  AdapterLike,
  AdapterModel,
  AdapterQuery,
  AdapterQueryExecuteArguments,
  AdapterRow,
  AdapterSource,
  AdapterTransactionConnection,
  AdapterUpdateConnection,
  AdapterUpdateByQueryResult,
  AdapterUpdateByQueryType,
  AdapterUpdateField,
  AdapterUpdateModel,
  AdapterUpdateValue,
  AdapterRollbackResult,
} from './contracts/adapter';
export type { FieldName, RowShape } from './contracts/common';
export type {
  Field,
  FieldDefinition,
  FieldDefinitionJsonValue,
  FieldDefinitionNonNullValue,
  FieldType,
  FieldValidator,
  JsonRowFromSchema,
  PrimaryKeyNames,
  RowFromSchema,
  SchemaDefinition,
  ValidatedSchema,
  ValidatedFieldType,
} from './contracts/field';
export type {
  CompiledSchema,
  BuildInput,
  BuiltRowFromSchema,
  FieldNamesMap,
  InferModelPrimaryKey,
  InferModelRow,
  Model,
  ModelOptions,
  NameToColumnMap,
} from './contracts/model';
export type {
  FindByIdInput,
  Query,
  QueryFieldCondition,
  QueryFieldOperators,
  QueryFindOptions,
  QueryJsonRow,
  QueryOrder,
  QueryOrderDirection,
  QueryWhere,
} from './query';
