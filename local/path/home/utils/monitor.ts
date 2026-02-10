export async function main(ns: NS) {
    const delay = 50;

    ns.ui.openTail();
    ns.ui.resizeTail(422, 281);
    ns.ui.moveTail(2122, 486);
    ns.disableLog('ALL');
    while (true) {
        ns.clearLog(); 

        let server =  "";
        let portData = ns.peek(1) as string;

        if (ns.args.length > 0){
            server = ns.args[0] as string;
        }else if (portData != "NULL PORT DATA"){
            server = portData
        }else{
            server = "n00dles"
        }

        ns.print(portData);
        
        ns.print(`Server: ${server}`);
        let isPrepped: Boolean = ns.getServerMoneyAvailable(server) == ns.getServerMaxMoney(server) && ns.getServerSecurityLevel(server) == ns.getServerMinSecurityLevel(server);
        ns.print(`server prepped: ${isPrepped}`);
        ns.print(`Money: ${ns.format.number(ns.getServerMoneyAvailable(server))} / ${ns.format.number(ns.getServerMaxMoney(server))} (${ns.format.percent(ns.getServerMoneyAvailable(server) / ns.getServerMaxMoney(server))})`);
        ns.print(`Time to hack: ${ns.format.time(ns.getHackTime(server))}`);
        ns.print(`Time to grow: ${ns.format.time(ns.getGrowTime(server))}`);
        ns.print(`Time to weaken: ${ns.format.time(ns.getWeakenTime(server))}`);
        ns.print(`Current security: ${ns.getServerSecurityLevel(server)}`);
        ns.print(`Minimum security: ${ns.getServerMinSecurityLevel(server)}`);
        ns.print(`Hack chance: ${ns.format.percent(ns.hackAnalyzeChance(server))}`) 
        await ns.sleep(delay);
    }


}