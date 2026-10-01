import { CompanyPrivate, CompanyType } from "@td/codegen-ui";
import { ZodBsffGroupingOrForwarding } from "../schema";

export type ReconditioningContainer = ZodBsffGroupingOrForwarding & {
  weight?: number | null;
  bsff: ZodBsffGroupingOrForwarding["bsff"] & {
    waste?: { code?: string | null } | null;
  };
};

export const filterReconditioningCompanies = (companies: CompanyPrivate[]) =>
  companies.filter(company =>
    company.companyTypes.includes(CompanyType.Collector)
  );

export const getReconditioningWasteCode = (
  container: ReconditioningContainer
) =>
  container.acceptation?.wasteCode ??
  container.bsff.waste?.code ??
  container.waste?.code;

export function canAddReconditioningContainer(
  selected: ReconditioningContainer[],
  container: ReconditioningContainer
) {
  const selectedWasteCode =
    selected[0] && getReconditioningWasteCode(selected[0]);
  return (
    !selected.some(item => item.id === container.id) &&
    (!selected.length ||
      getReconditioningWasteCode(container) === selectedWasteCode)
  );
}

export function addReconditioningContainer(
  selected: ReconditioningContainer[],
  container: ReconditioningContainer
) {
  return canAddReconditioningContainer(selected, container)
    ? [...selected, container]
    : selected;
}
