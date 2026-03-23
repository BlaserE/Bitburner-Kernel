import {NS, AutocompleteData} from "../../NetscriptDefinitions";

interface ServerMetrics {
    maxRam: number;
    usedRam: number;
    runningPids: Set<number>; // A Set is faster for checking/removing PIDs
}

interface ProcessMetrics {
    hostname: string;
    ramUsage: number;
    scriptName: string;
}

export class RAMLedger {
    private ns: NS;
    private servers : Map<string, ServerMetrics>;
    private processes: Map<string, ProcessMetrics>;
    private reservedRam: number;

    constructor(ns: NS, flags: any) {
        this.ns = ns;

        this.servers = new Map(); // hostname -> { used: number, max: number }
        this.processes = new Map(); // pid -> { hostname: string, ramUsage: number }

        this.reservedRam = flags.reserveRam ?? 0;
    }


    /**
     * Registers or updates a server in the ledger.
     */
    public registerServer(hostname: string) {
        const maxRam = this.ns.getServerMaxRam(hostname);

        // Don't overwrite existing data if the server is already known
        if (!this.servers.has(hostname)) {
            this.servers.set(hostname, {
                maxRam: maxRam,
                usedRam: 0,
                runningPids: new Set()
            });
        }
    }
}