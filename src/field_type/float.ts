/**
 * Toshihiko - Float field type
 */

import { BaseType } from "../types";

const Float: BaseType<number> = {
    name: "Float",
    needQuotes: false,
    defaultValue: 0.0,

    /**
     * Restore parsed value to database format
     */
    restore(parsed: any): number {
        return parseFloat(parsed);
    },

    /**
     * Parse original database value
     */
    parse(orig: any): number {
        return parseFloat(orig);
    },

    /**
     * Check equality
     */
    equal(a: any, b: any): boolean {
        if (a === b) {
            return true;
        }
        return parseFloat(a) === parseFloat(b);
    },
};

export default Float;
