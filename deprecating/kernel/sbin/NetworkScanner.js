import {DataType, PortManager} from "../etc/ports";

/** @param {NS} ns **/
export async function main(ns) {
    const flags = ns.flags([
        ['verbose', false] // Just makes more prints

    ])




    const scanner = new NetworkScanner(ns, flags);
    await scanner.boot();
}

class NetworkScanner {


    constructor(ns, flags) {
        this.ns = ns;
        this.flags = flags;

        this.MY_PID = this.ns.pid;
        this.MY_CHANNEL = PortManager.getChannel(this.MY_PID)

        this._initHandshake();

    }


    async boot() {


    }

    _initHandshake () {
        this.ns.tprint($`[NetworkScanner (${this.MY_PID})] Beginning handshake protocol...`)

        const handshake = PortManager.pack(this.MY_PID, DataType.HANDSHAKE, {
            host: this.ns.getHostname()

        })



    }

}