declare module "otrans" {
    export function toCamel(obj: any): any;
    export function toUnderline(obj: any): any;
}

declare module "toshihiko-mysqlparser" {
    export function sqlNameToColumn(name: string, nameToColumn: { [key: string]: string }): string;
}

declare module "scarlet-task" {
    class Scarlet {
        constructor(concurrency: number);
        push(task: any, callback: (taskObject: any) => void): void;
        afterFinish(count: number, callback: () => void, sync: boolean): void;
    }
    export = Scarlet;
}
