/**
 * lib/KernelScript.ts
 */
import {NS, ScriptArg} from "@ns";
import {convertDataToFrame, convertIntegerToBase, parsePacket} from "./NetProtocol";
import {IAckPayload, IPayload, IRegisterPayload} from "./NetDefinitions";


export abstract class KernelScript {
    /**
     * The protected property of netscript.
     * @protected
     */
    protected _ns: NS;
    protected _args: ScriptArg[];
    protected _opcode: number = 0;
    protected _flags: number = 0;


    /**
     * The kernel script constructor. It receives has a NS property as well as the script args property.
     * @param ns
     * @param args
     * @protected
     */
    protected constructor(ns: NS, args: ScriptArg[]) {
        this._ns = ns;
        this._args = args;
        this.onInit(ns)
    }

    protected abstract onInit(ns: NS): void;



    protected writeToPort(port: number, opcode: number, flags: number, payload: IPayload): boolean {
        const frame = convertDataToFrame(this._ns.pid, opcode, flags, true);
        const packet = frame + JSON.stringify(payload);
        return this._ns.tryWritePort(port, packet);
    }

    protected readFromPort(port: number): string{
        return this._ns.readPort(port);
    }

    /**
     *
     * @param port
     * @protected
     */
    protected async awaitPortWrite(port: number): Promise<string> {
        await this._ns.nextPortWrite(port);
        return this.readFromPort(port);
    }

    protected async register(): Promise<boolean> {
        const payload: IRegisterPayload = {
            args: this._args,
            name: this._ns.getScriptName(),
            type: "register"
        }

        this.writeToPort(1, this._opcode, this._flags, payload);
        const response = parsePacket(await this.awaitPortWrite(this._ns.pid + 1000));

        return (response.payload == "ack");
    }

    protected abstract heartbeat(): void;


}