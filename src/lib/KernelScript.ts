import type {
    IProtocol,
    KRequest,
    IBaseHeader,
    PRegister,
    IProtocolParser,
    KernelPacket
} from "./protocol.d.ts"
import {forgeHeader, KCommand, KFlag, KResponseStatus} from "./protocol-bitmask";
import {NS} from "@ns"



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
export abstract class KernelScript implements IKernelScript, IProtocol, IProtocolParser {
    protected ns: NS;
    protected PrivateChannel: number;
    protected NULL_PORT = "NULL PORT DATA";
    protected args: any;

    protected myFlags: number;

    constructor(ns: NS, args?:any) {
        this.ns = ns;
        this.PrivateChannel = this.ns.pid + 1000;

        this.myFlags = this.ns.args[0] as number?? 0;

        if (args != null) {
            this.args = args;
        }
    }

    // Default implementation: Can be overridden if needed
    public async register(): Promise<void> {
        const header: IBaseHeader<KCommand.REGISTER> = {
            cmd: KCommand.REGISTER,
            originPid: this.ns.pid,
            flags: 0x02
        }
        const pRegister : PRegister = {
            ramCost: this.ns.getScriptRam(this.ns.getScriptName()),
            host: this.ns.getHostname()
        }

        const register: KernelPacket = {
            header : header,
            payload: pRegister,
        }

        // const data = await this.sendAndAwait(DataType.HANDSHAKE, handshake) as IRequestPacket;



        // this.ns.print(`[KernelScript] Received handshake from Kernel : ${data}`)
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
    protected readPrivatePort(): KernelPacket {
        return this.readPort(this.PrivateChannel) as KernelPacket;
    }

    /**
     * Implementation of the IProtocol interface.
     * @param port
     * @param payload
     */
    public writeToPort(port: number, payload: KRequest): boolean {
        payload.header.flags |= this.myFlags;

        const encodedString: string = this.encode(payload);
        return this.ns.tryWritePort(port, encodedString);
    }

    /**
     * Implementation of the IProtocol interface
     */
    public readPort(port: number): KernelPacket | null {
        if (port !== this.PrivateChannel) {
            this.ns.print(`ERROR: Unauthorized port read attempt on port ${port}`);
            return null;
        }
        const rawData = this.ns.readPort(port);
        if (rawData == this.NULL_PORT) return null;

        return this.decode(rawData);
    }

    /**
     * Implementation of the IProtocolParser interfaec
     * @param request
     */
    public encode(request: KernelPacket) : string {
        const headerstr: string = forgeHeader(request.header as IBaseHeader<any>)

        return "";
    }

    /**
     * Implementation of the IProtocolParser interfaec
     * @param request
     */
    public decode (request: string) : KernelPacket {
        const header: IBaseHeader<KCommand.REGISTER> = {
            cmd: KCommand.REGISTER,
            originPid: this.ns.pid,
            flags: 0x02
        }
        const pRegister : PRegister = {
            ramCost: this.ns.getScriptRam(this.ns.getScriptName()),
            host: this.ns.getHostname()
        }

        const register: KernelPacket = {
            header : header,
            payload: pRegister,
        }

        return register;
    }
}