import { KernelScript } from "../lib/KernelScript";
export async function main(ns) {
    const basicHack = new BasicHack(ns);
}
/**
 *
 */
class BasicHack extends KernelScript {
    run() {
        return Promise.resolve(undefined);
    }
}
