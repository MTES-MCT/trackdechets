import { indexElasticSearch } from "./indexElasticSearch.helpers";
import { index } from "../../common/elastic";

(async function () {
  const force = process.argv.includes("-f");
  await indexElasticSearch({ force, index });
})();
