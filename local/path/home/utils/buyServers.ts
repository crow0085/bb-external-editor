export async function main(ns: NS) {
    let numServers = ns.cloud.getServerNames().length;
    const ram = 8;
    const max = ns.cloud.getServerLimit();
    ns.tprint(`Current number of servers: ${numServers}. Max servers: ${max}. RAM per server: ${ram}GB.`);
    ns.tprint(ns.cloud.getServerNames());
    while (numServers < max) {
        // keep buying servers
        if (ns.getServerMoneyAvailable("home") > ns.cloud.getServerCost(ram)) {
            let hname = ns.cloud.purchaseServer("pserv-" + numServers, ram);
            ns.scp(["hk.ts", "wk.ts", "gr.ts", "starter.ts", "utils/utils.ts", "utils/monitor.ts"], hname);
            numServers++;
            ns.tprint(`Purchased server ${hname} with ${ns.format.ram(ram)} of RAM. Total servers: ${numServers}`);
        }

        await ns.sleep(1000);
    }


    const serverHosts = ns.cloud.getServerNames();
    while (true) {
        for (let server of serverHosts) {
            const curRam = ns.getServerMaxRam(server);
            if (curRam < ns.cloud.getRamLimit()) {
                const nextRam = Math.min(nextPowerOfTwo(curRam+1), ns.cloud.getRamLimit());
                if (ns.getServerMoneyAvailable("home") > ns.cloud.getServerUpgradeCost(server, nextRam)) {
                    ns.cloud.upgradeServer(server, nextRam);
                    ns.tprint(`Upgraded server ${server} to ${ns.format.ram(nextRam)} of RAM.`);
                }
            }
        }
        await ns.sleep(5000); 
    }
}


function nextPowerOfTwo(n) {
    if (n <= 0) return 1; // Handle 0 or negative numbers
    return Math.pow(2, Math.ceil(Math.log2(n)));
}