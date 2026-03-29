import { PortManager, BusChannels } from "./PortProtocol";
//import {IKernelPacket, KernelSignal, SignalPayloadMap} from "./PortProtocol";
const DataType = {
    // CRITICAL BUS (Port 1)
    TERMINATE: "TERMINATE",
    SHUTDOWN: "SHUTDOWN",
    // RESOURCE BUS (Port 2)
    ADD_SERVER: "ADD_SERVER", // New rooted server found
    FREE_PROCESS: "FREE_PROCESS", // Script finished naturally
    UPDATE_RAM: "UPDATE_RAM", // Server RAM changed (e.g. purchased server upgrade)
    // HANDSHAKE BUS (Port 4)
    BOOT_SUCCESS: "BOOT_SUCCESS", // Script sucessfully booted
    HANDSHAKE: "HANDSHAKE",
    // DISPATCH BUS (Port 5)
    DISPATCH: "DISPATCH",
    BATCH_DISPATCH: "BATCH_DISPATCH",
    // QUERY BUS (Port 6)
    QUERY: "QUERY",
    BATCH_QUERY: "BATCH_QUERY",
};
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
        await this.sendAndAwait(DataType.HANDSHAKE, handshake);
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
