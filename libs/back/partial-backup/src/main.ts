import { unescape } from "node:querystring";
import { Company, Form, Prisma, PrismaClient } from "@prisma/client";

enum BsdType {
  Bsda = "BSDA",
  Bsdasri = "BSDASRI",
  Bsdd = "BSDD",
  Bsff = "BSFF",
  Bspaoh = "BSPAOH",
  Bsvhu = "BSVHU"
}

const { DATABASE_URL, TUNNELED_DB, DUMP_OBJ } = process.env;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

if (!TUNNELED_DB) {
  throw new Error("TUNNELED_DB is not defined");
}

if (!DUMP_OBJ) {
  throw new Error(
    "DUMP_OBJ is not defined, please specify an object t act as the dump starting point"
  );
}

function getDbUrlWithSchema(rawDatabaseUrl: string) {
  try {
    const dbUrl = new URL(rawDatabaseUrl);
    dbUrl.searchParams.set("schema", "default$default");

    return unescape(dbUrl.href); // unescape needed because of the `$`
  } catch (err) {
    return "";
  }
}

const prismaLocal = new PrismaClient({
  datasources: {
    db: { url: getDbUrlWithSchema(DATABASE_URL) }
  },
  log: ["query", "info", "warn", "error"]
});

const prismaRemote = new PrismaClient({
  datasources: {
    db: { url: getDbUrlWithSchema(TUNNELED_DB) }
  },
  log: ["query", "info", "warn", "error"]
});

const pipelines = {
  Form: {
    getter: async (bsdId: string) =>
      bsdId && prismaRemote.form.findFirst({ where: { readableId: bsdId } }),
    setter: async (bsd?: Form) =>
      bsd &&
      prismaLocal.form.create({
        data: {
          ...bsd,
          wasteDetailsPackagingInfos:
            bsd.wasteDetailsPackagingInfos ?? Prisma.JsonNull,
          wasteDetailsParcelNumbers:
            bsd.wasteDetailsParcelNumbers ?? Prisma.JsonNull
        }
      })
  },
  Company: {
    getter: async (siret?: string) =>
      siret && prismaRemote.company.findFirst({ where: { orgId: siret } }),
    setter: async (company?: Company) =>
      company && prismaLocal.company.create({ data: company })
  }
};

const origins = {
  [BsdType.Bsdd]: {
    type: "Form",
    getter: async (bsdId: string) =>
      bsdId && prismaRemote.form.findFirst({ where: { readableId: bsdId } }),
    setter: async (bsd?: Form) =>
      bsd &&
      prismaLocal.form.create({
        data: {
          ...bsd,
          wasteDetailsPackagingInfos:
            bsd.wasteDetailsPackagingInfos ?? Prisma.JsonNull,
          wasteDetailsParcelNumbers:
            bsd.wasteDetailsParcelNumbers ?? Prisma.JsonNull
        }
      })
  }
};

const traversals = {
  Form: [
    {
      type: "Company",
      localKey: "emitterCompanySiret"
    },
    {
      type: "Company",
      localKey: "recipientCompanySiret"
    },
    {
      type: "Company",
      localKey: "traderCompanySiret"
    },
    {
      type: "Company",
      localKey: "ecoOrganismeSiret"
    },
    {
      type: "Company",
      localKey: "brokerCompanySiret"
    },
    {
      type: "Company",
      localKey: "nextDestinationCompanySiret"
    }
  ]
};

const run = async () => {
  let objectType: BsdType;

  const objType = DUMP_OBJ.split("-")?.[0];

  if (!objType) {
    throw new Error("DUMP_OBJ is not a valid BSD id");
  }

  switch (objType) {
    case "BSD":
      objectType = BsdType.Bsdd;
      break;
    case "DASRI":
      objectType = BsdType.Bsdasri;
      break;
    case "BSDA":
      objectType = BsdType.Bsda;
      break;
    case "FF":
      objectType = BsdType.Bsff;
      break;
    case "PAOH":
      objectType = BsdType.Bspaoh;
      break;
    case "VHU":
      objectType = BsdType.Bsvhu;
      break;
    default:
      throw new Error("DUMP_OBJ is not a valid BSD id");
  }
  const bsd = await pipelines[origins[objectType].type].getter(DUMP_OBJ);
  await pipelines[origins[objectType].type].setter(bsd);
  for (const item of traversals[origins[objectType].type]) {
    const getter = pipelines[item.type]?.getter;
    const setter = pipelines[item.type]?.setter;
    const obj = await getter?.(bsd[item.localKey]);
    await setter?.(obj);
  }
};

run();
