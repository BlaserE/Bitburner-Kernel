/**
 * /etc/ports.ts
 */
// Bus Architecture
export var BusChannels;
(function (BusChannels) {
    // === RING 0: HARDWARE INTERRUPTS ===
    // Preempts the normal tick loop. Handled immediately.
    BusChannels[BusChannels["CRITICAL"] = 1] = "CRITICAL";
    // === RING 1: STATE RECONCILIATION (Garbage Collection) ===
    // Must process BEFORE new allocations so we have absolute maximum RAM available.
    BusChannels[BusChannels["REGISTER"] = 2] = "REGISTER";
    // === RING 2: PENDING STATE RESOLUTION ===
    // Finalizes "Ghost RAM". When the Kernel EXECs, it temporarily reserves RAM.
    // This bus confirms the script actually booted.
    BusChannels[BusChannels["HANDSHAKE"] = 4] = "HANDSHAKE";
    // === RING 3: ALLOCATION & MUTATION ===
    // Safe to process now because Ring 1 and 2 guarantee the RAM Ledger is 100% accurate.
    BusChannels[BusChannels["DISPATCH"] = 5] = "DISPATCH";
    // === RING 4: READ-ONLY & LOW PRIORITY ===
    // Processed last so that queries get the post-reconciliation, post-allocation truth.
    BusChannels[BusChannels["QUERY"] = 6] = "QUERY";
    BusChannels[BusChannels["DEFAULT"] = 20] = "DEFAULT";
})(BusChannels || (BusChannels = {}));
export class PortManager {
    static OFFSET = 1000;
    /**
     * Returns the private channel that the kernel uses to communicate with the process.
     * It is the PID + offset, so PID + 1000
     * @param pid The process ID of the process making the communication.
     */
    static getChannel(pid) {
        return pid + PortManager.OFFSET;
    }
    /**
     * Unpacks and casts the data to a generic packet type.
     * @param {string} rawData The raw data to be unpacked into a json, obtained by reading the port request.
     */
    static unpack(rawData) {
        if (!rawData || rawData === "NULL PORT DATA")
            return null;
        try {
            return JSON.parse(rawData);
        }
        catch {
            return null;
        }
    }
    /**
     * Packs data into a JSON string with strict type enforcement.
     * @param {number} pid
     * @param {IPacket} packet
     * @return {string} Returns a string that can written to the ports.
     */
    static pack(pid, packet) {
        const request = {
            origin: pid,
            channel: this.getChannel(pid),
            payload: packet,
            sentAt: Date.now(),
        };
        return JSON.stringify(request);
    }
}
