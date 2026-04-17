import {FileType} from "./vfs";

/**
 * Every single file in the VFS MUST hold this information :
 */
export interface FSObject<T extends FileType> {
    Inode: FSInode<T>;

}

export interface FSInode<T extends FileType> {
    FileType: T;
    Permission: FSPermissions;
    Process: number; // the PID holding the file "hostage"
}

export interface FSPermissions {
    Mask: string;
}
