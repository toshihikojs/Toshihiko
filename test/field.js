/**
 * XadillaX created at 2016-08-09 13:20:53 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const Field = require("../lib/field");
const Type = require("../lib/field_type");

describe("🐣 field", function() {
    describe("create", function() {
        it("should create json object", function() {
            const field = new Field({
                name: "foo",
                column: "bar",
                type: Type.Json,
                primaryKey: true,
                autoIncrement: true
            });

            field.name.should.equal("foo");
            field.column.should.equal("bar");
            field.type.should.deepEqual(Type.Json);
            field.validators.should.deepEqual([]);
            field.allowNull.should.equal(false);
            field.primaryKey.should.equal(true);
            field.autoIncrement.should.equal(true);
            field.defaultValue.should.deepEqual({});
        });

        it("should have some default options", function() {
            const field = new Field({
                name: "foo"
            });

            field.name.should.equal("foo");
            field.column.should.equal("foo");
            field.type.should.deepEqual(Type.String);
            field.validators.should.deepEqual([]);
            field.allowNull.should.equal(false);
            field.primaryKey.should.equal(false);
            field.autoIncrement.should.equal(false);
            field.defaultValue.should.equal("");
        });

        it("should have validator(s)", function() {
            const v1 = function() {};
            const v2 = function() {};

            let field = new Field({ name: "foo", validators: v1 });
            field.validators[0].should.equal(v1);
            field = new Field({ name: "foo", validators: [ v2, v1 ] });
            field.validators[0].should.equal(v2);
            field.validators[1].should.equal(v1);
        });
    });
});
