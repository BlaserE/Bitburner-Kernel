/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0] || "n00dles";
    ns.print(`PULSE: Executed on ${target}`);
    
    // Use a loop so the process stays alive long enough for 
    // the Kernel's Garbage Collection (GC) to see it.
    while(true) {
        await ns.hack(target); 
    }
}