import { escape, escapeLike } from '@toshihiko/sql-utils';
import type {
  Adapter as AdapterContract,
  AdapterConstructor,
  AdapterQuery,
} from './contracts/adapter';
import { loadAdapter } from './toshihiko';

export { Type, type JsonValue } from './field-types';
export { Toshihiko, type ToshihikoOptions } from './toshihiko';

export const Escaper = { escape, escapeLike };

export const Adapter = {
  get base(): AdapterConstructor {
    return loadAdapter('base');
  },
  get mysql(): AdapterConstructor {
    return loadAdapter('mysql');
  },
};

export type Adapter<
  Model = unknown,
  Connection = unknown,
  Field = unknown,
  Value = unknown,
  Query extends AdapterQuery<Model, Connection> = AdapterQuery<Model, Connection>,
> = AdapterContract<Model, Connection, Field, Value, Query>;

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
  adapterExecuteSpec,
  AdapterBeginTransactionArguments,
  AdapterConnection,
  AdapterCommitArguments,
  AdapterCommitResult,
  AdapterConstructor,
  AdapterCountQueryType,
  AdapterData,
  AdapterDeleteQueryType,
  AdapterDeleteByQueryResult,
  AdapterExecuteArguments,
  AdapterExecuteResult,
  AdapterExecuteSpec,
  AdapterFindOptions,
  AdapterFindResult,
  AdapterLike,
  AdapterModel,
  AdapterQuery,
  AdapterQueryExecuteArguments,
  AdapterRollbackArguments,
  AdapterRow,
  AdapterSource,
  AdapterTransactionConnection,
  AdapterUpdateConnection,
  AdapterUpdateByQueryResult,
  AdapterUpdateByQueryCallArguments,
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
  FieldDefinitionStorageValue,
  FieldType,
  FieldTypeStorageValue,
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
  QueryFindManyOptions,
  QueryFindOneOptions,
  QueryFindOptions,
  QueryJsonRow,
  QueryOrder,
  QueryOrderDirection,
  QueryWhere,
} from './query';
