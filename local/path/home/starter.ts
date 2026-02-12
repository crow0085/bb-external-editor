// @ts-expect-error: this works in the bitburner environment
import * as utils from "utils/utils.ts"


export async function main(ns: NS) {
    ns.ui.openTail();
    ns.ui.resizeTail(1400, 600);
    ns.disableLog('ALL');
    ns.clearLog();
    await nukeAllServers(ns);

    let target = "";
    if (ns.args.length > 0) {
        target = ns.args[0] as string;
    } else {
        target = utils.findTarget(ns);
    }

    ns.clearPort(1);
    ns.writePort(1, target);

    if (!isTargetPrepped(ns, target)) {
        await prepServer(ns, target);
    }   

    await hackServer(ns, target);

}

async function nukeAllServers(ns: NS) {
    let servers = utils.netscan(ns);
    await ns.sleep(50);
    servers.forEach(s => utils.nukeServer(ns, s));
    servers.forEach(s => ns.scp(["hk.ts", "wk.ts", "gr.ts"], s));
}

async function prepServer(ns: NS, target: string) {
    ns.print(`Prepping ${target}...`);
    if (isTargetPrepped(ns, target))
        return;

    const growBy = 0.001; // how much to grow by with each batch | 0.01 = 1%
    while (!isTargetPrepped(ns, target)) {
        const threads = getThreads(ns, target, growBy);
        const growThreads = threads[1];
        const weakThreads1 = threads[2];
        const weakThreads2 = threads[3];

        const ramCost = growThreads * ns.getScriptRam("gr.ts") + (weakThreads1 + weakThreads2) * ns.getScriptRam("wk.ts");

        const servers = utils.netscan(ns).filter(s => ns.hasRootAccess(s));
        for (let server of servers) {
            let freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
            while (ramCost < freeRam && !isTargetPrepped(ns, target)) {
                const growTime: number = ns.getGrowTime(target);
                const weakTime: number = ns.getWeakenTime(target);
                const nextLanding = weakTime + performance.now() + 500;
                ns.print(`Prepping batch from ${server} with landing time: ${nextLanding}, grow threads: ${growThreads}, weak threads 1: ${weakThreads1}, weak threads 2: ${weakThreads2}`);
                ns.exec("gr.ts", server, growThreads, target, nextLanding + 50, growTime);
                ns.exec("wk.ts", server, weakThreads1, target, nextLanding + 100, weakTime);
                ns.exec("wk.ts", server, weakThreads2, target, nextLanding + 150, weakTime);
                freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
                await ns.sleep(50);
            }
        }
        await ns.sleep(50);
    }
    const servers = utils.netscan(ns).filter(s => ns.hasRootAccess(s));
    //kill pids with hk wk gr
    servers.forEach(server => {
        const pids = ns.ps(server).filter(p => p.filename == "hk.ts" || p.filename == "wk.ts" || p.filename == "gr.ts").map(p => p.pid);
        pids.forEach(pid => ns.kill(pid));
    });
}

function getThreads(ns: NS, target: string, greed: number): number[] {

    const steal = ns.getServerMaxMoney(target) * greed;

    const hackThreads = Math.max(Math.floor(ns.hackAnalyzeThreads(target, steal)), 1);
    const hackPercent = ns.hackAnalyze(target) * hackThreads; // the actual percent of money we will steal based on the number of hack threads
    const growThreads = Math.ceil(ns.growthAnalyze(target, 1 / (1 - 1 * hackPercent)) * 1.1);

    const hackSecInc = ns.hackAnalyzeSecurity(hackThreads);
    const growSecInc = ns.growthAnalyzeSecurity(growThreads);
    const weakAnalysis = ns.weakenAnalyze(1);
    const weakThreads1 = Math.ceil(hackSecInc / weakAnalysis);
    const weakThreads2 = Math.ceil(growSecInc / weakAnalysis);

    return [hackThreads, growThreads, weakThreads1, weakThreads2];
}

async function hackServer(ns: NS, target: string) {
    const greed = 0.1; // percent of money to steal | 0.1 = 10%

    const padding = 1000;
    const spacer = 50;

    const hackCost = ns.getScriptRam("hk.ts");
    const weakCost = ns.getScriptRam("wk.ts");
    const growCost = ns.getScriptRam("gr.ts");

    while (true) {
        const [hackThreads, growThreads, weakThreads1, weakThreads2] = getThreads(ns, target, greed);
        const ramCost = hackThreads * hackCost + growThreads * growCost + (weakThreads1 + weakThreads2) * weakCost;

        const weakTime = ns.getWeakenTime(target);
        const hackTime = ns.getHackTime(target);
        const growTime = ns.getGrowTime(target);

        const nextLanding = performance.now() + weakTime + padding;

        let servers = utils.netscan(ns).filter(s => ns.hasRootAccess(s));
        for (let server of servers) {
            let freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);

            if (freeRam > ramCost) {
                ns.print(`Launching batch from ${server} with landing time: ${nextLanding}, hack threads: ${hackThreads}, grow threads: ${growThreads}, weak threads 1: ${weakThreads1}, weak threads 2: ${weakThreads2}`);
                ns.exec("hk.ts", server, hackThreads, target, nextLanding, hackTime);
                ns.exec("wk.ts", server, weakThreads1, target, nextLanding, weakTime);
                ns.exec("gr.ts", server, growThreads, target, nextLanding, growTime);
                ns.exec("wk.ts", server, weakThreads2, target, nextLanding, weakTime);
                break;
            }
        }

        await ns.sleep(5)
    }

}

function isTargetPrepped(ns: NS, target: string) {
    return ns.getServerMoneyAvailable(target) == ns.getServerMaxMoney(target) && ns.getServerSecurityLevel(target) == ns.getServerMinSecurityLevel(target)
}