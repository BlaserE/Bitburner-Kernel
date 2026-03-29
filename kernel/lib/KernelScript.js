import { PortManager, BusChannels, DataType } from "./PortProtocol";
//import {IKernelPacket, KernelSignal, SignalPayloadMap} from "./PortProtocol";
const RouteRecord = {
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
};
// 2. The Base Class: Implements the "Standard" behavior
export class KernelScript {
    ns;
    PrivateChannel;
    NULL_PORT = "NULL PORT DATA";
    constructor(ns) {
        this.ns = ns;
        this.PrivateChannel = PortManager.getChannel(this.ns.pid);
    }
    // Default implementation: Can be overridden if needed
    async register() {
        const handshake = {
            type: "HANDSHAKE",
            data: { pid: this.ns.pid }
        };
        const data = await this.sendAndAwait(DataType.HANDSHAKE, handshake);
        this.ns.tprint(data);
    }
    shutdown() {
        const process = {
            type: "FREE_PROCESS",
            data: { pid: this.ns.pid }
        };
        this.sendSignal(DataType.FREE_PROCESS, process);
        this.ns.exit();
    }
    /**
     * Class method for sending signals on the port.
     * @param type
     * @param payload
     * @protected
     */
    sendSignal(type, payload) {
        const bus = RouteRecord[type];
        if (bus == undefined) {
            this.ns.print(`ERROR: No defined route in RouteRecord for signal type : ${type}`);
            return false;
        }
        const request = PortManager.pack(this.ns.pid, payload);
        const success = this.ns.tryWritePort(bus, request);
        if (!success) {
            this.ns.print(`WARNING: Write to port ${bus} unsuccessful`);
        }
        return success;
    }
    async sendAndAwait(type, payload) {
        // flush port cache
        while (this.ns.peek(this.PrivateChannel) !== this.NULL_PORT) {
            this.ns.readPort(this.PrivateChannel);
        }
        const success = this.sendSignal(type, payload);
        if (!success)
            return;
        // waits for an answer
        await this.ns.nextPortWrite(this.PrivateChannel);
        return this.readPrivatePort();
    }
    readPrivatePort() {
        return PortManager.unpack(this.ns.readPort(this.PrivateChannel));
    }
}
