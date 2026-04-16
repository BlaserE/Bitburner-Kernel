/**
 * Command IDs (1 Byte / 2 Hex chars)
 */
export var KCommand;
(function (KCommand) {
    KCommand[KCommand["REGISTER"] = 1] = "REGISTER";
    KCommand[KCommand["HEARTBEAT"] = 2] = "HEARTBEAT";
    KCommand[KCommand["EXEC"] = 3] = "EXEC";
    KCommand[KCommand["FREE"] = 4] = "FREE";
    KCommand[KCommand["KILL"] = 5] = "KILL";
})(KCommand || (KCommand = {}));
/**
 * Bit-mask flags (2 Bytes / 4 Hex chars)
 */
export var KFlag;
(function (KFlag) {
    KFlag[KFlag["NONE"] = 0] = "NONE";
    KFlag[KFlag["FORCE"] = 1] = "FORCE";
    KFlag[KFlag["SILENT"] = 2] = "SILENT";
    KFlag[KFlag["CRITICAL"] = 4] = "CRITICAL";
    KFlag[KFlag["ELEVATED"] = 8] = "ELEVATED"; // Run with root/admin filesystem permissions
})(KFlag || (KFlag = {}));
/**
 * Kernel Response Codes
 */
export var KResponseStatus;
(function (KResponseStatus) {
    KResponseStatus[KResponseStatus["SUCCESS"] = 0] = "SUCCESS";
    KResponseStatus[KResponseStatus["ERROR"] = 1] = "ERROR"; // NACK
})(KResponseStatus || (KResponseStatus = {}));
