/**
 * A octal of process state.
 * Octal because it's fun.
 */
export var ProcessState;
(function (ProcessState) {
    ProcessState[ProcessState["PENDING"] = 0] = "PENDING";
    ProcessState[ProcessState["SPAWNING"] = 1] = "SPAWNING";
    ProcessState[ProcessState["RUNNING"] = 2] = "RUNNING";
    ProcessState[ProcessState["BUSY"] = 3] = "BUSY";
    ProcessState[ProcessState["ORPHAN"] = 4] = "ORPHAN";
    ProcessState[ProcessState["SLEEPING"] = 5] = "SLEEPING";
    ProcessState[ProcessState["ZOMBIE"] = 6] = "ZOMBIE";
    ProcessState[ProcessState["DEAD"] = 7] = "DEAD"; // → Terminal; no restart scheduled
})(ProcessState || (ProcessState = {}));
export var Priority;
(function (Priority) {
    Priority[Priority["CRITICAL"] = 0] = "CRITICAL";
    Priority[Priority["HIGH"] = 1] = "HIGH";
    Priority[Priority["NORMAL"] = 2] = "NORMAL";
    Priority[Priority["LOW"] = 3] = "LOW";
    Priority[Priority["IDLE"] = 4] = "IDLE"; // Opportunistic; only runs if RAM is abundant
})(Priority || (Priority = {}));
