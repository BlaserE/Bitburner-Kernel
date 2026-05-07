/**
 * lib/NetProtocol.ts
 */

import {IFrame, IPacket, IPayload} from "./NetDefinitions";

/**
 *
 */
export enum HEADER_VALUES {
    PID_LENGTH = 4,
    FLAGS_LENGTH = 4,
    OPCODE_LENGTH = 2,
}

export enum Opcode {
    REGISTER  = 0x01,  // Script registers itself with the kernel after spawn
    HEARTBEAT = 0x02,  // Liveness signal to watchdog; no payload
    EXEC      = 0x03,  // Request kernel to spawn a script
    FREE      = 0x04,  // Script signals clean exit; release RAM reservation
    KILL      = 0x05,  // Request kernel to kill a target PID
    QUERY     = 0x06,  // Read-only request; response payload is JSON
}

export enum FrameFlag {
    NONE     = 0x0000,
    FORCE    = 0x0001,  // Bypass normal checks (e.g., force kill a CRITICAL process)
    SILENT   = 0x0002,  // Suppress kernel-side logging for this frame
    CRITICAL = 0x0004,  // Kernel-level priority; bypasses ring queue (see §9.5)
    ELEVATED = 0x0008,  // Requires elevated trust; kernel validates before acting
    HAS_ARGS = 0x0010,  // EXEC payload carries a JSON args fragment after TLV fields
}

export enum AckStatus {
    OK  = 0x00,  // ACK  — command accepted
    ERR = 0x01,  // NACK — command rejected; payload is ErrorReceipt
}

export const FRAME_LENGTH = 10;


/**
 * A method that converts any integers into their equivalent hexadecimal value.
 * Only accepts integer values.
 * @param num the number to be converted
 * @param base the base to convert to, 16 is default
 * @param padLength the length with which to pad the returned string, 4 is default
 */
export function convertIntegerToBase(num: number, base: number = 16, padLength: number = 4): string {
    if (!Number.isInteger(num)) throw new Error(`Expected integer, got ${num}`);
    return num.toString(base).padStart(padLength, "0");
}

/**
 * An overloaded method with three
 * @param pid
 * @param opcode
 * @param flags
 * @param asString
 */
export function convertDataToFrame(pid: number, opcode: number, flags: number, asString: true): string;
export function convertDataToFrame(pid: number, opcode: number, flags: number, asString?: false): IFrame;
export function convertDataToFrame(pid: number, opcode: number, flags: number, asString?: boolean): IFrame | string {
    const frame: IFrame = {
        pid: convertIntegerToBase(pid, 16, 4),
        flags: convertIntegerToBase(flags, 16, 4),
        opcode: convertIntegerToBase(opcode, 16, 2),
    };

    if (asString) return convertFrameToString(frame);
    return frame;
}

export function convertFrameToString(frame: IFrame): string {
    return frame.pid + frame.flags + frame.opcode;
}

export function parsePacket(packet: string): IPacket {
    const frameString: string = packet.slice(0, FRAME_LENGTH)

    const parsedFrame: IFrame = parsePacketFrame(frameString);

    const payloadString: string = packet.slice(FRAME_LENGTH)

    const parsedPayload: IPayload = {data: payloadString};

    return {frame: parsedFrame, payload: parsedPayload};
}

export function parsePacketFrame(frame: string): IFrame {
    const pid = frame.slice(0, HEADER_VALUES.PID_LENGTH);
    const flags = frame.slice(HEADER_VALUES.PID_LENGTH, HEADER_VALUES.PID_LENGTH + HEADER_VALUES.FLAGS_LENGTH);
    const opcode = frame.slice(HEADER_VALUES.PID_LENGTH + HEADER_VALUES.FLAGS_LENGTH);
    return {pid, flags, opcode};
}