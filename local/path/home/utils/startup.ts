// @ts-expect-error: this works in the bitburner environment
import * as utils from "utils/utils.ts"

export async function main(ns: NS) {
    // nuke all servers and copy scripts
    let servers = utils.netscan(ns);
    await ns.sleep(50);
    for(let s of servers) {
        utils.nukeServer(ns, s);
        ns.scp(["hk.ts", "wk.ts", "gr.ts", "starter.ts", "utils/utils.ts", "utils/monitor.ts"], s);
        
        ns.tprint(`copied scripts: ["hk.ts", "wk.ts", "gr.ts", "starter.ts", "utils/utils.ts", "utils/monitor.ts"] to ${s}`);
    }

}   