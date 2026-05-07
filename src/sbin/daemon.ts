/**
 * sbin/daemon.ts
 */


import {AutocompleteData, NS} from "@ns";
import {KernelScript} from "../lib/KernelScript";

/** @param {NS} ns **/
export async function main(ns:NS) {

}

export function autocomplete(data: AutocompleteData) {
    data.flags(schema)
}


interface DaemonFlags {

}

const schema: [string, string | number | boolean | []][] = [
    ['force', false],
    ['owner', "BlaserE"],
    ['repo', "Bitburner-Kernel"],
    ['branch', "main"],
]