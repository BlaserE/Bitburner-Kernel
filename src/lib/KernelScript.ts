/**
 * lib/KernelScript.ts
 */
import {NS, ScriptArg} from "@ns";


export class KernelScript {
    protected _ns: NS;



    constructor(ns: NS, args: ScriptArg) {
        this._ns = ns;

    }


    /**
     * This method writes a message to the designated port. It automatically handles the PID header.
     * @param port
     * @param payload
     * @protected
     */
    protected writeToPort(port: number, payload: string): boolean {

        return false;
    }

    protected readFromPort(port: number): string{

        return "";
    }

}