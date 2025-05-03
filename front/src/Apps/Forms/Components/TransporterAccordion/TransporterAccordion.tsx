import React, { useEffect, useState, useRef } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import "./TransporterAccordion.scss";

export type TransporterAccordionProps = {
  name: string;
  numero: number;
  hasError?: boolean;
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
  hasError,
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (!contentRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        setContentHeight(entries[0].contentRect.height);
      }
    });

    resizeObserver.observe(contentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <section className="transporter">
      <div
        className={`transporter__header ${hasError ? "transporter-error" : ""}`}
      >
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
        className="transporter__form"
        style={{
          maxHeight: expanded ? contentHeight + 28 : 0
        }}
      >
        <div ref={contentRef}>{children}</div>
      </div>
    </section>
  );
}
