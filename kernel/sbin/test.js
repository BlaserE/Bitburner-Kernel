import { TestMethod } from "sbin/import";
export async function main(ns) {
    ns.tprint(`import works with test method : ${TestMethod()}`);
}
