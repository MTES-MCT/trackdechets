export type FluidesFrigorigenesContainer = { id: string; number: string; volumeLiters?: number; weightKg: number };
export type FluidesFrigorigenesIntervention = { id: string; number: string; wasteCode: string; equipmentHolder: string; weightKg: number; interventionDate?: string; isAssociated: boolean; containers: FluidesFrigorigenesContainer[] };
export type FluidesFrigorigenesFilters = { wasteCodes: string[]; equipmentHolders: string[]; association: Array<"yes" | "no"> };
export type FluidesFrigorigenesDataState = { status: "loading" } | { status: "serviceError" } | { status: "unknownSiret" } | { status: "success"; interventions: FluidesFrigorigenesIntervention[] };

export const filterInterventions = (items: FluidesFrigorigenesIntervention[], filters: FluidesFrigorigenesFilters) =>
  items.filter(item => (!filters.wasteCodes.length || filters.wasteCodes.includes(item.wasteCode)) && (!filters.equipmentHolders.length || filters.equipmentHolders.includes(item.equipmentHolder)) && (!filters.association.length || filters.association.includes(item.isAssociated ? "yes" : "no")));
export const getSelectedWasteCode = (items: FluidesFrigorigenesIntervention[], selectedIds: string[]) => items.find(({ id }) => selectedIds.includes(id))?.wasteCode;
export const isInterventionSelectable = (item: FluidesFrigorigenesIntervention, selectedWasteCode?: string) => !selectedWasteCode || item.wasteCode === selectedWasteCode;
