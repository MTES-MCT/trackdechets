import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getDasriOrDasriNotFound } from "../../database";
import { expandDasriFromDb } from "../../dasri-converter";
import { checkIsDasriContributor } from "../../permissions";

import dasriTransition from "../../workflow/dasriTransition";
import { DasriEventType } from "../../workflow/types";
import { okForSealedFormSchema } from "../../validation";
const markAsReadyResolver: MutationResolvers["dasriMarkAsReady"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);
  const dasri = await getDasriOrDasriNotFound({ id });
  await checkIsDasriContributor(user, dasri, "nope");

  const sealedDasri = await dasriTransition(
    dasri,
    {
      type: DasriEventType.MarkAsReady
    },
    okForSealedFormSchema
  );

  return expandDasriFromDb(sealedDasri);
};

export default markAsReadyResolver;
