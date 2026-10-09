export type BsffDetenteurIdentity = {
  company?: {
    name?: string | null;
    siret?: string | null;
    orgId?: string | null;
    address?: string | null;
  } | null;
  isPrivateIndividual?: boolean | null;
};

export const hasBsffInitialValue = (value: unknown) =>
  value != null && (typeof value !== "string" || value.trim() !== "");

export const normalizeBsffDetenteurIdentity = (value?: string | null) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Existing BSFF identity rule: identifier, otherwise normalized name + address. */
export const getDetenteurKey = (
  detenteur: BsffDetenteurIdentity
): string | null => {
  const identifier =
    detenteur.company?.siret?.trim() || detenteur.company?.orgId?.trim();
  if (identifier) return `siret:${identifier}`;
  const name = normalizeBsffDetenteurIdentity(detenteur.company?.name);
  const address = normalizeBsffDetenteurIdentity(detenteur.company?.address);
  if (!name && !address) return null;
  return `private:${name}|${address}`;
};

/** Match a partial historical identity without treating a newly completed field as a different holder. */
export const matchesInitialDetenteur = (
  initial: BsffDetenteurIdentity,
  candidate: BsffDetenteurIdentity
) => {
  if (getDetenteurKey(initial) === null) return false;
  if (
    initial.isPrivateIndividual != null &&
    initial.isPrivateIndividual !== candidate.isPrivateIndividual
  )
    return false;
  return (["siret", "orgId", "name", "address"] as const).every(field => {
    const value = normalizeBsffDetenteurIdentity(initial.company?.[field]);
    return (
      !value ||
      value === normalizeBsffDetenteurIdentity(candidate.company?.[field])
    );
  });
};

/** Refuse ambiguous historical matches instead of choosing the first namesake. */
export function findInitialDetenteurCompletion<T extends BsffDetenteurIdentity>(
  holder: BsffDetenteurIdentity,
  initial: BsffDetenteurIdentity[],
  candidates: T[]
): T | undefined {
  const key = getDetenteurKey(holder);
  if (key === null) return undefined;
  const exact = candidates.filter(
    candidate => getDetenteurKey(candidate) === key
  );
  if (exact.length) return exact.length === 1 ? exact[0] : undefined;
  const compatible = candidates.filter(candidate =>
    matchesInitialDetenteur(holder, candidate)
  );
  if (compatible.length !== 1) return undefined;
  const candidate = compatible[0];
  const owners = initial.filter(source =>
    matchesInitialDetenteur(source, candidate)
  );
  return owners.length === 1 ? candidate : undefined;
}

/** Existing backend deduplication: first occurrence, stable order, empty identities kept. */
export const uniqueDetenteurs = <T extends BsffDetenteurIdentity>(
  holders: T[]
): T[] => {
  const seen = new Set<string>();
  return holders.filter(holder => {
    const key = getDetenteurKey(holder);
    if (key === null) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/** Extend the existing deduplication by collecting every known source field. */
export function mergeInitialDetenteurs<T extends BsffDetenteurIdentity>(
  holders: T[]
): T[] {
  return uniqueDetenteurs(holders).map(holder => {
    const key = getDetenteurKey(holder);
    const versions =
      key === null
        ? [holder]
        : holders.filter(source => getDetenteurKey(source) === key);
    const company = { ...holder.company };
    for (const source of versions) {
      for (const [field, value] of Object.entries(source.company ?? {})) {
        if (
          !hasBsffInitialValue((company as Record<string, unknown>)[field]) &&
          hasBsffInitialValue(value)
        ) {
          Object.assign(company, { [field]: value });
        }
      }
    }
    return {
      ...holder,
      company,
      isPrivateIndividual:
        holder.isPrivateIndividual ??
        versions.find(source => source.isPrivateIndividual != null)
          ?.isPrivateIndividual
    };
  });
}
