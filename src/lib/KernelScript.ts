// 1. The Contract: Every script must be able to do these things
import {NS} from "../../NetscriptDefinitions";
import {DataType, PortManager} from "./PortProtocol";
//import {IKernelPacket, KernelSignal, SignalPayloadMap} from "./PortProtocol";

interface IKernelScript {
    register(): void;
    //handleMessage(msg: any): void;
    shutdown(): void;
}

// 2. The Base Class: Implements the "Standard" behavior
export abstract class KernelScript implements IKernelScript {
    protected ns: NS;

    constructor(ns: NS) {
        this.ns = ns;
        this.register(); // Automatic on boot
    }

    // Default implementation: Can be overridden if needed
    public register(): void {
        const packet = {
            pid: this.ns.pid,
            hostname: this.ns.getHostname(),
            ram: this.ns.getScriptRam(this.ns.getScriptName()),
            type: 'REG'
        };
        this.ns.writePort(2, JSON.stringify(packet));
    }

    // Abstract method: Forces the child script to define its own logic
    abstract run(): Promise<void>;

    public shutdown(): void {
        this.ns.writePort(2, JSON.stringify({ pid: this.ns.pid, type: 'EXIT' }));
        this.ns.exit();
    }

    /**
     * Class method for sending signals on the port.
     * @param type
     * @param payload
     * @protected
     */
    protected sendSignal(type: any, payload: any): void {
        const packet = PortManager.pack(this.ns.pid, type,  payload)
        this.ns.writePort(2, JSON.stringify(packet));
    }
}