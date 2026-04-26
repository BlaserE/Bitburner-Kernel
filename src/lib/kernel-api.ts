import {Priority, RestartPolicy} from "./process/process";

interface ProcessSpec {
    script:         string;
    host?:          string;           // defaults to "home"
    threads?:       number;           // defaults to 1
    args?:          (string|number)[];
    spawnFlags?:    number;           // FrameFlag bitmask injected as args[0]
    priority?:      Priority;
    restartPolicy?: Partial<RestartPolicy>;
    provides?:      string[];
    dependencies?:  string[];
    ramOverride?:   number;           // if set, skip ns.getScriptRam()
}