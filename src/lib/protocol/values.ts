// The file that contains everything that can't go inside a .d.ts file but isnt used directly either.



import {ExecPayload, FrameHeader, ExecReceipt, ErrorReceipt, FreePayload, KillPayload, RegisterPayload, ResponseHeader} from "./protocol";

export enum Opcode {
    REGISTER  = 0x01,   // Script registers itself with the kernel after spawn
    HEARTBEAT = 0x02,   // Liveness signal to the watchdog; no payload
    EXEC      = 0x03,   // Request kernel to spawn a script
    FREE      = 0x04,   // Script signals clean exit; release RAM reservation
    KILL      = 0x05,   // Request kernel to kill a target PID
}

export enum FrameFlag {
    NONE     = 0x0000,
    FORCE    = 0x0001,   // Bypass normal checks (e.g., force kill a CRITICAL process)
    SILENT   = 0x0002,   // Suppress kernel-side logging for this frame
    CRITICAL = 0x0004,   // Kernel-level priority; bumped to front of ring queue
    ELEVATED = 0x0008,   // Requires elevated trust; kernel validates before acting
    HAS_ARGS = 0x0010,   // EXEC payload carries a JSON args fragment after TLV fields
}

enum Priority {
    CRITICAL = 0,   // Kernel services; killed last, spawned first
    HIGH     = 1,   // Coordination scripts
    NORMAL   = 2,   // Standard workers
    LOW      = 3,   // Background analytics, logging
    IDLE     = 4   // Opportunistic; only runs if RAM is abundant
}

export enum AckStatus {
    OK  = 0x00,   // ACK  — command accepted and executed
    ERR = 0x01,   // NACK — command rejected; ResponseFrame carries an ErrorReceipt
}

type RequestFrame =
    | { header: FrameHeader<Opcode.EXEC>,      payload: ExecPayload      }
    | { header: FrameHeader<Opcode.REGISTER>,  payload: RegisterPayload  }
    | { header: FrameHeader<Opcode.KILL>,      payload: KillPayload      }
    | { header: FrameHeader<Opcode.FREE>,      payload: FreePayload      }
    | { header: FrameHeader<Opcode.HEARTBEAT>, payload: null             };

type ResponseFrame =
    | { header: ResponseHeader & { status: AckStatus.OK  }; payload: ExecReceipt | null }
    | { header: ResponseHeader & { status: AckStatus.ERR }; payload: ErrorReceipt       };

/**
 * Bridges the two types together
 */
export type WireFrame = RequestFrame | ResponseFrame;
