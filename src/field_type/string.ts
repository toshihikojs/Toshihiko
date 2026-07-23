/**
 * Toshihiko - String field type
 */

import { BaseType } from "../types";

const Str: BaseType<string> = {
    name: "String",
    needQuotes: true,
    defaultValue: "",

    /**
     * Restore parsed value to database format
     */
    restore(parsed: any): string {
        if (undefined === parsed || null === parsed) {
            return "";
        }
        return parsed.toString();
    },

    /**
     * Parse original database value
     */
    parse(orig: any): string {
        if (undefined === orig || null === orig) {
            return "";
        }
        return orig.toString();
    },

    /**
     * Check equality
     */
    equal(a: any, b: any): boolean {
        if (a === b) {
            return true;
        }

        try {
            return a.toString() === b.toString();
        } catch (e) {
            return false;
        }
    },
};

export default Str;
