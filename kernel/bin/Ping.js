import { PortManager, DataType } from '/etc/ports.js';

/** @param {NS} ns **/
export async function main(ns) {
    const MY_ID = ns.pid;
    const MY_CHANNEL = PortManager.getChannel(MY_ID);

    const packet = PortManager.pack(MY_ID, DataType.QUERY, { queryType: "RAM_CHECK" });
    
    ns.tprint(`PING: Sending request to Kernel on Port ${PortManager.BUS_QUERY}...`);
    ns.writePort(PortManager.BUS_QUERY, packet);

    ns.tprint(`PING: Awaiting response on Port ${MY_CHANNEL}...`);
    
    let response = null;
    let attempts = 0;

    while (attempts < 10) {
        const raw = ns.readPort(MY_CHANNEL);
        response = PortManager.unpack(raw);

        if (response) break;
        
        attempts++;
        await ns.sleep(200);
    }

    if (response) {
        ns.tprint(`PONG: Received from PID ${response.origin}`);
        ns.tprint(`DATA: ${JSON.stringify(response.data)}`);
    } else {
        ns.tprint("ERROR: Kernel timed out or didn't respond.");
    }
}