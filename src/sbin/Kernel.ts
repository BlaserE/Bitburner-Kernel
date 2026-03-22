import {NS} from "../../NetscriptDefinitions";
import {RAMLedger} from "../lib/RAMLedger";


export async function main(ns: NS) {
    const flags = ns.flags([
        ['verbose', false], // Just makes more prints
        ['reserve-ram', 15]
    ])

    const kernel = new Kernel(ns, flags);
    await kernel.boot();
}

class Kernel {
    private ns : NS;
    private ledger: RAMLedger;


    constructor (ns: NS, flags : any) {
        this.ns = ns;
        this.ledger = new RAMLedger(ns, flags);
    }

    async boot() {


    }

}