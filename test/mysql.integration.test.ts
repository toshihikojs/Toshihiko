/**
 * Toshihiko - MySQL Integration Tests
 * Tests against a real MySQL database
 */

import { Toshihiko } from "../src/toshihiko";
import { Yukari } from "../src/yukari";
import Type from "../src/field_type";

const DB_CONFIG = {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    username: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "test",
};

const TABLE_NAME = "toshihiko_test_" + Date.now();

describe("MySQL Integration Tests", () => {
    let toshihiko: Toshihiko;
    let model: any;

    beforeAll(async () => {
        toshihiko = new Toshihiko("mysql", DB_CONFIG);

        // Create test table
        await toshihiko.execute(`
            CREATE TABLE IF NOT EXISTS \`${TABLE_NAME}\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`name\` VARCHAR(255) NOT NULL DEFAULT '',
                \`age\` INT NOT NULL DEFAULT 0,
                \`score\` FLOAT NOT NULL DEFAULT 0,
                \`active\` TINYINT(1) NOT NULL DEFAULT 1,
                \`metadata\` TEXT,
                \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Define model
        model = toshihiko.define(TABLE_NAME, [
            { name: "id", type: Type.Integer, primaryKey: true, autoIncrement: true },
            { name: "name", type: Type.String },
            { name: "age", type: Type.Integer },
            { name: "score", type: Type.Float },
            { name: "active", type: Type.Boolean },
            { name: "metadata", type: Type.Json, allowNull: true },
            { name: "createdAt", column: "created_at", type: Type.Datetime },
        ]);
    });

    afterAll(async () => {
        // Drop test table
        try {
            await toshihiko.execute(`DROP TABLE IF EXISTS \`${TABLE_NAME}\``);
        } catch (e) {
            // ignore
        }
    });

    describe("Connection & Model", () => {
        it("should connect to database", () => {
            expect(toshihiko.adapter).toBeDefined();
            expect(toshihiko.database).toEqual("test");
        });

        it("should define model correctly", () => {
            expect(model.name).toEqual(TABLE_NAME);
            expect(model.primaryKeys.length).toEqual(1);
            expect(model.primaryKeys[0].name).toEqual("id");
            expect(model.ai).not.toBeNull();
            expect(model.ai!.name).toEqual("id");
        });

        it("should have correct field mappings", () => {
            expect(model.nameToColumn["createdAt"]).toEqual("created_at");
            expect(model.columnToName["created_at"]).toEqual("createdAt");
        });
    });

    describe("CRUD Operations", () => {
        let insertedId: number;

        it("should insert a record via model.build", async () => {
            const yukari = model.build({
                name: "Alice",
                age: 25,
                score: 95.5,
                active: true,
                metadata: { role: "admin" },
            });

            const result = await yukari.insert();
            expect(result).toBeInstanceOf(Yukari);
            expect(result.id).toBeGreaterThan(0);
            expect(result.name).toEqual("Alice");
            expect(result.age).toEqual(25);
            insertedId = result.id;
        });

        it("should find record by id", async () => {
            const result = await model.findById(insertedId);
            expect(result).toBeInstanceOf(Yukari);
            expect(result.name).toEqual("Alice");
            expect(result.age).toEqual(25);
            expect(result.score).toEqual(95.5);
            expect(result.active).toEqual(true);
            expect(result.metadata).toEqual({ role: "admin" });
        });

        it("should find record with toJSON", async () => {
            const result = await model.findById(insertedId, undefined, true);
            expect(result).not.toBeInstanceOf(Yukari);
            expect(result.name).toEqual("Alice");
            expect(typeof result).toEqual("object");
        });

        it("should update a record via yukari", async () => {
            const yukari = await model.findById(insertedId);
            yukari.age = 26;
            yukari.name = "Alice Updated";

            const result = await yukari.update();
            expect(result).toBeInstanceOf(Yukari);

            // Verify update
            const updated = await model.findById(insertedId);
            expect(updated.age).toEqual(26);
            expect(updated.name).toEqual("Alice Updated");
        });

        it("should update via query", async () => {
            await model.where({ id: insertedId }).update({ age: 30 });

            const updated = await model.findById(insertedId);
            expect(updated.age).toEqual(30);
        });

        it("should count records", async () => {
            const count = await model.count();
            expect(count).toBeGreaterThanOrEqual(1);
        });

        it("should delete a record via yukari", async () => {
            // Insert a temp record
            const temp = model.build({ name: "ToDelete", age: 99 });
            await temp.insert();
            const tempId = temp.id;

            // Delete it
            const yukari = await model.findById(tempId);
            const result = await yukari.delete();
            expect(result).toBe(true);

            // Verify deletion
            const deleted = await model.findById(tempId);
            expect(deleted).toBeNull();
        });

        it("should delete via query", async () => {
            // Insert temp records
            const temp1 = model.build({ name: "Del1", age: 1 });
            const temp2 = model.build({ name: "Del2", age: 1 });
            await temp1.insert();
            await temp2.insert();

            // Delete by query
            const result = await model.where({ age: 1 }).delete();
            expect(result.affectedRows).toBeGreaterThanOrEqual(2);
        });
    });

    describe("Query Features", () => {
        beforeAll(async () => {
            // Insert test data
            const data = [
                { name: "Bob", age: 20, score: 80.0, active: true },
                { name: "Charlie", age: 30, score: 70.5, active: false },
                { name: "David", age: 25, score: 90.0, active: true },
                { name: "Eve", age: 35, score: 60.0, active: true },
                { name: "Frank", age: 28, score: 85.5, active: false },
            ];

            for (const d of data) {
                const yukari = model.build(d);
                await yukari.insert();
            }
        });

        it("should find all records", async () => {
            const results = await model.find();
            expect(results.length).toBeGreaterThanOrEqual(5);
            expect(results[0]).toBeInstanceOf(Yukari);
        });

        it("should find with where condition (equal)", async () => {
            const results = await model.where({ name: "Bob" }).find();
            expect(results.length).toEqual(1);
            expect(results[0].name).toEqual("Bob");
        });

        it("should find with where condition ($gt)", async () => {
            const results = await model.where({ age: { $gt: 28 } }).find(undefined, true);
            expect(results.length).toBeGreaterThanOrEqual(2);
            results.forEach((r: any) => {
                expect(r.age).toBeGreaterThan(28);
            });
        });

        it("should find with where condition ($lt)", async () => {
            const results = await model.where({ age: { $lt: 25 } }).find(undefined, true);
            results.forEach((r: any) => {
                expect(r.age).toBeLessThan(25);
            });
        });

        it("should find with where condition ($gte)", async () => {
            const results = await model.where({ age: { $gte: 30 } }).find(undefined, true);
            results.forEach((r: any) => {
                expect(r.age).toBeGreaterThanOrEqual(30);
            });
        });

        it("should find with where condition ($lte)", async () => {
            const results = await model.where({ age: { $lte: 25 } }).find(undefined, true);
            results.forEach((r: any) => {
                expect(r.age).toBeLessThanOrEqual(25);
            });
        });

        it("should find with where condition ($neq)", async () => {
            const results = await model.where({ name: { $neq: "Bob" } }).find(undefined, true);
            results.forEach((r: any) => {
                expect(r.name).not.toEqual("Bob");
            });
        });

        it("should find with where condition ($in)", async () => {
            const results = await model.where({ name: { $in: ["Bob", "Charlie"] } }).find(undefined, true);
            expect(results.length).toEqual(2);
            const names = results.map((r: any) => r.name);
            expect(names).toContain("Bob");
            expect(names).toContain("Charlie");
        });

        it("should find with where condition ($like)", async () => {
            const results = await model.where({ name: { $like: "%a%" } }).find(undefined, true);
            expect(results.length).toBeGreaterThanOrEqual(1);
        });

        it("should find with where condition ($between)", async () => {
            const results = await model.where({ age: { $between: [25, 30] } }).find(undefined, true);
            results.forEach((r: any) => {
                expect(r.age).toBeGreaterThanOrEqual(25);
                expect(r.age).toBeLessThanOrEqual(30);
            });
        });

        it("should find with order (ASC)", async () => {
            const results = await model.order({ age: 1 }).find(undefined, true);
            for (let i = 1; i < results.length; i++) {
                expect(results[i].age).toBeGreaterThanOrEqual(results[i - 1].age);
            }
        });

        it("should find with order (DESC)", async () => {
            const results = await model.order({ age: -1 }).find(undefined, true);
            for (let i = 1; i < results.length; i++) {
                expect(results[i].age).toBeLessThanOrEqual(results[i - 1].age);
            }
        });

        it("should find with order string syntax", async () => {
            const results = await model.order("age DESC").find(undefined, true);
            for (let i = 1; i < results.length; i++) {
                expect(results[i].age).toBeLessThanOrEqual(results[i - 1].age);
            }
        });

        it("should find with limit", async () => {
            const results = await model.limit(2).find(undefined, true);
            expect(results.length).toEqual(2);
        });

        it("should find with limit offset", async () => {
            const all = await model.order({ age: 1 }).find(undefined, true);
            const limited = await model.order({ age: 1 }).limit(1, 2).find(undefined, true);
            expect(limited.length).toEqual(2);
            expect(limited[0].age).toEqual(all[1].age);
        });

        it("should find with specific fields", async () => {
            const results = await model.fields(["name", "age"]).find(undefined, true);
            expect(results.length).toBeGreaterThanOrEqual(1);
            results.forEach((r: any) => {
                expect(r.name).toBeDefined();
                expect(r.age).toBeDefined();
            });
        });

        it("should findOne", async () => {
            const result = await model.where({ name: "Bob" }).findOne();
            expect(result).toBeInstanceOf(Yukari);
            expect(result.name).toEqual("Bob");
        });

        it("should findOne with toJSON", async () => {
            const result = await model.where({ name: "Bob" }).findOne(undefined, true);
            expect(result).not.toBeInstanceOf(Yukari);
            expect(result.name).toEqual("Bob");
        });

        it("should return null for findOne with no match", async () => {
            const result = await model.where({ name: "NonExistent" }).findOne();
            expect(result).toBeNull();
        });

        it("should count with where condition", async () => {
            const count = await model.where({ active: true }).count();
            expect(count).toBeGreaterThanOrEqual(1);
        });

        it("should support $and condition", async () => {
            const results = await model.where({
                $and: [{ age: { $gte: 25 } }, { active: true }],
            }).find(undefined, true);
            results.forEach((r: any) => {
                expect(r.age).toBeGreaterThanOrEqual(25);
                expect(r.active).toEqual(true);
            });
        });

        it("should support $or condition", async () => {
            const results = await model.where({
                $or: [{ name: "Bob" }, { name: "Charlie" }],
            }).find(undefined, true);
            expect(results.length).toEqual(2);
        });
    });

    describe("Transactions", () => {
        it("should commit transaction", async () => {
            const conn = await model.beginTransaction();
            expect(conn).toBeDefined();

            // Insert within transaction using raw SQL
            await new Promise<void>((resolve, reject) => {
                conn.query(
                    `INSERT INTO \`${TABLE_NAME}\` SET \`name\` = 'TxCommit', \`age\` = 50`,
                    (err: any) => (err ? reject(err) : resolve())
                );
            });

            // Commit
            await model.commit(conn);

            // Verify data persists
            const result = await model.where({ name: "TxCommit" }).findOne();
            expect(result).not.toBeNull();
            expect(result.name).toEqual("TxCommit");

            // Cleanup
            await model.where({ name: "TxCommit" }).delete();
        });

        it("should rollback transaction", async () => {
            const conn = await model.beginTransaction();
            expect(conn).toBeDefined();

            // Insert within transaction using raw SQL
            await new Promise<void>((resolve, reject) => {
                conn.query(
                    `INSERT INTO \`${TABLE_NAME}\` SET \`name\` = 'TxRollback', \`age\` = 60`,
                    (err: any) => (err ? reject(err) : resolve())
                );
            });

            // Rollback
            await model.rollback(conn);

            // Verify data does not persist
            const result = await model.where({ name: "TxRollback" }).findOne();
            expect(result).toBeNull();
        });
    });

    describe("Raw SQL Execution", () => {
        it("should execute raw SQL", async () => {
            const result = await toshihiko.execute(`SELECT 1 + 1 AS result`);
            expect(result[0].result).toEqual(2);
        });

        it("should execute raw SQL with params", async () => {
            const result = await toshihiko.execute(
                `SELECT * FROM \`${TABLE_NAME}\` WHERE name = ?`,
                ["Bob"]
            );
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual("Bob");
        });

        it("should execute via model", async () => {
            const result = await model.execute(`SELECT COUNT(*) as cnt FROM \`${TABLE_NAME}\``);
            expect(result[0].cnt).toBeGreaterThanOrEqual(1);
        });
    });

    describe("Yukari Operations", () => {
        it("should save new record (insert)", async () => {
            const yukari = model.build({ name: "SaveNew", age: 40 });
            const result = await yukari.save();
            expect(result).toBeInstanceOf(Yukari);
            expect(result.id).toBeGreaterThan(0);

            // Cleanup
            await model.where({ name: "SaveNew" }).delete();
        });

        it("should save existing record (update)", async () => {
            // Insert first
            const yukari = model.build({ name: "SaveUpdate", age: 41 });
            await yukari.insert();
            const id = yukari.id;

            // Modify and save
            const found = await model.findById(id);
            found.age = 42;
            await found.save();

            // Verify
            const updated = await model.findById(id);
            expect(updated.age).toEqual(42);

            // Cleanup
            await model.where({ name: "SaveUpdate" }).delete();
        });

        it("should handle null values with allowNull", async () => {
            const yukari = model.build({ name: "NullMeta", age: 33, metadata: null });
            await yukari.insert();
            const id = yukari.id;

            const found = await model.findById(id);
            expect(found.metadata).toBeNull();

            // Cleanup
            await model.where({ name: "NullMeta" }).delete();
        });

        it("should convert to JSON correctly", async () => {
            const result = await model.where({ name: "Bob" }).findOne(undefined, true);
            expect(typeof result).toEqual("object");
            expect(result.name).toEqual("Bob");
            expect(result.$model).toBeUndefined();
        });

        it("should not insert non-new yukari", async () => {
            const found = await model.where({ name: "Bob" }).findOne();
            await expect(found.insert()).rejects.toThrow("You must call this function via a new Yukari object.");
        });

        it("should not update new yukari", async () => {
            const yukari = model.build({ name: "NewOnly", age: 1 });
            await expect(yukari.update()).rejects.toThrow("You must call this function via an old Yukari object.");
        });

        it("should not delete new yukari", async () => {
            const yukari = model.build({ name: "NewOnly", age: 1 });
            await expect(yukari.delete()).rejects.toThrow("You can't call this function via a new Yukari object.");
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty result set", async () => {
            const results = await model.where({ name: "AbsolutelyNonExistent" }).find();
            expect(results).toEqual([]);
        });

        it("should handle special characters in strings", async () => {
            const specialName = "Test'\"\\Name";
            const yukari = model.build({ name: specialName, age: 1 });
            await yukari.insert();

            const found = await model.where({ name: specialName }).findOne();
            expect(found).not.toBeNull();
            expect(found.name).toEqual(specialName);

            // Cleanup
            await model.where({ name: specialName }).delete();
        });

        it("should handle multiple primary key query via findById with object", async () => {
            const results = await model.find(undefined, true);
            if (results.length > 0) {
                const id = results[0].id;
                const found = await model.findById({ id: id });
                expect(found).not.toBeNull();
                expect(found.id).toEqual(id);
            }
        });

        it("should handle boolean field correctly", async () => {
            const yukari = model.build({ name: "BoolTest", age: 1, active: false });
            await yukari.insert();
            const id = yukari.id;

            const found = await model.findById(id);
            expect(found.active).toEqual(false);

            // Cleanup
            await model.where({ name: "BoolTest" }).delete();
        });

        it("should handle JSON field correctly", async () => {
            const metadata = { nested: { key: "value" }, arr: [1, 2, 3] };
            const yukari = model.build({ name: "JsonTest", age: 1, metadata });
            await yukari.insert();
            const id = yukari.id;

            const found = await model.findById(id);
            expect(found.metadata).toEqual(metadata);

            // Cleanup
            await model.where({ name: "JsonTest" }).delete();
        });
    });
});
