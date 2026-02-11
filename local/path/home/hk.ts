export async function main(ns: NS) {
    let target:string = ns.args[0] as string;
    let batchLand:number = ns.args[1] as number;
    let runtime:number = ns.args[2] as number;
    let currentTime = performance.now();
    let msecDelay: number = batchLand - currentTime - runtime
    //ns.tprint(`Hack batch for ${target} with landing time: ${batchLand}, current time: ${currentTime}, runtime: ${runtime}, msec delay: ${ns.format.time(msecDelay)}`);
    await ns.hack(target, { additionalMsec: msecDelay })

}