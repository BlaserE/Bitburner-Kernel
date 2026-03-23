// ---------------------------------------------------------
// INTERFACES (The Shape of the Data)
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
    ramCost: number;
    hostname: string;
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
 * @constructor
 */
export const CreateProcessObject = (pid: number, script: string, ramCost: number, hostname: string): IProcess => {
    return { pid, script, ramCost, hostname };
};

/**
 * The RAMLedger is the class that the kernel uses to register processes across the rooted network.
 * It is the accountant of the kernel.
 */
export class RAMLedger {
    private servers: Map<string, IServer>;
    private flags: IFlags
    private reservedRam: number;

    constructor(flags: IFlags) {
        this.servers = new Map();
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
    }

    /**
     * Locates a process by PID on a specific server, frees its RAM, and deletes it.
     * Usually, only dead scripts are freed.
     * @param {string} hostname Name of the server the script runs on.
     * @param {number} pid The PID of the process to be freed.
     */
    public freeProcess(hostname: string, pid: number): void {
        const server = this.servers.get(hostname);
        if (!server) return;

        const process = server.processes.get(pid);
        if (process) {
            server.usedRam -= process.ramCost;
            server.processes.delete(pid);
        }
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

}