import {Priority, ProcessState} from "./values";
import {ProcessInfo} from "@ns";

/**
 * ./lib/process.d.ts
 * The file that holds all interfaces for use by processes.
 * Contains process identities as much as policies and status.
 */
interface IProcess {
    pid:          number;           // Bitburner's own PID — the canonical identity
    inboxPort:    number;           // PROCESS_PORT_BASE + pid; derived, never injected
    script:       string;           // Path to .js file on host
    host:         string;           // Execution host
    args:         (string|number)[]; // args[0] = FrameFlag bitmask; args[1..] = user args
    threads:      number;
    ramReserved:  number;           // GB reserved by allocator at spawn time
    state:        ProcessState;
    priority:     Priority;
    restartPolicy: RestartPolicy;
    spawnedAt:    number;           // Date.now()
    lastSeenAt:   number;           // Last tick it appeared in ns.ps()
    exitCode:     number | null;
    dependencies: string[];         // Service names this process requires
    provides:     string[];         // Service names this process exports
}

interface RestartPolicy {
    mode:        "never" | "always" | "on-failure" | "on-exit";
    maxRetries:  number;          // -1 = unlimited
    retryDelay:  number;          // ms before respawn attempt
    backoff:     "fixed" | "exponential";
    retryCount:  number;          // mutable; reset on clean run
}



interface ProcessSpec {
    script:         string;
    host?:          string;           // defaults to "home"
    threads?:       number;           // defaults to 1
    args?:          (string|number|boolean)[];
    spawnFlags?:    number;           // FrameFlag bitmask injected as args[0]
    priority?:       Priority;
    restartPolicy?:  Partial<RestartPolicy>;
    provides?:      string[];
    dependencies?:  string[];
    ramOverride?:   number;           // if set, skip ns.getScriptRam()
}


interface IProcessTable {
    add(spec: ProcessSpec): IProcess;
    get(pid: number):  IProcess | undefined;
    list(filter?: Partial<IProcess>): IProcess[]
    transition(pid: number, newState: ProcessState, reason?: string): [ProcessState, ProcessState] | undefined;
    reconcile(liveProcesses: ProcessInfo[]): any;
    remove(pid: number): boolean;
}

interface ServiceDeclaration {
    name:      string;   // e.g., "hack-scheduler"
    version:   string;   // semver; registry enforces major-version compat
    inboxPort: number;   // owning process's inbox port; callers write here directly
    pid:       number;   // owning Bitburner PID
    metadata:  Record<string, string | number | boolean>;
}