import { index } from "../../common/elastic";
import { indexElasticSearch } from "../../scripts/bin/indexElasticSearch.helpers";

export async function indexAllBsdJob() {
  try {
    // will index all BSD without downtime, only if need because of a mapping change
    await indexElasticSearch({
      index
    });
  } catch (error) {
    throw new Error(`Error in job re-indexing off all BSDs : ${error}`);
  }
}
