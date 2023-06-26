import prisma from "../../../prisma";
import { UserInputError } from "apollo-server-express";
import { BsdasriStatus, BsdasriType, Bsdasri } from "@prisma/client";
import { DASRI_GROUPING_OPERATIONS_CODES } from "../../../common/constants";
import { getReadonlyBsdasriRepository } from "../../repository";
import { CompanyInput } from "../../../generated/graphql/types";

export const getEligibleDasrisForSynthesis = async (
  synthesizingIds: string[],
  bsdasri: Bsdasri | null,
  company?: CompanyInput | null
): Promise<Bsdasri[]> => {
  if (!synthesizingIds) {
    return [];
  }
  if (!synthesizingIds.length) {
    return [];
  }

  const bsdasriReadonlyRepository = getReadonlyBsdasriRepository();
  // retrieve dasris:
  // whose id is in synthesizingIds array
  // which are in SENT status
  // wich are of SIMPLE type
  // which are not already grouped, grouping, synthesized or synthesizing
  // whose recipient in current transporter
  const found = await bsdasriReadonlyRepository.findMany({
    id: { in: synthesizingIds },
    status: BsdasriStatus.SENT,
    type: BsdasriType.SIMPLE,
    groupedIn: null,
    grouping: { none: {} },
    synthesizedIn: null,
    synthesizing: { none: {} },
    OR: [
      {
        transporterCompanySiret: bsdasri
          ? bsdasri.transporterCompanySiret
          : company?.siret
      },
      {
        transporterCompanyVatNumber: bsdasri
          ? bsdasri.transporterCompanyVatNumber
          : company?.vatNumber
      }
    ]
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

  return found;
};

export const checkDasrisAreGroupable = async (
  groupingIds: string[],
  emitterSiret: string | null | undefined
) => {
  if (!emitterSiret) {
    throw new UserInputError(
      `Impossible de créer un bordereau de groupement sans préciser l'émetteur.`
    );
  }
  if (!groupingIds) {
    return;
  }
  if (!groupingIds.length) {
    return;
  }
  const bsdasriReadonlyRepository = getReadonlyBsdasriRepository();

  // retrieve dasris:
  // whose id is in regroupedBsdasrisIds array
  // which are in PROCESSED status
  // whose destinationOperationCode is either D12 or  R12
  // wich are of SIMPLE type
  // which are not already grouped, grouping, synthesized or synthesizing
  // whose recipient in current emitter
  const found = await bsdasriReadonlyRepository.findMany(
    {
      id: { in: groupingIds },
      destinationOperationCode: { in: DASRI_GROUPING_OPERATIONS_CODES },
      status: BsdasriStatus.AWAITING_GROUP,
      type: BsdasriType.SIMPLE,
      groupedIn: null,
      grouping: { none: {} },
      synthesizedIn: null,
      synthesizing: { none: {} },
      destinationCompanySiret: emitterSiret
    },
    { select: { id: true } }
  );
  const foundIds = found.map(el => el.id);
  const diff = groupingIds.filter(el => !foundIds.includes(el));

  if (!!diff.length) {
    throw new UserInputError(
      `Les dasris suivants ne peuvent pas être inclus dans un bordereau de groupement ${diff.join()}`
    );
  }
};

export const emitterIsAllowedToGroup = async (
  emitterSiret: string | null | undefined
) => {
  if (!emitterSiret) {
    throw new UserInputError(
      `Aucun siret émetteur, impossible de créer un bordereau de regroupement`
    );
  }
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
type dbPackaging = {
  type: string;
  other?: string;
  quantity: number;
  volume: number;
};
/**
 * Aggregate packagings from several bsds and sum their volume an quantity by container type
 */
export const aggregatePackagings = (dasrisToAssociate: Bsdasri[]) => {
  const packagingsArray = dasrisToAssociate.map(dasri =>
    Array.isArray(dasri.transporterWastePackagings)
      ? <dbPackaging[]>dasri.transporterWastePackagings
      : []
  );

  return packagingsArray.reduce((prev, cur) => {
    for (const packaging of cur) {
      const found = prev.find(
        item =>
          item.type === packaging.type &&
          item.other === packaging.other &&
          item.volume === packaging.volume
      );
      if (found) {
        found.quantity += packaging.quantity;
      } else {
        prev.push(packaging);
      }
    }
    return prev;
  }, []);
};
