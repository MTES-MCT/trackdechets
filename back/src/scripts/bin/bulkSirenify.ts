import { prisma } from "@td/prisma";
import {
  closeSirenifyQueue,
  enqueueSirenifyJob
} from "../../queue/producers/sirenify";

async function exitScript() {
  await prisma.$disconnect();
  await closeSirenifyQueue();
}

const keypress = async () => {
  return new Promise(resolve => {
    process.on("SIGINT", () => resolve("SIGINT"));

    process.stdin.setRawMode(true);
    process.stdin.on("data", chunk => {
      if (chunk.toString() === "\r") {
        // Vérifier si la touche est Entrée
        console.log(
          "Vous avez appuyé sur la touche Entrée. Le programme continue."
        );
        process.stdin.setRawMode(false);
        return resolve("ENTER");
      }
      if (chunk.toString() === "\u001b") {
        console.log(
          "Vous avez appuyé sur la touche Echap. Le programme s'arrête."
        );
        process.stdin.setRawMode(false);
        return resolve("ECHAP");
      }
    });
  });
};

(async function () {
  // Checks for --since and if it has a value
  const sinceIndex = process.argv.indexOf("--since");

  if (sinceIndex === -1) {
    console.log(
      [
        `Ce script permet d'ajouter les informations de la base SIRENE sur des bordereaux`,
        `Il accepte deux arguments :`,
        `--since 2024-04-01 : date à partir de laquelle effectuer le rattrapage`,
        `--before 2024-04-03 : date à laquelle le rattrapage doit s'arrêter (optionnel)`
      ].join("\n")
    );
    return;
  }

  // Retrieve the value after --since
  const sinceValue = process.argv[sinceIndex + 1];

  let beforeValue: string | null = null;

  // Checks for --before and if it has a value
  const beforeIndex = process.argv.indexOf("--before");

  if (beforeIndex > -1) {
    beforeValue = process.argv[beforeIndex + 1];
  }

  const since = new Date(sinceValue);
  const before = beforeValue ? new Date(beforeValue) : new Date();

  console.log(
    `Mise à jour des bordereaux entre ${since.toISOString()} et ${before.toISOString()}`
  );

  const bsdds = await prisma.form.findMany({
    where: { updatedAt: { gte: since, lte: before } },
    select: { readableId: true }
  });

  console.log(`Il y a ${bsdds.length} BSDDs à mettre à jour`);

  const bsdas = await prisma.bsda.findMany({
    where: { updatedAt: { gte: since, lte: before } },
    select: { id: true }
  });

  console.log(`Il y a ${bsdas.length} BSDAs à mettre à jour`);

  const bsdasris = await prisma.bsdasri.findMany({
    where: { updatedAt: { gte: since, lte: before } },
    select: { id: true }
  });

  console.log(`Il y a ${bsdasris.length} BSDASRIs à mettre à jour`);

  const bsffs = await prisma.bsff.findMany({
    where: { updatedAt: { gte: since, lte: before } },
    select: { id: true }
  });

  console.log(`Il y a ${bsffs.length} BSFFSs à mettre à jour`);

  const bsvhus = await prisma.bsvhu.findMany({
    where: { updatedAt: { gte: since, lte: before } },
    select: { id: true }
  });

  console.log(`Il y a ${bsvhus.length} BSVHUs à mettre à jour`);

  const bspaohs = await prisma.bspaoh.findMany({
    where: { updatedAt: { gte: since, lte: before } },
    select: { id: true }
  });

  console.log(`Il y a ${bspaohs.length} BSPAOHs à mettre à jour`);

  console.log("Appuyer sur Entrée pour continuer ou Echap pour arrêter");

  const key = await keypress();

  if (key === "ECHAP") {
    return process.exit();
  }

  for (const readableId of bsdds.map(b => b.readableId)) {
    await enqueueSirenifyJob(readableId);
  }

  for (const id of bsdas.map(b => b.id)) {
    await enqueueSirenifyJob(id);
  }

  for (const id of bsdasris.map(b => b.id)) {
    await enqueueSirenifyJob(id);
  }

  for (const id of bsffs.map(b => b.id)) {
    await enqueueSirenifyJob(id);
  }

  for (const id of bsvhus.map(b => b.id)) {
    await enqueueSirenifyJob(id);
  }

  for (const id of bspaohs.map(b => b.id)) {
    await enqueueSirenifyJob(id);
  }

  console.log("Tous les jobs ont été ajoutés à la queue");

  return exitScript();
})().then(() => process.exit());
