/**
 * Toshihiko - Integer field type
 */

import { BaseType } from "../types";

const Integer: BaseType<number> = {
    name: "Integer",
    needQuotes: false,
    defaultValue: 0,

    /**
     * Restore parsed value to database format
     */
    restore(parsed: any): number {
        return parseInt(parsed, 10);
    },

    /**
     * Parse original database value
     */
    parse(orig: any): number {
        return parseInt(orig, 10);
    },

    /**
     * Check equality
     */
    equal(a: any, b: any): boolean {
        if (a === b) {
            return true;
        }
        return parseInt(a, 10) === parseInt(b, 10);
    },
};

export default Integer;
