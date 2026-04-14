/**
 * /etc/ports.ts
 */

/**
 * The interface for when a script sends a packet asking the kernel to execute a script.
 */
export interface IDispatchRequest {
    script: string;
    host: string | undefined; // specifies if the executed script needs a specific host, mostly for coding contracts if this is necessary. Might be phased out
    threads: number;
    args: (string | number | boolean)[];
}

/**
 * The interface for the kernel to reply to the script asking it to execute a script.
 * It specifies if it was successful and the PID as well as the host.
 */
export interface IDispatchReply {
    success: boolean;
    pid: number; // returns 0 if failed
    host: string; // empty if failed.
}

export interface IKillData {
    pid: number;
}

export interface IQueryData {
    queryType: "RAM" | "PROCESSES" | "NODES";
}

export interface IFreeProcess {
    pid: number;
}

export interface IHandshake {
    pid: number;
}

export interface IError {

}

/**
 * The type of request
 */
export type IPacket =
    | { type: "DISPATCH"; data: IDispatchRequest }
    | { type: "KILL"; data: IKillData }
    | { type: "QUERY"; data: IQueryData }
    | { type: "PING"; data: { msg: string } }
    | { type: "FREE_PROCESS", data: IFreeProcess }
    | { type: "HANDSHAKE", data: IHandshake }
    | { type: "ERROR"}
    | { type: "DISPATCH_REPLY", data: IDispatchReply };

/**
 * The actual payload being sent. This is what goes in the ports as requests
 */
export interface IRequestPacket {
    origin: number;
    channel: number;
    payload: IPacket; // The type-safe interior
    sentAt: number;
}

export const DataType = {
    // CRITICAL BUS (Port 1)
    TERMINATE: "TERMINATE",
    SHUTDOWN: "SHUTDOWN",
    TERMINAL: "TERMINAL", // for CLI operations

    // RESOURCE BUS (Port 2)
    ADD_SERVER: "ADD_SERVER",     // New rooted server found
    FREE_PROCESS: "FREE_PROCESS", // Script finished naturally
    UPDATE_RAM: "UPDATE_RAM",     // Server RAM changed (e.g. purchased server upgrade)

    // HANDSHAKE BUS (Port 4)
    BOOT_SUCCESS: "BOOT_SUCCESS", // Script sucessfully booted
    HANDSHAKE: "HANDSHAKE",

    // DISPATCH BUS (Port 5)
    DISPATCH: "DISPATCH",
    BATCH_DISPATCH: "BATCH_DISPATCH",

    // QUERY BUS (Port 6)
    QUERY: "QUERY",
    BATCH_QUERY: "BATCH_QUERY",


    // Outbound types, those that the Kernel only sends out
    ERROR: "ERROR",

}

// Bus Architecture
export enum BusChannels {
    // === RING 0: HARDWARE INTERRUPTS ===
    // Preempts the normal tick loop. Handled immediately.
    CRITICAL = 1,   // KILL, SHUTDOWN. Recovers RAM forcefully.

    // === RING 1: STATE RECONCILIATION (Garbage Collection) ===
    // Must process BEFORE new allocations so we have absolute maximum RAM available.
    REGISTER = 2,   // FREE RAM. Processes dying naturally (EXIT signals), new servers rooted.

    // === RING 2: PENDING STATE RESOLUTION ===
    // Finalizes "Ghost RAM". When the Kernel EXECs, it temporarily reserves RAM.
    // This bus confirms the script actually booted.
    HANDSHAKE = 4,

    // === RING 3: ALLOCATION & MUTATION ===
    // Safe to process now because Ring 1 and 2 guarantee the RAM Ledger is 100% accurate.
    DISPATCH = 5,       // Spawns scripts. Kernel immediately deducts from internal ledger.

    // === RING 4: READ-ONLY & LOW PRIORITY ===
    // Processed last so that queries get the post-reconciliation, post-allocation truth.
    QUERY = 6,      // Network mapping, RAM requests, PINGs.
    DEFAULT = 20,   // Uncategorized generic traffic.
}

export class PortManager {

    static readonly OFFSET = 1000;

    /**
     * Returns the private channel that the kernel uses to communicate with the process.
     * It is the PID + offset, so PID + 1000
     * @param pid The process ID of the process making the communication.
     */
    static getChannel(pid: number): number {
        return pid + PortManager.OFFSET;
    }

    /**
     * Unpacks and casts the data to a generic packet type.
     * @param {string} rawData The raw data to be unpacked into a json, obtained by reading the port request.
     */
    static unpack(rawData: string): any {
        if (!rawData || rawData === "NULL PORT DATA") return null;
        try {
            return JSON.parse(rawData) as IRequestPacket;
        } catch {
            return null;
        }
    }

    /**
     * Packs data into a JSON string with strict type enforcement.
     * @param {number} pid
     * @param {IPacket} packet
     * @return {string} Returns a string that can written to the ports.
     */
    static pack(pid: number, packet: IPacket): string {
        const request: IRequestPacket = {
            origin: pid,
            channel: this.getChannel(pid),
            payload: packet,
            sentAt: Date.now(),
        }
        return JSON.stringify(request);
    }
}

/**
 * Interface required by scripts that need to implement the PortProtocol.
 */
export interface IProtocol {
    sendSignal(type:string | number, payload: IPacket): boolean;
    readPort(port:number):IRequestPacket | null;
}