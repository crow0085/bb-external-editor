export function netscan(ns: NS) {
    ns.disableLog('scan');
    let hosts = new Set(["home"]);
    hosts.forEach(h => { ns.scan(h).forEach(n => hosts.add(n)); });
    return Array.from(hosts);
}

export function nukeServer(ns: NS, server: string) {
    let portOpeners = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"]
    let currentPortOpeners = [];
    portOpeners.forEach(el => {
        if (ns.fileExists(el, 'home'))
            currentPortOpeners.push(el);
    });

    if (server == 'home' || ns.hasRootAccess(server))
        return;

    if (ns.getServerNumPortsRequired(server) > currentPortOpeners.length)
        return;

    currentPortOpeners.forEach(opener => {
        if (opener == "BruteSSH.exe")
            ns.brutessh(server);
        if (opener == "FTPCrack.exe")
            ns.ftpcrack(server);
        if (opener == "relaySMTP.exe")
            ns.relaysmtp(server);
        if (opener == "HTTPWorm.exe")
            ns.httpworm(server);
        if (opener == "SQLInject.exe")
            ns.sqlinject(server);
    });

    ns.nuke(server);
    ns.tprint(`nuking server: ${server}`)
}

export function findTarget(ns: NS) {
    let servers = netscan(ns);
    let customServers: CustomServer[] = [];
    servers.forEach(server => {
        customServers.push(new CustomServer(server, ns));
    });
    customServers.sort((a, b) => b.getWeight() - a.getWeight());
    return customServers[0].hostname;
}


class CustomServer{
    hostname: string;
    ns: NS;

    constructor(hostname: string, ns:NS) {
        this.hostname = hostname;
        this.ns = ns;
    }

    getWeight(){
        const weight = this.ns.getServerMaxMoney(this.hostname) / this.ns.getServerMinSecurityLevel(this.hostname);
        if (this.ns.getServerRequiredHackingLevel(this.hostname) > Math.ceil(this.ns.getHackingLevel()/2) || !this.ns.hasRootAccess(this.hostname) || this.hostname == "home") {
            return 0;
        }
        return weight;
    }
}