/**
 * /etc/ports.ts
 */

export interface IExecData {
    script: string;
    host: string;
    threads: number;
    args: (string | number | boolean)[];
}

export interface IKillData {
    pid: number;
}

export interface IQueryData {
    queryType: "RAM" | "PROCESSES" | "NODES";
}

/**
 * The type of request
 */
export type IPacket =
    | { type: "EXEC"; data: IExecData }
    | { type: "KILL"; data: IKillData }
    | { type: "QUERY"; data: IQueryData }
    | { type: "PING"; data: { msg: string } };


/**
 * The actual payload being sent. This is what goes in the ports as requests
 */
export interface IRequestPacket {
    origin: number;
    channel: number;
    payload: IPacket; // The type-safe interior
    sentAt: number;
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
    static unpack(rawData: string) {
        if (!rawData || rawData === "NULL PORT DATA") return null;
        try {
            return JSON.parse(rawData);
        } catch {
            return null;
        }
    }

    /**
     * Packs data into a JSON string with strict type enforcement.
     * @param {number} pid
     * @param {IPacket} packet
     */
    static pack(pid: number, packet: IPacket): IRequestPacket {
        const request: IRequestPacket = {
            channel: 0,
            payload: packet,
            sentAt: 0,
            origin: pid
        }
        return request;
    }
}