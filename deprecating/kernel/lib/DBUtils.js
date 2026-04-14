import { Database } from "/lib/Database.js";

export class DBUtils {
    /** * Returns the single best server to hack based on profit-per-second potential.
     * Logic: Weight = MaxMoney / MinSecurity
     */
    static getBestTarget(db, playerHackingLevel) {
        const servers = db.select("servers", s => 
            s.isRooted && 
            s.requiredLevel <= playerHackingLevel && 
            s.maxMoney > 0
        );

        if (servers.length === 0) return null;

        return servers.reduce((best, current) => {
            const currentWeight = current.maxMoney / Math.max(1, current.minSecurity);
            const bestWeight = best.maxMoney / Math.max(1, best.minSecurity);
            return currentWeight > bestWeight ? current : best;
        });
    }

    /** * Returns an array of hostnames that have free RAM available for worker scripts.
     */
    static getAvailableHosts(db) {
        return db.select("servers", s => s.isRooted && s.maxRam > 0)
                 .sort((a, b) => b.maxRam - a.maxRam); // Sort by biggest first
    }

    /** * Returns total network RAM available (excluding home if specified).
     */
    static getTotalNetworkRam(db, includeHome = false) {
        const hosts = db.select("servers", s => s.isRooted && (includeHome || s.id !== "home"));
        return hosts.reduce((sum, host) => sum + host.maxRam, 0);
    }
}