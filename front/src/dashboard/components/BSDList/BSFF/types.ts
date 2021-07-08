import { BsffStatus } from "generated/graphql/types";

export interface BsffFragment {
  id: string;
  bsffStatus: BsffStatus;
  bsffEmitter?: {
    company?: {
      siret?: string;
      name?: string;
    };
  };
  bsffTransporter?: {
    company?: {
      siret?: string;
      name?: string;
    };
  };
  bsffDestination?: {
    company?: {
      siret?: string;
      name?: string;
    };
  };
  waste?: {
    code?: string;
    nature?: string;
  };
}
