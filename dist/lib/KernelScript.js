import { KCommand } from "./protocol-bitmask";
/**
 * KernelScript is the basic class that all scripts that are to be run in the Kernel-framework
 * HAVE to inherit from.
 */
export class KernelScript {
    ns;
    PrivateChannel;
    NULL_PORT = "NULL PORT DATA";
    args;
    constructor(ns, args) {
        this.ns = ns;
        this.PrivateChannel = this.ns.pid + 1000;
        if (args != null) {
            this.args = args;
        }
    }
    // Default implementation: Can be overridden if needed
    async register() {
        const header = {
            cmd: KCommand.REGISTER,
            originPid: this.ns.pid,
            flags: 0x02
        };
        const pRegister = {
            ramCost: this.ns.getScriptRam(this.ns.getScriptName()),
            host: this.ns.getHostname()
        };
        const register = {
            header: header,
            payload: pRegister,
        };
        // const data = await this.sendAndAwait(DataType.HANDSHAKE, handshake) as IRequestPacket;
        // this.ns.print(`[KernelScript] Received handshake from Kernel : ${data}`)
    }
    /**
     *
     */
    shutdown() {
        // const process: IPacket = {
        //     type: "FREE_PROCESS",
        //     data: {pid: this.ns.pid}
        // }
        // this.sendRequest(DataType.FREE_PROCESS, process);
        this.ns.exit();
    }
    /**
     * Class method for sending signals on the port.
     * @param type
     * @param payload
     * @protected
     */
    // protected sendRequest(type: string, payload: IPacket): boolean {
    //     return this.sendSignal(type, payload);
    // }
    // protected async sendAndAwait(type: string, payload: IPacket): Promise<any> {
    //     // flush port cache
    // while (this.ns.peek(this.PrivateChannel) !== this.NULL_PORT) {
    //     const message = this.readPrivatePort();
    //
    //     // if (message.payload.type)
    // }
    //
    // const success = this.sendRequest(type, payload);
    // if (!success) {
    //     return { type: DataType.ERROR, data: { message: "BUS_FULL" } };
    // }
    // // waits for an answer
    // await this.ns.nextPortWrite(this.PrivateChannel)
    //
    // return this.readPrivatePort();
    // }
    /**
     * KernelScript-specific method for reading private ports.
     * It is mostly meant to be used by calling sendAndAwait
     * @protected
     */
    readPrivatePort() {
        return this.readPort(this.PrivateChannel);
    }
    writeToPort(port, payload) {
        return false;
    }
    /**
     *
     */
    readPort(port) {
        if (port !== this.PrivateChannel) {
            this.ns.print(`ERROR: Unauthorized port read attempt on port ${port}`);
            return null;
        }
        const rawData = this.ns.readPort(port);
        if (rawData == this.NULL_PORT)
            return null;
        return this.decode(rawData);
    }
    encode(request) {
        return "";
    }
    decode(request) {
        const header = {
            cmd: KCommand.REGISTER,
            originPid: this.ns.pid,
            flags: 0x02
        };
        const pRegister = {
            ramCost: this.ns.getScriptRam(this.ns.getScriptName()),
            host: this.ns.getHostname()
        };
        const register = {
            header: header,
            payload: pRegister,
        };
        return register;
    }
}
