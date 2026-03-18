import { PortManager, DataType } from '/etc/ports.js';

/** @param {NS} ns **/
export async function main(ns) {
    const proc = new MyScriptProcess(ns);
    await proc.handshake();
}

class MyScriptProcess {
    constructor(ns) {
        this.ns = ns;
        this.pid = ns.pid;
    }

    async handshake() {
        const myChannel = PortManager.getChannel(this.pid);

        this.ns.clearPort(myChannel);
        
        await this._writePort(DataType.QUERY, { ram: 2.0 });

        let response = null;
        const start = Date.now();

        this.ns.print(`Awaiting Kernel response on port ${myChannel}...`);

        while (!response) {
            if (Date.now() - start > 5000) {
                this.ns.tprint("ERROR: Kernel Handshake Timeout!");
                return; 
            }
            response = PortManager.unpack(this.ns.readPort(myChannel));
            await this.ns.sleep(20);
        }

        this.ns.tprint("Received reply: " + JSON.stringify(response));
    }

    async _writePort(type, data) {
        const msg = PortManager.pack(this.pid, type, data);
        this.ns.writePort(PortManager.BUS_LOW, msg);
    }
}