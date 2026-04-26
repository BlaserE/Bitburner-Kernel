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
export var AckStatus;
(function (AckStatus) {
    AckStatus[AckStatus["OK"] = 0] = "OK";
    AckStatus[AckStatus["ERR"] = 1] = "ERR";
})(AckStatus || (AckStatus = {}));
