/**
 * ./lib/process.d.ts
 * The file that holds all interfaces for use by processes.
 * Contains process identities as much as policies and status.
 */
export interface IProcess {
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

export interface RestartPolicy {
    mode:        "never" | "always" | "on-failure" | "on-exit";
    maxRetries:  number;          // -1 = unlimited
    retryDelay:  number;          // ms before respawn attempt
    backoff:     "fixed" | "exponential";
    retryCount:  number;          // mutable; reset on clean run
}

export interface ProcessState {


}

export interface Priority {

}