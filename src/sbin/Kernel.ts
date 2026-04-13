import {NS, AutocompleteData} from "@ns";
import {RAMLedger, IProcess, IServer, CreateServerObject, CreateProcessObject} from "../lib/RAMLedger";
import {KernelScript} from "../lib/KernelScript";
import {BusChannels, DataType, IHandshake, IPacket, IProtocol, IRequestPacket, PortManager} from "../lib/PortProtocol";

/**
 * Interface for the kernel flags. It uses camelCase because kebab-case is too cool for JS.
 */
export interface IFlags {
    [key: string]: any;

    verbose: boolean;
    reservedRam: number;
    gcInterval: number;
    aggressiveGc: boolean;
    help: boolean;
}

/**
 * Flags schema for terminal autocomplete
 */
const schema: [string, string | number | boolean | []][] = [
    ['verbose', false], // Just makes more prints
    ['reservedRam', 15], // reserves ram for manual execution via terminal
    ['gcInterval', 2000], // interval for collecting garbage
    ['aggressiveGc', false], // actively seeks PIDs on rooted servers and kills them if they are not registered.
    ['help', false] // prints a list of arguments and their description (NYI)
]

/**
 * Simply an autocomplete method for terminal. No clue how it works, ask the bitburner devs.
 * @param data
 * @param args
 */
export function autocomplete(data: AutocompleteData, args: string[]) {
    data.flags(schema);
    return [];
}

export async function main(ns: NS) {
    const args = ns.flags(schema) as IFlags // fits the interface and is type safe

    if (args.help) {
        ns.tprint(`
Kernel Boot Options:
--verbose       : Enable detailed logging
--reserveRam    : [number] RAM to leave free for terminal scripts (Default: 15GB)
--gcInterval    : [number] MS between garbage collection cycles (Default: 2000)
--aggressiveGc  : [boolean] Kill unregistered PIDs on rooted servers
        `);
        return;
    }
    const kernel = new Kernel(ns, args);

    let exitLoop = false;
    while (!exitLoop) {
        exitLoop = await kernel.tick();
        await ns.sleep(1);
    }

    // the kernel exits the run loop.

    kernel.shutdown()
}

/**
 * The Kernel class. It is the central authority, serving as the executer of scripts and allocator of RAM.
 * It uses utility classes, such as the RAMLedger, for Zero-Cost tracking of scripts across the network of rooted servers.
 * It is intended to be the only script able to do `ns.exec`. It could potentially be configured to automatically kill any scripts that
 * it hasn't executed itself.
 */
class Kernel implements IProtocol {
    private ns: NS
    private processDB: RAMLedger;
    private readonly config: IFlags;
    private lastGC: number;


    /**
     * Creates the Kernel object, but does not begin operation. It only prepares it.
     * @param ns
     * @param flags
     */
    constructor(ns: NS, flags: IFlags) {
        this.ns = ns;
        this.config = flags;

        // creates the ledger
        this.processDB = new RAMLedger(this.config);

        this.boot()

        this.lastGC = Date.now(); // should be the last thing called in the constructor
    }


    /**
     * The thing that actually does begin kernel operations.
     */
    public boot(): void {
        this.ns.disableLog("ALL");
        this.ns.tprint("KERNEL: Booting...");

        const KernelServer = CreateServerObject(
            this.ns, this.ns.getHostname()
        )
        this.processDB.registerServer(KernelServer);

        const KernelProcess = CreateProcessObject(
            this.ns.pid, "/sbin/Kernel.js", this.ns.getScriptRam("/sbin/Kernel.js"), this.ns.getHostname()
        )
        this.processDB.registerProcess(KernelProcess);

        this.ns.tprint("KERNEL: RAMLedger initialized.");

        // while (true) {
        //     // TODO: add terminal-based kernel interrupt


        //     // Gargage collection
        //     if (Date.now() - this.lastGC > this.config.gcInterval) {
        //         this.ns.print("Running Garbage Collection...");
        //
        //         await this.runGarbageCollection();
        //         this.lastGC = Date.now();
        //     }
        //
        //     await this.ns.sleep(1); // needs to sleep in order to pass actual game time
        // }


    }


