import {NS, RunningScript} from "@ns";
import {Script} from "./script";


export function getSelfScript(ns:NS, pid:number): RunningScript | null {
    return ns.getRunningScript(pid);
}