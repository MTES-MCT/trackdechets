import {
  ssdLookupUtils,
  incomingWasteLookupUtils,
  incomingTexsLookupUtils,
  outgoingWasteLookupUtils,
  outgoingTexsLookupUtils,
  transportedLookupUtils,
  managedLookupUtils,
  type MissingLookupEntry
} from "@td/registry";
import { prisma } from "@td/prisma";
import { lookupUtils as bsddLookupUtils } from "../../forms/registryV2";
import { lookupUtils as bsdaLookupUtils } from "../../bsda/registryV2";
import { lookupUtils as bsdasriLookupUtils } from "../../bsdasris/registryV2";
import { lookupUtils as bsffLookupUtils } from "../../bsffs/registryV2";
import { lookupUtils as bspaohLookupUtils } from "../../bspaoh/registryV2";
import { lookupUtils as bsvhuLookupUtils } from "../../bsvhu/registryV2";
import { BsdType, RegistryImportType } from "@td/codegen-back";

type RebuildLookupFn = (
  pageSize: number,
  threads: number,
  ids: string[] | undefined,
  discovery: boolean
) => Promise<MissingLookupEntry[]>;

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

/** Run discovery then fix: discover missing lookups, unique by id (for BSDs one id can have multiple missing entries), then rebuild for those ids. */
async function discoveryAndFix(
  rebuildLookup: RebuildLookupFn,
  pageSize: number,
  threads: number,
  bsdOrRegistryType: BsdType | RegistryImportType
): Promise<void> {
  const missing = await rebuildLookup(pageSize, threads, undefined, true);
  const uniqueIds =
    bsdOrRegistryType === "BSDD"
      ? [...new Set(missing.map(e => e.readableId!))]
      : [...new Set(missing.map(e => e.id))];
  if (uniqueIds.length > 0) {
    console.log(
      `\n🔧 Rebuilding lookup for ${uniqueIds.length} entr${
        uniqueIds.length === 1 ? "y" : "ies"
      }...\n`
    );
    await rebuildLookup(pageSize, threads, uniqueIds, false);
  }
}

(async function () {
  const args = process.argv.slice(2);
  const bsdOrRegistryTypesToIndex = bsdOrRegistryTypes.filter(t =>
    args.map(a => a.toUpperCase()).includes(t)
  );

  // Parse --id (comma-separated list; id for registry types, readableId for BSD types)
  const idArg = args.find(a => a.startsWith("--id="));
  const idRaw = idArg
    ? idArg.split("=")[1]
    : args.includes("--id")
    ? args[args.indexOf("--id") + 1]
    : undefined;
  let ids: string[] | undefined =
    idRaw === undefined
      ? undefined
      : idRaw
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);

  if (
    ids !== undefined &&
    ids.length > 0 &&
    bsdOrRegistryTypesToIndex.length !== 1
  ) {
    throw new Error(
      "When --id is specified, exactly one bsdOrRegistryType must be specified. " +
        "Example: npx nx run back:rebuild-registry-lookup INCOMING_TEXS --id=<id1> or --id=<id1>,<id2>,<id3>"
    );
  }

  // Empty list = no filter. Always pass string[] or undefined.
  if (ids?.length === 0) ids = undefined;

  const pageSize = args.includes("--page-size")
    ? parseInt(args[args.indexOf("--page-size") + 1])
    : 500;

  const threads = args.includes("--threads")
    ? parseInt(args[args.indexOf("--threads") + 1])
    : 4;

  const discovery = args.includes("--discovery");
  const discoveryAndFixMode = args.includes("--discovery-and-fix");

  if (discovery && discoveryAndFixMode) {
    throw new Error(
      "Cannot use both --discovery and --discovery-and-fix. Use --discovery-and-fix to discover and then fix in one run."
    );
  }
  if (discoveryAndFixMode && ids !== undefined) {
    throw new Error(
      "Cannot use --id with --discovery-and-fix. Discovery-and-fix discovers missing entries then rebuilds for those ids."
    );
  }

  console.log("pageSize", pageSize);
  console.log("threads", threads);
  if (ids !== undefined) {
    console.log(
      `ids (${ids.length} entr${ids.length === 1 ? "y" : "ies"} rebuild)`,
      ids.join(", ")
    );
  }
  if (discovery) {
    console.log(
      "discovery mode: will only output missing RegistryLookup entries (no write)"
    );
  }
  if (discoveryAndFixMode) {
    console.log(
      "discovery-and-fix mode: will discover missing entries then rebuild lookup for them"
    );
  }
  try {
    const run = discoveryAndFixMode
      ? (
          fn: RebuildLookupFn,
          bsdOrRegistryType: BsdType | RegistryImportType
        ) => discoveryAndFix(fn, pageSize, threads, bsdOrRegistryType)
      : (fn: RebuildLookupFn) => fn(pageSize, threads, ids, discovery);

    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("SSD")
    ) {
      await run(ssdLookupUtils.rebuildLookup, "SSD");
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("INCOMING_WASTE")
    ) {
      await run(incomingWasteLookupUtils.rebuildLookup, "INCOMING_WASTE");
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("INCOMING_TEXS")
    ) {
      await run(incomingTexsLookupUtils.rebuildLookup, "INCOMING_TEXS");
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("OUTGOING_WASTE")
    ) {
      await run(outgoingWasteLookupUtils.rebuildLookup, "OUTGOING_WASTE");
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("OUTGOING_TEXS")
    ) {
      await run(outgoingTexsLookupUtils.rebuildLookup, "OUTGOING_TEXS");
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("TRANSPORTED")
    ) {
      await run(transportedLookupUtils.rebuildLookup, "TRANSPORTED");
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("MANAGED")
    ) {
      await run(managedLookupUtils.rebuildLookup, "MANAGED");
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSDD")
    ) {
      await run(bsddLookupUtils.rebuildLookup, "BSDD");
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSDA")
    ) {
      await run(bsdaLookupUtils.rebuildLookup, "BSDA");
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSDASRI")
    ) {
      await run(bsdasriLookupUtils.rebuildLookup, "BSDASRI");
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSFF")
    ) {
      await run(bsffLookupUtils.rebuildLookup, "BSFF");
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSPAOH")
    ) {
      await run(bspaohLookupUtils.rebuildLookup, "BSPAOH");
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSVHU")
    ) {
      await run(bsvhuLookupUtils.rebuildLookup, "BSVHU");
    }
  } catch (error) {
    console.error("Error in rebuildRegistryLookup script, exiting", error);
    throw new Error(`Error in rebuildRegistryLookup script : ${error}`);
  } finally {
    await exitScript();
  }
})();
