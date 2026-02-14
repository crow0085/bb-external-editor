// @ts-expect-error: this works in the bitburner environment
import * as utils from "utils/utils.ts"

export async function main(ns: NS) {
    const servers = utils.netscan(ns);
    servers.forEach(s => {
        utils.nukeServer(ns, s);
        ns.scp(["hk.ts", "wk.ts", "gr.ts"], s);
    });
}