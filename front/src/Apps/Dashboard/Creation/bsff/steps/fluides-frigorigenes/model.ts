export type FluidesFrigorigenesContainer = {
  id: string;
  number: string;
  wasteCode: string;
  adr?: string;
  volumeLiters?: number;
  weightKg: number;
};
export type FluidesFrigorigenesHolder = {
  siret: string;
  name: string;
  address?: string;
  postalCode?: string;
  city?: string;
};
export type FluidesFrigorigenesIntervention = {
  id: string;
  number: string;
  wasteCodes: string[];
  equipmentHolder: string;
  holder: FluidesFrigorigenesHolder;
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
  item.wasteCodes.length === 1 &&
  (!selectedWasteCodes?.length ||
    (selectedWasteCodes.length === 1 &&
      item.wasteCodes[0] === selectedWasteCodes[0]));
