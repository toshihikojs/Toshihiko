/**
 * Toshihiko - Datetime field type
 */

import dayjs from "dayjs";
import { BaseType } from "../types";

const Datetime: BaseType<Date> = {
    name: "Datetime",
    needQuotes: true,

    /**
     * Restore parsed value to database format
     */
    restore(parsed: any): string {
        return dayjs(parsed).format("YYYY-MM-DD HH:mm:ss");
    },

    /**
     * Parse original database value
     */
    parse(orig: any): Date {
        return dayjs(orig).toDate();
    },

    /**
     * Check equality
     */
    equal(a: any, b: any): boolean {
        return dayjs(a).valueOf() === dayjs(b).valueOf();
    },

    /**
     * Convert to JSON
     */
    toJSON(datetime: any): string | null {
        if (datetime === null) return null;
        if (!(datetime instanceof Date)) {
            datetime = dayjs(datetime).toDate();
        }
        return dayjs(datetime).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
    },
};

export default Datetime;
