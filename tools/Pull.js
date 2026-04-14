/** * Feature-Complete Repo Puller
 * type `run Pull.js` in the terminal to automatically pull from the main branch
 * You can force it to pull every fill indivually if they were modified inside bitburner
 * using `run Pull.js --force`
 * You can define which branch to pull from using the branch flag :
 * `run Pull.js --branch main` -> `run Pull.js --branch dev`.
 * It is recommended to add an alias to it.
 * `alias -g pull="run Pull.js"`
 * The flags still work with the alias.
 **/
/** @param {NS} ns */
export async function main(ns) {
    // terminal flags
    const flags = ns.flags([
        ['branch', 'main'],
        ['force', false]
    ]);

    // Basic credentials for my repo. It is already public so I can't exactly hide it
    const CREDS = {
        OWNER: "BlaserE",
        REPO: "Bitburner-Kernel",
        BRANCH: flags.branch,
        PACKAGE_PATH: "package.json",      // For the remote check
        VERSION_PATH: "etc/version.txt",    // For the local save-state
        MANIFEST_PATH: "etc/manifest.json"  // For the integrity check
    };

    const vData = await CheckVersion(ns, CREDS);

    // compares remote and local
    if (vData.local === vData.remote) {
        ns.tprint(`Remote version: ${vData.remote} | Local version: ${vData.local}`);

        // if not forced, exits
        if (!flags.force) {
            ns.tprint(`Kernel image up to date with latest (${vData.remote})`);
            return;
        }
    }

    const localMajorVer = vData.local.split('.')[0];
    const remoteMajorVer = vData.remote.split('.')[0];

    if (localMajorVer !== remoteMajorVer && vData.local === "0.0.0") {
        const result = await ns.prompt(`WARNING: Major version different (Remote version: ${vData.remote} | Local version: ${vData.local}). Proceed anyways?`);
        if (!result) {
            return;
        }
    }

    if (vData.local !== vData.remote) {
        ns.tprint(`UPGRADE: v${vData.local} -> v${vData.remote}`);
    }

    await PullAllFiles(ns, CREDS, vData, flags);
}

async function CheckVersion(ns, CREDS) {
    // Destructuring exactly what you have in your CREDS object
    const { OWNER, REPO, BRANCH, PACKAGE_PATH, VERSION_PATH } = CREDS;

    // We hit the package.json in the root for the remote version
    const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${PACKAGE_PATH}?t=${Date.now()}`;

    await ns.wget(url, "/tmp/package.json");

    // Parse the JSON to get the version string
    const raw = ns.read("/tmp/package.json")
    // ns.tprint(`Raw file : ${raw}`) // debug print
    const pkg = JSON.parse(raw);
    const remoteVersion = (pkg.version).toString();

    // Look for your existing local version.txt
    const localVersion = (ns.fileExists(VERSION_PATH) ? ns.read(VERSION_PATH).trim() : "0.0.0").toString();

    ns.rm("/tmp/package.json");

    return { local: localVersion, remote: remoteVersion };
}


/**
 * Method used to pull the entire kernel from my public repository.
 */
async function PullAllFiles(ns, CREDS, vData, flags) {
    const {OWNER, REPO, BRANCH, MANIFEST_PATH, VERSION_PATH} = CREDS;

    ns.tprint(`Synchronising with repo at ${OWNER}/${REPO} [${BRANCH}]`)

    // gets the tree of the repo, which contains all files and their paths.
    // in this case, we only care about the files in the kernel/ directory, which is where the kernel image is stored.
    const treeUrl = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`;

    await ns.wget(treeUrl, "/tmp/repo_tree.txt")

    const treeData = JSON.parse(ns.read("/tmp/repo_tree.txt"))

    let localManifest = {};
    if (ns.fileExists(MANIFEST_PATH)) {
        localManifest = JSON.parse(ns.read(MANIFEST_PATH));
    }

    const remoteManifest = {};
    let downloadCount = 0;

    const kernelFiles = treeData.tree.filter(item =>
        item.type === "blob" &&
        item.path.startsWith("kernel/")
    );

    ns.tprint(`Found ${kernelFiles.length} kernel files. Mapping to root...`);

    for (const file of kernelFiles) {
        let localPath = file.path.replace(/^kernel\//, "")

        if (localPath.endsWith(".md")) {
            localPath = localPath.replace(".md", ".txt");
        }

        // remoteManifest[localPath] = file.sha;

        if (localManifest[localPath] === file.sha && ns.fileExists(localPath) && !flags.force) {
            ns.print(`Verified: ${localPath}`);
            continue;
        }

        const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${file.path}`;
        ns.tprint(`  -> Syncing: ${localPath}`);

        const MAX_RETRIES = 3;
        let attempt = 0;
        let success = false;

        while (attempt < MAX_RETRIES && !success) {
            ns.print(`Downloading: ${localPath} (Attempt ${attempt + 1})`);
            await ns.wget(rawUrl, localPath);

            // --- VERIFICATION ---
            const content = ns.read(localPath);
            const blobString = `blob ${new TextEncoder().encode(content).length}\0${content}`;
            const localSha = await getHash(blobString);

            if (localSha === file.sha) {
                success = true;
                downloadCount++;
                ns.print(`  [✓] Verified: ${localPath}`);
            } else {
                attempt++;
                if (attempt < MAX_RETRIES) {
                    ns.tprint(`  [!] Hash mismatch for ${localPath}. Retrying in 15s...`);
                    await ns.sleep(15000); // The 15-second breather
                } else {
                    ns.tprint(`  [X] ERROR: Failed to sync ${localPath} after ${MAX_RETRIES} tries. Check GitHub.`);
                }
            }
            
        }
        if (success) {
            localManifest[localPath] = file.sha;
        } else {
            ns.tprint(` [X] ERROR: Failed to sync ${localPath}. Saving progress and exiting.`);
            ns.write(MANIFEST_PATH, JSON.stringify(localManifest, null, 2), "w");
            return; // version.txt is NOT updated
        }
    }

    ns.write(MANIFEST_PATH, JSON.stringify(localManifest, null, 2), "w");
    ns.write(VERSION_PATH, `${vData.remote}`, "w");

    ns.rm("/tmp/repo_tree.txt")
    ns.tprint(`SUCCESS: Update kernel image to v${vData.remote} (${downloadCount} files updated)`);
}

/** @param {string} string */
async function getHash(string) {
    const msgUint8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}