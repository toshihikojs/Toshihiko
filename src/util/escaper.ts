/**
 * Toshihiko - SQL Escaper utilities
 */

/**
 * Escape SQL string
 */
export function escape(str: any): any {
    if (typeof str !== "string") {
        return str;
    }

    return str.split("").reduce(function (str: string, ch: string) {
        switch (ch) {
            case "\n": str += "\\n"; break;
            case "'": str += "\\'"; break;
            case "\"": str += "\\\""; break;
            case "\t": str += "\\t"; break;
            case "\0": str += "\\0"; break;
            case "\r": str += "\\r"; break;
            case "\b": str += "\\b"; break;
            case "\x1a": str += "\\Z"; break;
            case "\\": str += "\\\\"; break;
            default: str += ch; break;
        }
        return str;
    }, "");
}

/**
 * Escape SQL string for LIKE
 */
export function escapeLike(str: string): string {
    return str.split("").reduce(function (str: string, ch: string) {
        if (ch === "_" || ch === "%") {
            str += "\\";
        }
        str += ch;
        return str;
    }, "");
}

export default {
    escape,
    escapeLike,
};
