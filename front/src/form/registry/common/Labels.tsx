import React from "react";

export const Labels = {
  reportForRecepisseIsExempted: (
    <div>
      Le transporteur déclare être exempté de récépissé conformément aux
      dispositions de l'
      <a
        className="fr-link force-external-link-content force-underline-link"
        target="_blank"
        rel="noreferrer"
        href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000046669839"
      >
        article R.541-50 du code de l'environnement
      </a>
    </div>
  ),
  wastePop: (
    <span>
      Le déchet contient des{" "}
      <a
        className="fr-link force-external-link-content force-underline-link"
        href="https://www.ecologique-solidaire.gouv.fr/polluants-organiques-persistants-pop"
        target="_blank"
        rel="noopener noreferrer"
      >
        polluants organiques persistants
      </a>
    </span>
  ),
  wasteIsDangerous: (
    <span>
      Le déchet est{" "}
      <a
        className="fr-link force-external-link-content force-underline-link"
        href="https://www.ecologie.gouv.fr/dechets-dangereux"
        target="_blank"
        rel="noopener noreferrer"
      >
        dangereux
      </a>
    </span>
  ),
  publicId: "Identifiant unique",
  receptionDate: "Date de réception",
  managingStartDate: "Date d'acquisition",
  managingEndDate: "Date de fin de gestion",
  dispatchDate: "Date d'expédition",
  useDate: "Date d'utilisation",
  processingDate: "Date de traitement",
  processingEndDate: "Date de fin de traitement",
  collectionDate: "Date d'enlèvement",
  unloadingDate: "Date de déchargement",
  wasteDescription: "Dénomination usuelle du déchet",
  wasteCodeBale: "Code déchet Bâle",
  wasteDap: "DAP",
  weighingHour: "Heure de pesée",
  ttdImportNumber: "Numéro de notification ou de déclaration d'import",
  movementNumber: "Numéro de mouvement",
  isDirectSupply: "Approvisionnement direct (pipeline, convoyeur)",
  sisIdentifier: "Identifiant SIS du terrain",
  isUpcycled: "Terres valorisées",
  gistridNumber: "Numéro de notification ou de déclaration GISTRID",
  product: "Produit",
  administrativeActReference: "Référence de l'acte administratif",
  brokerRecepisseNumber: "Numéro de récépissé",
  traderRecepisseNumber: "Numéro de récépissé"
};
