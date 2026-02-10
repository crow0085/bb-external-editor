export async function main(ns: NS) {
    let numServers = ns.cloud.getServerNames().length;
    const ram = 8;
    const max = ns.cloud.getServerLimit();
    ns.tprint(`Current number of servers: ${numServers}. Max servers: ${max}. RAM per server: ${ram}GB.`);
    ns.tprint(ns.cloud.getServerNames());
    while (numServers < max){
        // keep buying servers
        if (ns.getServerMoneyAvailable("home") > ns.cloud.getServerCost(ram)) {
            let hname = ns.cloud.purchaseServer("pserv-" + numServers, ram);
            ns.scp(["hk.ts", "wk.ts", "gr.ts", "starter.ts", "utils/utils.ts", "utils/monitor.ts"], hname);
            numServers ++;
            ns.tprint(`Purchased server ${hname} with ${ram}GB of RAM. Total servers: ${numServers}`);
        }

        await ns.sleep(1000);
    }
}