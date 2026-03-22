import {NS} from "../../NetscriptDefinitions";
import {TestMethod} from "sbin/import"

export async function main (ns: NS) {

    ns.tprint(`import works with test method : ${TestMethod()}`);
}