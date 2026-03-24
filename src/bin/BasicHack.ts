import {NS} from "../../NetscriptDefinitions";
import {KernelScript} from "../lib/KernelScript";

export async function main(ns: NS) {
    const basicHack = new BasicHack(ns);
}

/**
 *
 */
class BasicHack extends KernelScript {


    run(): Promise<void> {
        return Promise.resolve(undefined);
    }


}