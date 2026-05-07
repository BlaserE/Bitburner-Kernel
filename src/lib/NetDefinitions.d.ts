import {ScriptArg} from "@ns";

interface IPacket {
    frame: IFrame;
    payload: IPayload;
}

interface IFrame {
    pid: string;
    flags: string;
    opcode: string;

}

/**
 * Literally an empty interface, only meant for children of payload.
 */
interface IPayload { }

interface IRegisterPayload extends IPayload {
    name: string;
    args: ScriptArg[];
    type: "register";
}


declare enum AckStatus {
    OK  = 0x00,  // ACK  — command accepted
    ERR = 0x01,  // NACK — command rejected; payload is ErrorReceipt
}

interface IAckPayload extends IPayload {
    status: AckStatus;
}
