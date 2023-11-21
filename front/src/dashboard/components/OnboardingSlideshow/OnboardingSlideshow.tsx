import * as React from "react";
import { Modal, Slideshow, List, ListItem } from "../../../common/components";
import { IconCheckCircle1 } from "../../../Apps/common/Components/Icons/Icons";

import styles from "./OnboardingSlideshow.module.scss";
import slide1Image from "./assets/slide1.gif";
import slide2Image from "./assets/slide2.gif";
import slide3Image from "./assets/slide3.gif";
import slide4Image from "./assets/slide4.gif";
import prepareImage from "./assets/prepare.svg";
import signImage from "./assets/sign.svg";
import followImage from "./assets/follow.svg";
import downloadImage from "./assets/download.svg";
import slide6Image from "./assets/slide6.svg";

const LOCAL_STORAGE_KEY = "td-slideshow";

export function OnboardingSlideshow() {
  const [isDismissed, setIsDismissed] = React.useState(true);

  React.useEffect(() => {
    if (!window.localStorage.getItem(LOCAL_STORAGE_KEY)) {
      setIsDismissed(false);
      window.localStorage.setItem(LOCAL_STORAGE_KEY, new Date().toISOString());
    }
  }, []);

  if (isDismissed) {
    return null;
  }

  return (
    <Modal
      isOpen
      onClose={() => setIsDismissed(true)}
      ariaLabel="Présentation de Trackdéchets"
    >
      <Slideshow>
        <div className={styles.Slide}>
          <div className={styles.ModalTitle}>
            Préparer facilement un Bordereau de Suivi de Déchets
          </div>
          <div className={styles.SlideContent}>
            <div className={styles.SlideContentImage}>
              <img src={slide1Image} alt="" />
            </div>
            <div className={styles.SlideContentList}>
              <List variant="unstyled">
                <ListItem
                  startIcon={
                    <IconCheckCircle1 className={styles.CheckmarkIcon} />
                  }
                >
                  Toute entreprise présente sur le BSD (producteur ou
                  prestataire) peut préparer un BSD à partir de son compte
                  Trackdéchets
                </ListItem>
                <ListItem
                  startIcon={
                    <IconCheckCircle1 className={styles.CheckmarkIcon} />
                  }
                >
                  Une saisie simplifiée et des contrôles de cohérence pour
                  éviter les erreurs
                </ListItem>
              </List>
            </div>
          </div>
        </div>
        <div className={styles.Slide}>
          <div className={styles.ModalTitle}>
            Signer numériquement l’enlèvement de vos déchets
          </div>
          <div className={styles.SlideContent}>
            <div className={styles.SlideContentImage}>
              <img src={slide2Image} alt="" />
            </div>
            <div className={styles.SlideContentList}>
              <List variant="unstyled">
                <ListItem
                  startIcon={
                    <IconCheckCircle1 className={styles.CheckmarkIcon} />
                  }
                >
                  Signez de manière dématérialisée sur l’outil du chauffeur avec
                  votre code de signature entreprise
                </ListItem>
                <ListItem
                  startIcon={
                    <IconCheckCircle1 className={styles.CheckmarkIcon} />
                  }
                >
                  Vous pouvez aussi signer l’enlèvement sur votre propre compte
                  Trackdéchets
                </ListItem>
              </List>
            </div>
          </div>
        </div>
        <div className={styles.Slide}>
          <div className={styles.ModalTitle}>
            Suivre l’état de ses BSD en temps réel
          </div>
          <div className={styles.SlideContent}>
            <div className={styles.SlideContentImage}>
              <img src={slide3Image} alt="" />
            </div>
            <div className={styles.SlideContentList}>
              <List variant="unstyled">
                <ListItem
                  startIcon={
                    <IconCheckCircle1 className={styles.CheckmarkIcon} />
                  }
                >
                  Soyez informés du statut de vos déchets et des actions à
                  prendre à chaque étape
                </ListItem>
                <ListItem
                  startIcon={
                    <IconCheckCircle1 className={styles.CheckmarkIcon} />
                  }
                >
                  Consultez le BSD en temps réel avec l'aperçu ou le PDF
                </ListItem>
                <ListItem
                  startIcon={
                    <IconCheckCircle1 className={styles.CheckmarkIcon} />
                  }
                >
                  Un archivage automatique de tous les BSD vous concernant
                </ListItem>
              </List>
            </div>
          </div>
        </div>
        <div className={styles.Slide}>
          <div className={styles.ModalTitle}>
            Télécharger son registre réglementaire
          </div>
          <div className={styles.SlideContent}>
            <div className={styles.SlideContentImage}>
              <img src={slide4Image} alt="" />
            </div>
            <div className={styles.SlideContentList}>
              <List variant="unstyled">
                <ListItem
                  startIcon={
                    <IconCheckCircle1 className={styles.CheckmarkIcon} />
                  }
                >
                  Exportez votre registre simplement à tout moment
                </ListItem>
                <ListItem
                  startIcon={
                    <IconCheckCircle1 className={styles.CheckmarkIcon} />
                  }
                >
                  Des rubriques conformes à la réglementation
                </ListItem>
                <ListItem
                  startIcon={
                    <IconCheckCircle1 className={styles.CheckmarkIcon} />
                  }
                >
                  De nombreux filtres possibles pour personnaliser votre
                  registre
                </ListItem>
              </List>
            </div>
          </div>
        </div>
        <div className={styles.Slide}>
          <div className={styles.ModalTitle}>Trackdéchets permet de :</div>
          <div className={styles.Features}>
            <div className={styles.FeaturesItem}>
              <img src={prepareImage} alt="" />
              <div className={styles.FeaturesItemLabel}>Préparer</div>
            </div>
            <div className={styles.FeaturesItem}>
              <img src={signImage} alt="" />
              <div className={styles.FeaturesItemLabel}>Signer</div>
            </div>
            <div className={styles.FeaturesItem}>
              <img src={followImage} alt="" />
              <div className={styles.FeaturesItemLabel}>Suivre</div>
            </div>
            <div className={styles.FeaturesItem}>
              <img src={downloadImage} alt="" />
              <div className={styles.FeaturesItemLabel}>Télécharger</div>
            </div>
          </div>
        </div>
        <div className={styles.Slide}>
          <div className={styles.ModalTitle}>
            Des questions ? Besoin d’aide ?
          </div>
          <div className={styles.SlideContent}>
            <div className={styles.SlideContentImage}>
              <img src={slide6Image} alt="" style={{ padding: "1rem" }} />
            </div>
            <div className={styles.SlideContentList}>
              <List variant="unstyled">
                <ListItem
                  startIcon={
                    <IconCheckCircle1 className={styles.CheckmarkIcon} />
                  }
                >
                  Nous avons déjà répondu à de nombreuses questions{" "}
                  <span role="img" aria-label="Main pointant du doigt">
                    👉
                  </span>{" "}
                  rendez-vous sur la{" "}
                  <a href="https://faq.trackdechets.fr/" className="link">
                    Foire Aux Questions
                  </a>
                </ListItem>
                <ListItem
                  startIcon={
                    <IconCheckCircle1 className={styles.CheckmarkIcon} />
                  }
                >
                  Votre question n'est pas documentée dans la FAQ ? Vous pouvez
                  nous contacter via la FAQ. L'équipe support est là pour vous
                  répondre !
                </ListItem>
              </List>
            </div>
          </div>
        </div>
      </Slideshow>
    </Modal>
  );
}
