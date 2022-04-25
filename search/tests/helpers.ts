import { elasticSearchClient } from "../src/common/elastic";
import { INDEX_NAME_INSEE_PREFIX } from "../src/indexation/indexInsee.helpers";


export function refreshElasticSearch() {
  return elasticSearchClient.indices.refresh();
}


export async function resetDatabase() {
  const indices = await elasticSearchClient.cat.indices({
    index: `${INDEX_NAME_INSEE_PREFIX}*`,
    format: "json"
  });

  const indicesNames: string[] = indices.body
    .map((info: { index: string }) => info.index);
  if (indicesNames.length) {
    await elasticSearchClient.indices.delete({ index: indicesNames.join(",") });
  }
}
