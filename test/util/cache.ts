/**
 * Toshihiko - Test utilities - Mock Cache
 */

export class Cache {
    public foo: any;
    public bar: any;

    constructor(foo: any, bar: any) {
        this.foo = foo;
        this.bar = bar;
    }
}

export function create(foo: any, bar: any): Cache {
    return new Cache(foo, bar);
}

export default {
    create,
    Cache,
};
