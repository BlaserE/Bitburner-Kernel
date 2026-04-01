// ---------------------------------------------------------
// INTERFACES for the ram registry
// ---------------------------------------------------------
import {IFlags} from "../sbin/Kernel";

export interface IServer {
    hostname: string;
    maxRam: number;
    usedRam: number;
    processes: Map<number, IProcess>; // Nested map: PID -> IProcess
}

export interface IProcess {
    pid: number;
    script: string;
    ramCost: number; // equal to ram * thread
    hostname: string;
    registered: boolean;
}

/**
 * Interface for exporting the diff of the reconcile process.
 */
export interface IReconcileResult {
    dead: number[];
    rogue: number[];
}

/**
 * Creates the server object for the ledger using only the server name
 * @param {NS} ns Netscript object
 * @param {string} hostname The name of the server
 */
export const CreateServerObject = (ns: any, hostname: string): IServer => {
    return {
        hostname: hostname, // server name
        maxRam: ns.getServerMaxRam(hostname), // server max ram
        usedRam: 0, // by default, has zero used ram. Up to maxRam - reserveRam.
        processes: new Map<number, IProcess>() // map of processes
    };
};
/**
 * Creates the process object that is given to the ledger.
 * @param pid The PID of the script
 * @param script The absolute path to the script
 * @param ramCost The total RAM cost of the script, equal to threads * RAM cost.
 * @param hostname The name of the server the script is running on.
 * @param registered If the process has performed a handshake with the kernel.
 * @constructor
 */
export const CreateProcessObject = (pid: number, script: string, ramCost: number, hostname: string, registered: boolean = false): IProcess => {
    return { pid, script, ramCost, hostname, registered };
};

/**
 * The RAMLedger is the class that the kernel uses to register processes across the rooted network.
 * It is the accountant of the kernel.
 *
 * TODO: The RAMLedger will extend a basic DB class. It will also map the whole network, rather than the rooted servers.
 * TODO: For that, more data about the servers needs to be held as well.
 */
export class RAMLedger {
    private servers: Map<string, IServer>;
    private pidToHost: Map<number, string>;
    private reservedRam: number;

    constructor(flags: IFlags) {
        this.servers = new Map();
        this.pidToHost = new Map();
        this.reservedRam = flags.reservedRam;
    }

    /**
     * Registers a new server or updates the maxRam of an existing one.
     * @param {IServer} server The server to register, created with the method `CreateServerObject` method.
     */
    public registerServer(server: IServer): void {
        const existing = this.servers.get(server.hostname);

        if (existing) {
            // If it exists, only update maxRam to account for server upgrades.
            // Do not overwrite the object or you lose the running processes map.
            existing.maxRam = server.maxRam;
        } else {
            this.servers.set(server.hostname, server);
        }
    }

    /**
     * Ingests a process object and updates the corresponding server's used RAM.
     * @param {IProcess} process The process to register in the ledger. Created using the `CreateProcessObject` method.
     */
    public registerProcess(process: IProcess): void {
        const server = this.servers.get(process.hostname);
        if (!server) return; // Server not found in ledger.

        // Add to the server's local map and deduct from its available pool
        server.processes.set(process.pid, process);
        server.usedRam += process.ramCost;

        this.pidToHost.set(process.pid, server.hostname);
    }

    /**
     * Locates a process by PID on a specific server, frees its RAM, and deletes it.
     * Usually, only dead scripts are freed.
     * @param {number} pid The PID of the process to be freed.
     */
    public freeProcess(pid: number): void {
        const hostname = this.pidToHost.get(pid);
        if (!hostname) return;

        const server = this.servers.get(hostname);
        if (server) {
            const process = server.processes.get(pid);
            if (process) {
                server.usedRam -= process.ramCost;
                server.processes.delete(process.pid);
            }
        }
        this.pidToHost.delete(pid);
    }


    /**
     * A public method that receives the list of running processes running on
     * the provided hostname.
     * It returns the 'diff', meaning the processes that are now dead and updates the ledger accordingly
     * as well as the rogue processes, that are currently running but not registered in the ledger.
     * @param {string} hostname The name of the host being reconciled.
     * @param actualPids The list of actually running processes.
     * @return {IReconcileResult} The 'diff' of the processes compared against the ledger.
     */
    public reconcile(hostname:string, actualPids: number[]): IReconcileResult {
        const server = this.servers.get(hostname);
        const result : IReconcileResult = {dead: [], rogue : []}
        if (!server) return result;

        // creates a set for O(1) lookup
        const livePids = new Set(actualPids);

        // finds dead processes
        for (const [pid, process] of server.processes.entries()) {
            if (!livePids.has(pid)) {
                // adds the dead
                result.dead.push(pid);

                // clears the cache
                server.usedRam -= process.ramCost;
                server.processes.delete(pid);
                this.pidToHost.delete(pid);
            }
        }

        for (const pid of actualPids) {
            if (!server.processes.has(pid)) {
                result.rogue.push(pid);
            }
        }

        return result;
    }

    /**
     * Utility method for the Kernel to know how much room is left.
     */
    public getAvailableRam(hostname: string): number {
        const server = this.servers.get(hostname);
        if (!server) return 0;

        const reserved = hostname === 'home' ? this.reservedRam : 0;
        return Math.max(0, server.maxRam - server.usedRam - reserved);
    }

    /**
     * Returns all the servers registered in the RAMLedger.
     */
    public getAllServers(): Map<string, IServer> {
        return this.servers;
    }

}