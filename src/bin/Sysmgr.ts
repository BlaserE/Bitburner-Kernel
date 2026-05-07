/**
 * Genuinely an amazing script in my opinion.
 */
import {AutocompleteData, NS} from "@ns"
import type {ISystemConfig, IGitHubTreeResponse, IGitHubTreeItem, IVersionData} from "../lib/sysmgr.d.ts"

interface IFlags {
    [key: string]: any;

    force: boolean;
    owner: string;
    repo: string;
    branch: string;
}

const schema: [string, string | number | boolean | []][] = [
    ['force', false],
    ['owner', "BlaserE"],
    ['repo', "Bitburner-Kernel"],
    ['branch', "main"],
]

const c = {
    reset: "\u001b[0m",

    // standard colors
    black: "\u001b[30m",
    red: "\u001b[31m",
    green: "\u001b[32m",
    yellow: "\u001b[33m",
    blue: "\u001b[34m",
    magenta: "\u001b[35m",
    cyan: "\u001b[36m",
    white: "\u001b[37m",

    // styles
    bold: "\u001b[1m",
    dim: "\u001b[2m",
    italic: "\u001b[3m",
    underline: "\u001b[4m",
};

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
    return Object.keys(data.flags(schema));
}

export async function main(ns: NS): Promise<void> {
    const args = ns.flags(schema) as IFlags;

    const config: ISystemConfig = {
        OWNER: args.owner,
        REPO: args.repo,
        BRANCH: args.branch,
        PACKAGE_PATH: "package.json",
        VERSION_PATH: "etc/version.txt",
        MANIFEST_PATH: "etc/manifest.json"
    };
    ns.tprint(`${c.green}[sysmgr]${c.reset} Synchronising with ${c.bold}${config.OWNER}/${config.REPO}${c.reset} (${config.BRANCH})`);

    // ns.tprint(`${c.green} ╔══ Kernel Sync ══════════════════════════════╗`);
    // ns.tprint(`${c.green} ║  Source : ${c.reset}${config.OWNER}/${config.REPO}`);
    // ns.tprint(`${c.green} ║  Branch : ${c.reset}${config.BRANCH}`);
    // ns.tprint(`${c.green} ╚═════════════════════════════════════════════╝${c.reset}`);

    const vData: IVersionData = await CheckVersion(ns, config);

    ns.tprint(`${c.green}[sysmgr]${c.reset} Remote v${vData.remote} — Local v${vData.local}`);
    // ns.tprint(`Sysmgr:  Remote  v${vData.remote}  │  Local  v${vData.local}`);

    if (vData.local === vData.remote) {
        if (!args.force) {
            ns.tprint(`${c.green}[sysmgr]${c.reset} Nothing to do.`); // up to date
            // ns.tprint(`Already up to date. Use --force to reinstall.`);
            return;
        }
        ns.tprint(`${c.yellow}[sysmgr]${c.reset} --force set, reinstalling anyway.`); // forced
    }

    const localMajor = vData.local.split('.')[0];
    const remoteMajor = vData.remote.split('.')[0];

    if (localMajor !== remoteMajor && vData.local !== "0.0.0") {
        ns.tprint(`${c.red}  Major version mismatch (${vData.local} → ${vData.remote}). Prompting for confirmation.${c.reset}`);
        const proceed: boolean = await ns.prompt(
            `${c.yellow}Major version change: v${vData.local} -> v${vData.remote}. This may include breaking changes. Proceed?${c.reset}`,
            {type: "boolean"}
        ) as boolean;
        if (!proceed) {
            ns.tprint(`${c.red}Sync aborted by user.${c.reset}`);
            return;
        }
    }

    if (vData.local !== vData.remote) {
        ns.tprint(`${c.green}[sysmgr]${c.reset} Upgrading ${c.bold}v${vData.local}${c.reset} → ${c.bold}v${vData.remote}${c.reset}`);
    }

    await PullAllFiles(ns, config, vData, args);
}

