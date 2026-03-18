/** * Feature-Complete Repo Puller
 * Usage: 
 * run pull.js --all                 (Pulls the whole repo)
 * run pull.js /etc/ports.js         (Pulls a single file)
 * run pull.js --all --branch dev    (Pulls the dev branch)
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
    VERSION_PATH: "/etc/version.txt",
    MANIFEST_PATH: "/etc/manifest.json"
  };


  const vData = await CheckVersion(ns, CREDS);
  if (vData.local === vData.remote && !flags.force) {
    ns.tprint(`Kernel is already up to date (v${vData.local}). Use --force to override.`);
    return;
} // exits if the kernel is already up to date and --force is not used.

  ns.tprint(`Upgrading kernel: v${vData.local} -> v${vData.remote}`);

  await PullAllFiles(ns, CREDS, vData, flags)


}

async function CheckVersion(ns, CREDS) 
{
  const { OWNER, REPO, BRANCH, VERSION_PATH } = CREDS;

  const versionUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/kernel/etc/version.txt`;

  await ns.wget(versionUrl, "/tmp/version.txt");
  const remoteVersion = ns.read("/tmp/version.txt").trim();
  const localVersion = ns.fileExists(VERSION_PATH)? ns.read(VERSION_PATH).trim() : "0.0.0";
  
  ns.rm("/tmp/version.txt");  
  ns.tprint(`Remote version: ${remoteVersion} | Local version: ${localVersion}`);


  return {local: localVersion, remote: remoteVersion};
}


/**
 * Method used to pull the entire kernel from my public repository. 
 */
async function PullAllFiles (ns, CREDS, vData, flags)
{
  const { OWNER, REPO, BRANCH, MANIFEST_PATH, VERSION_PATH } = CREDS;

  ns.tprint(`Synchronising with repo at ${OWNER}/${REPO} [${BRANCH}]`)

  // gets the tree of the repo, which contains all files and their paths.
  // in this case, we only care about the files in the kernel/ directory, which is where the kernel image is stored.
  const treeUrl = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`;

  await ns.wget(treeUrl, "/tmp/repo_tree.txt")

  const treeData = JSON.parse(ns.read("/tmp/repo_tree.txt"))

  let localManifest ={};
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
    const localPath = file.path.replace("kernel/", "")
    remoteManifest[localPath] = file.sha;

    if (localManifest[localPath] === file.sha && ns.fileExists(localPath) && !flags.force) {
      ns.print(`File is up to date: ${localPath}`);
      continue;
    }

    const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${file.path}`;

    ns.print(`Downloading: ${localPath}`);
    await ns.wget(rawUrl, localPath)
    downloadCount++;
    await ns.sleep(20);
  }

  ns.write(MANIFEST_PATH, JSON.stringify(remoteManifest, null, 2),  "w");
  ns.write(VERSION_PATH, vData.remote, "w");

  ns.rm("/tmp/repo_tree.txt")
  ns.tprint(`SUCCESS: Update kernel image to v${vData.remote} (${downloadCount} files updated)`);
}