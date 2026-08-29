import { escape, escapeLike } from '@toshihiko/sql-utils';
import type {
  Adapter as AdapterContract,
  AdapterConstructor,
  AdapterExecuteSpec,
  AdapterOperationResult,
  AdapterQuery,
  DefaultAdapterExecuteSpec,
} from './contracts/adapter';
import type { DataValue } from './contracts/common';
import { loadAdapter } from './toshihiko';

export {
  Type,
  type BooleanStorageValue,
  type DatetimeStorageValue,
  type JsonStorageValue,
  type JsonValue,
  type NumberStorageValue,
  type StringStorageValue,
} from './field-types';
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
  Model = object,
  Connection = object,
  Field = object,
  Value = DataValue,
  Query extends AdapterQuery<Model, Connection> = AdapterQuery<Model, Connection>,
  ExecuteSpec extends AdapterExecuteSpec<
    readonly DataValue[],
    readonly DataValue[],
    AdapterOperationResult
  > = DefaultAdapterExecuteSpec,
> = AdapterContract<Model, Connection, Field, Value, Query, ExecuteSpec>;

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
  DefaultAdapterExecuteSpec,
  AdapterExecuteArguments,
  AdapterExecuteResult,
  AdapterExecuteSpec,
  AdapterFindOptions,
  AdapterFindResult,
  AdapterLike,
  AdapterModel,
  AdapterOperationResult,
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
export type {
  DataRow,
  DataValue,
  FieldName,
  RowShape,
} from './contracts/common';
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
  ModelDefinitionOptions,
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
