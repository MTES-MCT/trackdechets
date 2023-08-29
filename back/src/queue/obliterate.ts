#!/usr/bin/env ts-node
import { mailQueue } from "./producers/mail";
import { indexQueue } from "./producers/elastic";
import {
  favoritesCompanyQueue,
  geocodeCompanyQueue,
  setCompanyDepartementQueue
} from "./producers/company";

const QUEUES = {
  // eslint-disable-next-line prettier/prettier
  "mailQueue": mailQueue,
  // eslint-disable-next-line prettier/prettier
  "indexQueue": indexQueue,
  // eslint-disable-next-line prettier/prettier
  "geocodeCompanyQueue": geocodeCompanyQueue,
  // eslint-disable-next-line prettier/prettier
  "setCompanyDepartementQueue": setCompanyDepartementQueue,
  // eslint-disable-next-line prettier/prettier
  "favoritesCompanyQueue": favoritesCompanyQueue
};

(async () => {
  const [queueName] = process.argv.slice(2);

  if (!queueName) {
    console.log(
      [
        `Ce script permet de vider tous les jobs d'une queue donnée.`,
        `Il accepte un seul argument :`,
        `- queueName : nom de la queue (cf. back/src/queue/producers/)`,
        ``,
        `Exemple :`,
        `npm run queue:obliterate -- indexQueue`
      ].join("\n")
    );
    return;
  }

  QUEUES[queueName].obliterate({ force: true });
  process.exit();
})();
