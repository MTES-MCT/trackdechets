import { indexElasticSearch } from "./indexElasticSearch.helpers";
import { index } from "../../common/elastic";
import { closeQueues } from "../../queue/producers";

(async function () {
  const force = process.argv.includes("-f");
  try {
    await indexElasticSearch({ force, index });
  } catch (error) {
    console.error("ES indexation failed, error:", error);
  } finally {
    await closeQueues();
  }
})();
