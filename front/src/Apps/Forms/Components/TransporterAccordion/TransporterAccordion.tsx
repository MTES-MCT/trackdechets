import * as React from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import "./TransporterAccordion.scss";

export type TransporterAccordionProps = {
  name: string;
  numero: number;
  onTransporterAdd: () => void;
  onTransporterDelete: () => void;
  onTransporterShiftDown: () => void;
  onTransporterShiftUp: () => void;
  onExpanded: () => void;
  disableAdd?: boolean;
  disableDelete?: boolean;
  disableUp?: boolean;
  disableDown?: boolean;
  expanded?: boolean;
  children: NonNullable<React.ReactNode>;
  deleteLabel: string;
};

/**
 * Ce composant gère l'affichage du formulaire transporteur en
 * mode "accordéon". C'est une version modifiée du composant
 * <Accordion /> du react-dsfr qui permet d'afficher ce que l'on veut dans
 * la barre de label. Les événements au clic sur les boutons "Ajouter",
 * "Supprimer", "Avancer", "Reculer" et "Déplier" sont propagés vers <TransporterList />
 */
export function TransporterAccordion({
  name,
  numero,
  expanded,
  onTransporterAdd,
  onTransporterDelete,
  onTransporterShiftDown,
  onTransporterShiftUp,
  onExpanded,
  disableAdd = false,
  disableDelete = false,
  disableUp = false,
  disableDown = false,
  children,
  deleteLabel
}: TransporterAccordionProps) {
  const collapseElementId = `transporter__${numero}__form`;

  const ref = React.useRef(null);

  // FIXME scrollHeight est recalculé à chaque render
  // Idéalement il faudrait utiliser ResizeObserver pour être notifié
  // lorsque l'élément change de taille tel que décrit ici
  // https://legacy.reactjs.org/docs/hooks-faq.html#how-can-i-measure-a-dom-node
  const scrollHeight = (() => {
    if (ref.current) {
      // Cf https://www.w3schools.com/howto/howto_js_collapsible.asp
      // "Animated Collapsible (Slide Down)"
      // On a besoin de connaitre la hauteur de l'élément déplié
      // pour définir la valeur de maxHeight et avoir une animation fluide.
      return (ref.current as any).scrollHeight;
    }
    return 0;
  })();

  return (
    <section className="transporter">
      <div className="transporter__header">
        <label className="transporter__header__label">{name}</label>
        <div className="transporter__header__buttons">
          <Button
            type="button"
            className="transporter__header__button"
            priority="secondary"
            iconPosition="right"
            iconId="ri-add-line"
            title="Ajouter"
            disabled={disableAdd}
            onClick={onTransporterAdd}
          >
            Ajouter
          </Button>
          <Button
            type="button"
            className="transporter__header__button"
            priority="tertiary"
            iconPosition="right"
            iconId="ri-delete-bin-line"
            title={deleteLabel}
            onClick={onTransporterDelete}
            disabled={disableDelete}
            nativeButtonProps={{
              "data-testid": collapseElementId
            }}
          >
            {deleteLabel}
          </Button>
          <Button
            type="button"
            className="transporter__header__button"
            iconId="ri-arrow-up-line"
            priority="secondary"
            title="Remonter"
            onClick={onTransporterShiftUp}
            disabled={disableUp}
          />
          <Button
            type="button"
            className="transporter__header__button"
            iconId="ri-arrow-down-line"
            priority="secondary"
            title="Descendre"
            onClick={onTransporterShiftDown}
            disabled={disableDown}
          />
          <Button
            type="button"
            className="transporter__header__button"
            // FIXME Ce serait bien ici d'arriver à reproduire l'animation de l'accordéon du DSFR
            iconId={expanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
            title={expanded ? "Replier" : "Déplier"}
            aria-expanded={expanded}
            aria-controls={collapseElementId}
            onClick={onExpanded}
          />
        </div>
      </div>
      <div
        id={collapseElementId}
        ref={ref}
        className="transporter__form"
        style={
          expanded
            ? scrollHeight
              ? { maxHeight: scrollHeight }
              : {} // avoid having an animation on first render
            : { maxHeight: 0 }
        }
      >
        {children}
      </div>
    </section>
  );
}
