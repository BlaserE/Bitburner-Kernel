/**
 * Genuinely an amazing script in my opinion.
 */
import { AutocompleteData, NS } from "@ns"
import type { ISystemConfig, IGitHubTreeResponse, IGitHubTreeItem, IVersionData } from "../lib/sysmgr.d.ts"

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

    ns.tprint(`INFO ╔══ Kernel Sync ══════════════════════════════╗`);
    ns.tprint(`INFO ║  Source : ${config.OWNER}/${config.REPO}`);
    ns.tprint(`INFO ║  Branch : ${config.BRANCH}`);
    ns.tprint(`INFO ╚═════════════════════════════════════════════╝`);

    const vData: IVersionData = await CheckVersion(ns, config);

    ns.tprint(`INFO  Remote  v${vData.remote}  │  Local  v${vData.local}`);

    if (vData.local === vData.remote) {
        if (!args.force) {
            ns.tprint(`SUCCESS Already up to date. Use --force to reinstall.`);
            return;
        }
        ns.tprint(`WARN  Up to date, but --force is set — reinstalling.`);
    }

    const localMajor  = vData.local.split('.')[0];
    const remoteMajor = vData.remote.split('.')[0];

    if (localMajor !== remoteMajor && vData.local !== "0.0.0") {
        ns.tprint(`WARN  Major version mismatch (${vData.local} → ${vData.remote}). Prompting for confirmation.`);
        const proceed = await ns.prompt(
            `Major version change: v${vData.local} → v${vData.remote}. This may include breaking changes. Proceed?`,
            { type: "boolean" }
        );
        if (!proceed) {
            ns.tprint(`WARN  Sync aborted by user.`);
            return;
        }
    }

    if (vData.local !== vData.remote) {
        ns.tprint(`INFO  Upgrading  v${vData.local}  →  v${vData.remote}`);
    }

    await PullAllFiles(ns, config, vData, args);
}

async function CheckVersion(ns: NS, config: ISystemConfig): Promise<IVersionData> {
    const { OWNER, REPO, BRANCH, PACKAGE_PATH, VERSION_PATH } = config;

    const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${PACKAGE_PATH}?t=${Date.now()}`;
    await ns.wget(url, "/tmp/package.json");

    const pkg = JSON.parse(ns.read("/tmp/package.json"));
    const remoteVersion: string = pkg.version.toString();
    const localVersion: string  = (ns.fileExists(VERSION_PATH) ? ns.read(VERSION_PATH).trim() : "0.0.0");

    ns.rm("tmp/package.json");

    return { local: localVersion, remote: remoteVersion };
}

async function PullAllFiles(ns: NS, config: ISystemConfig, vData: IVersionData, args: IFlags): Promise<void> {
    const { OWNER, REPO, BRANCH, MANIFEST_PATH, VERSION_PATH } = config;

    const treeUrl = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`;
    await ns.wget(treeUrl, "/tmp/repo_tree.txt");

    const treeData     = JSON.parse(ns.read("/tmp/repo_tree.txt")) as IGitHubTreeResponse;
    const kernelFiles  = treeData.tree.filter((item): item is IGitHubTreeItem => item.type === "blob" && item.path.startsWith("dist/"));

    let localManifest: Record<string, string> = {};
    if (ns.fileExists(MANIFEST_PATH)) {
        localManifest = JSON.parse(ns.read(MANIFEST_PATH));
    }

    ns.tprint(`INFO  Found ${kernelFiles.length} files in dist/. Beginning sync.`);
    ns.tprint(`INFO  ─────────────────────────────────────────────`);

    let syncClean     = true;
    let downloadCount = 0;
    let skipCount     = 0;

    for (const file of kernelFiles) {
        let localPath = file.path.replace(/^dist\//, "");
        if (localPath.endsWith(".md")) localPath = localPath.replace(".md", ".txt");

        // Integrity check — skip if manifest + disk hash agree
        if (localManifest[localPath] === file.sha && !args.force && ns.fileExists(localPath)) {
            const diskContent = ns.read(localPath);
            const diskSha     = await getHash(`blob ${new TextEncoder().encode(diskContent).length}\0${diskContent}`);

            if (diskSha === file.sha) {
                ns.tprint(`INFO    SKIP  ${localPath}`);
                skipCount++;
                continue;
            }
        }

        // Download with retries
        const rawUrl     = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${file.path}`;
        const MAX_RETRIES = 3;
        let attempt      = 0;
        let success      = false;

        while (attempt < MAX_RETRIES && !success) {
            attempt++;
            success = await TryPullFile(ns, rawUrl, localPath, file.sha);

            if (success) {
                localManifest[localPath] = file.sha;
                downloadCount++;
                ns.tprint(`SUCCESS   SYNC  ${localPath}`);
            } else if (attempt < MAX_RETRIES) {
                ns.tprint(`WARN    RETRY  ${localPath}  (attempt ${attempt}/${MAX_RETRIES}) — waiting 15s`);
                await ns.sleep(15000);
            }
        }

        if (!success) {
            ns.tprint(`ERROR   FAIL  ${localPath}  — gave up after ${MAX_RETRIES} attempts`);
            syncClean = false;
        }
    }

    ns.tprint(`INFO  ─────────────────────────────────────────────`);
    ns.tprint(`INFO  Synced ${downloadCount} file(s), skipped ${skipCount} — ${syncClean ? "clean" : "incomplete"}.`);

    ns.write(MANIFEST_PATH, JSON.stringify(localManifest, null, 2), "w");

    if (syncClean) {
        ns.write(VERSION_PATH, vData.remote, "w");
        ns.tprint(`SUCCESS Version pinned to v${vData.remote}.`);
    } else {
        ns.tprint(`WARN  Version NOT updated — some files failed. Fix errors and re-run.`);
    }

    ns.rm("tmp/repo_tree.txt");
}

async function TryPullFile(ns: NS, url: string, path: string, remoteHash: string): Promise<boolean> {
    const fileName = path.split("/").pop() ?? "temp_file.txt";
    const tmpPath  = `/tmp/${fileName}`;

    await ns.wget(url, tmpPath, "home");

    const content    = ns.read(tmpPath);
    const blobString = `blob ${new TextEncoder().encode(content).length}\0${content}`;
    const localHash  = await getHash(blobString);

    let success = false;
    if (localHash === remoteHash) {
        ns.write(path, content, "w");
        success = true;
    }

    ns.rm(tmpPath, "home");
    return success;
}

async function getHash(fileBlob: string): Promise<string> {
    const msgUint8   = new TextEncoder().encode(fileBlob);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
    const hashArray  = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}