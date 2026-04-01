/**
 * lib/Sudo.ts
 * This is the script that will be run when the alias 'sudo' is called.
 */
import { DataType } from "./PortProtocol";
import { KernelScript } from "./KernelScript";
/**
 * Flags schema for terminal autocomplete.
 * Every option here is prefixed with '--'
 * Eg, '--help'
 */
const schema = [
    // Flag -- Default value of flag
    ['verbose', false], // Just makes more prints
    ['exec', 'help'], // reserves ram for manual execution via terminal
    ['hostname', ''],
    ['threads', 1], // Only applies to the script being executed.
    ['help', false] // prints a list of arguments and their description (NYI)
];
/**
 * Sudo's autocomplete method.
 * I have no idea how it works...
 * @param data
 * @param args
 */
export function autocomplete(data, args) {
    data.flags(schema);
    data.scripts;
    data.servers;
    return [];
}
export async function main(ns) {
    const args = ns.flags(schema); // fits the interface and is type safe
    if (args.help) {
        ns.tprint(`
Sudo Options:
(NEEDS TO BE ADAPTED)
--verbose       : Enable detailed logging
--reserveRam    : [number] RAM to leave free for terminal scripts (Default: 15GB)
--gcInterval    : [number] MS between garbage collection cycles (Default: 2000)
--aggressiveGc  : [boolean] Kill unregistered PIDs on rooted servers
        `);
        return;
    }
    const sudo = new Sudo(ns, args);
    await sudo.register();
    await sudo.run();
}
class Sudo extends KernelScript {
    /**
     * The constructor can handle the args, I think. We'll see.
     * @param ns
     * @param args
     */
    // constructor(ns: NS, args: IFlags) {
    //     super(ns, args);
    // }
    /**
     * The main method of the sudo class.
     */
    async run() {
        if (this.args.exec && this.args.exec !== 'help') {
            await this.handleExec();
        }
        else {
            this.ns.tprint(`[SUDO] ERROR: No command provided to sudo`);
        }
    }
    async handleExec() {
        const scriptPath = this.args.exec;
        const hostname = this.args.hostname || this.ns.getHostname();
        const threads = this.args.threads;
        const scriptArgs = this.args._ || [];
        this.ns.tprint(`[SUDO] Requesting execution of script: ${scriptPath} with args: ${scriptArgs}`);
        const packet = {
            type: "DISPATCH",
            data: {
                script: scriptPath,
                host: hostname,
                threads: threads,
                args: scriptArgs
            }
        };
        // does not call PortManager.pack, the sendAndAwait does it by itself.
        const answer = await this.sendAndAwait(DataType.DISPATCH, packet);
        if (answer && answer.success) {
            this.ns.tprint(`[SUDO] Execution successful, script PID : ${answer.pid}`);
        }
        else {
            this.ns.tprint(`[SUDO] Execution failed. Check Kernel Logs.`);
        }
    }
}
