


/** @param {NS} ns **/
export class RAMLedger {
    constructor(ns) {
        this.ns = ns;
        this.servers = new Map(); // hostname -> { used: number, max: number }
        
        this.processes = new Map(); // pid -> { hostname: string, ramUsage: number }

    }

    /**
     * Method called to register a server into the managed resource pool.
     * Only servers with root access should be registered, as they can be used for running scripts.
     * @param {string} hostname 
     */
    registerServer(hostname) {
        const maxRAM = this.ns.getServerMaxRam(hostname);
        this.servers.set(hostname, { max: maxRAM, used: 0 });

        this.ns.print(`[Ledger] Registered ${hostname} (${maxRAM}GB)`);
    }

    /**
     * Finds a host that has enough free RAM to accommodate the requested amount.
     * @param {int} ramNeeded 
     * @returns {string|null} The hostname of the first suitable host, or null if none is found.
     */
    findHostFor(ramNeeded) {
        for (const [hostname, stats] of this.servers.entries()) {
            const free = stats.max - stats.used;
            if (free >= ramNeeded) {
                return hostname;
            }
        }
        return null;
    }

    /**
     * Registers a process in the ledger, marking the specified amount of RAM as used on the host server.
     * @param {int} pid 
     * @param {string} hostname 
     * @param {int} ramCost 
     * @returns boolean indicating whether the process was successfully registered
     */
    registerProcess(pid, hostname, ramCost) {
        const server = this.servers.get(hostname);
        if (!server) return false;

        server.used += ramCost;
        this.processes.set(pid, { host: hostname, ram: ramCost });
        return true;
    }

    /**
     * Method called to unregister a process from the ledger, freeing up its RAM on the host server.
     * @param {int} pid 
     * @returns boolean indicating whether the process was successfully unregistered (i.e. it existed in the ledger)
     */
    freeProcess(pid) {
        const process = this.processes.get(pid);
        if (!process) return false;

        const server = this.servers.get(process.host);
        if (server) {
            server.used -= process.ram;
            if (server.used < 0) server.used = 0; // Just in case
        }

        this.processes.delete(pid);
        this.ns.print(`LEDGER: Reclaimed ${process.ram}GB from PID ${pid}`);
        return true;
    }

    /**
     * Method to get the current RAM usage and host server of a process by its PID.
     * @param {int} PID 
     */
    getStatus(PID) {
        const process = this.processes.get(PID);
        if (!process) {
            return null; // Process not found
        }
        return { host: process.host, ram: process.ram };
    }

    /**
     * Method to get the status of a specific server.
     * @param {string} hostname 
     * @returns 
     */
    getServerStatus(hostname) {
        return this.servers.get(hostname);
    }

    /**
     * Method to get the status of the server network
     * @returns 
     */
    getNetworkStatus() {
        const status = {
            TotalRAM: 0,
            UsedRAM: 0,
            Servers: []
        };
        for (const [hostname, stats] of this.servers.entries()) {
            status.TotalRAM += stats.max;
            status.UsedRAM += stats.used;
            status.Servers.push(hostname)
        }
        return status;
    }
}