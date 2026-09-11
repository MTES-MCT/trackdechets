export type FluidesFrigorigenesContainer = {
  id: string;
  number: string;
  wasteCode: string;
  volumeLiters?: number;
  weightKg: number;
};
export type FluidesFrigorigenesIntervention = {
  id: string;
  number: string;
  wasteCodes: string[];
  equipmentHolder: string;
  weightKg: number;
  interventionDate?: string;
  isAssociated: boolean;
  containers: FluidesFrigorigenesContainer[];
};
export type FluidesFrigorigenesFilters = {
  wasteCodes: string[];
  equipmentHolders: string[];
};
export type FluidesFrigorigenesDataState =
  | { status: "loading" }
  | { status: "missingSiret" }
  | { status: "serviceError" }
  | { status: "credentialsError" }
  | { status: "unknownSiret" }
  | { status: "success"; interventions: FluidesFrigorigenesIntervention[] };

export const filterInterventions = (
  items: FluidesFrigorigenesIntervention[],
  filters: FluidesFrigorigenesFilters
) =>
  items.filter(
    item =>
      !item.isAssociated &&
      (!filters.wasteCodes.length ||
        item.wasteCodes.some(code => filters.wasteCodes.includes(code))) &&
      (!filters.equipmentHolders.length ||
        filters.equipmentHolders.includes(item.equipmentHolder))
  );
export const getSelectedWasteCodes = (
  items: FluidesFrigorigenesIntervention[],
  selectedIds: string[]
) => items.find(({ id }) => selectedIds.includes(id))?.wasteCodes;
export const isInterventionSelectable = (
  item: FluidesFrigorigenesIntervention,
  selectedWasteCodes?: string[]
) =>
  item.wasteCodes.length > 0 &&
  (!selectedWasteCodes?.length ||
    (item.wasteCodes.length === selectedWasteCodes.length &&
      item.wasteCodes.every(code => selectedWasteCodes.includes(code))));
