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
} from "../../../Common/wordings/dashboard/wordingsDashboard";
import { BsdAdditionalActionsButtonProps } from "./bsdAdditionalActionsButtonTypes";
import useOnClickOutsideRefTarget from "../../../../common/hooks/useOnClickOutsideRefTarget";
import {
  canReviewBsd,
  canDeleteBsd,
  canDuplicateBsff,
  canDuplicate,
  canUpdateBsd,
  canGeneratePdf,
} from "../../dashboardServices";

import "./bsdAdditionalActionsButton.scss";

function BsdAdditionalActionsButton({
  bsd,
  currentSiret,
  onOverview,
  onDuplicate,
  onPdf,
  onDelete,
  onUpdate,
  onRevision,
  children,
}: BsdAdditionalActionsButtonProps) {
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

  const closeMenu = () => {
    setisOpen(false);
  };

  const handleOverview = () => {
    closeMenu();
    onOverview(bsd);
  };
  const handlePdf = () => {
    closeMenu();
    onPdf(bsd);
  };
  const handleUpdate = () => {
    closeMenu();
    onUpdate(bsd);
  };
  const handleDuplicate = () => {
    closeMenu();
    onDuplicate(bsd);
  };
  const handleDelete = () => {
    closeMenu();
    onDelete(bsd);
  };
  const handleRevision = () => {
    closeMenu();
    onRevision(bsd);
  };

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
          data-testid={`bsd-actions-dropdown_${bsd.id}`}
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
          {canDeleteBsd(bsd, currentSiret) && (
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
          {canReviewBsd(bsd, currentSiret) && (
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
          {(canDuplicate(bsd) || canDuplicateBsff(bsd, currentSiret)) && (
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
          {canUpdateBsd(bsd, currentSiret) && (
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
          {canGeneratePdf(bsd) && (
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
}

export default BsdAdditionalActionsButton;
