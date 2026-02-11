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

    // const missingMoney = 1- (ns.getServerMoneyAvailable(target) / ns.getServerMaxMoney(target)); // percent of money missing on the target
    // const maxGrowThreads = Math.ceil(ns.growthAnalyze(target, 1 / (1 - missingMoney))); // total amount of grow threads needed to bring server to max money
    // const growSecInc = ns.growthAnalyzeSecurity(maxGrowThreads);
    // const weakAnalysis = ns.weakenAnalyze(1);
    // const maxWeakThreads1 = Math.ceil(growSecInc / weakAnalysis); // max amount of weaken threads to counter the grow threads security increase
    // const minSecLevel = ns.getServerMinSecurityLevel(target);
    // const curSecLevel = ns.getServerSecurityLevel(target);
    // const maxWeakThreads2 = Math.ceil((curSecLevel - minSecLevel) / weakAnalysis); // max amount of weaken threads to counter the current security level above minimum

    // const totalRam = maxGrowThreads * ns.getScriptRam("gr.ts") + (maxWeakThreads1 + maxWeakThreads2) * ns.getScriptRam("wk.ts");

    // ns.print(`Missing money: ${ns.format.percent(missingMoney)}, max grow threads: ${maxGrowThreads}, grow security increase: ${growSecInc}, max weaken threads to counter grow: ${maxWeakThreads1}, current sec level: ${curSecLevel}, min sec level: ${minSecLevel}, max weaken threads to counter current sec level: ${maxWeakThreads2}`);
    // ns.print(`Total RAM needed for prep: ${ns.format.ram(totalRam)}`);
    // ns.exit();

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
            while(ramCost < freeRam && !isTargetPrepped(ns, target)){
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

    const padding = 500;
    const hackCost = ns.getScriptRam("hk.ts");
    const weakCost = ns.getScriptRam("wk.ts");
    const growCost = ns.getScriptRam("gr.ts");

    while (true) {
        const servers = utils.netscan(ns).filter(s => ns.hasRootAccess(s));
        const [hackThreads, growThreads, weakThreads1, weakThreads2] = getThreads(ns, target, greed);
        const ramCost = hackThreads * hackCost + growThreads * growCost + (weakThreads1 + weakThreads2) * weakCost;

        for (let server of servers) {
            let freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
            while (ramCost < freeRam) {
                //send out a batch
                const growTime: number = ns.getGrowTime(target);
                const weakTime: number = ns.getWeakenTime(target);
                const hackTime: number = ns.getHackTime(target);

                const nextLanding = weakTime + performance.now() + padding;
                ns.print(`New batch from ${server} with landing time: ${nextLanding}, hack threads: ${hackThreads}, weak threads 1: ${weakThreads1}, grow threads: ${growThreads}, weak threads 2: ${weakThreads2}`);
                ns.exec("hk.ts", server, hackThreads, target, nextLanding + 50, hackTime);
                ns.exec("wk.ts", server, weakThreads1, target, nextLanding + 100, weakTime);
                ns.exec("gr.ts", server, growThreads, target, nextLanding + 150, growTime);
                ns.exec("wk.ts", server, weakThreads2, target, nextLanding + 200, weakTime);
                freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
                await ns.sleep(50);
            }
        }

        await ns.sleep(50);
    }

}

function isTargetPrepped(ns: NS, target: string) {
    return ns.getServerMoneyAvailable(target) == ns.getServerMaxMoney(target) && ns.getServerSecurityLevel(target) == ns.getServerMinSecurityLevel(target)
}