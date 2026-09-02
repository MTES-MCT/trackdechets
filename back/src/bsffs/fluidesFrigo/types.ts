export type FluidesFrigoGetCerfaParams = {
  siret: string;
  debut?: string;
  fin?: string;
  identifiantBouteille?: string;
};

export interface RestUtilisationBouteilleRecuperation {
  bouteilleId: string;
  bouteilleIdentification: string;
  capaciteUtilisee: number;
  inflammable: boolean;
  codeUN: string;
}

export interface RestCerfa {
  siret: string;
  ficheInterventionNumero: string;
  operateur: {
    nom: string;
    siret: string;
  };
  detenteur: {
    nom: string;
    siret: string;
    adresseCerfa?: {
      adresse: string;
      codePostal: string;
      ville: string;
    };
  };
  dateSignatureTechnicien?: string;
  signatureDetenteur?: {
    dateSignature: string;
  };
  bouteilleRecuperations: RestUtilisationBouteilleRecuperation[];
  quantiteTotalRecuperation?: string;
  quantitéTotalRecuperation?: string;
}

export interface BsffOperateurDraft {
  ficheInterventionNumero: string;
  dateIntervention: string | null;
  dechets: Array<{
    bouteilleId: string;
    bouteilleIdentification: string;
    codeDechet: string;
    poidsFluide: number;
    volumeContenant: null;
    mentionADR: string | null;
  }>;
  detenteur: {
    siret: string;
    nom: string;
    adresse?: string;
  };
  operateur: {
    siret: string;
    nom: string;
  };
  sourceData: "fluides_frigo";
  ffFicheId: string;
  quantiteTotalRecuperation?: string;
}
