export class KernelScript {
    _ns;
    constructor(ns, args) {
        this._ns = ns;
    }
    /**
     * This method writes a message to the designated port. It automatically handles the PID header.
     * @param port
     * @param payload
     * @protected
     */
    writeToPort(port, payload) {
        return false;
    }
    readFromPort(port) {
        return "";
    }
}
