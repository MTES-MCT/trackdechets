import { indexElasticSearch } from "./indexElasticSearch.helpers";
import { index } from "../../common/elastic";
import { closeQueues } from "../../queue/producers";

(async function () {
  const force = process.argv.includes("-f");
  await indexElasticSearch({ force, index });
  await closeQueues();
})();
