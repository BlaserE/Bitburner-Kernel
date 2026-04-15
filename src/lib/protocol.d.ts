/**
 * /lib/protocol.d.ts
 */

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

/**
 * The standard response header
 */
export interface IResponseHeader {
    status: KResponseStatus;
    originPid: number; // The PID of the script receiving this answer
}

/**
 * Response Payloads
 */
export interface RSuccessExec {
    newPid: number; // The PID of the newly spawned script
}
export interface RError {
    reason: string; // E.g., "ERR_OUT_OF_RAM" or "ERR_ELEVATION_REQUIRED"
}

/**
 * The magic interface that connects all requests together.
 * It contains the command (KCommand), the originating PID and the flags (KFlags)
 */
export interface IBaseHeader<T extends KCommand> {
    cmd: T;
    originPid: number;
    flags: number;
}

/**
 * The Payloads of KernelRequests
 */
export interface PExec {
    scriptPath: string;
    host: string;
    threads: number;
    args: (string | number | boolean)[]; // The dynamic list of arguments
}
export interface PRegister {
    ramCost: number;
    host: string;
    // PIDs are assigned by the kernel, so it's not in the payload
}
export interface PKill {
    targetPid: number; // The PID to be assassinated
}
export interface PFree {
    targetPid: number;
}

/**
 * THE GRAND UNIFIER: The Discriminated Union
 */
export type KernelRequest =
    // the requests
    | { header: IBaseHeader<KCommand.KILL>, payload: PKill }
    | { header: IBaseHeader<KCommand.EXEC>, payload: PExec }
    | { header: IBaseHeader<KCommand.REGISTER>, payload: PRegister }
    | { header: IBaseHeader<KCommand.HEARTBEAT>, payload: null } // because it is only a heartbeat, has no other payload.
    | { header: IBaseHeader<KCommand.FREE>, payload: PFree }
    // the responses
    | { header: IResponseHeader & { status: KResponseStatus.SUCCESS }; payload: RSuccessExec | null }
    | { header: IResponseHeader & { status: KResponseStatus.ERROR }; payload: RError }
// Add new commands here...
    ;

/**
 * The Request Constructor Interface
 * Simply defines how the transcoding of requests should result in.
 */
export interface IProtocolParser {
    encode(request: KernelRequest): string; // returns a string to be sent to a port.
    decode(packet: string): KernelRequest; // returns a parsable object
    validate?(packet: string): boolean;
}

/**
 * The Port Interface
 * Defines the methods that will handle the ports
 */
export interface IProtocol {
    writeToPort(port: number, payload: KernelRequest): boolean; // sends the fully built KernelRequest
    readPort(port:number):KernelRequest | null;
}

// stuff in kernel loop :
// if (request.header.cmd === KCommand.EXEC) {
//     // TypeScript KNOWS request.payload is exactly PExec.
//     // It will autocomplete request.payload.scriptPath for you!
//     ns.exec(request.payload.scriptPath, request.payload.host);
// }