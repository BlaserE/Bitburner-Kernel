// Request header: identifies the command, origin, and flags
import {AckStatus, Opcode, WireFrame} from "./values";

interface FrameHeader<T extends Opcode> {
    cmd:       T;        // The opcode
    originPid: number;   // Bitburner PID of the sending script
    flags:     number;   // OR'd FrameFlag bitmask
}

// Response header: identifies the outcome and the target (who to reply to)
interface ResponseHeader {
    status:    AckStatus;
    originPid: number;   // PID of the script this response is addressed to
}

// Payloads (request side)
interface ExecPayload {
    scriptPath: string;
    host: string;
    threads: number;
    args?: (string | number | boolean)[];  // Only present when HAS_ARGS flag is set
}
interface RegisterPayload {
    ramCost: number;   // Total RAM cost: ramPerThread * threads
    host: string;
}
interface KillPayload  { targetPid: number; }
interface FreePayload  { targetPid: number; }
// HEARTBEAT has no payload

// Receipts (response side)
interface ExecReceipt  { newPid: number; }        // Kernel confirms spawn, returns bbPid
interface ErrorReceipt { reason: string; }         // e.g. "ERR_OUT_OF_RAM"

// Encodes/decodes WireFrames to/from the string wire format
interface ICodec {
    encode(frame: WireFrame): string;
    decode(raw: string): WireFrame;
    validate?(raw: string): boolean;  // optional fast header-only check
}

// Handles the actual port read/write operations
interface ITransport {
    writeToPort(port: number, frame: WireFrame): boolean;
    readPort(port: number): WireFrame | null;
}