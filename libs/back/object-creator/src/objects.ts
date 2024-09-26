import { PrismaClient, Prisma } from "@prisma/client";

type DataType<M extends keyof PrismaClient> = Prisma.Args<
  PrismaClient[M],
  "create"
>["data"];

type CreationObject<M extends keyof PrismaClient> = {
  type: M;
  object: DataType<M>;
};
const objects = [
  {
    type: "ecoOrganisme",
    object: {
      siret: "00000000000013",
      name: "Mon éco-organisme",
      address: "12 RUE DES PINSONS 75012 PARIS",
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">
];

export default objects;
