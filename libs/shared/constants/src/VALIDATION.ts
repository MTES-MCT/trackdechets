export const SSTI_CHARS = ["{", "}", "%", "<", ">", "$", `"`, "="]; // single quote removed

export function isValidWebsite(s: string): boolean {
  try {
    const url = new URL(s);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

export const MIN_DATE_FOR_REGISTRY = {
  years: 1,
  months: 6
};

// Dérogation temporaire à la limite de 18 mois pour la saisie/modification
// dans les registres, accordée à certains SIRET le temps qu'ils se mettent
// en conformité sur demande de leur DREAL (validation DGPR).
// Reprend le mécanisme de liste de SIRET exemptés mis en place pour
// permettre la saisie à plus de 18 mois, borné dans le temps.
export const TEMPORARY_REGISTRY_DATE_LIMIT_EXEMPTION_SIRETS = [
  "25270386300024", // PRECOVAL - Malleville-sur-le-Bec (27)
  "48118481000010" // Les Champs Jouault - Cuves (50)
];

export const TEMPORARY_REGISTRY_DATE_LIMIT_EXEMPTION_END_DATE = new Date(
  "2026-12-31T23:59:59.999+01:00"
);

export function isSiretExemptFromRegistryDateLimit(
  siret: string,
  now: Date = new Date()
): boolean {
  return (
    TEMPORARY_REGISTRY_DATE_LIMIT_EXEMPTION_SIRETS.includes(siret) &&
    now <= TEMPORARY_REGISTRY_DATE_LIMIT_EXEMPTION_END_DATE
  );
}
