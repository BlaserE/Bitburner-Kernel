import { PortManager, DataType } from '/etc/ports.js';

/** @param {NS} ns **/
export async function main(ns) {
    const MY_ID = ns.pid;
    const MY_CHANNEL = PortManager.getChannel(MY_ID);
    
    ns.tprint(`[${MY_ID}] Starting Handshake...`);

    // 1. HANDSHAKE (Discovery Port 20)
    // We tell the kernel who we are.
    const handshake = PortManager.pack(MY_ID, DataType.PING, { message: "Hello Kernel!" });
    ns.writePort(PortManager.BUS_DEFAULT, handshake);

    // Listen for acknowledgment
    let response = await waitForReply(ns, MY_CHANNEL);
    if (!response) return ns.tprint("FAIL: No handshake response.");
    ns.tprint("SUCCESS: Kernel acknowledged handshake.");

    // 2. EXEC REQUEST (Exec Port 3)
    // Now we ask the kernel to run a simple script (e.g., a basic hack)
    ns.tprint(`[${MY_ID}] Requesting EXEC for /bin/basic-hack.js...`);
    const execRequest = PortManager.pack(MY_ID, DataType.EXEC, { 
        script: "/bin/basic-hack.js", 
        threads: 1, 
        args: ["n00dles"] 
    });
    
    ns.writePort(PortManager.BUS_EXEC, execRequest);

    // Listen for the PID of the new process
    response = await waitForReply(ns, MY_CHANNEL);
    if (response && response.type === DataType.SUCCESS) {
        ns.tprint(`SUCCESS: Kernel spawned child with PID: ${response.data.pid} on ${response.data.host}`);
    } else {
        ns.tprint(`FAIL: Kernel rejected EXEC. Reason: ${response?.data?.error || "Unknown"}`);
    }
}

/** Helper to poll the private port for a reply **/
async function waitForReply(ns, channel) {
    for (let i = 0; i < 50; i++) { // 5 second timeout
        const raw = ns.readPort(channel);
        const data = PortManager.unpack(raw);
        if (data) return data;
        await ns.sleep(100);
    }
    return null;
}