import {IBaseHeader, IResponseHeader, KRequest} from "./protocol";

/**
 * Command IDs (1 Byte / 2 Hex chars)
 * There are
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



/**
 * Fuses the header into a deterministic 10-char hex string.
 * Order: [CMD:2][PID:4][FLAGS:4]
 */
export function forgeHeader<T extends KCommand>(header: IBaseHeader<T>): string {
    const cmdHex = header.cmd.toString(16).padStart(2, '0');

    // PIDs are numbers, originPid: 1024 -> "0400"
    const pidHex = header.originPid.toString(16).padStart(4, '0');

    // Flags are a bitmask, e.g., SILENT | ELEVATED
    const flgHex = header.flags.toString(16).padStart(4, '0');

    return `${cmdHex}${pidHex}${flgHex}`.toLowerCase();
}

export function forgeResponseHeader(header: IResponseHeader): string {
    const statusHex = header.status.toString(16).padStart(2, '0');
    const targetPidHex = header.originPid.toString(16).padStart(4, '0');

    // You could pad the rest with zeros to keep all packets 10 chars
    return `${statusHex}${targetPidHex}0000`.toLowerCase();
}