import {IProtocol, KCommand, KernelRequest, IBaseHeader, PRegister, IProtocolParser} from "./protocol.d.ts"
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

    constructor(ns: NS, args?:any) {
        this.ns = ns;
        this.PrivateChannel = this.ns.pid + 1000;

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

        const register: KernelRequest = {
            header : header,
            payload: pRegister,
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

            // if (message.payload.type)
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
    protected readPrivatePort(): KernelRequest {
        return this.readPort(this.PrivateChannel) as KernelRequest;
    }

    public writeToPort(port: number, payload: KernelRequest): boolean {


        return false;
    }

    /**
     *
     */
    public readPort(port: number): KernelRequest | null {
        if (port !== this.PrivateChannel) {
            this.ns.print(`ERROR: Unauthorized port read attempt on port ${port}`);
            return null;
        }
        const rawData = this.ns.readPort(port);
        if (rawData == this.NULL_PORT) return null;

        return this.decode(rawData);
    }

    public encode (request: KernelRequest) : string {


        return "";
    }

    public decode (request: string) : KernelRequest {
        

        return null;
    }
}