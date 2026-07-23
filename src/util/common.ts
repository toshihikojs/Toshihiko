/**
 * Toshihiko - Common utilities
 */

import _ from "lodash";
import createDebug from "debug";
import { ObjStatic, PromisifiedCallback } from "../types";

const debug = createDebug("toshihiko:common");

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;

/**
 * Get param names for a function
 */
export function getParamNames(func: Function): string[] {
    const fnStr = func.toString().replace(STRIP_COMMENTS, "");
    debug("function detected.", fnStr);
    const result = fnStr.slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")")).match(ARGUMENT_NAMES);
    return (null === result) ? [] : result;
}

/**
 * Extend object with defaults
 */
export function extend(_default: ObjStatic | undefined, options: ObjStatic): ObjStatic {
    _default = _default || {};
    const obj = _.cloneDeep(options);

    for (const key in _default) {
        if (!Object.prototype.hasOwnProperty.call(_default, key)) continue;

        if (undefined === obj[key]) {
            obj[key] = _.cloneDeep(_default[key]);
            continue;
        }

        if (typeof _default[key] === "object" && typeof obj[key] === "object") {
            obj[key] = extend(_default[key], obj[key]);
            continue;
        }
    }

    return obj;
}

/**
 * Make a callback function promisify
 */
export function promisify(callback?: Function): PromisifiedCallback {
    let resolve!: (value: any) => void;
    let reject!: (reason?: any) => void;

    const q = new Promise(function (_resolve, _reject) {
        resolve = _resolve;
        reject = _reject;
    });

    // let it be compatible with 0.9
    (q as any).$promise = q;

    const newCallback = function (this: any, ...args: any[]) {
        if (typeof callback === "function") {
            callback.apply(null, args);
        }

        if (args[0]) {
            reject(args[0]);
        } else {
            resolve(args[1]);
        }
    } as unknown as PromisifiedCallback;

    newCallback.promise = q;

    return newCallback;
}

export default {
    getParamNames,
    extend,
    promisify,
};
