import { BsdIndexationConfig } from "../../common/elastic";

export type IndexElasticSearchOpts = {
  index?: BsdIndexationConfig;
  force?: boolean;
  useQueue?: boolean;
};

export type IndexAllFnSignature = {
  bsdName: string;
  index: string;
  since?: Date;
  indexConfig: BsdIndexationConfig;
};

export type FindManyAndIndexBsdsFnSignature = {
  bsdName: string;
  index: string;
  ids: string[];
  elasticSearchUrl: string;
};
