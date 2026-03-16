import React, { useEffect, useState, useRef } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import "./DetenteurAccordion.scss";

export type DetenteurAccordionProps = {
  name: string;
  numero: number;
  hasError?: boolean;
  onActorAdd: () => void;
  onActorDelete: () => void;
  onActorShiftDown: () => void;
  onActorShiftUp: () => void;
  onExpanded: () => void;
  disableAdd?: boolean;
  disableDelete?: boolean;
  disableUp?: boolean;
  disableDown?: boolean;
  expanded?: boolean;
  children: NonNullable<React.ReactNode>;
  deleteLabel: string;
  hideHeader?: boolean; // Nouvelle prop pour masquer l'en-tête
};

export function DetenteurAccordion({
  name,
  numero,
  hasError,
  expanded = true,
  onActorAdd,
  onActorDelete,
  onActorShiftDown,
  onActorShiftUp,
  onExpanded,
  disableAdd = false,
  disableDelete = false,
  disableUp = false,
  disableDown = false,
  children,
  deleteLabel,
  hideHeader = false // Par défaut, l'en-tête est visible
}: DetenteurAccordionProps) {
  const collapseElementId = `actor__${numero}__form`;
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
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <section className="actor">
      {!hideHeader && (
        <div className={`actor__header ${hasError ? "actor-error" : ""}`}>
          <label className="actor__header__label">{name}</label>
          <div className="actor__header__buttons">
            <Button
              type="button"
              className="actor__header__button"
              priority="secondary"
              iconPosition="right"
              iconId="ri-add-line"
              title="Ajouter"
              disabled={disableAdd}
              onClick={onActorAdd}
            >
              Ajouter
            </Button>

            <Button
              type="button"
              className="actor__header__button"
              priority="tertiary"
              iconPosition="right"
              iconId="ri-delete-bin-line"
              title={deleteLabel}
              onClick={onActorDelete}
              disabled={disableDelete}
              nativeButtonProps={{
                "data-testid": collapseElementId
              }}
            >
              {deleteLabel}
            </Button>

            <Button
              type="button"
              className="actor__header__button"
              iconId="ri-arrow-up-line"
              priority="secondary"
              title="Remonter"
              onClick={onActorShiftUp}
              disabled={disableUp}
            />

            <Button
              type="button"
              className="actor__header__button"
              iconId="ri-arrow-down-line"
              priority="secondary"
              title="Descendre"
              onClick={onActorShiftDown}
              disabled={disableDown}
            />

            <Button
              type="button"
              className="actor__header__button"
              iconId={expanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
              title={expanded ? "Replier" : "Déplier"}
              priority="secondary"
              aria-expanded={expanded}
              aria-controls={collapseElementId}
              onClick={onExpanded}
            />
          </div>
        </div>
      )}

      <div
        id={collapseElementId}
        className="actor__form"
        style={{
          maxHeight: expanded ? contentHeight + 28 : 0
        }}
      >
        <div ref={contentRef}>{children}</div>
      </div>
    </section>
  );
}
