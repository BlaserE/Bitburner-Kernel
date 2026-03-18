import { PortManager, DataType } from '/etc/ports.js';

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tprint("KERNEL: Booting...");

    const kernel = new Kernel(ns);
    await kernel.boot();
}

class Kernel {
    constructor(ns) {
        this.ns = ns;
        this.bus = PortManager.BUS_LOW;
        this.registry = new Map(); // Where we will track PIDs eventually
    }

    async boot() {
        this.ns.tprint("KERNEL: Online. Listening on Port " + this.bus);
        
        while (true) {
            const raw = this.ns.readPort(this.bus);
            const request = PortManager.unpack(raw);

            if (request) {
                this.ns.print(`INBOUND: [${request.type}] from PID ${request.origin}`);
                await this.handleRequest(request);
            }

            await this.ns.sleep(20); // The "Heartbeat"
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