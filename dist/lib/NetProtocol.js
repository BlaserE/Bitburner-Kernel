/**
 * lib/NetProtocol.ts
 */
/**
 *
 */
export var HEADER_VALUES;
(function (HEADER_VALUES) {
    HEADER_VALUES[HEADER_VALUES["PID_LENGTH"] = 4] = "PID_LENGTH";
    HEADER_VALUES[HEADER_VALUES["FLAGS_LENGTH"] = 4] = "FLAGS_LENGTH";
    HEADER_VALUES[HEADER_VALUES["OPCODE_LENGTH"] = 2] = "OPCODE_LENGTH";
})(HEADER_VALUES || (HEADER_VALUES = {}));
export var Opcode;
(function (Opcode) {
    Opcode[Opcode["REGISTER"] = 1] = "REGISTER";
    Opcode[Opcode["HEARTBEAT"] = 2] = "HEARTBEAT";
    Opcode[Opcode["EXEC"] = 3] = "EXEC";
    Opcode[Opcode["FREE"] = 4] = "FREE";
    Opcode[Opcode["KILL"] = 5] = "KILL";
    Opcode[Opcode["QUERY"] = 6] = "QUERY";
})(Opcode || (Opcode = {}));
export var FrameFlag;
(function (FrameFlag) {
    FrameFlag[FrameFlag["NONE"] = 0] = "NONE";
    FrameFlag[FrameFlag["FORCE"] = 1] = "FORCE";
    FrameFlag[FrameFlag["SILENT"] = 2] = "SILENT";
    FrameFlag[FrameFlag["CRITICAL"] = 4] = "CRITICAL";
    FrameFlag[FrameFlag["ELEVATED"] = 8] = "ELEVATED";
    FrameFlag[FrameFlag["HAS_ARGS"] = 16] = "HAS_ARGS";
})(FrameFlag || (FrameFlag = {}));
export var AckStatus;
(function (AckStatus) {
    AckStatus[AckStatus["OK"] = 0] = "OK";
    AckStatus[AckStatus["ERR"] = 1] = "ERR";
})(AckStatus || (AckStatus = {}));
export const FRAME_LENGTH = 10;
/**
 * A method that converts any integers into their equivalent hexadecimal value.
 * Only accepts integer values.
 * @param num the number to be converted
 * @param base the base to convert to, 16 is default
 * @param padLength the length with which to pad the returned string, 4 is default
 */
export function convertIntegerToBase(num, base = 16, padLength = 4) {
    if (!Number.isInteger(num))
        throw new Error(`Expected integer, got ${num}`);
    return num.toString(base).padStart(padLength, "0");
}
export function convertDataToFrame(pid, opcode, flags, asString) {
    const frame = {
        pid: convertIntegerToBase(pid, 16, 4),
        flags: convertIntegerToBase(flags, 16, 4),
        opcode: convertIntegerToBase(opcode, 16, 2),
    };
    if (asString)
        return convertFrameToString(frame);
    return frame;
}
export function convertFrameToString(frame) {
    return frame.pid + frame.flags + frame.opcode;
}
export function parsePacket(packet) {
    const frameString = packet.slice(0, FRAME_LENGTH);
    const parsedFrame = parsePacketFrame(frameString);
    const payloadString = packet.slice(FRAME_LENGTH);
    const parsedPayload = { data: payloadString };
    return { frame: parsedFrame, payload: parsedPayload };
}
export function parsePacketFrame(frame) {
    const pid = frame.slice(0, HEADER_VALUES.PID_LENGTH);
    const flags = frame.slice(HEADER_VALUES.PID_LENGTH, HEADER_VALUES.PID_LENGTH + HEADER_VALUES.FLAGS_LENGTH);
    const opcode = frame.slice(HEADER_VALUES.PID_LENGTH + HEADER_VALUES.FLAGS_LENGTH);
    return { pid, flags, opcode };
}
