export async function main(ns: NS) {
    const target = ns.args[0] as string;
    const route = await getRoute(ns, target);
    
    let conString = "";
    route.forEach(s => conString += `connect ${s};`);
    conString += "backdoor";
    ns.tprint(conString);
    navigator.clipboard.writeText(conString)
}

export async function getRoute(ns: NS, target: string) {
    const root = "home";
    let current = target;
    let path = new Set<string>();
    path.add(current);
    while (current != root) {
        const parent = ns.scan(current)[0];
        path.add(parent);
        current = parent;
    }
    return Array.from(path).reverse();
}

export function autocomplete(data, args) {
    return data.servers;
}