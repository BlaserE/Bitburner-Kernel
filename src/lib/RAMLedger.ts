import {NS} from "../../NetscriptDefinitions";

export class RAMLedger {
    private ns : NS;
    private servers : {};
    private processes : {};

    constructor(ns:NS, flags: any) {
        this.ns = ns;

        this.servers = new Map(); // hostname -> { used: number, max: number }
        this.processes = new Map(); // pid -> { hostname: string, ramUsage: number }

    }
}