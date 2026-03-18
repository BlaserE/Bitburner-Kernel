// /etc/ports.js


export const DataType = Object.freeze({
    EXEC: "EXEC",
    KILL: "KILL",
    QUERY: "QUERY",
    PING: "PING",
    SUCCESS: "SUCCESS",
    ERROR: "ERROR"
});

/**
 * This is a 0GB library. It contains NO 'ns' calls.
 */
export class PortManager {
    // 1. Static properties (Shared across the whole game)
    static OFFSET = 1000;
    static BUS_LOW = 2;
    static BUS_HIGH = 1;

    // 2. Static methods (Calculators that don't need a 'new' instance)
    static getChannel(pid) {
        return pid + PortManager.OFFSET;
    }

    /**
     * Standardizes how we look at port data.
     * Returns null if the port is empty, or the parsed object if it has data.
     */
    static unpack(rawData) {
        if (!rawData || rawData === "NULL PORT DATA") {
            return null;
        }
        try {
            return JSON.parse(rawData);
        } catch (e) {
            return null; // Silently fail on bad data
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