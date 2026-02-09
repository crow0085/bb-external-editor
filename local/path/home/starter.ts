// @ts-expect-error: this works in the bitburner environment
import * as utils from "utils/utils.ts"


export async function main(ns: NS) {
    ns.ui.openTail();
    ns.ui.resizeTail(800, 600);
    ns.disableLog('ALL');
    ns.clearLog();

    const target = "n00dles";

    await nukeAllServers(ns);
    if (!isTargetPrepped(ns, target)) {
        await prepServer(ns, target);
    }
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

    ns.print("Starting prep for " + target);
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
    ns.print("Finished prep for " + target);
}

async function hackServer(ns: NS, target: string) {

    const padding = 2000;
    const hackCost = ns.getScriptRam("hk.ts");
    const weakCost = ns.getScriptRam("wk.ts");
    const growCost = ns.getScriptRam("gr.ts");

    const potentialServers = utils.netscan(ns);
    await ns.sleep(50);
    const servers = potentialServers.filter(s => ns.hasRootAccess(s))

    const greed = 0.0001; // percent of money to steal 
    const steal = ns.getServerMaxMoney(target) * greed;

    while (true) {

        const hackThreads = Math.max(Math.floor(ns.hackAnalyzeThreads(target, steal)), 1);
        const hackPercent = ns.hackAnalyze(target) * hackThreads; // the actual percent of money we will steal
        const growThreads = Math.max(Math.ceil(ns.growthAnalyze(target, ns.getServerMaxMoney(target) / (ns.getServerMaxMoney(target) - ns.getServerMaxMoney(target) * hackPercent))), 1);
        const weakThreads1 = Math.max(Math.ceil(ns.hackAnalyzeSecurity(hackThreads, target)), 1);
        const weakThreads2 = Math.max(Math.ceil(ns.growthAnalyzeSecurity(growThreads, target)), 1);

        const ramCost = hackThreads * hackCost + growThreads * growCost + (weakThreads1 + weakThreads2) * weakCost;

        for (let server of servers) {
            ns.scp(["hk.ts", "wk.ts", "gr.ts"], server);
            await ns.sleep(50);
            let freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
            while (ramCost < freeRam) {
                //send out a batch
                const growTime: number = ns.getGrowTime(target);
                const weakTime: number = ns.getWeakenTime(target);
                const hackTime: number = ns.getHackTime(target);

                const nextLanding = weakTime + performance.now() + padding;
                ns.print(`sending out a batch with ${hackThreads} hack threads, ${growThreads} grow threads, ${weakThreads1 + weakThreads2} weak threads, with a landing time of: ${nextLanding}`);
                ns.exec("hk.ts", server, hackThreads, target, nextLanding + 50, hackTime);
                ns.exec("wk.ts", server, weakThreads1, target, nextLanding + 100, weakTime);
                ns.exec("gr.ts", server, growThreads, target, nextLanding + 150, growTime);
                ns.exec("wk.ts", server, weakThreads2, target, nextLanding + 200, weakTime);
                freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
                await ns.sleep(250);
            }
        }

        await ns.sleep(50);
    }

}

function isTargetPrepped(ns: NS, target: string) {
    return ns.getServerMoneyAvailable(target) == ns.getServerMaxMoney(target) && ns.getServerSecurityLevel(target) == ns.getServerMinSecurityLevel(target)
}