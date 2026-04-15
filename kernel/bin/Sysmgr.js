// This file is what 'manages' the kernel image.
const schema = [
    ['force', false],
    ['owner', "BlaserE"],
    ['repo', "Bitburner-Kernel"],
    ['branch', "main"],
];
export async function main(ns) {
    const args = ns.flags(schema);
    const config = {
        OWNER: args.owner,
        REPO: args.repo,
        BRANCH: args.branch,
        PACKAGE_PATH: "package.json",
        VERSION_PATH: "etc/version.txt",
        MANIFEST_PATH: "etc/manifest.json"
    };
    // const config = {
    //     OWNER: args.owner,
    //     REPO: args.repo,
    //     BRANCH: args.branch,
    //     PACKAGE_PATH: "package.json",      // For the remote check
    //     VERSION_PATH: "etc/version.txt",    // For the local save-state
    //     MANIFEST_PATH: "etc/manifest.json"  // For the integrity check
    // };
    const vData = await CheckVersion(ns, config);
    // check versions ...
    if (vData.local === vData.remote) {
        ns.tprint(`Remote version: ${vData.remote} | Local version: ${vData.local}`);
        // if not forced, exits
        if (!args.force) {
            ns.tprint(`Kernel image up to date with latest (v${vData.remote})`);
            return;
        }
    }
    const localMajorVer = vData.local.split('.')[0];
    const remoteMajorVer = vData.remote.split('.')[0];
    if (localMajorVer !== remoteMajorVer && vData.local !== "0.0.0") {
        const result = await ns.prompt(`WARNING: Major version different (Remote version: ${vData.remote} | Local version: ${vData.local}). Proceed anyways?`, { type: "boolean" });
        if (!result) {
            return;
        }
    }
    if (vData.local !== vData.remote) {
        ns.tprint(`UPGRADE: v${vData.local} -> v${vData.remote}`);
    }
    await PullAllFiles(ns, config, vData, args);
}
async function CheckVersion(ns, config) {
    const { OWNER, REPO, BRANCH, PACKAGE_PATH, VERSION_PATH } = config;
    const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${PACKAGE_PATH}?t=${Date.now()}`;
    await ns.wget(url, "/tmp/package.json");
    const pkg = JSON.parse(ns.read("/tmp/package.json"));
    const remoteVersion = (pkg.version).toString();
    const localVersion = (ns.fileExists(VERSION_PATH) ? ns.read(VERSION_PATH).trim() : "0.0.0").toString();
    ns.rm("tmp/package.json");
    return { local: localVersion, remote: remoteVersion };
}
/**\
 * The method that begins the pulling process.
 * @param ns
 * @param config
 * @param vData
 * @param args
 * @constructor
 */
async function PullAllFiles(ns, config, vData, args) {
    const { OWNER, REPO, BRANCH, MANIFEST_PATH, VERSION_PATH } = config;
    ns.tprint(`Synchronising with repo at ${OWNER}/${REPO} [${BRANCH}]`);
    const treeUrl = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`;
    await ns.wget(treeUrl, "/tmp/repo_tree.txt");
    const treeData = JSON.parse(ns.read("/tmp/repo_tree.txt"));
    let localManifest = {};
    if (ns.fileExists(MANIFEST_PATH)) {
        localManifest = JSON.parse(ns.read(MANIFEST_PATH));
    }
    // boolean that if at the end is still true, means image is up to date.
    // otherwise, version remains the same.
    let SyncAllFiles = true;
    let downloadCount = 0;
    // ns.tprint(`Found ${kernelFiles.length} kernel files. Mapping to root...`);
    const kernelFiles = treeData.tree.filter(item => item.type === "blob" && item.path.startsWith("kernel/"));
    for (const file of kernelFiles) {
        let localPath = file.path.replace(/^kernel\//, "");
        if (localPath.endsWith(".md"))
            localPath = localPath.replace(".md", ".txt");
        let needsUpdate = true;
        if (localManifest[localPath] === file.sha && !args.force) {
            if (ns.fileExists(localPath)) {
                const diskContent = ns.read(localPath);
                const diskSha = await getHash(`blob ${new TextEncoder().encode(diskContent).length}\0${diskContent}`);
                if (diskSha === file.sha) {
                    ns.tprint(`File integrity verified: ${localPath} up to date.`);
                    needsUpdate = false;
                }
            }
        }
        if (!needsUpdate)
            continue;
        // --- Download and retry ---
        const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${file.path}`;
        const MAX_RETRIES = 3;
        let attempt = 0;
        let success = false;
        while (attempt < MAX_RETRIES && !success) {
            ns.tprint(`  -> Syncing: ${localPath} (${attempt + 1})`);
            attempt++;
            success = await TryPullFile(ns, rawUrl, localPath, file.sha);
            if (success) {
                localManifest[localPath] = file.sha; // updates the local manifest.json atomically
                downloadCount++;
                ns.print(`  [✓] Verified: ${localPath}`);
            }
            else if (attempt < MAX_RETRIES) {
                ns.print(`  [X] Failed: ${localPath}. Trying again in 15s...`);
                await ns.sleep(15000);
            }
        }
        if (!success) {
            ns.tprint(`[X] FATAL: Downloading ${localPath} failed all ${MAX_RETRIES} times.`);
            SyncAllFiles = false;
        }
    }
    ns.write(MANIFEST_PATH, JSON.stringify(localManifest, null, 2), "w");
    if (SyncAllFiles) {
        ns.write(VERSION_PATH, `${vData.remote}`, "w");
    }
    ns.rm("tmp/repo_tree.txt");
}
/**
 * Method that pulls a single file
 * @param ns
 * @param url
 * @param path
 * @param remoteHash
 * @return Promise<boolean> Returns true if successful download
 */
async function TryPullFile(ns, url, path, remoteHash) {
    const fileName = path.split("/").pop() || "temp_file.txt";
    const tmpPath = `/tmp/${fileName}`;
    // --- Download to staging ---
    let success = await ns.wget(url, tmpPath, "home");
    // --- VERIFICATION ---
    const content = ns.read(tmpPath);
    const blobString = `blob ${new TextEncoder().encode(content).length}\0${content}`;
    const localHash = await getHash(blobString);
    // --- Compare version
    if (localHash === remoteHash) {
        ns.write(path, content, "w");
        ns.print(`  [✓] Verified: ${path}`);
        success = true;
    }
    ns.rm(tmpPath, "home");
    return success;
}
/**
 * Calculates and returns the SHA-1 of the file content it receives as 'blob'.
 * @param fileBlob The content of the file to be hashed.
 */
async function getHash(fileBlob) {
    const msgUint8 = new TextEncoder().encode(fileBlob);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
