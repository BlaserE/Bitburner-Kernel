/**
 * Command IDs (1 Byte / 2 Hex chars)
 */
export enum KCommand {
    REGISTER = 0x01,
    HEARTBEAT = 0x02,
    EXEC = 0x03,
    FREE = 0x04,
    KILL = 0x05,
}

/**
 * Bit-mask flags (2 Bytes / 4 Hex chars)
 */
export enum KFlag {
    NONE = 0x0000,
    FORCE = 0x0001,      // Bypass normal checks (e.g., force kill)
    SILENT = 0x0002,     // Do not log this action to the terminal
    CRITICAL = 0x0004,   // Kernel-level priority
    ELEVATED = 0x0008    // Run with root/admin filesystem permissions
}

/**
 * Kernel Response Codes
 */
export enum KResponseStatus {
    SUCCESS = 0x00, // ACK
    ERROR = 0x01    // NACK
}