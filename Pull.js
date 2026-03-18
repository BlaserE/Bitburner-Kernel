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
    ['all', false],
    ['branch', 'main'],
    ['force', false]
  ]);

  // Basic credentials for my repo. It is already public so I can't exactly hide it
  const CREDS = {
    OWNER: "BlaserE",
    REPO: "Bitburner-Kernel",
    BRANCH: flags.branch
  };

  if (!flags.all && flags._.length > 0) {
    const file = flags._[0];
    await PullSingleFile(ns, CREDS, file);
      ns.tprint(`[Pull] Kernel file ${file} has been updated.`)
  }

  if (flags.all) {
    await PullAllFiles(ns, CREDS)
    ns.tprint(`[Pull] Kernel image has been updated to latest.`)
  }

}

/**
 * Method used to pull a single file from my public repository.
 */
async function PullSingleFile(ns) {
  ns.tprint("test")
}
/**
 * Method used to pull the entire repo from my public repository. 
 */
async function PullAllFiles (ns, CREDS) {
const { OWNER, REPO, BRANCH } = CREDS;

  ns.tprint(`Synchronising with repo at ${OWNER}/${REPO} [${BRANCH}]`)

  const tempFile = "/tmp/repo_tree.txt"
  await ns.wget(treeUrl, tempFile)

  const data = JSON.parse(ns.read(tempFile))
  const files = data.tree.filter(item => 
        item.type === "blob" && 
        item.path.startsWith("kernel/")
    );

  ns.tprint(`Found ${files.length} kernel files. Mapping to root...`);

  for (const file of files) {
    const localPath = file.path.replace("kernel/", "")

    const rawUrl = `https://api.github.com/repos/${USER}/${REPO}/git/trees/${BRANCH}?recursive=1`;

    ns.print(`Downloading: ${localPath}`);
    await ns.wget(rawUrl, localPath)
    await ns.sleep(20);
  }

  ns.rm(tempFile)
  ns.tprint("SUCCESS: Kernel image pulled and remapped to filesystem.");
}