import { PortManager, DataType } from '/etc/ports.js';
import { RAMLedger } from '/lib/RAMLedger.js';

/** @param {NS} ns **/
export async function main(ns) {
    const kernel = new Kernel(ns);
    await kernel.boot();
}

class Kernel {
    constructor(ns) {
        this.ns = ns;
        
        this.ledger = new RAMLedger(ns); // Where we will track PIDs eventually
        this.gcInterval = 2000; // How often to run garbage collection (in ms)
        this.lastGC = Date.now();
    }

    async boot() {
        this.ns.disableLog("ALL");
        this.ns.tprint("KERNEL: Booting...");

        // Define the kernel's own PID, RAM cost, and host for easy reference
        const KERNEL = {
            PID: this.ns.pid,
            ramCost: this.ns.getScriptRam("/sbin/kernel.js"),
            host: "home"
        }

        // Start by registering home and any purchased servers into the ledger
        this.ledger.registerServer("home"); 
        this.ns.getPurchasedServers().forEach(server => this.ledger.registerServer(server));

        this.ns.tprint(`KERNEL: RAM Ledger initialized`)

        this.ledger.registerProcess(KERNEL.PID, KERNEL.host, KERNEL.ramCost); // Register the kernel itself as a process on home with 0 RAM usage

        this.ns.tprint(`KERNEL: Online. Request pipeline (1-20) active.`);
        
        while (true) {

            await this.listen();

            // Gargage collection
            if (Date.now() - this.lastGC > this.gcInterval) {
                this.ns.print("Running Garbage Collection...");

                await this.runGarbageCollection();
                this.lastGC = Date.now();
            }

            await this.ns.sleep(20); // The "Heartbeat"
        }
    }


    async listen() {
        this.ns.print("KERNEL: Listening for requests...");
        let requests = 0;
        
        for (let port = 1; port <= 20; port++) {
            let raw;

            while ((raw = this.ns.readPort(port)) !== "NULL PORT DATA") {
                const request = PortManager.unpack(raw);
                if (request) {
                    this.ns.print(`INBOUND: [${request.type}] from PID ${request.origin}`);
                    await this.handleRequest(request);
                    requests++;
                }
            }
        }
        this.ns.print(`KERNEL: Handled ${requests} requests.`);
    }

    /**
     * Method that runs every few seconds to check if any process in the ledger have died without
     * being removed from the ledger.
     */
    async runGarbageCollection() {
        const trackedPIDS = [...this.ledger.processes.keys()];
        this.ns.print(`GC: Tracking ${trackedPIDS.length} processes...`); 
        for (const pid of trackedPIDS) {
            if (!this.ns.isRunning(pid)) {
                this.ns.print(`GC: Cleaning up PID ${pid}...`);
                this.ledger.freeProcess(pid);
            }
        }
    }

    /**
     * Method called when a request hits a port.
     * @param {DataType} request 
     */
    async handleRequest(request) {
        switch (request.type) {
            case DataType.QUERY:
                let result;
                const queryType = request.data.queryType;
                
                switch (queryType) {
                    case "NET_STATS":
                        result = this.ledger.getNetworkStatus();
                        break; // CRITICAL: Stop here
                    case "PROCESS_LIST":
                        result = this.ledger.getProcessList();
                        break; // CRITICAL: Stop here
                    default:
                        result = { error: "Unknown Query Type: " + queryType };
                }
                // Send the reply after the sub-switch finishes
                this.sendReply(request.channel, DataType.SUCCESS, result);
                break; // Exit the DataType.QUERY block



            case DataType.EXEC:
                const { script, threads, args = [] } = request.data;
                const scriptRam = this.ns.getScriptRam(script);
                const totalRam = scriptRam * threads;

                const targetHost = this.ledger.findHostFor(totalRam);

                if (!targetHost) {
                    this.ns.print(`ERROR: No host fits ${totalRam}GB for ${script}`);
                    this.sendReply(request.channel, DataType.ERROR, { error: "INSUFFICIENT RAM", needed: totalRam });
                } else {
                    const pid = this._kernelExec(script, threads, args, targetHost);
                    this.sendReply(request.channel, DataType.SUCCESS, { pid, host: targetHost });
                }
                break;

            case DataType.BATCH_EXEC:
                // We'll tackle this logic next!
                break;

            case DataType.KILL:
                const pidToKill = request.data.pid;
                if (this.ns.kill(pidToKill)) {
                    this.ledger.freeProcess(pidToKill); // Sync ledger immediately
                    this.sendReply(request.channel, DataType.SUCCESS, { killed: pidToKill });
                } else {
                    this.sendReply(request.channel, DataType.ERROR, { msg: "Failed to kill PID" });
                }
                break;

            case DataType.BATCH_KILL:
                // We'll tackle this logic next!
                break;

            case DataType.PING:
                this.ns.print(`HANDSHAKE: Received from PID ${request.origin}`);
                this.sendReply(request.channel, DataType.SUCCESS, { msg: "ACK: System Online" });
                break;

            default:
                this.ns.print("Unknown Request Type: " + request.type);
                this.sendReply(request.channel, DataType.ERROR, { msg: "Invalid Type" });
        }
    }
    /**
     * The method called to reply to a request. It answers to the PID's private channel, so it goes directly to the requester.
     * @param {int} channel 
     * @param {DataType} type 
     * @param {object} data 
     */
    sendReply(channel, type, data) {
        // We use the same 'pack' logic but send it to the SENDER'S channel
        const msg = PortManager.pack(this.ns.pid, type, data);
        this.ns.writePort(channel, msg);
    }

    /**
     * THE ONE EXEC TO RULE THEM ALL.
     * This method will handle them all.
     * @param {string} script 
     * @param {int} threads 
     * @param {Array} args 
     * @param {string} targetHost 
     * @returns 
     */
    _kernelExec(script, threads, args, targetHost) {
        const pid = this.ns.exec(script, targetHost, threads, ...args);

        if (pid === 0) {
            this.ns.print(`ERROR: Failed to exec ${script} on ${targetHost} with ${threads} threads.`);
            return;
        }
        this.ledger.registerProcess(pid, targetHost, this.ns.getScriptRam(script) * threads);
        return pid;
    }


}
