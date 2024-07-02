import {
  postGericoJob,
  gericoQueue,
  SEND_GERICO_API_REQUEST_JOB_NAME
} from "back";

function startGericoConsumers() {
  console.info(`Gerico queue consumers started`);

  gericoQueue.process(SEND_GERICO_API_REQUEST_JOB_NAME, postGericoJob);
}

startGericoConsumers();
