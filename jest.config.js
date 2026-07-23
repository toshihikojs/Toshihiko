/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/test"],
    testMatch: ["**/*.test.ts"],
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                tsconfig: {
                    strict: false,
                    noImplicitAny: false,
                    esModuleInterop: true,
                    allowJs: true,
                },
            },
        ],
    },
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
