/**
 * Toshihiko - Test utilities - Hack functions
 */

export function whereOnce(parent: any, assume: any): { called: number } {
    const $where = parent.where.bind(parent);
    const called = { called: 0 };

    parent.where = function (where: any) {
        expect(where).toEqual(assume);
        parent.where = $where;
        called.called++;
        return $where(where);
    };

    return called;
}

export function connOnce(parent: any, assume: any): { called: number } {
    const $conn = parent.conn.bind(parent);
    const called = { called: 0 };

    parent.conn = function (conn: any) {
        expect(conn).toEqual(assume);
        parent.conn = $conn;
        called.called++;
        return $conn(conn);
    };

    return called;
}

export function hackOnce(obj: any, name: string): void {
    const old = obj[name];
    const called = { called: 0 };
    obj[name] = function (...args: any[]) {
        called.called++;
        obj[name] = old;
        return obj[name].apply(null, args);
    };
}

export function hackSyncErr(obj: any, name: string, whichCall?: number): void {
    whichCall = whichCall || 1;
    const old = obj[name];
    let called = 0;

    obj[name] = function (...args: any[]) {
        called++;

        if (called === whichCall) {
            obj[name] = old;
            throw new Error(`${name} predefinition ${called}`);
        }

        return old.apply(obj, args);
    };
}

export function hackSyncReturn(obj: any, name: string, result: any, whichCall?: number): void {
    whichCall = whichCall || 1;
    const old = obj[name];
    let called = 0;

    obj[name] = function (...args: any[]) {
        called++;

        if (called === whichCall) {
            obj[name] = old;
            return result;
        }

        return old.apply(obj, args);
    };
}

export function hackAsyncErr(obj: any, name: string, whichCall?: number): void {
    whichCall = whichCall || 1;
    const old = obj[name];
    let called = 0;

    obj[name] = function (...args: any[]) {
        called++;

        let callback: Function | undefined;
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === "function") callback = args[i];
        }

        if (called === whichCall) {
            obj[name] = old;
            if (callback) {
                callback(new Error(`${name} predefinition ${called}`));
            }
            return;
        }

        return old.apply(obj, args);
    };
}

export function hackAsyncReturn(obj: any, name: string, results: any[], whichCall?: number): void {
    whichCall = whichCall || 1;
    const old = obj[name];
    let called = 0;

    obj[name] = function (...args: any[]) {
        called++;

        let callback: Function | undefined;
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === "function") callback = args[i];
        }

        if (called === whichCall) {
            obj[name] = old;
            if (callback) {
                callback.apply(null, results);
            }
            return;
        }

        return old.apply(obj, args);
    };
}

export default {
    whereOnce,
    connOnce,
    hackOnce,
    hackSyncErr,
    hackSyncReturn,
    hackAsyncErr,
    hackAsyncReturn,
};
