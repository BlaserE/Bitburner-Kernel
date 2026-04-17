// vfs.d.ts

/**
 * Represents the 4-character hex capability token used for process isolation.
 */
export type ProcessToken = string;

/**
 * Standard Linux-style permission mask (e.g., 0o777).
 */
export type PermissionMask = number;

export interface IInode {
    id: number;
    size: number;
    permissions: PermissionMask;
    ownerPID: number;

    // Core purpose: Verifies if the provided token/PID has the requested access rights.
    checkPermissions(token: ProcessToken, requestedAccess: number): boolean;
}

export interface IDentry {
    name: string;
    parent: IDentry | null;
    inode: IInode | null;
    children: Map<string, IDentry>;

    // Core purpose: Navigates the VFS tree structure.
    addChild(name: string, child: IDentry): void;
    getChild(name: string): IDentry | undefined;
}

export interface IFileObject {
    inode: IInode;
    offset: number;
    token: ProcessToken;
    isOpen: boolean;

    // Core purpose: Tracks the state of an active interaction between a script and an Inode.
    read(length: number): string;
    write(data: string): number;
    close(): void;
}

export interface IVirtualFileSystem {
    // Core purpose: Translates string paths into memory objects.
    resolvePath(path: string): IDentry | null;

    // The System Call Interface exposed to the kernel's port listener.
    sys_open(token: ProcessToken, path: string, mode: number): IFileObject | null;
    sys_read(token: ProcessToken, fileDescriptor: number, length: number): string | null;
    sys_write(token: ProcessToken, fileDescriptor: number, data: string): number;
    sys_close(token: ProcessToken, fileDescriptor: number): void;
}