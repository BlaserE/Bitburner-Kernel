import {NS, AutocompleteData} from "../../NetscriptDefinitions";
import {RAMLedger, IProcess, IServer, CreateServerObject, CreateProcessObject} from "../lib/RAMLedger";
import {KernelScript} from "../lib/KernelScript";
import {BusChannels, DataType, IHandshake, IPacket, IRequestPacket, PortManager} from "../lib/PortProtocol";

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
        exitLoop= await kernel.tick();
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
class Kernel {
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
    boot(): void {
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


    async tick () : Promise<boolean> {
        let exitLoop = false;

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

    drainBus(bus: number) {
        this.ns.print(`Draining bus ${bus}...`)
        while (this.ns.peek(bus) !== 'NULL PORT DATA') {
            const request = this.unpackFromPort(bus)

            // safety switch
            if (!request || !request.payload) continue;

            // payload router
            switch (request.payload.type) {

                case DataType.HANDSHAKE:
                    this.performHandshake(request.origin)
                    break;

                case DataType.DISPATCH:
                    this.ns.tprint(`[KERNEL] Dispatch requested...`)
                    break;

                default:
                    break;
            }

            // this.ns.tprint(request);
        }
    }

    unpackFromPort(port: number) : IRequestPacket {
        return PortManager.unpack(this.ns.readPort(port)) as IRequestPacket;
    }

    private performDispatch () {

    }


    performHandshake (destination: number) {
        const handshake: IPacket = {
            type: "HANDSHAKE",
            data : { pid: 0 } // 0 because kernel is root
        }
        // adds offset
        this.sendReply(destination, handshake);
    }


    /**
     * Exits the script
     */
    shutdown(): void {
        this.ns.exit()
    }

    sendReply(port:number, reply: IPacket) {
        this.sendSignal(PortManager.getChannel(port), reply);
    }

    sendSignal(channel:number, request:IPacket) {
        const requestString = PortManager.pack(0, request);

        const success = this.ns.tryWritePort(channel, requestString);

        if (!success) {
            this.ns.tprint(`[Port Protocol] Failed to reach PID: ${channel}`);
        }
    }

    runGarbageCollection(): void {
        
    }

}