import { convertDataToFrame, parsePacket } from "./NetProtocol";
export class KernelScript {
    /**
     * The protected property of netscript.
     * @protected
     */
    _ns;
    _args;
    _opcode = 0;
    _flags = 0;
    /**
     * The kernel script constructor. It receives has a NS property as well as the script args property.
     * @param ns
     * @param args
     * @protected
     */
    constructor(ns, args) {
        this._ns = ns;
        this._args = args;
        this.onInit();
    }
    writeToPort(port, opcode, flags, payload) {
        const frame = convertDataToFrame(this._ns.pid, opcode, flags, true);
        const packet = frame + JSON.stringify(payload);
        return this._ns.tryWritePort(port, packet);
    }
    readFromPort(port) {
        return this._ns.readPort(port);
    }
    /**
     *
     * @param port
     * @protected
     */
    async awaitPortWrite(port) {
        await this._ns.nextPortWrite(port);
        return this.readFromPort(port);
    }
    async register() {
        const payload = {
            args: this._args,
            name: this._ns.getScriptName(),
            type: "register"
        };
        this.writeToPort(1, this._opcode, this._flags, payload);
        const response = parsePacket(await this.awaitPortWrite(this._ns.pid + 1000));
        return (response.payload == "ack");
    }
}
