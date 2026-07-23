/**
 * Toshihiko - Base Adapter
 */

import createDebug from "debug";
import { EventEmitter2 } from "eventemitter2";

import { extend } from "../util/common";
import { ObjStatic, ResultCallback } from "../types";

const debug = createDebug("toshihiko:adapter:base");

export class BaseAdapter extends EventEmitter2 {
    public readonly parent: any;
    public options: ObjStatic;

    constructor(parent: any, options?: ObjStatic) {
        super();

        this.parent = parent;
        this.options = extend({}, options || {});

        debug("created.", this);
    }

    /**
     * Find records
     */
    find(query: any, callback: ResultCallback, options?: ObjStatic): void {
        options = null as any;
        process.nextTick(function () {
            callback(new Error("this adapter's find function is not implemented yet."));
        });
    }

    /**
     * Count records
     */
    count(query: any, callback: ResultCallback): void {
        process.nextTick(function () {
            callback(new Error("this adapter's count function is not implemented yet."));
        });
    }

    /**
     * Update by query
     */
    updateByQuery(query: any, callback: ResultCallback): void {
        process.nextTick(function () {
            callback(new Error("this adapter's updateByQuery function is not implemented yet."));
        });
    }

    /**
     * Delete by query
     */
    deleteByQuery(query: any, callback: ResultCallback): void {
        process.nextTick(function () {
            callback(new Error("this adapter's deleteByQuery function is not implemented yet."));
        });
    }

    /**
     * Insert record
     */
    insert(model: any, conn: any, data: any[], callback: ResultCallback): void {
        process.nextTick(function () {
            callback(new Error("this adapter's insert function is not implemented yet."));
        });
    }

    /**
     * Update record
     */
    update(model: any, conn: any, pk: ObjStatic, data: any[], callback: ResultCallback): void {
        process.nextTick(function () {
            callback(new Error("this adapter's update function is not implemented yet."));
        });
    }

    /**
     * Execute SQL
     */
    execute(...args: any[]): void {
        const callback = args[args.length - 1];
        process.nextTick(function () {
            callback(new Error("this adapter's execute function is not implemented yet."));
        });
    }

    /**
     * Get database name
     */
    getDBName(): string {
        return "";
    }

    /**
     * Begin transaction
     */
    beginTransaction(callback: ResultCallback): void {
        process.nextTick(function () {
            callback(new Error("this adapter's beginTransaction function is not implemented yet."));
        });
    }

    /**
     * Commit transaction
     */
    commit(conn: any, callback: ResultCallback): void {
        process.nextTick(function () {
            callback(new Error("this adapter's commit function is not implemented yet."));
        });
    }

    /**
     * Rollback transaction
     */
    rollback(conn: any, callback: ResultCallback): void {
        process.nextTick(function () {
            callback(new Error("this adapter's rollback function is not implemented yet."));
        });
    }
}

export default BaseAdapter;
