// @ts-expect-error: this works in the bitburner environment
import * as utils from "utils/utils.ts"

export async function main(ns: NS) {
    let target = ns.args[0] as string;
    if (!target) {
        ns.tprint("Please provide a target server as an argument.");
        return;
    }
    
    utils.nukeServer(ns, target);
}

export function autocomplete(data, args) {
    return data.servers;
}