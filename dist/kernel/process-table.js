import { Priority, ProcessState } from "../lib/values";
class ProcessTable {
    _processes;
    constructor() {
        this._processes = [];
    }
    add(spec) {
        let policy;
        if (spec.restartPolicy !== undefined) {
            policy = spec.restartPolicy;
            policy.backoff = spec.restartPolicy.backoff ? spec.restartPolicy.backoff : "fixed";
            policy.mode = spec.restartPolicy.mode ? spec.restartPolicy.mode : "never";
            policy.maxRetries = spec.restartPolicy.maxRetries ? spec.restartPolicy.maxRetries : 0;
            policy.retryCount = spec.restartPolicy.retryCount ? spec.restartPolicy.retryCount : 0;
            policy.retryDelay = spec.restartPolicy.retryDelay ? spec.restartPolicy.retryDelay : 0;
        }
        else {
            policy = {
                mode: "never",
                maxRetries: 0,
                retryDelay: 50,
                backoff: "fixed",
                retryCount: 0
            };
        }
        const process = {
            args: [],
            dependencies: [],
            exitCode: null,
            lastSeenAt: 0,
            priority: Priority.IDLE,
            provides: [],
            ramReserved: 0,
            restartPolicy: policy,
            spawnedAt: 0,
            state: ProcessState.PENDING,
            threads: 0,
            pid: -1, // -1 for unassigned
            inboxPort: -1, // same as above
            script: spec.script,
            host: spec.host ? spec.host : "home"
        };
        this._processes.push(process);
        return process;
    }
    get(pid) {
        for (const process of this._processes) {
            if (process.pid === pid) {
                return process;
            }
        }
        return undefined;
    }
    /**
     * Returns a list of shallow copies of every logged process, optionally filtered against the provided IProcess filter.
     * @param filter A Partial IProcess object used to filter the list
     */
    list(filter) {
        if (!filter || Object.keys(filter).length === 0) {
            return [...this._processes]; // Returning a shallow copy prevents external mutation
        }
        const filterEntries = Object.entries(filter);
        return this._processes.filter(process => {
            // Short-circuiting AND: The process must pass every filter condition
            return filterEntries.every(([key, expectedValue]) => {
                const processValue = process[key];
                // Branch 1: Subset Matching for Arrays
                if (Array.isArray(expectedValue)) {
                    // Safeguard against malformed data where processValue isn't an array
                    if (!Array.isArray(processValue))
                        return false;
                    // Every element in the filter's array must exist in the process's array
                    return expectedValue.every(item => processValue.includes(item));
                }
                // Branch 2: Strict Equality for Primitives (Numbers, Strings, Enums, Null)
                return processValue === expectedValue;
            });
        });
    }
    /**
     *
     * @param liveProcesses A list of running processes, often obtained from ns.ps()
     */
    reconcile(liveProcesses) {
        // Step 1: Finding Zombies
        const systemPidSet = new Set(liveProcesses.map(process => process.pid));
        this._processes.forEach(process => {
            if (!systemPidSet.has(process.pid)) {
                this.transition(process.pid, ProcessState.ZOMBIE);
            }
        });
        // Step 2: Finding ORPHANS
        const orphanPidSet = new Set(this._processes.map(process => process.pid));
        liveProcesses.forEach(process => {
            if (!orphanPidSet.has(process.pid)) {
                this.transition(process.pid, ProcessState.ORPHAN);
            }
        });
        return false;
    }
    /**
     * Removes the specified PID if and only if the process is also DEAD (ProcessState)
     * @param pid
     * @return True if process deleted, false otherwise.
     */
    remove(pid) {
        const matchingProcesses = new Set(this._processes.map(process => process.pid));
        this._processes.forEach((process, index) => {
            if (matchingProcesses.has(pid) && process.state === ProcessState.DEAD) {
                delete this._processes[index];
                return true;
            }
        });
        return false;
    }
    /**
     * The only method capable of changing the state of a process.
     * @param pid
     * @param newState
     * @param reason
     * @return The state difference between the old and new state. Or undefined, if there is not exactly 1 instance of the PID in argument.
     */
    transition(pid, newState, reason) {
        const process = this._processes.filter(process => process.pid === pid);
        if (process.length !== 1) {
            return;
        }
        const oldState = process[0].state;
        process[0].state = newState;
        return [oldState, newState];
    }
}
