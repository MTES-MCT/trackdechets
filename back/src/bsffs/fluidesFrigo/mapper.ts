import { BsffOperateurDraft, RestCerfa } from "./types";

function formatAddress(
  address?: RestCerfa["detenteur"]["adresseCerfa"]
): string | undefined {
  if (!address) {
    return undefined;
  }
  return `${address.adresse}, ${address.codePostal} ${address.ville}`;
}

function getQuantiteTotalRecuperation(cerfa: RestCerfa): string | undefined {
  return (
    cerfa.quantiteTotalRecuperation ??
    cerfa["quantitéTotalRecuperation"] ??
    undefined
  );
}

export function mapCerfaToBsffOperateurDraft(
  cerfa: RestCerfa
): BsffOperateurDraft {
  return {
    ficheInterventionNumero: cerfa.ficheInterventionNumero,
    dateIntervention:
      cerfa.dateSignatureTechnicien ??
      cerfa.signatureDetenteur?.dateSignature ??
      null,
    dechets: (cerfa.bouteilleRecuperations ?? []).map(bouteille => ({
      bouteilleId: bouteille.bouteilleId,
      bouteilleIdentification: bouteille.bouteilleIdentification,
      // ✅ CORRIGÉ : Déduit de inflammable
      codeDechet: bouteille.inflammable ? "16 04 05*" : "14 06 01*",
      poidsFluide: bouteille.capaciteUtilisee,
      volumeContenant: null,
      // ✅ CORRIGÉ : Calculé basé sur inflammable + codeUN
      mentionADR:
        bouteille.inflammable && bouteille.codeUN
          ? `ADR ${bouteille.codeUN}`
          : null
    })),
    detenteur: {
      siret: cerfa.detenteur.siret,
      nom: cerfa.detenteur.nom,
      adresse: formatAddress(cerfa.detenteur.adresseCerfa)
    },
    operateur: {
      siret: cerfa.operateur.siret,
      nom: cerfa.operateur.nom
    },
    sourceData: "fluides_frigo",
    ffFicheId: cerfa.ficheInterventionNumero,
    quantiteTotalRecuperation: getQuantiteTotalRecuperation(cerfa)
  };
}
