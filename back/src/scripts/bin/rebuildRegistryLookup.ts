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
import { BsdType, RegistryImportType } from "@td/codegen-back";

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

(async function () {
  const args = process.argv.slice(2);
  const bsdOrRegistryTypesToIndex = bsdOrRegistryTypes.filter(t =>
    args.map(a => a.toUpperCase()).includes(t)
  );

  // Parse --id (publicId for registry types, readableId for BSD types)
  const idArg = args.find(a => a.startsWith("--id="));
  const id = idArg
    ? idArg.split("=")[1]
    : args.includes("--id")
      ? args[args.indexOf("--id") + 1]
      : undefined;

  if (id !== undefined && bsdOrRegistryTypesToIndex.length !== 1) {
    throw new Error(
      "When --id is specified, exactly one bsdOrRegistryType must be specified. " +
        "Example: npx nx run back:rebuild-registry-lookup INCOMING_TEXS --id=<publicId>"
    );
  }

  const pageSize = args.includes("--page-size")
    ? parseInt(args[args.indexOf("--page-size") + 1])
    : 500;

  const threads = args.includes("--threads")
    ? parseInt(args[args.indexOf("--threads") + 1])
    : 4;
  console.log("pageSize", pageSize);
  console.log("threads", threads);
  if (id !== undefined) {
    console.log("id (single entry rebuild)", id);
  }
  try {
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("SSD")
    ) {
      await ssdLookupUtils.rebuildLookup(pageSize, threads, id);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("INCOMING_WASTE")
    ) {
      await incomingWasteLookupUtils.rebuildLookup(pageSize, threads, id);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("INCOMING_TEXS")
    ) {
      await incomingTexsLookupUtils.rebuildLookup(pageSize, threads, id);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("OUTGOING_WASTE")
    ) {
      await outgoingWasteLookupUtils.rebuildLookup(pageSize, threads, id);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("OUTGOING_TEXS")
    ) {
      await outgoingTexsLookupUtils.rebuildLookup(pageSize, threads, id);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("TRANSPORTED")
    ) {
      await transportedLookupUtils.rebuildLookup(pageSize, threads, id);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("MANAGED")
    ) {
      await managedLookupUtils.rebuildLookup(pageSize, threads, id);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSDD")
    ) {
      await bsddLookupUtils.rebuildLookup(pageSize, threads, id);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSDA")
    ) {
      await bsdaLookupUtils.rebuildLookup(pageSize, threads, id);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSDASRI")
    ) {
      await bsdasriLookupUtils.rebuildLookup(pageSize, threads, id);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSFF")
    ) {
      await bsffLookupUtils.rebuildLookup(pageSize, threads, id);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSPAOH")
    ) {
      await bspaohLookupUtils.rebuildLookup(pageSize, threads, id);
    }
    if (
      bsdOrRegistryTypesToIndex.length === 0 ||
      bsdOrRegistryTypesToIndex.includes("BSVHU")
    ) {
      await bsvhuLookupUtils.rebuildLookup(pageSize, threads, id);
    }
  } catch (error) {
    console.error("Error in rebuildRegistryLookup script, exiting", error);
    throw new Error(`Error in rebuildRegistryLookup script : ${error}`);
  } finally {
    await exitScript();
  }
})();
