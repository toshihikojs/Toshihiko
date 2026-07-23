/**
 * Toshihiko - Boolean field type
 */

import { BaseType } from "../types";

const _Boolean: BaseType<boolean> = {
    name: "_Boolean",
    needQuotes: false,
    defaultValue: 0 as any,

    /**
     * Restore parsed value to database format
     */
    restore(parsed: any): number {
        return (parsed ^ 0) & 1;
    },

    /**
     * Parse original database value
     */
    parse(orig: any): boolean {
        return !!orig;
    },

    /**
     * Check equality
     */
    equal(a: any, b: any): boolean {
        a = !!a;
        b = !!b;
        return a === b;
    },
};

export default _Boolean;
