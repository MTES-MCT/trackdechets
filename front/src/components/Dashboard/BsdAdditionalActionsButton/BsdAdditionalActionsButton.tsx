import React, { useRef, useState, useEffect } from "react";
import classnames from "classnames";
import FocusTrap from "focus-trap-react";
import {
  apercu_action_label,
  dupliquer_action_label,
  modifier_action_label,
  pdf_action_label,
  revision_action_label,
  supprimer_action_label,
} from "../../../assets/wordings/dashboard/wordingsDashboard";
import { BsdAdditionalActionsButtonProps } from "./bsdAdditionalActionsButtonTypes";
import useOnClickOutsideRefTarget from "../../../common/hooks/useOnClickOutsideRefTarget";
import { BsdStatusCode } from "../../../common/types/bsdTypes";
import { BsdasriType, BsdType } from "../../../generated/graphql/types";

import "./bsdAdditionalActionsButton.scss";

const BsdAdditionalActionsButton = ({
  bsd,
  currentSiret,
  onOverview,
  onDuplicate,
  onPdf,
  onDelete,
  onUpdate,
  onRevision,
  children,
}: BsdAdditionalActionsButtonProps) => {
  const [isOpen, setisOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLElement>(null);
  const { targetRef } = useOnClickOutsideRefTarget({
    onClickOutside: () => setisOpen(false),
  });

  useEffect(() => {
    const { current } = dropdownRef;
    if (
      current &&
      isOpen &&
      window.innerHeight - current.getBoundingClientRect().bottom <
        current.scrollHeight
    ) {
      current.style.top = `-${current.offsetHeight + 20}px`;
      current.style.transition = `none`;
    }
  }, [isOpen]);

  const onClick = () => {
    setisOpen(!isOpen);
  };

  const handleOverview = () => {
    onOverview(bsd);
  };
  const handlePdf = () => {
    onPdf(bsd);
  };
  const handleUpdate = () => {
    onUpdate(bsd);
  };
  const handleDuplicate = () => {
    onDuplicate(bsd);
  };
  const handleDelete = () => {
    onDelete(bsd);
  };
  const handleRevision = () => {
    onRevision(bsd);
  };

  const canUpdateOrDeleteBsdd =
    bsd.type === BsdType.Bsdd &&
    [BsdStatusCode.DRAFT, BsdStatusCode.SEALED].includes(bsd.status);

  const canReviewBsdd =
    bsd.type === BsdType.Bsdd &&
    ![
      BsdStatusCode.DRAFT,
      BsdStatusCode.SEALED,
      BsdStatusCode.REFUSED,
    ].includes(bsd.status);

  const canUpdateBsda =
    bsd.type === BsdType.Bsda &&
    ![
      BsdStatusCode.PROCESSED,
      BsdStatusCode.REFUSED,
      BsdStatusCode.AWAITING_CHILD,
    ].includes(bsd.status);

  const canDeleteBsda =
    bsd.type === BsdType.Bsda &&
    (bsd.status === BsdStatusCode.INITIAL ||
      (bsd.status === BsdStatusCode.SIGNED_BY_PRODUCER &&
        bsd.emitter?.company?.siret === currentSiret));

  const canReviewBsda = bsd.type === BsdType.Bsda && !canDeleteBsda;

  const canDeleteBsdasri =
    bsd.type === BsdType.Bsdasri && bsd.status === BsdStatusCode.INITIAL;

  const canUpdateBsdasri =
    bsd.type === BsdType.Bsdasri &&
    ![BsdStatusCode.PROCESSED, BsdStatusCode.REFUSED].includes(bsd.status);

  const canDuplicate =
    bsd.type === BsdType.Bsdasri
      ? bsd.bsdWorkflowType === BsdasriType.Simple
      : true;

  const canDuplicateBsff = () => {
    const emitterSiret = bsd.emitter?.company?.siret;
    const transporterSiret = bsd.transporter?.company?.siret;
    const destinationSiret = bsd.destination?.company?.siret;
    return (
      bsd.type === BsdType.Bsff &&
      [emitterSiret, transporterSiret, destinationSiret].includes(currentSiret)
    );
  };

  const canUpdateBsff =
    bsd.type === BsdType.Bsff &&
    ![BsdStatusCode.PROCESSED, BsdStatusCode.REFUSED].includes(bsd.status) &&
    canDuplicateBsff();

  const canDeleteBsff =
    bsd.type === BsdType.Bsff &&
    bsd.status === BsdStatusCode.INITIAL &&
    canDuplicateBsff();

  const canUpdateBsvhu =
    bsd.type === BsdType.Bsvhu &&
    ![BsdStatusCode.PROCESSED, BsdStatusCode.REFUSED].includes(bsd.status);

  const canDeleteBsvhu =
    bsd.type === BsdType.Bsvhu && bsd.status === BsdStatusCode.INITIAL;

  const tabIndex = isOpen ? 0 : -1;

  return (
    <FocusTrap active={isOpen}>
      <div
        ref={targetRef as React.RefObject<HTMLDivElement>}
        className="bsd-actions-kebab-menu"
      >
        <button
          type="button"
          data-testid="bsd-actions-secondary-btn"
          className="fr-btn fr-btn--tertiary-no-outline bsd-actions-kebab-menu__button"
          aria-controls={`bsd-actions-dropdown_${bsd.id}`}
          aria-expanded={isOpen}
          onClick={onClick}
        >
          <span className="sr-only">
            {isOpen ? "fermer menu actions" : "ouvrir menu actions"}
          </span>
          <figure aria-hidden={true} className="dots"></figure>
          <figure aria-hidden={true} className="dots"></figure>
          <figure aria-hidden={true} className="dots"></figure>
        </button>

        <ul
          id={`bsd-actions-dropdown_${bsd.id}`}
          aria-hidden={!isOpen}
          ref={dropdownRef as React.RefObject<HTMLUListElement>}
          className={classnames("bsd-actions-kebab-menu__dropdown", {
            "bsd-actions-kebab-menu__dropdown--active": isOpen,
          })}
        >
          {React.Children.map(children, child => {
            const newChildWithTabIndex = child
              ? React.cloneElement(child as React.ReactElement<HTMLElement>, {
                  tabIndex,
                })
              : null;

            return newChildWithTabIndex && <li>{newChildWithTabIndex}</li>;
          })}
          <li>
            <button
              type="button"
              data-testid="bsd-overview-btn"
              className="fr-btn fr-btn--tertiary-no-outline"
              tabIndex={tabIndex}
              onClick={handleOverview}
            >
              {apercu_action_label}
            </button>
          </li>
          {(canUpdateOrDeleteBsdd ||
            canDeleteBsda ||
            canDeleteBsdasri ||
            canDeleteBsff ||
            canDeleteBsvhu) && (
            <li>
              <button
                type="button"
                data-testid="bsd-delete-btn"
                className="fr-btn fr-btn--tertiary-no-outline"
                tabIndex={tabIndex}
                onClick={handleDelete}
              >
                {supprimer_action_label}
              </button>
            </li>
          )}
          {(canReviewBsdd || canReviewBsda) && (
            <li>
              <button
                type="button"
                data-testid="bsd-review-btn"
                className="fr-btn fr-btn--tertiary-no-outline"
                tabIndex={tabIndex}
                onClick={handleRevision}
              >
                {revision_action_label}
              </button>
            </li>
          )}
          {(canDuplicate || canDuplicateBsff()) && (
            <li>
              <button
                type="button"
                data-testid="bsd-duplicate-btn"
                className="fr-btn fr-btn--tertiary-no-outline"
                tabIndex={tabIndex}
                onClick={handleDuplicate}
              >
                {dupliquer_action_label}
              </button>
            </li>
          )}
          {(canUpdateOrDeleteBsdd ||
            canUpdateBsda ||
            canUpdateBsdasri ||
            canUpdateBsff ||
            canUpdateBsvhu) && (
            <li>
              <button
                type="button"
                data-testid="bsd-update-btn"
                className="fr-btn fr-btn--tertiary-no-outline"
                tabIndex={tabIndex}
                onClick={handleUpdate}
              >
                {modifier_action_label}
              </button>
            </li>
          )}
          {(bsd.type === BsdType.Bsff || !bsd.isDraft) && (
            <li>
              <button
                type="button"
                data-testid="bsd-pdf-btn"
                className="fr-btn fr-btn--tertiary-no-outline"
                tabIndex={tabIndex}
                onClick={handlePdf}
              >
                {pdf_action_label}
              </button>
            </li>
          )}
        </ul>
      </div>
    </FocusTrap>
  );
};

export default BsdAdditionalActionsButton;
