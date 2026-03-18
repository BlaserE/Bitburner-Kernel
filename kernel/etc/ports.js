// /etc/ports.js


export const DataType = Object.freeze({
    EXEC: "EXEC", // for single scripts, regardless of threads (eg, ns.share)
    BATCH_EXEC: "BATCH_EXEC", // for multiple scripts in one request, each with their own thread count. (eg, HGHW)
    KILL: "KILL", // kills a process by PID
    QUERY: "QUERY", // for querying the kernel for information. Specify a "queryType" in the data field to specify what info you want
    PING: "PING", 
    SUCCESS: "SUCCESS", // response to a request, indicating it was successful. Data field can be used for the response body.
    ERROR: "ERROR" // response to a request, indicating it failed. Data field can be used for the error message.
});

export class PortManager {
    // Input bus architecture:
    static BUS_CRITICAL = 1; // Interrupts (Kills, Reboots)
    static BUS_MUTATE   = 2; // Writes (Ledger/DB updates)
    static BUS_EXEC     = 3; // Schedulers (Spawning scripts)
    static BUS_QUERY    = 4; // Reads (Asking for data)
    static BUS_DEFAULT  = 20; // Handshakes and unknowns

    static OFFSET = 1000; // The offset added to a PID to get its listening port. This is where the kernel writes responses to.

    /**
     * Calculates the port number for a given PID.
     * This is the port thay the process listens to. The kernel writes responses to this port.
     * @param {int} pid 
     * @returns port number to listen to for this PID
     */
    static getChannel(pid) {
        return pid + PortManager.OFFSET;
    }

    /**
     * Standardizes how we look at port data.
     * Returns null if the port is empty, or the parsed object if it has data.
     */
    static unpack(rawData) {
        if (!rawData || rawData === "NULL PORT DATA") return null;
        try {
            return JSON.parse(rawData);
        } catch (e) {
            return null;
        }
    }

    static pack(pid, type, data = {}) {
        return JSON.stringify({
            origin: pid,
            channel: PortManager.getChannel(pid),
            type: type,
            data: data,
            sentAt: Date.now()
        })
    }
}