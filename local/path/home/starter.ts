// @ts-expect-error: this works in the bitburner environment
import * as utils from "utils/utils.ts"


export async function main(ns: NS) {
    ns.ui.openTail();
    ns.disableLog('ALL');
    ns.clearLog();

    const target = "n00dles";

    await nukeAllServers(ns);
    await hackServer(ns, target);

}

async function nukeAllServers(ns: NS) {
    let servers = utils.netscan(ns);
    await ns.sleep(50);
    servers.forEach(s => utils.nukeServer(ns, s));
}

async function prepServer(ns: NS, target: string) {
    const padding = 2000;
    const weakCost = ns.getScriptRam("wk.ts");
    const growCost = ns.getScriptRam("gr.ts");

    const ramCost = growCost + weakCost + weakCost;

    const potentialServers = utils.netscan(ns);
    await ns.sleep(50);
    const servers = potentialServers.filter(s => ns.hasRootAccess(s) && ns.getServerMaxRam(s) - ns.getServerUsedRam(s) >= ramCost);

    while (!isTargetPrepped(ns, target)) {
        // running weak grow weak.
        const growTime: number = ns.getGrowTime(target);
        const weakTime: number = ns.getWeakenTime(target);

        for (let server of servers) {
            ns.scp(["hk.ts", "wk.ts", "gr.ts"], server);
            const freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
            if (ramCost < freeRam) {
                const nextLanding = weakTime + performance.now() + padding;
                ns.print("Sending out a prep batch with a landing time of: " + nextLanding);
                ns.exec("wk.ts", server, 1, target, nextLanding + 50, weakTime);
                ns.exec("gr.ts", server, 1, target, nextLanding + 100, growTime);
                ns.exec("wk.ts", server, 1, target, nextLanding + 150, weakTime);
            }
        }
        await ns.sleep(50);
    }
}

async function hackServer(ns: NS, target: string) {
    // 1 weaken will counter 25 hacks or 12 grows.

    const padding = 2000;
    const hackCost = ns.getScriptRam("hk.ts");
    const weakCost = ns.getScriptRam("wk.ts");
    const growCost = ns.getScriptRam("gr.ts");

    const potentialServers = utils.netscan(ns);
    await ns.sleep(50);
    const servers = potentialServers.filter(s => ns.hasRootAccess(s))

    const greed = 0.1; // percent of money to steal 

    while (true) {
        if (!isTargetPrepped(ns, target)) {
            await prepServer(ns, target);
        }

        await ns.sleep(50);
    }
}

function isTargetPrepped(ns: NS, target: string) {
    return ns.getServerMoneyAvailable(target) == ns.getServerMaxMoney(target) && ns.getServerSecurityLevel(target) == ns.getServerMinSecurityLevel(target)
}