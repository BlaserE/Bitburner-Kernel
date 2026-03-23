import {NS, AutocompleteData} from "../../NetscriptDefinitions";
import {RAMLedger, IProcess, IServer} from "../lib/RAMLedger";
import {KernelScript} from "../lib/KernelScript";

/**
 * Interface for the kernel flags. It uses camelCase because kebab-case is too cool for JS.
 */
export interface IFlags {
    [key: string]: any;

    verbose: boolean;
    reservedRam: number;
    gcInterval: number;
    aggressiveGc: boolean;
    help: boolean;
}

/**
 * Flags schema for terminal autocomplete
 */
const schema: [string, string | number | boolean | []][] = [
    ['verbose', false], // Just makes more prints
    ['reservedRam', 15], // reserves ram for manual execution via terminal
    ['gcInterval', 2000], // interval for collecting garbage
    ['aggressiveGc', false], // actively seeks PIDs on rooted servers and kills them if they are not registered.
    ['help', false] // prints a list of arguments and their description (NYI)
]

/**
 * Simply an autocomplete method for terminal. No clue how it works, ask the bitburner devs.
 * @param data
 * @param args
 */
export function autocomplete(data: AutocompleteData, args: string[]) {
    data.flags(schema);
    return [];
}

export async function main(ns: NS) {
    const args = ns.flags(schema) as IFlags // fits the interface and is type safe

    if (args.help) {
        ns.tprint(`
Kernel Boot Options:
--verbose       : Enable detailed logging
--reserveRam    : [number] RAM to leave free for terminal scripts (Default: 15GB)
--gcInterval    : [number] MS between garbage collection cycles (Default: 2000)
--aggressiveGc  : [boolean] Kill unregistered PIDs on rooted servers
        `);
        return;
    }
    const kernel = new Kernel(ns, args);
    await kernel.run();

    // the kernel exits the run loop.

    kernel.shutdown()
}

/**
 * The Kernel class. It is the central authority, serving as the executer of scripts and allocator of RAM.
 * It uses utility classes, such as the RAMLedger, for Zero-Cost tracking of scripts across the network of rooted servers.
 * It is intended to be the only script able to do `ns.exec`. It could potentially be configured to automatically kill any scripts that
 * it hasn't executed itself.
 */
class Kernel extends KernelScript {

    private ns: NS;
    private ledger: RAMLedger;
    private readonly config: IFlags;
    private lastGC: number;


    /**
     * Creates the Kernel object, but does not begin operation. It only prepares it.
     * @param ns
     * @param flags
     */
    constructor(ns: NS, flags: IFlags) {
        this.ns = ns;
        this.config = flags;

        // creates the ledger
        this.ledger = new RAMLedger(this.config);

        // optionally creates the database for zero-cost queries.

        this.lastGC = Date.now(); // should be the last thing called in the constructor
    }


    /**
     * The thing that actually does begin kernel operations.
     */
    async run(): Promise<void> {
        this.ns.disableLog("ALL");
        this.ns.tprint("KERNEL: Booting...");


        this.ledger.registerServer("home");
        // this.ns.getPurchasedServers().forEach(server => this.ledger.registerServer(server));


    }


    async boot() {

    }

}