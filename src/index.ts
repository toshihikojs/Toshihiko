/**
 * Toshihiko - Yet another simple ORM for node.js
 */

export { Toshihiko } from "./toshihiko";
export { default as Type } from "./field_type";
export { escape, escapeLike } from "./util/escaper";
export { default as Escaper } from "./util/escaper";
export { BaseAdapter } from "./adapters/base";
export { MySQLAdapter } from "./adapters/mysql";
export { ToshihikoModel } from "./model";
export { ToshihikoQuery } from "./query";
export { Yukari } from "./yukari";
export { ToshihikoField } from "./field";

// Export types
export * from "./types";

// Adapter namespace for compatibility
import { BaseAdapter } from "./adapters/base";
import { MySQLAdapter } from "./adapters/mysql";

export const Adapter = {
    base: BaseAdapter,
    mysql: MySQLAdapter,
};
