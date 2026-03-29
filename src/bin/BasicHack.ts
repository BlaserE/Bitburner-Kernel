import {NS} from "../../NetscriptDefinitions";
import {KernelScript} from "../lib/KernelScript";

export async function main(ns: NS) {
    const basicHack = new BasicHack(ns);

    await basicHack.register()
    await basicHack.run();
}

/**
 *
 */
class BasicHack extends KernelScript {


    run(): Promise<void> {
        this.ns.tprint(`[Basic Hack] Successfully called run() after registering.`);

        return Promise.resolve(undefined);
    }


}