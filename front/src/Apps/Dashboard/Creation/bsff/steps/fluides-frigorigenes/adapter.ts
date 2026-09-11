import { FluidesFrigorigenesDto } from "./api";
import { FluidesFrigorigenesIntervention } from "./model";

export function adaptFluidesFrigorigenesIntervention(
  dto: FluidesFrigorigenesDto
): FluidesFrigorigenesIntervention {
  const wasteCodes = [
    ...new Set(dto.dechets.map(({ codeDechet }) => codeDechet))
  ].sort((a, b) => a.localeCompare(b));

  return {
    id: dto.ffFicheId,
    number: dto.ficheInterventionNumero,
    wasteCodes,
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
      wasteCode: container.codeDechet,
      weightKg: container.poidsFluide,
      volumeLiters: container.volumeContenant ?? undefined
    }))
  };
}
