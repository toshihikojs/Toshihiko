/**
 * Toshihiko - Main class
 */

import _ from "lodash";
import { EventEmitter2 } from "eventemitter2";

import { getParamNames, promisify } from "./util/common";
import { ToshihikoModel } from "./model";
import { ObjStatic, ToshihikoOptions, SchemaDefinition, ModelOptions, CacheOptions, CacheInstance, ResultCallback, PromisifiedCallback } from "./types";

export class Toshihiko extends EventEmitter2 {
    public options: ToshihikoOptions;
    public adapter: any;
    public cache: CacheInstance | null;

    constructor(Adapter: any, options?: ToshihikoOptions) {
        super();

        this.options = options || {};
        const opt = _.cloneDeep(this.options);

        // Create the adapter
        if (typeof Adapter === "string") {
            Adapter = require(`./adapters/${Adapter}`).default;
        }
        this.adapter = new Adapter(this, options);

        if (opt.cache) {
            this.cache = Toshihiko.createCache(opt.cache as CacheOptions);
        } else {
            this.cache = null;
        }
    }

    /**
     * Get database name
     */
    get database(): string {
        return this.adapter.getDBName();
    }

    /**
     * Do adapter's execute
     */
    execute(...args: any[]): Promise<any> {
        let trueCallback: Function = function () {};
        let cbIdx: number | undefined;

        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === "function") {
                trueCallback = args[i];
                cbIdx = i;
            }
        }

        const promisifiedCallback = promisify(trueCallback) as PromisifiedCallback;
        if (cbIdx === undefined) {
            args.push(promisifiedCallback);
        } else {
            args[cbIdx] = promisifiedCallback;
        }

        this.adapter.execute.apply(this.adapter, args);

        return promisifiedCallback.promise;
    }

    /**
     * Define a model
     */
    define(collectionName: string, schema: SchemaDefinition[], options?: ModelOptions): ToshihikoModel {
        const model = new ToshihikoModel(collectionName, this, schema, options);
        return model;
    }

    /**
     * Create a cache object
     */
    static createCache(param: CacheOptions | CacheInstance): CacheInstance | null {
        // If param itself is a cache instance
        if (typeof (param as CacheInstance).deleteData === "function" &&
            typeof (param as CacheInstance).deleteKeys === "function" &&
            typeof (param as CacheInstance).setData === "function" &&
            typeof (param as CacheInstance).getData === "function") {
            return param as CacheInstance;
        }

        const cacheParam = param as CacheOptions;
        let path: string | undefined;
        if (cacheParam.module) {
            path = "$$$";
        } else if (cacheParam.path) {
            path = cacheParam.path;
        } else if (cacheParam.name) {
            path = `toshihiko-${cacheParam.name}`;
        } else {
            return null;
        }

        const m = cacheParam.module ? cacheParam.module : require(path!);
        const func = m.create;
        const keys = getParamNames(func);

        // Fill param.?? to Cache.create
        return func.apply(undefined, keys.map((key: string) => (cacheParam as ObjStatic)[key]));
    }
}

export default Toshihiko;
