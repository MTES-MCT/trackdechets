import React, { useState, useEffect } from "react";
import Slide from "./Slide";
import styles from "./Onboarding.module.scss";
import Slider from "./Slider";
import TdModal from "common/components/Modal";
export default function OnBoarding() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const slideShowShown = window.localStorage.getItem("td-slideshow");

    if (!slideShowShown) {
      setIsOpen(true);
      window.localStorage.setItem("td-slideshow", "DONE");
    }
  }, []);

  return (
    <TdModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      ariaLabel="Éditez et transmettez simplement vos BSD"
      wide={true}
    >
      <div className={styles.Onboarding} onClick={e => e.stopPropagation()}>
        <Slider onClose={() => setIsOpen(false)}>
          <Slide
            image="/onboarding/slide1.png"
            title="Éditez et transmettez simplement vos BSD"
          >
            <p>
              Pour que la préparation des bordereaux ne soit plus d'une
              complexité inutile... producteurs qui êtes responsables de vos
              déchets dangereux : éditez vous-même un BSD ou co-éditez le avec
              votre prestataire (ou il peut le préparer à votre place via son
              compte Trackdéchets).
            </p>
            <p>
              On vous facilite la vie avec{" "}
              <span role="img" aria-label="Fort">
                💪
              </span>{" "}
              :
            </p>
            <ul>
              <li>
                un système de favoris (codes déchets, coordonnées prestataires,
                etc.)
              </li>
              <li>des contrôles de cohérence</li>
              <li>
                la duplication de BSD types (pour ne pas tout refaire à chaque
                fois !)
              </li>
              <li>la signature et la transmission électronique des données</li>
              <li>l’édition d’un CERFA PDF (si nécessaire)</li>
              <li>
                une annexe 2 générée automatiquement (pour les centres de
                regroupements et les traiteurs notamment)
              </li>
            </ul>
          </Slide>

          <Slide
            image="/onboarding/slide2.png"
            title="Suivez la vie de vos déchets en temps réel"
          >
            <p>
              Fini les relances multiples pour savoir si vos déchets ont été
              traités et le travail d'archivage des BSD : un tableau de bord
              vous permet de suivre le statut de chaque BSD et de réaliser les
              actions nécessaires au bon moment (envoi du déchet, réception,
              traitement, etc.).
            </p>
          </Slide>

          <Slide
            image="/onboarding/slide3.png"
            title="Consultez et exportez votre registre déchets"
          >
            <p>
              Fini la double saisie : un registre s’incrémente automatiquement à
              chaque fois qu’un BSD est parti de chez le producteur/détenteur.
              Vous pouvez consulter des statistiques macro et exporter le
              registre sous format CSV dans son intégralité.
            </p>

            <p>Un export spécifique GEREP est à venir prochainement.</p>
          </Slide>

          <Slide
            image="/onboarding/slide4.png"
            title="Gérez les membres de votre organisation"
          >
            <p>
              En tant qu’administrateur, vous pouvez donner accès à plusieurs
              membres de votre organisation pour qu’ils utilisent également
              Trackdéchets. Un système de gestion des droits est accessible.
            </p>
          </Slide>

          <Slide
            image="/onboarding/slide5.png"
            title="Vérifiez si une entreprise partenaire est bien autorisée à traiter vos déchets"
          >
            <p>
              Un rapide questionnaire pour vous aider à vérifier qu’un
              prestataire peut collecter, recevoir et/ou traiter un type de
              déchet dangereux. On vous aide à y voir clair et à travailler avec
              des acteurs vertueux qui prendront soin de vos déchets.
            </p>
          </Slide>
        </Slider>
      </div>
    </TdModal>
  );
}
