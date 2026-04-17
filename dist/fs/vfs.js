// Enums defining standard states and access modes.
export var FileType;
(function (FileType) {
    FileType[FileType["Regular"] = 0] = "Regular";
    FileType[FileType["Directory"] = 1] = "Directory";
    FileType[FileType["DevicePort"] = 2] = "DevicePort";
    FileType[FileType["NamedPipe"] = 3] = "NamedPipe"; // Standard IPC
})(FileType || (FileType = {}));
export var AccessMode;
(function (AccessMode) {
    AccessMode[AccessMode["Read"] = 1] = "Read";
    AccessMode[AccessMode["Write"] = 2] = "Write";
    AccessMode[AccessMode["Execute"] = 4] = "Execute";
})(AccessMode || (AccessMode = {}));
/**
 * Inode: The Metadata Container
 * Purpose: Acts as the absolute source of truth for permissions and routing.
 * It does not know its own path in the file system, only what it is and who can touch it.
 */
export class Inode {
    id;
    type;
    size = 0;
    permissions;
    ownerPID;
    // If this Inode represents a Bitburner port, this holds the port number.
    boundPort = null;
    // If this Inode is an IPC endpoint, this holds the callback to trigger.
    executeCallback = null;
    constructor(id, type, permissions) {
        // Initialization logic
        this.id = id;
        this.type = type;
        this.permissions = permissions;
        this.ownerPID = 0;
    }
    checkPermissions(token, requestedAccess) {
        // Purpose: Query the Kernel's Token->PID map.
        // Compare the PID's privilege level against this Inode's permission mask.
        // Return true if authorized, false if the request should be dropped.
        return false;
    }
    setPort(port) {
        this.boundPort = port;
    }
}
/**
 * Dentry (Directory Entry): The Path Router
 * Purpose: Constructs the tree (e.g., /mnt/ports/exec). It simply maps a string
 * name to a specific Inode in memory.
 */
export class Dentry {
    name;
    parent;
    inode;
    children;
    constructor(name, parent, inode) {
        // Initialization logic
        this.name = name;
        this.parent = parent;
        this.inode = inode;
        this.children = new Map();
    }
    addChild(name, child) {
        // Purpose: Attach a new sub-directory or file to the current path block.
        this.children.set(name, child);
    }
    getChild(name) {
        // Purpose: Retrieve the next node in the path sequence.
        return this.children.get(name);
    }
}
/**
 * FileObject: The Session Handler
 * Purpose: Created only when a script successfully passes sys_open. It holds the state
 * of the transaction so the script doesn't have to re-authenticate the path every tick.
 */
export class FileObject {
    inode;
    offset = 0;
    token;
    isOpen = true;
    constructor(inode, token) {
        // Initialization logic
        this.inode = inode;
        this.token = token;
    }
    read(length) {
        // Purpose: Read data from the bound port or memory block starting at 'offset'.
        return "";
    }
    write(data) {
        // Purpose: Push data to the bound port, kernel callback, or memory block.
        return 0;
    }
    close() {
        // Purpose: Mark as closed, allowing the VFS to garbage-collect this object.
    }
}
/**
 * VirtualFileSystem: The Core Manager
 * Purpose: Instantiated once by the Kernel on boot. Holds the root '/' Dentry.
 * Acts as the sole API for translating fixed-length hex port messages into file operations.
 */
export class VirtualFileSystem {
    root;
    inodeTable = new Map();
    nextInodeId = 1;
    // Maps temporary File Descriptors (integers) back to active FileObjects
    openFiles;
    constructor() {
        // Purpose: Build the initial tree in RAM.
        // Instantiate the root Dentry, attach /mnt, attach /mnt/ports.
        // Mount device Inodes to their respective paths.
        const rootInode = this.createInode(FileType.Directory, 0o755);
        this.root = new Dentry("/", null, rootInode);
        this.openFiles = new Map();
    }
    createInode(type, perm, port) {
        const inode = new Inode(this.nextInodeId++, type, perm);
        if (port != null) {
            inode.type = FileType.DevicePort;
            inode.setPort(port);
        }
        return inode;
    }
    bootstrapStandardTree() {
        const binInode = this.createInode(FileType.Directory, 0o755);
    }
    resolvePath(path) {
        // Purpose: Split the path string by '/' and traverse the Dentry tree.
        // Return the final Dentry, or null if the path is invalid.
        return null;
    }
    // --- The System Call Interface ---
    sys_open(token, path, mode) {
        // 1. Resolve path to Dentry.
        // 2. Extract Inode from Dentry.
        // 3. Call Inode.checkPermissions(token, mode).
        // 4. If valid, create a new FileObject, assign it a descriptor, and return it.
        return null;
    }
    sys_read(token, fileDescriptor, length) {
        // Purpose: Locate the FileObject via descriptor, verify token matches, execute read.
        return null;
    }
    sys_write(token, fileDescriptor, data) {
        // Purpose: Locate the FileObject, verify token, execute write, return bytes written.
        return 0;
    }
    sys_close(token, fileDescriptor) {
        // Purpose: Destroy the FileObject session.
    }
}
