import { sendMailJob } from "./jobs";
import { mailQueue } from "./producers/mail";
import { syncEventsQueue } from "./producers/events";
import {
  favoritesCompanyQueue,
  geocodeCompanyQueue,
  setCompanyDepartementQueue
} from "./producers/company";
import { geocodeJob } from "./jobs/geocode";
import { setDepartementJob } from "./jobs/setDepartement";
import { syncEventsJob } from "./jobs/syncEvents";
import { indexFavoritesJob } from "./jobs/indexFavorites";

function startConsumers() {
  console.info(`General queues consumers started`);

  mailQueue.process(sendMailJob);
  geocodeCompanyQueue.process(geocodeJob);
  setCompanyDepartementQueue.process(setDepartementJob);
  favoritesCompanyQueue.process(indexFavoritesJob);
  syncEventsQueue.process(syncEventsJob);
}

startConsumers();
