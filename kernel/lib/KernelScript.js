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
        this.ns.print(`[KernelScript] Received handshake from Kernel : ${data}`);
    }
    /**
     *
     */
    shutdown() {
        const process = {
            type: "FREE_PROCESS",
            data: { pid: this.ns.pid }
        };
        this.sendRequest(DataType.FREE_PROCESS, process);
        this.ns.exit();
    }
    /**
     * Class method for sending signals on the port.
     * @param type
     * @param payload
     * @protected
     */
    sendRequest(type, payload) {
        return this.sendSignal(type, payload);
    }
    async sendAndAwait(type, payload) {
        // flush port cache
        while (this.ns.peek(this.PrivateChannel) !== this.NULL_PORT) {
            this.ns.readPort(this.PrivateChannel);
        }
        const success = this.sendRequest(type, payload);
        if (!success)
            return;
        // waits for an answer
        await this.ns.nextPortWrite(this.PrivateChannel);
        return this.readPrivatePort();
    }
    /**
     * KernelScript-specific method for reading private ports.
     * It is mostly meant to be used by calling sendAndAwait
     * @protected
     */
    readPrivatePort() {
        return this.readPort(this.PrivateChannel);
    }
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
    /**
     * IProtocol implementation of readPort.
     * It verifies if the calling script owns the port being read (PID + 1000)
     * Afterward, it verifies if the port is empty.
     * @param port
     * @return {IRequestPacket | null} Port's content
     */
    readPort(port) {
        if (port !== this.PrivateChannel) {
            this.ns.print(`ERROR: Unauthorized port read attempt on port ${port}`);
            return null;
        }
        const rawData = this.ns.readPort(port);
        if (rawData == this.NULL_PORT)
            return null;
        return PortManager.unpack(rawData);
    }
}
