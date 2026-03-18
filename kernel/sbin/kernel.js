import { PortManager, DataType } from '/etc/Ports.js';
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

        this.ns.tprint("KERNEL: Online. Listening on Port " + this.bus);
        
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
        this.ns.tprint("KERNEL: Listening for requests...");
        let requests = 0;
        // 
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
        this.ns.tprint(`KERNEL: Handled ${requests} requests.`);
    }

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

    async handleRequest(request) {
        switch (request.type) {
            case DataType.QUERY:
                this.ns.print("Handling RAM Query...");
                // Logic: Check home RAM, etc.
                const response = { status: "OK", availableRam: 1024 }; 
                
                this.sendReply(request.channel, DataType.SUCCESS, response);
                break;

            case DataType.EXEC:
                // Logic for ns.exec goes here later
                break;

            default:
                this.ns.print("Unknown Request Type: " + request.type);
                this.sendReply(request.channel, DataType.ERROR, { msg: "Invalid Type" });
        }
    }

    sendReply(channel, type, data) {
        // We use the same 'pack' logic but send it to the SENDER'S channel
        const msg = PortManager.pack(this.ns.pid, type, data);
        this.ns.writePort(channel, msg);
    }
}