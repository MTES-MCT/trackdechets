import { FluidesFrigorigenesDto } from "./api";
import { FluidesFrigorigenesIntervention } from "./model";

export class FluidesFrigorigenesContractError extends Error {}

export function adaptFluidesFrigorigenesIntervention(
  dto: FluidesFrigorigenesDto
): FluidesFrigorigenesIntervention {
  const wasteCodes = [
    ...new Set(dto.dechets.map(({ codeDechet }) => codeDechet))
  ];

  if (wasteCodes.length !== 1) {
    throw new FluidesFrigorigenesContractError(
      `La fiche ${dto.ficheInterventionNumero} doit contenir un seul code déchet.`
    );
  }

  return {
    id: dto.ffFicheId,
    number: dto.ficheInterventionNumero,
    wasteCode: wasteCodes[0],
    equipmentHolder: dto.detenteur.nom,
    weightKg: dto.dechets.reduce(
      (total, { poidsFluide }) => total + poidsFluide,
      0
    ),
    interventionDate: dto.dateIntervention?.slice(0, 10),
    isAssociated: dto.associatedBsffIds.length > 0,
    containers: dto.dechets.map(container => ({
      id: container.bouteilleId,
      number: container.bouteilleIdentification,
      weightKg: container.poidsFluide,
      volumeLiters: container.volumeContenant ?? undefined
    }))
  };
}
