import React from "react";
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
  hideHeader?: boolean;
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
  hideHeader = false
}: DetenteurAccordionProps) {
  const collapseElementId = `actor__${numero}__form`;

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
        className={`actor__form ${expanded ? "is-expanded" : ""}`}
        style={{
          display: expanded ? "block" : "none"
        }}
      >
        <div>{children}</div>
      </div>
    </section>
  );
}
