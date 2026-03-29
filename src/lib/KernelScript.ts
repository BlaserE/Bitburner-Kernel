// 1. The Contract: Every script must be able to do these things
import {NS} from "../../NetscriptDefinitions";
import {PortManager, BusChannels, IPacket, IHandshake, DataType, IRequestPacket} from "./PortProtocol";
//import {IKernelPacket, KernelSignal, SignalPayloadMap} from "./PortProtocol";

const RouteRecord : Record<string, BusChannels> = {
    // Critical
    [DataType.TERMINATE]: BusChannels.CRITICAL,
    [DataType.SHUTDOWN]: BusChannels.CRITICAL,

    // Register
    [DataType.ADD_SERVER]: BusChannels.REGISTER,
    [DataType.FREE_PROCESS]: BusChannels.REGISTER,
    [DataType.UPDATE_RAM]: BusChannels.REGISTER,

    // Handshake
    [DataType.HANDSHAKE] : BusChannels.HANDSHAKE,
    [DataType.BOOT_SUCCESS] : BusChannels.HANDSHAKE,

    // Dispatch
    [DataType.DISPATCH] : BusChannels.DISPATCH,
    [DataType.BATCH_DISPATCH] : BusChannels.DISPATCH,

    // Query
    [DataType.QUERY] : BusChannels.QUERY,
    [DataType.BATCH_QUERY] : BusChannels.QUERY,

}

/**
 * Defines the minimum methods and parameters every script extending the KernelScript
 * can overwrite or implement.
 */
interface IKernelScript {
    register(): void;
    //handleMessage(msg: any): void;
    shutdown(): void;
}

// 2. The Base Class: Implements the "Standard" behavior
export abstract class KernelScript implements IKernelScript {
    protected ns: NS;
    protected PrivateChannel: number;
    protected NULL_PORT = "NULL PORT DATA";

    constructor(ns: NS) {
        this.ns = ns;
        this.PrivateChannel = PortManager.getChannel(this.ns.pid);
    }

    // Default implementation: Can be overridden if needed
    public async register(): Promise<void> {
        const handshake: IPacket = {
            type: "HANDSHAKE",
            data: { pid: this.ns.pid }
        }

        const data = await this.sendAndAwait(DataType.HANDSHAKE, handshake) as IRequestPacket;

        this.ns.tprint(data)
    }

    // Abstract method: Forces the child script to define its own logic
    abstract run(): Promise<void>;

    public shutdown(): void {
        const process: IPacket = {
            type: "FREE_PROCESS",
            data: { pid: this.ns.pid}
        }
        this.sendSignal(DataType.FREE_PROCESS, process);
        this.ns.exit();
    }

    /**
     * Class method for sending signals on the port.
     * @param type
     * @param payload
     * @protected
     */
    protected sendSignal(type: string, payload: IPacket): boolean {
        const bus = RouteRecord[type];

        if (bus == undefined) {
            this.ns.print(`ERROR: No defined route in RouteRecord for signal type : ${type}`);
            return false;
        }

        const request = PortManager.pack(this.ns.pid, payload);
        const success = this.ns.tryWritePort(bus, request)

        if (!success) {
            this.ns.print(`WARNING: Write to port ${bus} unsuccessful`);
        }
        return success;
    }

    protected async sendAndAwait(type: string, payload: IPacket): Promise<any> {
        // flush port cache
        while (this.ns.peek(this.PrivateChannel) !== this.NULL_PORT) {
            this.ns.readPort(this.PrivateChannel);
        }

        const success = this.sendSignal(type, payload);
        if (!success) return;

        // waits for an answer
        await this.ns.nextPortWrite(this.PrivateChannel)

        return this.readPrivatePort();
    }

    protected readPrivatePort(): any {
        return PortManager.unpack(this.ns.readPort(this.PrivateChannel));
    }
}