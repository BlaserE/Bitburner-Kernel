/**
 * Professional Utility Library - 0GB RAM Cost
 */
export class Utils {
    /** Format large numbers into readable currency strings. */
    static formatMoney(n) {
        const symbols = ["", "k", "m", "b", "t", "q", "Q", "s", "S", "n"];
        let i = 0;
        while (n >= 1000 && i < symbols.length - 1) {
            n /= 1000;
            i++;
        }
        return `$${n.toFixed(2)}${symbols[i]}`;
    }

    /** Format RAM into readable GB/TB strings. */
    static formatRam(gb) {
        if (gb >= 1024) return `${(gb / 1024).toFixed(2)}TB`;
        return `${gb.toFixed(2)}GB`;
    }

    /** Calculate the return on investment (ROI) for a potential hack. */
    static calculateRoi(money, time) {
        return money / (time / 1000); // Money per second
    }

    /** Return a consistent timestamp for logging. */
    static getTimestamp() {
        return new Date().toLocaleTimeString([], { hour12: false });
    }
}