import {
  ssdLookupUtils,
  incomingWasteLookupUtils,
  incomingTexsLookupUtils,
  outgoingWasteLookupUtils,
  outgoingTexsLookupUtils,
  transportedLookupUtils,
  managedLookupUtils
} from "@td/registry";
import { prisma } from "@td/prisma";
import { lookupUtils as bsddLookupUtils } from "../../forms/registryV2";
import { lookupUtils as bsdaLookupUtils } from "../../bsda/registryV2";
import { lookupUtils as bsdasriLookupUtils } from "../../bsdasris/registryV2";
import { lookupUtils as bsffLookupUtils } from "../../bsffs/registryV2";
import { lookupUtils as bspaohLookupUtils } from "../../bspaoh/registryV2";
import { lookupUtils as bsvhuLookupUtils } from "../../bsvhu/registryV2";
import {
  BsdType,
  RegistryImportType,
  RegistryV2ExportType,
  WasteRegistryType
} from "@td/codegen-back";
import { BsdElastic, client, index } from "../../common/elastic";

const bsdOrRegistryTypes: (BsdType | RegistryImportType)[] = [
  "BSDD",
  "BSDA",
  "BSDASRI",
  "BSVHU",
  "BSFF",
  "BSPAOH",
  "INCOMING_TEXS",
  "INCOMING_WASTE",
  "OUTGOING_TEXS",
  "OUTGOING_WASTE",
  "TRANSPORTED",
  "MANAGED",
  "SSD"
];

async function exitScript() {
  console.info("Done rebuildRegistryLookup script, exiting");
  await prisma.$disconnect();
  process.exit(0);
}
const elasticKey: { [key in WasteRegistryType]?: keyof BsdElastic } = {
  OUTGOING: "isOutgoingWasteFor",
  INCOMING: "isIncomingWasteFor",
  TRANSPORTED: "isTransportedWasteFor",
  MANAGED: "isManagedWasteFor",
  ALL: "isAllWasteFor"
};
const getKey = (id: string, siret: string) => `${id}_${siret}`;
const runIntegrityTest = async () => {
  const mem = {};
  const elasticRun = async (registryType: WasteRegistryType) => {
    let done = false;
    const size = 100;
    let after: any | null = null;
    let total = 0;
    while (!done) {
      const { body } = await client.search({
        index: index.alias,
        body: {
          size: size,
          query: {
            bool: {
              must: [
                {
                  script: {
                    script: {
                      source: `doc['${elasticKey[registryType]}'].length > 0`
                    }
                  }
                },
                {
                  exists: { field: "createdAt" }
                }
              ]
            }
          },
          sort: [
            {
              createdAt: "asc"
            },
            { id: "asc" }
          ],
          search_after: after ? after.sort : undefined
        }
      });
      total += body.hits.hits.length;
      if (body.hits.hits.length < size) {
        done = true;
      } else {
        after = body.hits.hits[body.hits.hits.length - 1];
      }
      const hits = body.hits.hits;
      for (const element of hits) {
        const source = element._source;
        for (const siret of source.isIncomingWasteFor) {
          if (mem[getKey(source.readableId, siret)]) {
            delete mem[getKey(source.readableId, siret)];
          } else {
            mem[getKey(source.readableId, siret)] = "elastic";
          }
        }
      }
    }
    console.log("elastic total", total);
  };
  const lookupRun = async (
    exportType: Exclude<RegistryV2ExportType, "ALL">
  ) => {
    let done = false;
    const size = 50;
    let cursorId: string | null = null;
    let total = 0;
    while (!done) {
      const items = await prisma.registryLookup.findMany({
        where: {
          declarationType: "BSD",
          exportRegistryType: exportType
        },
        take: size,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? { dateId: cursorId } : undefined,
        orderBy: {
          dateId: "asc"
        }
      });
      total += items.length;
      if (items.length < size) {
        done = true;
      } else {
        cursorId = items[items.length - 1].dateId;
      }
      for (const element of items) {
        if (mem[getKey(element.readableId, element.siret)]) {
          delete mem[getKey(element.readableId, element.siret)];
        } else {
          mem[getKey(element.readableId, element.siret)] = "lookup";
        }
      }
    }
    console.log("lookup total", total);
  };
  await Promise.all([elasticRun("INCOMING"), lookupRun("INCOMING")]);
  await Promise.all([elasticRun("OUTGOING"), lookupRun("OUTGOING")]);
  await Promise.all([elasticRun("TRANSPORTED"), lookupRun("TRANSPORTED")]);
  await Promise.all([elasticRun("MANAGED"), lookupRun("MANAGED")]);
  if (Object.keys(mem).length === 0) {
    console.log("LOOKUP & ELASTIC are in sync, no misses :)");
  } else {
    console.log(`There are ${Object.keys(mem).length} misses :(`);
    for (const miss of Object.keys(mem)) {
      console.log(
        `Registry: INCOMING, BSD id: ${miss.split("_")[0]}, siret: ${
          miss.split("_")[1]
        }, found in: ${mem[miss]}`
      );
    }
  }
};

(async function () {
  const args = process.argv.slice(2);
  const integrityTest = args.includes("--integrity");
  const bsdOrRegistryTypesToIndex = bsdOrRegistryTypes.filter(t =>
    args.map(a => a.toUpperCase()).includes(t)
  );
  const pageSize = args.includes("--page-size")
    ? parseInt(args[args.indexOf("--page-size") + 1])
    : 500;
  console.log("pageSize", pageSize);
  try {
    if (integrityTest) {
      await runIntegrityTest();
      return;
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("SSD")
    ) {
      await ssdLookupUtils.rebuildLookup(pageSize);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("INCOMING_WASTE")
    ) {
      await incomingWasteLookupUtils.rebuildLookup(pageSize);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("INCOMING_TEXS")
    ) {
      await incomingTexsLookupUtils.rebuildLookup(pageSize);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("OUTGOING_WASTE")
    ) {
      await outgoingWasteLookupUtils.rebuildLookup(pageSize);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("OUTGOING_TEXS")
    ) {
      await outgoingTexsLookupUtils.rebuildLookup(pageSize);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("TRANSPORTED")
    ) {
      await transportedLookupUtils.rebuildLookup(pageSize);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("MANAGED")
    ) {
      await managedLookupUtils.rebuildLookup(pageSize);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSDD")
    ) {
      await bsddLookupUtils.rebuildLookup(pageSize);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSDA")
    ) {
      await bsdaLookupUtils.rebuildLookup(pageSize);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSDASRI")
    ) {
      await bsdasriLookupUtils.rebuildLookup(pageSize);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSFF")
    ) {
      await bsffLookupUtils.rebuildLookup(pageSize);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSPAOH")
    ) {
      await bspaohLookupUtils.rebuildLookup(pageSize);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSVHU")
    ) {
      await bsvhuLookupUtils.rebuildLookup(pageSize);
    }
  } catch (error) {
    console.error("Error in rebuildRegistryLookup script, exiting", error);
    throw new Error(`Error in rebuildRegistryLookup script : ${error}`);
  } finally {
    await exitScript();
  }
})();
