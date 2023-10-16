import React, { useRef, useState, useEffect, useCallback } from "react";
import classnames from "classnames";
import FocusTrap from "focus-trap-react";
import {
  FAIRE_SIGNER,
  SUPRIMER_REVISION,
  VALIDER_TRAITEMENT,
  annexe1,
  apercu_action_label,
  completer_bsd_suite,
  dupliquer_action_label,
  modifier_action_label,
  pdf_action_label,
  revision_action_label,
  supprimer_action_label,
} from "../../../common/wordings/dashboard/wordingsDashboard";
import { BsdAdditionalActionsButtonProps } from "./bsdAdditionalActionsButtonTypes";
import useOnClickOutsideRefTarget from "../../../common/hooks/useOnClickOutsideRefTarget";
import {
  canReviewBsd,
  canDeleteBsd,
  canDuplicate,
  canUpdateBsd,
  canGeneratePdf,
  hasBsdSuite,
  hasAppendix1Cta,
  canDeleteReview,
  hasBsdasriEmitterSign,
  isSignTransportCanSkipEmission,
  isSignEmission,
} from "../../dashboardServices";
import { UserPermission } from "generated/graphql/types";

import "./bsdAdditionalActionsButton.scss";
import { BsdType } from "generated/graphql/types";
import { generatePath, useHistory, useLocation } from "react-router-dom";
import {
  getOverviewPath,
  getRevisionPath,
  getUpdatePath,
} from "Apps/Dashboard/dashboardUtils";
import {
  useBsdaDownloadPdf,
  useBsdasriDownloadPdf,
  useBsddDownloadPdf,
  useBsffDownloadPdf,
  useBsvhuDownloadPdf,
} from "../Pdf/useDownloadPdf";
import {
  useBsdaDuplicate,
  useBsdasriDuplicate,
  useBsddDuplicate,
  useBsffDuplicate,
  useBsvhuDuplicate,
} from "../Duplicate/useDuplicate";
import Loader from "../../../common/Components/Loader/Loaders";
import DeleteModal from "../DeleteModal/DeleteModal";
function BsdAdditionalActionsButton({
  bsd,
  permissions,
  currentSiret,
  actionList: {
    onAppendix1,
    onBsdSuite,
    onDeleteReview,
    onEmitterDasriSign,
    onEmitterBsddSign,
  },
  hideReviewCta,
  isToCollectTab = false,
  hasAutomaticSignature = false,
}: BsdAdditionalActionsButtonProps) {
  const [isOpen, setisOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLElement>(null);
  const { targetRef } = useOnClickOutsideRefTarget({
    onClickOutside: () => setisOpen(false),
  });
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    const { current } = dropdownRef;
    const dropdownBound = current?.getBoundingClientRect();
    const headerHeight = document.getElementById("header")?.clientHeight;
    const windowHeight = document.getElementsByTagName("body")[0].clientHeight;
    const scrollPosition = window.scrollY;

    if (
      current &&
      isOpen &&
      dropdownBound &&
      dropdownBound.height + dropdownBound.y > windowHeight &&
      headerHeight &&
      scrollPosition > headerHeight
    ) {
      current.style.top = `-${current.offsetHeight + 20}px`;
      current.style.transition = `none`;
    }
  }, [isOpen]);

  const toggleMenu = useCallback(() => {
    setisOpen(!isOpen);
  }, [isOpen]);

  const closeMenu = () => {
    setisOpen(false);
  };

  const redirectToPath = useCallback(
    (path, id) => {
      if (path) {
        history.push({
          pathname: generatePath(path, {
            siret: currentSiret,
            id,
          }),
          state: { background: location },
        });
      }
    },
    [history, location, currentSiret]
  );
  const options = {
    variables: { id: bsd.id },
  };
  const [downloadBsddPdf] = useBsddDownloadPdf({
    ...options,
  });
  const [downloadBsdaPdf] = useBsdaDownloadPdf({
    ...options,
  });
  const [downloadBsdasriPdf] = useBsdasriDownloadPdf({
    ...options,
  });
  const [downloadBsffPdf] = useBsffDownloadPdf({
    ...options,
  });
  const [downloadBsvhuPdf] = useBsvhuDownloadPdf({
    ...options,
  });

  const [duplicateBsdd, { loading: isDuplicatingBsdd }] = useBsddDuplicate({
    ...options,
  });
  const [duplicateBsda, { loading: isDuplicatingBsda }] = useBsdaDuplicate({
    ...options,
  });
  const [duplicateBsdasri, { loading: isDuplicatingBsdasri }] =
    useBsdasriDuplicate({
      ...options,
    });
  const [duplicateBsff, { loading: isDuplicatingBsff }] = useBsffDuplicate({
    ...options,
  });
  const [duplicateBsvhu, { loading: isDuplicatingBsvhu }] = useBsvhuDuplicate({
    ...options,
  });

  const isDuplicating =
    isDuplicatingBsdd ||
    isDuplicatingBsda ||
    isDuplicatingBsdasri ||
    isDuplicatingBsff ||
    isDuplicatingBsvhu;

  const handleOverview = useCallback(() => {
    closeMenu();
    const path = getOverviewPath(bsd);
    redirectToPath(path, bsd.id);
  }, [redirectToPath, bsd]);
  const handlePdf = useCallback(() => {
    closeMenu();
    if (bsd.type === BsdType.Bsdd) {
      downloadBsddPdf();
    }
    if (bsd.type === BsdType.Bsda) {
      downloadBsdaPdf();
    }
    if (bsd.type === BsdType.Bsdasri) {
      downloadBsdasriPdf();
    }
    if (bsd.type === BsdType.Bsff) {
      downloadBsffPdf();
    }
    if (bsd.type === BsdType.Bsvhu) {
      downloadBsvhuPdf();
    }
  }, [
    downloadBsdaPdf,
    downloadBsdasriPdf,
    downloadBsddPdf,
    downloadBsffPdf,
    downloadBsvhuPdf,
    bsd,
  ]);
  const handleUpdate = useCallback(() => {
    closeMenu();
    const path = getUpdatePath(bsd);
    redirectToPath(path, bsd.id);
  }, [redirectToPath, bsd]);
  const handleDuplicate = useCallback(() => {
    closeMenu();
    if (bsd.type === BsdType.Bsdd) {
      duplicateBsdd();
    }
    if (bsd.type === BsdType.Bsda) {
      duplicateBsda();
    }
    if (bsd.type === BsdType.Bsdasri) {
      duplicateBsdasri();
    }
    if (bsd.type === BsdType.Bsff) {
      duplicateBsff();
    }
    if (bsd.type === BsdType.Bsvhu) {
      duplicateBsvhu();
    }
  }, [
    duplicateBsda,
    duplicateBsdasri,
    duplicateBsdd,
    duplicateBsff,
    duplicateBsvhu,
    bsd,
  ]);
  const handleDelete = useCallback(() => {
    closeMenu();
    setIsDeleteModalOpen(true);
  }, []);
  const handleRevision = useCallback(() => {
    closeMenu();
    const path = getRevisionPath(bsd);
    redirectToPath(path, bsd.id);
  }, [redirectToPath, bsd]);

  const handleBsdSuite = useCallback(() => {
    closeMenu();
    onBsdSuite!(bsd);
  }, [bsd, onBsdSuite]);
  const handleAppendix1 = useCallback(() => {
    closeMenu();
    onAppendix1!(bsd);
  }, [bsd, onAppendix1]);

  const handleReviewDelete = useCallback(() => {
    closeMenu();
    onDeleteReview!(bsd);
  }, [bsd, onDeleteReview]);

  const handleDasriEmitterSign = useCallback(() => {
    closeMenu();
    onEmitterDasriSign!(bsd);
  }, [bsd, onEmitterDasriSign]);

  const handleBsddEmitterSign = useCallback(() => {
    closeMenu();
    onEmitterBsddSign!(bsd);
  }, [bsd, onEmitterBsddSign]);

  const onCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
  }, []);

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
          onClick={toggleMenu}
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
          {permissions.includes(UserPermission.BsdCanSignOperation) &&
            hasBsdSuite(bsd, currentSiret) && (
              <li>
                <button
                  type="button"
                  data-testid={
                    !bsd?.temporaryStorageDetail
                      ? "bsd-suite-btn"
                      : "valider-traitement-btn"
                  }
                  className="fr-btn fr-btn--tertiary-no-outline"
                  tabIndex={tabIndex}
                  onClick={handleBsdSuite}
                >
                  {!bsd?.temporaryStorageDetail
                    ? completer_bsd_suite
                    : VALIDER_TRAITEMENT}
                </button>
              </li>
            )}
          {permissions.includes(UserPermission.BsdCanRevise) &&
            canDeleteReview(bsd, currentSiret) && (
              <li>
                <button
                  type="button"
                  data-testid="review-btn"
                  className="fr-btn fr-btn--tertiary-no-outline"
                  tabIndex={tabIndex}
                  onClick={handleReviewDelete}
                >
                  {SUPRIMER_REVISION}
                </button>
              </li>
            )}
          {permissions.includes(UserPermission.BsdCanSignEmission) &&
            hasBsdasriEmitterSign(bsd, currentSiret, isToCollectTab) && (
              <li>
                <button
                  type="button"
                  data-testid="emport-direct-dasri-btn"
                  className="fr-btn fr-btn--tertiary-no-outline"
                  tabIndex={tabIndex}
                  onClick={handleDasriEmitterSign}
                >
                  {FAIRE_SIGNER}
                </button>
              </li>
            )}
          {isToCollectTab &&
            bsd.type === BsdType.Bsdd &&
            permissions.includes(UserPermission.BsdCanSignEmission) &&
            isSignEmission(currentSiret, bsd, hasAutomaticSignature) &&
            isSignTransportCanSkipEmission(
              currentSiret,
              bsd,
              hasAutomaticSignature
            ) && (
              <li>
                <button
                  type="button"
                  data-testid="emport-direct-bsdd-btn"
                  className="fr-btn fr-btn--tertiary-no-outline"
                  tabIndex={tabIndex}
                  onClick={handleBsddEmitterSign}
                >
                  {FAIRE_SIGNER}
                </button>
              </li>
            )}
          {permissions.includes(UserPermission.BsdCanUpdate) &&
            hasAppendix1Cta(bsd) && (
              <li>
                <button
                  type="button"
                  data-testid="appendix1-btn"
                  className="fr-btn fr-btn--tertiary-no-outline"
                  tabIndex={tabIndex}
                  onClick={handleAppendix1}
                >
                  {annexe1}
                </button>
              </li>
            )}
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
          {permissions.includes(UserPermission.BsdCanRead) &&
            canGeneratePdf(bsd) && (
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
          {permissions.includes(UserPermission.BsdCanCreate) &&
            canDuplicate(bsd, currentSiret) && (
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
          {permissions.includes(UserPermission.BsdCanUpdate) &&
            canUpdateBsd(bsd, currentSiret) && (
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
          {permissions.includes(UserPermission.BsdCanRevise) &&
            !hideReviewCta &&
            canReviewBsd(bsd, currentSiret) && (
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
          {permissions.includes(UserPermission.BsdCanDelete) &&
            !hideReviewCta &&
            canDeleteBsd(bsd, currentSiret) && (
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
        </ul>
        {isDuplicating && <Loader />}
        <DeleteModal
          bsdId={bsd.id}
          bsdType={bsd.type}
          isOpen={isDeleteModalOpen}
          onClose={onCloseDeleteModal}
        />
      </div>
    </FocusTrap>
  );
}

export default React.memo(BsdAdditionalActionsButton);
