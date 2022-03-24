import prisma from "../../../prisma";
import { UserInputError } from "apollo-server-express";
import { BsdasriStatus, BsdasriType } from "@prisma/client";
import { DASRI_GROUPING_OPERATIONS_CODES } from "../../../common/constants";

export const checkDasrisAreEligibleForSynthesis = async (
  synthesizingIds,
  emitterSiret
) => {
  if (!synthesizingIds) {
    return;
  }
  if (!synthesizingIds.length) {
    return;
  }
  // retrieve dasris:
  // whose id is in synthesizingIds array
  // which are in SENT status
  // wich are of SIMPLE type
  // which are not already grouped, grouping, synthesized or synthesizing
  // whose recipient in current transporter
  const found = await prisma.bsdasri.findMany({
    where: {
      id: { in: synthesizingIds },
      status: BsdasriStatus.SENT,
      type: BsdasriType.SIMPLE,
      groupedIn: null,
      grouping: { none: {} },
      synthesizedIn: null,
      synthesizing: { none: {} },
      transporterCompanySiret: emitterSiret
    },
    select: { id: true }
  });

  const foundIds = found.map(el => el.id);
  const diff = synthesizingIds.filter(el => !foundIds.includes(el));

  if (!!diff.length) {
    throw new UserInputError(
      [
        `Les dasris suivants ne peuvent pas être inclus dans un bordereau de synthèse ${diff.join()}`,
        `Les dasris éligibles doivent être des bsd simples, `,
        `pris en charge par le transporteur qui effectue le regroupement, `,
        `et ne pas déjà faire partie d'un autre bsd de groupement ou de synthèse`
      ].join("\n")
    );
  }
};

export const checkDasrisAreGroupable = async (groupingIds, emitterSiret) => {
  if (!groupingIds) {
    return;
  }
  if (!groupingIds.length) {
    return;
  }

  // retrieve dasris:
  // whose id is in regroupedBsdasrisIds array
  // which are in PROCESSED status
  // whose destinationOperationCode is either D12 or  R12
  // wich are of SIMPLE type
  // which are not already grouped, grouping, synthesized or synthesizing
  // whose recipient in current emitter
  const found = await prisma.bsdasri.findMany({
    where: {
      id: { in: groupingIds },
      destinationOperationCode: { in: DASRI_GROUPING_OPERATIONS_CODES },
      status: BsdasriStatus.PROCESSED,
      type: BsdasriType.SIMPLE,
      groupedIn: null,
      grouping: { none: {} },
      synthesizedIn: null,
      synthesizing: { none: {} },
      destinationCompanySiret: emitterSiret
    },
    select: { id: true }
  });
  const foundIds = found.map(el => el.id);
  const diff = groupingIds.filter(el => !foundIds.includes(el));

  if (!!diff.length) {
    throw new UserInputError(
      `Les dasris suivants ne peuvent pas être inclus dans un bordereau de groupement ${diff.join()}`
    );
  }
};

export const emitterIsAllowedToGroup = async (emitterSiret: string) => {
  const emitterCompany = await prisma.company.findUnique({
    where: { siret: emitterSiret }
  });
  if (!emitterCompany?.companyTypes.includes("COLLECTOR")) {
    throw new UserInputError(
      `Le siret de l'émetteur n'est pas autorisé à regrouper des dasris`
    );
  }
};

export const emitterBelongsToUserSirets = async (
  emitterSiret: string,
  userSirets: string[]
) => {
  if (!userSirets.includes(emitterSiret)) {
    throw new UserInputError(`Le siret de l'émetteur doit être un des vôtres`);
  }
};
