import { CompanyPrivate, CompanyType } from "@td/codegen-ui";
import { hasBsffInitialValue } from "@td/constants";
import { ZodBsffGroupingOrForwarding } from "../schema";

const firstPresent = (...values: (string | null | undefined)[]) =>
  values.find(hasBsffInitialValue);

export const getInitialWaste = (container?: ReconditioningContainer) => ({
  code: firstPresent(
    container?.acceptation?.wasteCode,
    container?.bsff?.waste?.code,
    container?.waste?.code
  ),
  description: firstPresent(
    container?.acceptation?.wasteDescription,
    container?.bsff?.waste?.description,
    container?.waste?.description
  ),
  adr: firstPresent(container?.bsff?.waste?.adr, container?.waste?.adr)
});

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
) => getInitialWaste(container).code;

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

/** Mapping already used by the grouping selector; preserve historical omissions. */
export function getGroupingPackagings(
  selected: ReconditioningContainer[],
  current: {
    id?: string | null;
    type?: ReconditioningContainer["type"];
    numero?: string | null;
    other?: string | null;
    weight?: number | null;
    volume?: number | null;
    previousBsffs?: { id: string }[] | null;
  }[] = []
) {
  return selected.map(container => {
    const numbered = current.filter(
      p =>
        p.numero === container.numero &&
        (!p.id || Boolean(p.previousBsffs?.length)) &&
        (!p.previousBsffs?.length ||
          p.previousBsffs.some(bsff => bsff.id === container.bsff?.id))
    );
    const previous =
      current.find(p => p.id === container.id) ??
      (numbered.length === 1 ? numbered[0] : undefined);
    return {
      id: container.id,
      type: container.type ?? previous?.type ?? null,
      other: firstPresent(container.other, previous?.other) ?? null,
      numero: firstPresent(container.numero, previous?.numero) ?? "",
      volume: container.volume ?? previous?.volume ?? null,
      weight:
        container.acceptation?.weight ??
        container.weight ??
        previous?.weight ??
        null
    };
  });
}
