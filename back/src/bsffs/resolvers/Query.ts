import { QueryResolvers } from "../../generated/graphql/types";
import bsff from "./queries/bsff";
import bsffPdf from "./queries/bsffPdf";
import bsffs from "./queries/bsffs";
import bsffPackagings from "./queries/bsffPackagings";
import bsffPackaging from "./queries/bsffPackaging";

export const Query: QueryResolvers = {
  bsff,
  bsffPdf,
  bsffs,
  bsffPackagings,
  bsffPackaging
};
