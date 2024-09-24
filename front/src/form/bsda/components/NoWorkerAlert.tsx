import React from "react";
import Alert from "@codegouvfr/react-dsfr/Alert";

// Dispositions permettant de cochant la case d'absence d'entreprise de travaux

const title =
  "Attention, vous devez mentionner l'entreprise qui a effectué" +
  " les travaux sur des matériaux ou produits contenant de l'amiante (MPCA)";

const faqLink =
  "https://faq.trackdechets.fr/amiante/informations-generales/" +
  "questions-frequentes#dans-quel-cas-je-peux-cocher-il-ny-a-pas-dentreprise-de-travaux";

const description = (
  <div>
    En effet, conformément aux dispositions du code du travail, vous êtes tenus,
    lorsque vous faites appel à une entreprise SS3 pour des travaux de retrait
    ou d’encapsulage de MPCA ou à une entreprise SS4 pour une intervention
    susceptible d’émettre des fibres d’amiante, de mentionner cette entreprise
    sur la traçabilité.
    <br /> Un particulier (ou un agriculteur réalisant des travaux dans ses
    propres locaux d’habitation) à l’origine d’une opération du BTP ne peut
    prendre en charge personnellement le conditionnement de MPCA déposés à cette
    occasion que si aucun professionnel n’a participé d’une quelconque façon à
    la réalisation de ce chantier. Cas décrits en{" "}
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="fr-link"
      href={faqLink}
    >
      FAQ
    </a>
    <br />
    <br />
    En continuant, vous confirmez remplir les conditions de l'exemption.
  </div>
);

export function NoWorkerAlert() {
  return <Alert severity="warning" title={title} description={description} />;
}
