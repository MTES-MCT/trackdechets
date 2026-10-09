type DetenteurLike = {
  company?: {
    name?: string | null;
    siret?: string | null;
    address?: string | null;
  } | null;
  isPrivateIndividual?: boolean | null;
};

const normalize = (value?: string | null) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/**
 * Clé d'identité d'un détenteur :
 * - entreprise : son SIRET ;
 * - particulier (pas de SIRET) : nom + adresse normalisés ;
 * - `null` si le détenteur est totalement vide (on ne le dédoublonne pas).
 */
export const getDetenteurKey = (detenteur: DetenteurLike): string | null => {
  const siret = detenteur.company?.siret?.trim();
  if (siret) return `siret:${siret}`;

  const name = normalize(detenteur.company?.name);
  const address = normalize(detenteur.company?.address);
  if (!name && !address) return null;

  return `private:${name}|${address}`;
};

/**
 * RG9 : lors d'un reconditionnement, les détenteurs des contenants sources
 * sont repris sur le nouveau contenant, sans doublon (la première occurrence
 * est conservée, l'ordre est préservé).
 */
export const uniqueDetenteurs = <T extends DetenteurLike>(
  detenteurs: T[]
): T[] => {
  const seen = new Set<string>();
  return detenteurs.filter(detenteur => {
    const key = getDetenteurKey(detenteur);
    if (key === null) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
