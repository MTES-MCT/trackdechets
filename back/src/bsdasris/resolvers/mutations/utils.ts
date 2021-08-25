import prisma from "../../../prisma";
import { UserInputError } from "apollo-server-express";
import { BsdasriType } from "@prisma/client";
import { DASRI_GROUPING_OPERATIONS_CODES } from "../../../common/constants";

type AssociationType = "group" | "synthesis";

type X = {
  id?: string;
};
export const checkDasrisAreAssociable = async ({
  bsdasrisToAssociate,
  emitterSiret,
  associationType
}: {
  bsdasrisToAssociate: Array<X>;
  emitterSiret: string;
  associationType: AssociationType;
}) => {
  if (!bsdasrisToAssociate) {
    return;
  }
  if (!bsdasrisToAssociate.length) {
    return;
  }

  const bsdasrisToAssociateIds = bsdasrisToAssociate.map(dasri => dasri.id);
  // retrieve dasris:
  // whose id is in regroupedBsdasrisIds array
  // which are in PROCESSED status
  // whose processingOperation is either D12 or  R12
  // which are not already grouped on an initial dasri
  // which are not already synthesized on an initial dasri
  // which are not regrouping other dasris
  // which are not synthesizing other dasris
  // whose recipient in current emitter
  const regroupable = await prisma.bsdasri.findMany({
    where: {
      id: { in: bsdasrisToAssociateIds },
      ...(associationType === "group" && {
        processingOperation: { in: DASRI_GROUPING_OPERATIONS_CODES },
        status: "PROCESSED"
      }),
      bsdasriType: "SIMPLE",

      regroupedOnBsdasri: null,
      regroupedBsdasris: { none: {} },
      synthesizedOnBsdasri: null,
      synthesizedBsdasris: { none: {} },
      recipientCompanySiret: emitterSiret
    },
    select: { id: true }
  });

  const regroupableIds = regroupable.map(el => el.id);
  const diff = bsdasrisToAssociateIds.filter(
    el => !regroupableIds.includes(el)
  );

  if (!!diff.length) {
    throw new UserInputError(
      `Les dasris suivants ne peuvent pas être associés à un bordereau de ${
        associationType === "group" ? "groupement" : "synthèse"
      }: ${diff.join()}`
    );
  }
};

export const emitterIsAllowedToGroup = async emitterSiret => {
  const emitterCompany = await prisma.company.findUnique({
    where: { siret: emitterSiret }
  });

  if (!emitterCompany?.companyTypes.includes("COLLECTOR")) {
    throw new UserInputError(
      `Le siret de l'émetteur n'est pas autorisé à regrouper des dasris`
    );
  }
};

/**
 *
 * get dasri type for creation and update mutations
 */
export const getBsdasriType = (
  isRegrouping: boolean,
  isSynthesizing: boolean
): BsdasriType => {
  if (isRegrouping) {
    return BsdasriType.GROUPING;
  }
  if (isSynthesizing) {
    return BsdasriType.SYNTHESIS;
  }
  return BsdasriType.SIMPLE;
};
