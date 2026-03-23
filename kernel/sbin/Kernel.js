import { RAMLedger } from "../lib/RAMLedger";
/**
 * Flags schema for terminal autocomplete
 */
const schema = [
    ['verbose', false], // Just makes more prints
    ['reservedRam', 15], // reserves ram for manual execution via terminal
    ['gcInterval', 2000], // interval for collecting garbage
    ['aggressiveGc', false], // actively seeks PIDs on rooted servers and kills them if they are not registered.
    ['help', false] // prints a list of arguments and their description (NYI)
];
export function autocomplete(data, args) {
    data.flags(schema);
    return [];
}
export async function main(ns) {
    const args = ns.flags(schema); // fits the interface and is type safe
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
    await kernel.boot();
}
/**
 * The Kernel class. It is the central authority, serving as the executer of scripts and allocator of RAM.
 * It uses utility classes, such as the RAMLedger, for Zero-Cost tracking of scripts across the network of rooted servers.
 * It is intended to be the only script able to do `ns.exec`. It could potentially be configured to automatically kill any scripts that
 * it hasn't executed itself.
 */
class Kernel {
    ns;
    ledger;
    config;
    constructor(ns, flags) {
        this.ns = ns;
        this.config = flags;
        // creates the ledger
        this.ledger = new RAMLedger(ns, this.config.reservedRam);
        // optionally creates the database for zero-cost queries.
    }
    async boot() {
    }
}
