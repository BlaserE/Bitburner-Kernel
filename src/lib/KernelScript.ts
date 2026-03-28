// 1. The Contract: Every script must be able to do these things
import {NS} from "../../NetscriptDefinitions";
import {PortManager, BusChannels} from "./PortProtocol";
//import {IKernelPacket, KernelSignal, SignalPayloadMap} from "./PortProtocol";



const DataType = {
    // CRITICAL BUS (Port 1)
    TERMINATE: "TERMINATE",
    SHUTDOWN: "SHUTDOWN",

    // RESOURCE BUS (Port 2)
    ADD_SERVER: "ADD_SERVER",     // New rooted server found
    FREE_PROCESS: "FREE_PROCESS", // Script finished naturally
    UPDATE_RAM: "UPDATE_RAM",     // Server RAM changed (e.g. purchased server upgrade)

    // HANDSHAKE BUS (Port 4)
    BOOT_SUCCESS: "BOOT_SUCCESS", // Script sucessfully booted
    HANDSHAKE: "HANDSHAKE",

    // DISPATCH BUS (Port 5)
    DISPATCH: "DISPATCH",
    BATCH_DISPATCH: "BATCH_DISPATCH",

    // QUERY BUS (Port 6)
    QUERY: "QUERY",
    BATCH_QUERY: "BATCH_QUERY",

}

const RouteRecord : Record<string, BusChannels> = {
    // Critical
    [DataType.TERMINATE]: BusChannels.CRITICAL,
    [DataType.SHUTDOWN]: BusChannels.CRITICAL,

    // Register
    [DataType.ADD_SERVER]: BusChannels.REGISTER,
    [DataType.FREE_PROCESS]: BusChannels.REGISTER,
    [DataType.UPDATE_RAM]: BusChannels.REGISTER,

    // Handshake
    [DataType.HANDSHAKE] : BusChannels.HANDSHAKE,
    [DataType.BOOT_SUCCESS] : BusChannels.HANDSHAKE,

    // Dispatch
    [DataType.DISPATCH] : BusChannels.DISPATCH,
    [DataType.BATCH_DISPATCH] : BusChannels.DISPATCH,

    // Query
    [DataType.QUERY] : BusChannels.QUERY,
    [DataType.BATCH_QUERY] : BusChannels.QUERY,

}

/**
 * Defines the minimum methods and parameters every script extending the KernelScript
 * can overwrite or implement.
 */
interface IKernelScript {
    register(): void;
    //handleMessage(msg: any): void;
    shutdown(): void;
}

// 2. The Base Class: Implements the "Standard" behavior
export abstract class KernelScript implements IKernelScript {
    protected ns: NS;

    constructor(ns: NS) {
        this.ns = ns;
        this.register(); // Automatic on boot
    }

    // Default implementation: Can be overridden if needed
    public register(): void {

    }

    // Abstract method: Forces the child script to define its own logic
    abstract run(): Promise<void>;

    public shutdown(): void {
        this.ns.exit();
    }

    /**
     * Class method for sending signals on the port.
     * @param type
     * @param payload
     * @protected
     */
    protected sendSignal(type: any, payload: any): void {

    }
}