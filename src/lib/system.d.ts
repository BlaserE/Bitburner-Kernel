export interface ISystemConfig {
    OWNER: string;
    REPO: string;
    BRANCH: string;
    PACKAGE_PATH: string;
    VERSION_PATH: string;
    MANIFEST_PATH: string;
}

export interface IGitHubTreeItem {
    path: string;
    mode: string;
    type: "blob" | "tree";
    sha: string;
    size?: number;
    url?: string;
}

export interface IGitHubTreeResponse {
    sha: string;
    url: string;
    tree: IGitHubTreeItem[];
    truncated: boolean;
}

export interface IVersionData {
    local: string;
    remote: string;
}
