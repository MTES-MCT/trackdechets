import axios from "axios";

type AwaitingCallInfos = { url: string; ids: string[] };

const HOOKS_PROCESSOR_INTERVAL = 10 * 1000;
const hooksToCall = new Map<string, AwaitingCallInfos>(); // Map to batch hook calls

export async function pushHookUpdate(sirets: Set<string>, id: string) {
  for (const siret of sirets) {
    if (!hooksToCall.has(siret)) {
      const url = await getSiretHookUrl(siret);
      if (!url) continue;

      hooksToCall.set(siret, { url, ids: [] });
    }

    const value = hooksToCall.get(siret);
    value.ids.push(id);
  }
}

async function getSiretHookUrl(siret: string): Promise<string> {
  // TODO retrieve URL associated to `siret`
  console.log(`Find ${siret} hook`);
  return null;
}

function processAwaitingHookCalls(
  callsInfos: IterableIterator<AwaitingCallInfos>
) {
  for (const { url, ids } of callsInfos) {
    axios.post(url, { ids }, { timeout: 2000 }); // Don't await, fire and forget
  }
}

export function startHookProcessor() {
  setInterval(() => {
    const calls = hooksToCall.values();
    hooksToCall.clear(); // Reset awaiting list

    processAwaitingHookCalls(calls);
  }, HOOKS_PROCESSOR_INTERVAL);
}
