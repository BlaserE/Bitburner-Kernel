/**
 * A octal of process state.
 * Octal because it's fun.
 */
export enum ProcessState {
    PENDING,    // → Declared in manifest but not yet spawned
    SPAWNING,   // → exec() called, awaiting confirmation
    RUNNING,    // → Confirmed alive in ns.ps()
    BUSY,       // → Running an asynchronous task, like ns.hack()
    ORPHAN,     // → A script that is running unregistered
    SLEEPING,   // → Voluntarily suspended (kernel-managed)
    ZOMBIE,     // → Process ended, pending cleanup and restart policy evaluation
    DEAD        // → Terminal; no restart scheduled
}

export enum Priority {
    CRITICAL = 0,   // Kernel services; killed last, spawned first
    HIGH     = 1,   // Coordination scripts
    NORMAL   = 2,   // Standard workers
    LOW      = 3,   // Background analytics, logging
    IDLE     = 4   // Opportunistic; only runs if RAM is abundant
}
