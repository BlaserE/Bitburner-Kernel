// The file that contains everything that can't go inside a .d.ts file but isnt used directly either.
export var Opcode;
(function (Opcode) {
    Opcode[Opcode["REGISTER"] = 1] = "REGISTER";
    Opcode[Opcode["HEARTBEAT"] = 2] = "HEARTBEAT";
    Opcode[Opcode["EXEC"] = 3] = "EXEC";
    Opcode[Opcode["FREE"] = 4] = "FREE";
    Opcode[Opcode["KILL"] = 5] = "KILL";
})(Opcode || (Opcode = {}));
export var FrameFlag;
(function (FrameFlag) {
    FrameFlag[FrameFlag["NONE"] = 0] = "NONE";
    FrameFlag[FrameFlag["FORCE"] = 1] = "FORCE";
    FrameFlag[FrameFlag["SILENT"] = 2] = "SILENT";
    FrameFlag[FrameFlag["CRITICAL"] = 4] = "CRITICAL";
    FrameFlag[FrameFlag["ELEVATED"] = 8] = "ELEVATED";
    FrameFlag[FrameFlag["HAS_ARGS"] = 16] = "HAS_ARGS";
})(FrameFlag || (FrameFlag = {}));
var Priority;
(function (Priority) {
    Priority[Priority["CRITICAL"] = 0] = "CRITICAL";
    Priority[Priority["HIGH"] = 1] = "HIGH";
    Priority[Priority["NORMAL"] = 2] = "NORMAL";
    Priority[Priority["LOW"] = 3] = "LOW";
    Priority[Priority["IDLE"] = 4] = "IDLE"; // Opportunistic; only runs if RAM is abundant
})(Priority || (Priority = {}));
export var AckStatus;
(function (AckStatus) {
    AckStatus[AckStatus["OK"] = 0] = "OK";
    AckStatus[AckStatus["ERR"] = 1] = "ERR";
})(AckStatus || (AckStatus = {}));