    public async tick(): Promise<boolean> {
        let exitLoop = false;

        this.ns.print(`[KERNEL] Running internal tick...`)

        this.drainBus(BusChannels.CRITICAL)
        this.drainBus(BusChannels.REGISTER)

        this.drainBus(BusChannels.HANDSHAKE)
        this.drainBus(BusChannels.DISPATCH)

        if (Date.now() - this.lastGC > this.config.gcInterval) {
            this.runGarbageCollection();
            this.lastGC = Date.now();
        }

        // leaves if needed
        return exitLoop;
    }

    private drainBus(bus: number) {
        let requests : number = 0;
       // this.ns.print(`Draining bus ${bus}...`)
        while (this.ns.peek(bus) !== 'NULL PORT DATA') {
            const request = this.unpackFromPort(bus);

            // safety switch
            if (!request || !request.payload) continue;


            this.resolveRequest(request);

            requests++;
            // this.ns.tprint(request);
        }
        this.ns.print(`[KERNEL] Drained bus ${bus} of ${requests} requests.`);
    }

    private resolveRequest (request : IRequestPacket): void {
        // payload router
        switch (request.payload.type) {

            case DataType.HANDSHAKE:
                this.performHandshake(request.origin)
                break;

            case DataType.DISPATCH:
                this.ns.tprint(`[KERNEL] Dispatch requested...`)
                break;


            case DataType.TERMINAL:
                this.ns.tprint(`[KERNEL] Terminal command received...`)

            default:
                break;
        }
    }


    private performDispatch() {

    }


    private performHandshake(destination: number) {
        const handshake: IPacket = {
            type: "HANDSHAKE",
            data: {pid: this.ns.pid} // because kernel is root
        }
        // adds offset
        this.sendReply(destination, handshake);
    }


    /**
     * Exits the script
     */
    public shutdown(): void {
        this.ns.exit()
    }

    private sendReply(port: number, reply: IPacket) {
        this.sendSignal(PortManager.getChannel(port), reply);
    }

    public sendSignal(port: number, request: IPacket): boolean {
        const requestString = PortManager.pack(this.ns.pid, request);

        // if (typeof port === "string") return false;

        const success = this.ns.tryWritePort(port, requestString);

        if (!success) {
            this.ns.tprint(`[Port Protocol] Failed to reach PID: ${port}`);
        }
        return success;
    }

    /**
     *
     * @param port
     */
    public readPort(port: number): IRequestPacket | null {
        const rawData = this.ns.readPort(port);
        if (rawData == "NULL PORT DATA") return null;

        return PortManager.unpack(rawData);
    }

    private unpackFromPort(port: number): IRequestPacket | null{
        return this.readPort(port);
    }

    private runGarbageCollection(): void {
        for (const [hostname, server] of this.processDB.getAllServers()) {

            const actualPids = this.ns.ps(hostname).map(p => p.pid);

            const report = this.processDB.reconcile(hostname, actualPids);

            if (this.config.verbose && report.dead.length > 0) {
                // processes already dead, no need to kill anything.
                this.ns.print(`[GarbageCollector] Reclaimed RAM from ${report.dead.length} dead PIDs on host ${hostname}`);
            }

            // the KILLER
            if (this.config.aggressiveGc) {
                for (const roguePid of report.rogue) {
                    // never kills the kernel.
                    // KERNELS NEVER DIE
                    if (roguePid === this.ns.pid) continue;

                    this.ns.print(`[GarbageCollector] Aggressive killing of rogue PID ${roguePid} on host ${hostname}`);
                    this.ns.kill(roguePid);
                }
            }

        }


    }

}