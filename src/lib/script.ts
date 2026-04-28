/**
 * lib/script.ts
 * This file is meant for everything that is managed under the kernel.
 * Every script for a specific task uses the methods here.
 */
import {IProcess} from "./process";
import {ICodec, ITransport} from "./protocol/protocol";
import {WireFrame} from "./protocol/values";
import {NS} from "@ns";


// --- THE CONTRACT ---
interface IScript {
    registerProcess(process:IProcess):void

}

export class Script implements IScript, ICodec, ITransport {
    protected _process: IProcess;
    protected _ns : NS

    constructor(ns:NS) {

        this._ns = ns;

        const self = this._ns.dynamicImport()
        this._process = {
            args: [],
            dependencies: [],
            exitCode: undefined,
            host: "",
            lastSeenAt: 0,
            priority: undefined,
            provides: [],
            ramReserved: 0,
            restartPolicy: undefined,
            spawnedAt: 0,
            state: undefined,
            threads: this._ns.self().,
            pid: this._ns.pid,
            inboxPort: this._ns.pid + 1000,
            script: this._ns.getScriptName()

        }
    }



    registerProcess(process: IProcess): void {
    }

    decode(raw: string): WireFrame {
        return undefined;
    }

    encode(frame: WireFrame): string {
        return "";
    }

    readPort(port: number): WireFrame | null {
        return undefined;
    }

    writeToPort(port: number, frame: WireFrame): boolean {


        return false;
    }

}