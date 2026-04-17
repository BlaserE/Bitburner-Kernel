/**
 * /fs/vfs.ts
 * The Virtual File System is essentially the translation layer between the linux philosophy of
 * "everything is a file" and the Bitburner limitations.
 *
 * It translates IPC requests from writing to file on disk to writing to bitburner ports in RAM.
 * It handles "files" for the Port Protocol, hacked server storage and data and the blocks of RAM
 * reserved or used by certain processes.
 *
 *
 * Content :
 * - Inodes (Index Nodes):
 *      This holds the metadata for different files.
 *      It contains the info about its purpose (Port, RAM block, Servers, etc.)
 *
 * - Dentries (Directory Entries):
 *      The caching and routing system. It maps the string paths to specific Inodes in memory.
 *      When a script requests a file (eg, /mnt/ports/exec), it traverses the dentries to find
 *      the right object.
 *
 * - File Objects:
 *      When a script "opens" a virtual file, the VFS creates a File Object in memory.
 *      This object tracks the state of the interaction, such as the read/write offset
 *      or the specific script PID that holds the block.
 *
 * - The System Call Interface:
 *      Scripts (specifically, KernelScripts) don't talk to the VFS directly
 *      Instead, they use generic commands like open(), read() and write()
 */
import {FSInode, FSPermissions} from "./filesystem";
import {KCommand} from "../lib/protocol-bitmask";

export enum FileType {
    Directory = "Directory",
    File = "File",
    Device = "Device",
    Port = "Port",
}

class File implements FSInode<FileType> {
    FileType: FileType;
    Permission: FSPermissions;
    Process: number;

    public constructor(file: FileType, permission: FSPermissions, process: number) {
        this.FileType = file;
        this.Permission = permission;
        this.Process = process;
    }

}


function parseFilePath (file:string) : FSInode<any> | undefined {

    
    return undefined;
}