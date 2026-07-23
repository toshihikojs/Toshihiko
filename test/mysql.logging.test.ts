/**
 * Toshihiko - MySQL Integration Tests with SQL Logging
 * Tests against a real MySQL database with detailed SQL output
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
    showSql: true, // 启用 SQL 日志输出
};

const TABLE_NAME = "toshihiko_log_test";

// SQL 日志收集器
const sqlLogs: Array<{ sql: string; time: string }> = [];

function logSql(sql: string) {
    const time = new Date().toISOString();
    sqlLogs.push({ sql, time });
    console.log(`\n${"=".repeat(80)}`);
    console.log(`[SQL] ${time}`);
    console.log(`${"-".repeat(80)}`);
    console.log(sql);
    console.log(`${"=".repeat(80)}\n`);
}

function logResult(operation: string, result: any) {
    console.log(`\n[RESULT] ${operation}`);
    console.log(JSON.stringify(result, null, 2));
}

describe("MySQL Integration Tests with SQL Logging", () => {
    let toshihiko: Toshihiko;
    let model: any;

    beforeAll(async () => {
        console.log("\n" + "█".repeat(80));
        console.log("█" + " ".repeat(78) + "█");
        console.log("█" + "  MySQL Integration Test - Connecting to database".padEnd(78) + "█");
        console.log("█" + " ".repeat(78) + "█");
        console.log("█".repeat(80) + "\n");

        toshihiko = new Toshihiko("mysql", DB_CONFIG);

        // 清理旧表
        console.log("\n>>> 清理旧测试表...");
        try {
            await toshihiko.execute(`DROP TABLE IF EXISTS \`${TABLE_NAME}\``);
        } catch (e) {}

        // Create test table
        console.log("\n>>> 创建测试表...");
        const createSql = `CREATE TABLE IF NOT EXISTS \`${TABLE_NAME}\` (
            \`id\` INT NOT NULL AUTO_INCREMENT,
            \`name\` VARCHAR(255) NOT NULL DEFAULT '',
            \`age\` INT NOT NULL DEFAULT 0,
            \`score\` FLOAT NOT NULL DEFAULT 0,
            \`active\` TINYINT(1) NOT NULL DEFAULT 1,
            \`metadata\` TEXT,
            \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;
        logSql(createSql);
        await toshihiko.execute(createSql);
        console.log("[RESULT] 表创建成功");

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
        console.log("\n>>> 清理测试表...");
        try {
            const dropSql = `DROP TABLE IF EXISTS \`${TABLE_NAME}\``;
            logSql(dropSql);
            await toshihiko.execute(dropSql);
            console.log("[RESULT] 表已删除");
        } catch (e) {}

        // 输出 SQL 统计
        console.log("\n" + "█".repeat(80));
        console.log("█" + " ".repeat(78) + "█");
        console.log("█" + `  SQL Statistics: Total ${sqlLogs.length} queries executed`.padEnd(78) + "█");
        console.log("█" + " ".repeat(78) + "█");
        console.log("█".repeat(80) + "\n");
    });

    describe("1. INSERT 操作", () => {
        it("插入单条记录", async () => {
            console.log("\n>>> 测试: 插入单条记录");
            const yukari = model.build({
                name: "Alice",
                age: 25,
                score: 95.5,
                active: true,
                metadata: { role: "admin", level: 5 },
            });

            const result = await yukari.insert();
            logResult("INSERT", {
                id: result.id,
                name: result.name,
                age: result.age,
                score: result.score,
                active: result.active,
                metadata: result.metadata,
            });

            expect(result.id).toBeGreaterThan(0);
            expect(result.name).toEqual("Alice");
        });

        it("批量插入记录", async () => {
            console.log("\n>>> 测试: 批量插入记录");
            const data = [
                { name: "Bob", age: 30, score: 88.0, active: true },
                { name: "Charlie", age: 35, score: 72.5, active: false },
                { name: "David", age: 28, score: 91.0, active: true },
            ];

            for (const d of data) {
                const yukari = model.build(d);
                const result = await yukari.insert();
                logResult(`INSERT ${d.name}`, { id: result.id, name: result.name, age: result.age });
            }
        });
    });

    describe("2. SELECT 查询操作", () => {
        it("查询所有记录", async () => {
            console.log("\n>>> 测试: 查询所有记录");
            const results = await model.find(undefined, true);
            logResult("SELECT *", results);
            expect(results.length).toBeGreaterThanOrEqual(4);
        });

        it("按 ID 查询", async () => {
            console.log("\n>>> 测试: 按 ID 查询");
            const result = await model.findById(1, undefined, true);
            logResult("SELECT WHERE id=1", result);
            expect(result).not.toBeNull();
        });

        it("条件查询 - 等值", async () => {
            console.log("\n>>> 测试: 条件查询 - 等值 (name='Bob')");
            const results = await model.where({ name: "Bob" }).find(undefined, true);
            logResult("SELECT WHERE name='Bob'", results);
            expect(results.length).toEqual(1);
        });

        it("条件查询 - 大于", async () => {
            console.log("\n>>> 测试: 条件查询 - 大于 (age > 28)");
            const results = await model.where({ age: { $gt: 28 } }).find(undefined, true);
            logResult("SELECT WHERE age > 28", results);
        });

        it("条件查询 - IN", async () => {
            console.log("\n>>> 测试: 条件查询 - IN (name IN ['Alice', 'Bob'])");
            const results = await model.where({ name: { $in: ["Alice", "Bob"] } }).find(undefined, true);
            logResult("SELECT WHERE name IN ('Alice', 'Bob')", results);
            expect(results.length).toEqual(2);
        });

        it("条件查询 - LIKE", async () => {
            console.log("\n>>> 测试: 条件查询 - LIKE (name LIKE '%a%')");
            const results = await model.where({ name: { $like: "%a%" } }).find(undefined, true);
            logResult("SELECT WHERE name LIKE '%a%'", results);
        });

        it("条件查询 - BETWEEN", async () => {
            console.log("\n>>> 测试: 条件查询 - BETWEEN (age BETWEEN 25 AND 32)");
            const results = await model.where({ age: { $between: [25, 32] } }).find(undefined, true);
            logResult("SELECT WHERE age BETWEEN 25 AND 32", results);
        });

        it("排序查询 - ORDER BY age DESC", async () => {
            console.log("\n>>> 测试: 排序查询 - ORDER BY age DESC");
            const results = await model.order({ age: -1 }).find(undefined, true);
            logResult("SELECT ORDER BY age DESC", results.map((r: any) => ({ name: r.name, age: r.age })));
        });

        it("分页查询 - LIMIT", async () => {
            console.log("\n>>> 测试: 分页查询 - LIMIT 2");
            const results = await model.limit(2).find(undefined, true);
            logResult("SELECT LIMIT 2", results);
            expect(results.length).toEqual(2);
        });

        it("分页查询 - LIMIT OFFSET", async () => {
            console.log("\n>>> 测试: 分页查询 - LIMIT 1, 2 (跳过1条，取2条)");
            const results = await model.limit(1, 2).find(undefined, true);
            logResult("SELECT LIMIT 1, 2", results);
            expect(results.length).toEqual(2);
        });

        it("指定字段查询", async () => {
            console.log("\n>>> 测试: 指定字段查询 (只取 name, age)");
            const results = await model.fields(["name", "age"]).find(undefined, true);
            logResult("SELECT name, age", results);
        });

        it("COUNT 统计", async () => {
            console.log("\n>>> 测试: COUNT 统计");
            const count = await model.count();
            logResult("SELECT COUNT(0)", { count });
            expect(count).toBeGreaterThanOrEqual(4);
        });

        it("组合条件查询 - AND", async () => {
            console.log("\n>>> 测试: 组合条件查询 - AND (age >= 25 AND active = true)");
            const results = await model.where({
                $and: [{ age: { $gte: 25 } }, { active: true }],
            }).find(undefined, true);
            logResult("SELECT WHERE age >= 25 AND active = true", results);
        });

        it("组合条件查询 - OR", async () => {
            console.log("\n>>> 测试: 组合条件查询 - OR (name='Alice' OR name='Bob')");
            const results = await model.where({
                $or: [{ name: "Alice" }, { name: "Bob" }],
            }).find(undefined, true);
            logResult("SELECT WHERE name='Alice' OR name='Bob'", results);
        });
    });

    describe("3. UPDATE 更新操作", () => {
        it("通过 Yukari 对象更新", async () => {
            console.log("\n>>> 测试: 通过 Yukari 对象更新");
            const yukari = await model.where({ name: "Alice" }).findOne();
            console.log("[BEFORE]", JSON.stringify({ name: yukari.name, age: yukari.age, score: yukari.score }));
            
            yukari.age = 26;
            yukari.score = 99.9;
            await yukari.update();
            
            const updated = await model.where({ name: "Alice" }).findOne(undefined, true);
            logResult("UPDATE (via Yukari)", updated);
            expect(updated.age).toEqual(26);
        });

        it("通过 Query 批量更新", async () => {
            console.log("\n>>> 测试: 通过 Query 批量更新 (age < 30 的 active 设为 false)");
            const before = await model.where({ age: { $lt: 30 } }).find(undefined, true);
            console.log("[BEFORE]", JSON.stringify(before.map((r: any) => ({ name: r.name, active: r.active }))));
            
            const result = await model.where({ age: { $lt: 30 } }).update({ active: false });
            logResult("UPDATE (via Query)", result);
            
            const after = await model.where({ age: { $lt: 30 } }).find(undefined, true);
            console.log("[AFTER]", JSON.stringify(after.map((r: any) => ({ name: r.name, active: r.active }))));
        });
    });

    describe("4. DELETE 删除操作", () => {
        it("通过 Yukari 对象删除", async () => {
            console.log("\n>>> 测试: 通过 Yukari 对象删除");
            // 先插入一条
            const temp = model.build({ name: "ToDelete", age: 99 });
            await temp.insert();
            const tempId = temp.id;
            console.log("[INSERTED] id =", tempId);
            
            const yukari = await model.findById(tempId);
            const result = await yukari.delete();
            logResult("DELETE (via Yukari)", { deleted: result });
            
            const deleted = await model.findById(tempId);
            console.log("[VERIFY] findById after delete:", deleted);
            expect(deleted).toBeNull();
        });

        it("通过 Query 批量删除", async () => {
            console.log("\n>>> 测试: 通过 Query 批量删除 (age = 99)");
            // 先插入几条
            await model.build({ name: "Del1", age: 99 }).insert();
            await model.build({ name: "Del2", age: 99 }).insert();
            
            const before = await model.where({ age: 99 }).count();
            console.log("[BEFORE] count where age=99:", before);
            
            const result = await model.where({ age: 99 }).delete();
            logResult("DELETE (via Query)", result);
            
            const after = await model.where({ age: 99 }).count();
            console.log("[AFTER] count where age=99:", after);
            expect(after).toEqual(0);
        });
    });

    describe("5. 事务操作", () => {
        it("事务提交 (COMMIT)", async () => {
            console.log("\n>>> 测试: 事务提交 (COMMIT)");
            const conn = await model.beginTransaction();
            console.log("[BEGIN TRANSACTION] 获得连接");
            
            await new Promise<void>((resolve, reject) => {
                const sql = `INSERT INTO \`${TABLE_NAME}\` SET \`name\` = 'TxCommit', \`age\` = 50`;
                logSql(sql);
                conn.query(sql, (err: any) => (err ? reject(err) : resolve()));
            });
            console.log("[INSERT] TxCommit 插入成功（未提交）");
            
            // 验证未提交前其他连接看不到
            const beforeCommit = await model.where({ name: "TxCommit" }).findOne();
            console.log("[BEFORE COMMIT] 其他连接查询结果:", beforeCommit);
            
            await model.commit(conn);
            console.log("[COMMIT] 事务已提交");
            
            const afterCommit = await model.where({ name: "TxCommit" }).findOne(undefined, true);
            logResult("SELECT after COMMIT", afterCommit);
            expect(afterCommit).not.toBeNull();
            
            // 清理
            await model.where({ name: "TxCommit" }).delete();
        });

        it("事务回滚 (ROLLBACK)", async () => {
            console.log("\n>>> 测试: 事务回滚 (ROLLBACK)");
            const conn = await model.beginTransaction();
            console.log("[BEGIN TRANSACTION] 获得连接");
            
            await new Promise<void>((resolve, reject) => {
                const sql = `INSERT INTO \`${TABLE_NAME}\` SET \`name\` = 'TxRollback', \`age\` = 60`;
                logSql(sql);
                conn.query(sql, (err: any) => (err ? reject(err) : resolve()));
            });
            console.log("[INSERT] TxRollback 插入成功（未提交）");
            
            await model.rollback(conn);
            console.log("[ROLLBACK] 事务已回滚");
            
            const afterRollback = await model.where({ name: "TxRollback" }).findOne();
            logResult("SELECT after ROLLBACK", afterRollback);
            expect(afterRollback).toBeNull();
        });
    });

    describe("6. 原生 SQL 执行", () => {
        it("执行原生 SELECT", async () => {
            console.log("\n>>> 测试: 执行原生 SELECT");
            const sql = `SELECT * FROM \`${TABLE_NAME}\` WHERE age > 25 ORDER BY age DESC`;
            logSql(sql);
            const result = await toshihiko.execute(sql);
            logResult("RAW SELECT", result);
        });

        it("执行带参数的 SQL", async () => {
            console.log("\n>>> 测试: 执行带参数的 SQL");
            const sql = `SELECT * FROM \`${TABLE_NAME}\` WHERE name = ? AND age > ?`;
            const params = ["Alice", 20];
            console.log("[SQL]", sql);
            console.log("[PARAMS]", params);
            const result = await toshihiko.execute(sql, params);
            logResult("RAW SELECT with params", result);
        });

        it("执行聚合查询", async () => {
            console.log("\n>>> 测试: 执行聚合查询");
            const sql = `SELECT COUNT(*) as total, AVG(age) as avg_age, MAX(score) as max_score FROM \`${TABLE_NAME}\``;
            logSql(sql);
            const result = await toshihiko.execute(sql);
            logResult("AGGREGATE QUERY", result);
        });
    });

    describe("7. 特殊数据类型", () => {
        it("JSON 字段存取", async () => {
            console.log("\n>>> 测试: JSON 字段存取");
            const metadata = { 
                nested: { key: "value", arr: [1, 2, 3] },
                chinese: "中文测试",
                special: "chars: !@#$%^&*()"
            };
            const yukari = model.build({ name: "JsonTest", age: 1, metadata });
            await yukari.insert();
            
            const found = await model.where({ name: "JsonTest" }).findOne(undefined, true);
            logResult("JSON field", { input: metadata, output: found.metadata });
            expect(found.metadata).toEqual(metadata);
            
            await model.where({ name: "JsonTest" }).delete();
        });

        it("特殊字符转义", async () => {
            console.log("\n>>> 测试: 特殊字符转义");
            const specialName = "Test'\"\\Name\nWith\tSpecial";
            const yukari = model.build({ name: specialName, age: 1 });
            await yukari.insert();
            
            const found = await model.where({ name: specialName }).findOne(undefined, true);
            logResult("Special chars", { input: specialName, output: found?.name });
            expect(found?.name).toEqual(specialName);
            
            await model.where({ name: specialName }).delete();
        });

        it("NULL 值处理", async () => {
            console.log("\n>>> 测试: NULL 值处理");
            const yukari = model.build({ name: "NullTest", age: 1, metadata: null });
            await yukari.insert();
            
            const found = await model.where({ name: "NullTest" }).findOne(undefined, true);
            logResult("NULL field", { metadata: found.metadata });
            expect(found.metadata).toBeNull();
            
            await model.where({ name: "NullTest" }).delete();
        });
    });
});
