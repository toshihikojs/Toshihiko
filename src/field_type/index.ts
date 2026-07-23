/**
 * Toshihiko - Field type index
 */

import _Boolean from "./boolean";
import _String from "./string";
import Datetime from "./datetime";
import Float from "./float";
import Integer from "./integer";
import Json from "./json";

const FieldType = {
    String: _String,
    Boolean: _Boolean,
    Integer: Integer,
    Float: Float,
    Json: Json,
    Datetime: Datetime,

    $equal(a: any, b: any): boolean {
        return a === b;
    },
};

export default FieldType;
export { _Boolean, _String, Datetime, Float, Integer, Json };
