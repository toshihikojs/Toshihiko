/**
 * Toshihiko - Json field type
 */

import { BaseType, ObjStatic } from "../types";

const Json: BaseType<ObjStatic> = {
    name: "Json",
    needQuotes: true,
    defaultValue: {},

    /**
     * Restore parsed value to database format
     */
    restore(parsed: any): string {
        return JSON.stringify(parsed);
    },

    /**
     * Parse original database value
     */
    parse(orig: any): ObjStatic {
        try {
            return JSON.parse(orig);
        } catch (e) {
            /* istanbul ignore if */
            if (process.env.NODE_ENV !== "test") {
                console.error(
                    "Toshihiko: Broken json value while parsing JSON type in Toshihiko: " +
                    orig
                );
            }
            return {};
        }
    },

    /**
     * Check equality
     */
    equal(a: any, b: any): boolean {
        if (a === b) {
            return true;
        }

        try {
            return JSON.stringify(a) === JSON.stringify(b);
        } catch (e) {
            return false;
        }
    },
};

export default Json;
