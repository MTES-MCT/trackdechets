import { FormForElastic } from "../../../forms/elastic";
import { BsdasriForElastic } from "../../../bsdasris/elastic";
import { BsvhuForElastic } from "../../../bsvhu/elastic";
import { BsdaForElastic } from "../../../bsda/elastic";
import { BsffForElastic } from "../../../bsffs/elastic";
import { BspaohForElastic } from "../../../bspaoh/elastic";
// complete Typescript example:
// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/6.x/_a_complete_example.html
export interface SearchResponse<T> {
  hits: {
    total: {
      value: number;
    };
    hits: Array<{
      _source: T;
    }>;
  };
}

export interface GetResponse<T> {
  _source: T;
}

export type PrismaBsdMap = {
  bsdds: FormForElastic[];
  bsdasris: BsdasriForElastic[];
  bsvhus: BsvhuForElastic[];
  bsdas: BsdaForElastic[];
  bsffs: BsffForElastic[];
  bspaohs: BspaohForElastic[];
};
