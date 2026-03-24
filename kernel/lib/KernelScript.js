import { PortManager } from "./PortProtocol";
// 2. The Base Class: Implements the "Standard" behavior
export class KernelScript {
    ns;
    constructor(ns) {
        this.ns = ns;
        this.register(); // Automatic on boot
    }
    // Default implementation: Can be overridden if needed
    register() {
        const packet = {
            pid: this.ns.pid,
            hostname: this.ns.getHostname(),
            ram: this.ns.getScriptRam(this.ns.getScriptName()),
            type: 'REG'
        };
        this.ns.writePort(2, JSON.stringify(packet));
    }
    shutdown() {
        this.ns.writePort(2, JSON.stringify({ pid: this.ns.pid, type: 'EXIT' }));
        this.ns.exit();
    }
    /**
     * Class method for sending signals on the port.
     * @param type
     * @param payload
     * @protected
     */
    sendSignal(type, payload) {
        const packet = PortManager.pack(this.ns.pid, type, payload);
        this.ns.writePort(2, JSON.stringify(packet));
    }
}
