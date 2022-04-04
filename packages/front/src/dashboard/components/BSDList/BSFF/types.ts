import { BsffStatus } from "@trackdechets/codegen/src/front.gen";

export interface BsffFragment {
  id: string;
  isDraft: boolean;
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
    description?: string;
  };
}
