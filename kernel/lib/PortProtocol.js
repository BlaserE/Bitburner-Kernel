/**
 * /etc/ports.ts
 */
export const DataType = {
    EXEC: "EXEC", // for single scripts, regardless of threads (eg, ns.share)
    BATCH_EXEC: "BATCH_EXEC", // for multiple scripts in one request, each with their own thread count. (eg, HGHW)
    KILL: "KILL", // kills a process by PID
    BATCH_KILL: "BATCH_KILL", // kills multiple PIDs in one request
    QUERY: "QUERY", // for querying the kernel for information. Specify a "queryType" in the data field to specify what info you want
    BATCH_QUERY: "BATCH_QUERY", // for querying the kernel for multiple pieces of information in one request. Data field should contain an array of queryTypes.
    PING: "PING",
    HANDSHAKE: "HANDSHAKE",
    BATCH_PING: "BATCH_PING", // for checking if the kernel is responsive. Data field can specify how many pings to send in one request.
    SUCCESS: "SUCCESS", // response to a request, indicating it was successful. Data field can be used for the response body.
    ERROR: "ERROR" // response to a request, indicating it failed. Data field can be used for the error message.
};
export var BusChannels;
(function (BusChannels) {
    BusChannels[BusChannels["CRITICAL"] = 1] = "CRITICAL";
    BusChannels[BusChannels["RESOURCE"] = 2] = "RESOURCE";
    BusChannels[BusChannels["HANDSHAKE"] = 3] = "HANDSHAKE";
    BusChannels[BusChannels["EXEC"] = 4] = "EXEC";
    BusChannels[BusChannels["QUERY"] = 5] = "QUERY";
    BusChannels[BusChannels["DEFAULT"] = 20] = "DEFAULT";
})(BusChannels || (BusChannels = {}));
export class PortManager {
    // Bus Architecture
    static BUS_CRITICAL = 1;
    static BUS_MUTATE = 2;
    static BUS_EXEC = 3;
    static BUS_QUERY = 4;
    static BUS_HANDSHAKE = 15;
    static BUS_DEFAULT = 20;
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
     * @param {any} type
     * @param {any} data
     */
    static pack(pid, type, data) {
        return JSON.stringify({
            origin: pid,
            channel: PortManager.getChannel(pid),
            type: BusChannels,
            data: data,
            sentAt: Date.now()
        });
    }
}
