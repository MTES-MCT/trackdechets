import { prisma } from "@td/prisma";
import { getFormRepository } from "../../forms/repository";

// Ticket Favro: https://favro.com/widget/ab14a4f0460a99a9d64d4945/76e5e3cb6cf95d7444ba2c0c?card=tra-15272
// Script pour passer tous les bordereaux à emptyReturnADR: "EMPTY_NOT_WASHED", à emptyReturnADR: "EMPTY_RETURN_NOT_WASHED"
// (la valeur EMPTY_NOT_WASHED étant supprimée)
//
// !!! DOIT ÊTRE EXECUTE **AVANT** LA MIGRATION !!!
(async function () {
  console.log(`> Starting script fixEmptyReturnADR`);

  const bsds = await prisma.form.findMany({
    where: { emptyReturnADR: "EMPTY_NOT_WASHED" },
    select: { id: true, readableId: true }
  });

  console.log(`Found ${bsds.length} BSDs to fix`);

  // If number is not normal, give time to Ctrl + C the whole process
  await new Promise(res => setTimeout(res, 10000));

  console.log("Updating...");

  const { update } = await getFormRepository({
    id: "support_tech"
  } as Express.User);

  // Going through BSDs
  for (const bsd of bsds) {
    console.log(`Fixing BSD ${bsd.readableId}`);

    await update({ id: bsd.id }, { emptyReturnADR: "EMPTY_RETURN_NOT_WASHED" });
  }

  console.log("> Done!");
})().then(() => process.exit());