async function CheckVersion(ns: NS, config: ISystemConfig): Promise<IVersionData> {
    const {OWNER, REPO, BRANCH, PACKAGE_PATH, VERSION_PATH} = config;

    const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${PACKAGE_PATH}?t=${Date.now()}`;
    await ns.wget(url, "/tmp/package.json");

    const pkg = JSON.parse(ns.read("/tmp/package.json"));
    const remoteVersion: string = pkg.version.toString();
    const localVersion: string = (ns.fileExists(VERSION_PATH) ? ns.read(VERSION_PATH).trim() : "0.0.0");

    ns.rm("tmp/package.json");

    return {local: localVersion, remote: remoteVersion};
}

async function PullAllFiles(ns: NS, config: ISystemConfig, vData: IVersionData, args: IFlags): Promise<void> {
    const {OWNER, REPO, BRANCH, MANIFEST_PATH, VERSION_PATH} = config;

    const treeUrl = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`;
    await ns.wget(treeUrl, "/tmp/repo_tree.txt");

    const treeData = JSON.parse(ns.read("/tmp/repo_tree.txt")) as IGitHubTreeResponse;
    const kernelFiles = treeData.tree.filter((item): item is IGitHubTreeItem => item.type === "blob" && item.path.startsWith("dist/"));

    let localManifest: Record<string, string> = {};
    if (ns.fileExists(MANIFEST_PATH)) {
        localManifest = JSON.parse(ns.read(MANIFEST_PATH));
    }
    ns.tprint(`${c.green}[sysmgr]${c.reset} Found ${kernelFiles.length} files. Resolving...`);
    ns.tprint(`────(Syncing Kernel Image)─────────────────────────────────────────`);

    let syncClean = true;
    let downloadCount = 0;
    let skipCount = 0;

    for (const file of kernelFiles) {
        let localPath = file.path.replace(/^dist\//, "");
        if (localPath.endsWith(".md")) localPath = localPath.replace(".md", ".txt");

        if (localManifest[localPath] === file.sha && ns.fileExists(localPath)) {
            const diskContent = ns.read(localPath);
            const diskSha = await getHash(`blob ${new TextEncoder().encode(diskContent).length}\0${diskContent}`);

            if (diskSha === file.sha) {
                ns.tprint(`  ${c.cyan}~ ${localPath} (up to date)${c.reset}`);
                skipCount++;
                continue;
            }
        }

        // Download with retries
        const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${file.path}`;
        const MAX_RETRIES = 3;
        let attempt: number = 0;
        let success: boolean = false;

        while (attempt < MAX_RETRIES && !success) {
            attempt++;
            success = await TryPullFile(ns, rawUrl, localPath, file.sha);

            if (success) {
                localManifest[localPath] = file.sha;
                downloadCount++;
                ns.tprint(`  ${c.green}✔${c.reset} ${localPath}`); // synced
            } else if (attempt < MAX_RETRIES) {
                ns.tprint(`  ${c.yellow}↻ ${localPath} — retry ${attempt}/${MAX_RETRIES}, waiting 15s${c.reset}`); // retry
                await ns.sleep(15000);
            }
        }

        if (!success) {
            ns.tprint(`  ${c.red}✘ ${localPath} — failed after ${MAX_RETRIES} attempts${c.reset}`); // failed
            syncClean = false;
        }
    }
    ns.tprint(`${c.cyan}─────────────────────────────────────────────${c.reset}`);

    ns.write(MANIFEST_PATH, JSON.stringify(localManifest, null, 2), "w");

    if (syncClean) {
        ns.write(VERSION_PATH, vData.remote, "w");
        ns.tprint(`${c.green}[sysmgr]${c.reset} Synced ${downloadCount} file(s), ${skipCount} skipped.`);
        ns.tprint(`${c.green}[sysmgr]${c.reset} Version pinned to ${c.bold}v${vData.remote}${c.reset}.`);
    } else {
        ns.tprint(`${c.red}[sysmgr]${c.reset} Sync incomplete — some files failed.`);       // on error
    }

    ns.rm("tmp/repo_tree.txt");
}

async function TryPullFile(ns: NS, url: string, path: string, remoteHash: string): Promise<boolean> {
    const fileName = path.split("/").pop() ?? "temp_file.txt";
    const tmpPath = `/tmp/${fileName}`;

    await ns.wget(url, tmpPath, "home");

    const content = ns.read(tmpPath);
    const blobString = `blob ${new TextEncoder().encode(content).length}\0${content}`;
    const localHash = await getHash(blobString);

    let success = false;
    if (localHash === remoteHash) {
        ns.write(path, content, "w");
        success = true;
    }

    ns.rm(tmpPath, "home");
    return success;
}

/**
 * Calculates and returns the SHA-1 of the file content it receives as 'blob'.
 * @param fileBlob The content of the file to be hashed.
 */
async function getHash(fileBlob: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(fileBlob);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}