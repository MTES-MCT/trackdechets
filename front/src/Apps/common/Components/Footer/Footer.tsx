import React from "react";
import { Footer } from "@codegouvfr/react-dsfr/Footer";

export default function AppFooter() {
  return (
    <Footer
      brandTop={
        <>
          République<br />
          Française
        </>
      }
       operatorLogo={{
        alt: "BRGM",
        imgUrl: "/trackdechets.png",
        orientation: "vertical"
      }}

      contentDescription="Trackdéchets est un service numérique de l’État porté par le Ministère de la Transition écologique et intégré à l’écosystème beta.gouv.fr."
       /* 🔥 IMPORTANT : supprime les 4 liens automatiques DSFR */
      serviceLinks={[]}

      homeLinkProps={{
        href: "https://www.gouvernement.fr",
        title: "Retour à l’accueil du site du Gouvernement"
      }}
      accessibility="partially compliant"
      bottomItems={[
         {
          text: "Homologation",
          linkProps: { href: "/homologation" }
        },
        {
          text: "Mentions légales",
          linkProps: { href: "/mentions-legales" }
        },
        {
          text: "Politique de confidentialité",
          linkProps: { href: "/politique-confidentialite" }
        },
        {
          text: "Conditions générales d’utilisation",
          linkProps: { href: "/cgu" }
        },
        {
          text: "Disponibilité de l'API",
          linkProps: { href: "/api" }
        }
      ]}
    />
  );
}
