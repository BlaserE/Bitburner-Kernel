/**
 * Command IDs (1 Byte / 2 Hex chars)
 * There are
 */
export var KCommand;
(function (KCommand) {
    KCommand[KCommand["REGISTER"] = 1] = "REGISTER";
    KCommand[KCommand["HEARTBEAT"] = 2] = "HEARTBEAT";
    KCommand[KCommand["EXEC"] = 3] = "EXEC";
    KCommand[KCommand["FREE"] = 4] = "FREE";
    KCommand[KCommand["KILL"] = 5] = "KILL";
})(KCommand || (KCommand = {}));
/**
 * Bit-mask flags (2 Bytes / 4 Hex chars)
 */
export var KFlag;
(function (KFlag) {
    KFlag[KFlag["NONE"] = 0] = "NONE";
    KFlag[KFlag["FORCE"] = 1] = "FORCE";
    KFlag[KFlag["SILENT"] = 2] = "SILENT";
    KFlag[KFlag["CRITICAL"] = 4] = "CRITICAL";
    KFlag[KFlag["ELEVATED"] = 8] = "ELEVATED"; // Run with root/admin filesystem permissions
})(KFlag || (KFlag = {}));
/**
 * Kernel Response Codes
 */
export var KResponseStatus;
(function (KResponseStatus) {
    KResponseStatus[KResponseStatus["SUCCESS"] = 0] = "SUCCESS";
    KResponseStatus[KResponseStatus["ERROR"] = 1] = "ERROR"; // NACK
})(KResponseStatus || (KResponseStatus = {}));
/**
 * Fuses the header into a deterministic 10-char hex string.
 * Order: [CMD:2][PID:4][FLAGS:4]
 */
export function forgeHeader(header) {
    const cmdHex = header.cmd.toString(16).padStart(2, '0');
    // PIDs are numbers, originPid: 1024 -> "0400"
    const pidHex = header.originPid.toString(16).padStart(4, '0');
    // Flags are a bitmask, e.g., SILENT | ELEVATED
    const flgHex = header.flags.toString(16).padStart(4, '0');
    return `${cmdHex}${pidHex}${flgHex}`.toLowerCase();
}
export function forgeResponseHeader(header) {
    const statusHex = header.status.toString(16).padStart(2, '0');
    const targetPidHex = header.originPid.toString(16).padStart(4, '0');
    // You could pad the rest with zeros to keep all packets 10 chars
    return `${statusHex}${targetPidHex}0000`.toLowerCase();
}
