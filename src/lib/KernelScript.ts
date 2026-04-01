// 1. The Contract: Every script must be able to do these things
import {NS} from "../../NetscriptDefinitions";
import {
    PortManager,
    BusChannels,
    IPacket,
    IHandshake,
    DataType,
    IRequestPacket,
    IProtocol,
    IError
} from "./PortProtocol";
//import {IKernelPacket, KernelSignal, SignalPayloadMap} from "./PortProtocol";

const RouteRecord: Record<string, BusChannels> = {
    // Critical
    [DataType.TERMINATE]: BusChannels.CRITICAL,
    [DataType.SHUTDOWN]: BusChannels.CRITICAL,

    // Register
    [DataType.ADD_SERVER]: BusChannels.REGISTER,
    [DataType.FREE_PROCESS]: BusChannels.REGISTER,
    [DataType.UPDATE_RAM]: BusChannels.REGISTER,

    // Handshake
    [DataType.HANDSHAKE]: BusChannels.HANDSHAKE,
    [DataType.BOOT_SUCCESS]: BusChannels.HANDSHAKE,

    // Dispatch
    [DataType.DISPATCH]: BusChannels.DISPATCH,
    [DataType.BATCH_DISPATCH]: BusChannels.DISPATCH,

    // Query
    [DataType.QUERY]: BusChannels.QUERY,
    [DataType.BATCH_QUERY]: BusChannels.QUERY,

}

/**
 * Defines the minimum methods and parameters every script extending the KernelScript
 * can overwrite or implement.
 */
interface IKernelScript {
    register(): void;

    shutdown(): void;
}

/**
 * KernelScript is the basic class that all scripts that are to be run in the Kernel-framework
 * HAVE to inherit from.
 */
export abstract class KernelScript implements IKernelScript, IProtocol {
    protected ns: NS;
    protected PrivateChannel: number;
    protected NULL_PORT = "NULL PORT DATA";
    protected args: any;

    constructor(ns: NS, args?:any) {
        this.ns = ns;
        this.PrivateChannel = PortManager.getChannel(this.ns.pid);

        if (args != null) {
            this.args = args;
        }
    }

    // Default implementation: Can be overridden if needed
    public async register(): Promise<void> {
        const handshake: IPacket = {
            type: "HANDSHAKE",
            data: {pid: this.ns.pid}
        }

        const data = await this.sendAndAwait(DataType.HANDSHAKE, handshake) as IRequestPacket;



        this.ns.print(`[KernelScript] Received handshake from Kernel : ${data}`)
    }

    /**
     * Abstract method that MUST be defined by children of the KernelScript class
     * @return {Promise<void>} `Promise<void>` because it is async
     */
    abstract run(): Promise<void>;

    /**
     *
     */
    public shutdown(): void {
        const process: IPacket = {
            type: "FREE_PROCESS",
            data: {pid: this.ns.pid}
        }
        this.sendRequest(DataType.FREE_PROCESS, process);
        this.ns.exit();
    }

    /**
     * Class method for sending signals on the port.
     * @param type
     * @param payload
     * @protected
     */
    protected sendRequest(type: string, payload: IPacket): boolean {
        return this.sendSignal(type, payload);
    }

    protected async sendAndAwait(type: string, payload: IPacket): Promise<any> {
        // flush port cache
        while (this.ns.peek(this.PrivateChannel) !== this.NULL_PORT) {
            const message = this.readPrivatePort();

            if (message.payload.type)
        }

        const success = this.sendRequest(type, payload);
        if (!success) {
            return { type: DataType.ERROR, data: { message: "BUS_FULL" } };
        }
        // waits for an answer
        await this.ns.nextPortWrite(this.PrivateChannel)

        return this.readPrivatePort();
    }

    /**
     * KernelScript-specific method for reading private ports.
     * It is mostly meant to be used by calling sendAndAwait
     * @protected
     */
    protected readPrivatePort(): IRequestPacket {
        return this.readPort(this.PrivateChannel) as IRequestPacket;
    }

    public sendSignal(type: string, payload: IPacket): boolean {
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

    /**
     * IProtocol implementation of readPort.
     * It verifies if the calling script owns the port being read (PID + 1000)
     * Afterward, it verifies if the port is empty.
     * @param port
     * @return {IRequestPacket | null} Port's content
     */
    public readPort(port: number): IRequestPacket | null {
        if (port !== this.PrivateChannel) {
            this.ns.print(`ERROR: Unauthorized port read attempt on port ${port}`);
            return null;
        }
        const rawData = this.ns.readPort(port);
        if (rawData == this.NULL_PORT) return null;

        return PortManager.unpack(rawData);
    }
}