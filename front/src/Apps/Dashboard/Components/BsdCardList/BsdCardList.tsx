import React, { useCallback, useEffect, useState } from "react";
import {
  generatePath,
  useNavigate,
  useLocation,
  useMatch,
  useParams
} from "react-router-dom";
import { BsdCardListProps } from "./bsdCardListTypes";
import BsdCard from "../BsdCard/BsdCard";
import {
  Bsd,
  BsdType,
  Bsda,
  BsdasriStatus,
  Bsff,
  Bsvhu,
  Form,
  FormStatus,
  Bsdasri,
  Bspaoh
} from "@td/codegen-ui";
import {
  getOverviewPath,
  getRevisionPath,
  getUpdatePath
} from "../../dashboardUtils";
import DraftValidation from "../../Validation/workflow/Draft/DraftValidation";
import routes from "../../../routes";
import ActBsddValidation from "../../Validation/workflow/Act/ActBsddValidation";
import ActBsdSuiteValidation from "../../Validation/workflow/Act/ActBsdSuiteValidation";
import ActBsdaValidation from "../../Validation/workflow/Act/ActBsdaValidation";
import ActBsffValidation from "../../Validation/workflow/Act/ActBsffValidation";
import ActBsvhuValidation from "../../Validation/workflow/Act/ActBsvhuValidation";
import ActBspaohValidation from "../../Validation/workflow/Act/ActBspaohValidation";
import { BsdDisplay } from "../../../common/types/bsdTypes";
import {
  canApproveOrRefuseReview,
  canDeleteReview,
  hasEmportDirect,
  hasRoadControlButton,
  isSynthesis
} from "../../dashboardServices";
import { formatBsd, mapBsdasri } from "../../bsdMapper";
import RevisionModal, { ActionType } from "../Revision/RevisionModal";

import "./bsdCardList.scss";
import { useKeyboard } from "react-aria";

function BsdCardList({
  siret,
  bsds,
  bsdCurrentTab,
  siretsWithAutomaticSignature
}: BsdCardListProps): JSX.Element {
  const navigate = useNavigate();
  const { bsdId } = useParams();
  const location = useLocation();
  const isReviewsTab =
    bsdCurrentTab === "reviewedTab" || bsdCurrentTab === "toReviewTab";
  const isActTab = bsdCurrentTab === "actTab";
  const isToCollectTab = bsdCurrentTab === "toCollectTab";
  const isReturnTab = bsdCurrentTab === "returnTab";
  const isCollectedTab = bsdCurrentTab === "collectedTab";
  const isAllBsdsTab = !!useMatch(routes.dashboard.bsds.index);

  const redirectToPath = useCallback(
    (path, id) => {
      if (path) {
        navigate(
          generatePath(path, {
            siret,
            id
          }),
          {
            state: { background: location }
          }
        );
      }
    },
    [navigate, location, siret]
  );

  const { keyboardProps } = useKeyboard({
    onKeyDown: event => {
      const key = event.key;
      const focusedElement = document.activeElement;

      if (!focusedElement) {
        return;
      }

      const focusedArticle =
        focusedElement.role === "article"
          ? focusedElement
          : focusedElement.closest("div[role=article]");

      if (!focusedArticle) {
        return;
      }

      const focusedIndex = Number(focusedArticle.getAttribute("aria-posinset"));

      const articles = document.querySelectorAll("div[role=article]");

      switch (key) {
        case "PageUp":
          event.preventDefault();
          if (focusedIndex > 0) {
            const previousArticle = articles[focusedIndex - 1] as HTMLElement;
            previousArticle.focus();
          }
          break;
        case "PageDown":
          event.preventDefault();
          if (articles.length >= focusedIndex) {
            const nextArticle = articles[focusedIndex + 1] as HTMLElement;
            nextArticle.focus();
          }
          break;
        case "Home":
          if (event.ctrlKey && articles.length > 0) {
            event.preventDefault();
            const firstArticle = articles[0] as HTMLElement;
            firstArticle.focus();
          }
          break;
        case "End":
          if (event.ctrlKey) {
            event.preventDefault();
            const lastArticle = articles[articles.length - 1] as HTMLElement;
            lastArticle.focus();
          }
          break;
      }
    }
  });

  const [validationWorkflowType, setValidationWorkflowType] =
    useState<string>();
  const [bsdClicked, setBsdClicked] = useState<Bsd | BsdDisplay>();

  const [isModalOpen, setIsModalOpen] = useState(true);

  const [hasEmitterSignSecondaryCta, setHasEmitterSignSecondaryCta] =
    useState(false);

  // If URL specifies a BSD id, directly open the associated revision modal
  useEffect(() => {
    if (bsdId) {
      setIsModalOpen(true);
      setBsdClicked({ id: bsdId ?? "" } as unknown as Bsd);
      if (bsdId?.startsWith("BSDA-")) {
        setValidationWorkflowType("REVIEW_BSDA_APPROVE");
      } else {
        setValidationWorkflowType("REVIEW_BSDD_APPROVE");
      }
    }
  }, [bsdId]);

  const onClose = () => {
    setIsModalOpen(false);
    setBsdClicked(undefined);
    setValidationWorkflowType("");
    setHasEmitterSignSecondaryCta(false);
  };

  const handleDraftValidation = useCallback(
    (bsd: Bsd) => {
      if (bsd.__typename === "Form") {
        setValidationWorkflowType("DRAFT");
        setBsdClicked(bsd);
        setIsModalOpen(true);
      }

      if (
        bsd.__typename === "Bsda" ||
        bsd.__typename === "Bsff" ||
        bsd.__typename === "Bsvhu" ||
        bsd.__typename === "Bspaoh"
      ) {
        setValidationWorkflowType("INITIAL_DRAFT");
        setBsdClicked(bsd);
        setIsModalOpen(true);
      }

      if (bsd.__typename === "Bsdasri") {
        const path = routes.dashboard.bsdasris.sign.publish;
        redirectToPath(path, bsd.id);
      }
    },
    [redirectToPath]
  );

  const handleActBsdasri = useCallback(
    (bsd: Bsd) => {
      const status = bsd["bsdasriStatus"];
      if (status === BsdasriStatus.Initial) {
        if (isActTab || isAllBsdsTab) {
          const path = routes.dashboard.bsdasris.sign.emission;
          redirectToPath(path, bsd.id);
          return;
        }
        if (isToCollectTab) {
          const formattedBsdAsBsdDisplay = mapBsdasri(bsd as Bsdasri);
          if (
            hasEmportDirect(formattedBsdAsBsdDisplay, siret, isToCollectTab)
          ) {
            const path = routes.dashboard.bsdasris.sign.directTakeover;
            redirectToPath(path, bsd.id);
            return;
          }
          if (
            isSynthesis(formattedBsdAsBsdDisplay.bsdWorkflowType?.toString())
          ) {
            const path = routes.dashboard.bsdasris.sign.synthesisTakeover;
            redirectToPath(path, bsd.id);
          } else {
            const path = routes.dashboard.bsdasris.sign.emissionSecretCode;
            redirectToPath(path, bsd.id);
          }
        }
      }
      if (status === BsdasriStatus.SignedByProducer) {
        const path = routes.dashboard.bsdasris.sign.transporter;
        redirectToPath(path, bsd.id);
      }
      if (status === BsdasriStatus.Sent) {
        const path = routes.dashboard.bsdasris.sign.reception;
        redirectToPath(path, bsd.id);
      }
      if (status === BsdasriStatus.Received) {
        const path = routes.dashboard.bsdasris.sign.operation;
        redirectToPath(path, bsd.id);
      }
    },
    [redirectToPath, isActTab, isToCollectTab, isAllBsdsTab, siret]
  );

  const handleActValidation = useCallback(
    (bsd: Bsd) => {
      if (bsd.__typename === "Form") {
        if (
          bsd?.temporaryStorageDetail &&
          bsd?.status === FormStatus.TempStorerAccepted
        ) {
          setValidationWorkflowType("ACT_BSD_SUITE");
        } else {
          setValidationWorkflowType("ACT_BSDD");
        }
        setBsdClicked(bsd);
        setIsModalOpen(true);
      }

      if (bsd.__typename === "Bsda") {
        setValidationWorkflowType("ACT_BSDA");
        setBsdClicked(bsd);
        setIsModalOpen(true);
      }

      if (bsd.__typename === "Bsdasri") {
        handleActBsdasri(bsd);
      }

      if (bsd.__typename === "Bsff") {
        setValidationWorkflowType("ACT_BSFF");
        setBsdClicked(bsd);
        setIsModalOpen(true);
      }
      if (bsd.__typename === "Bsvhu") {
        setValidationWorkflowType("ACT_BSVHU");
        setBsdClicked(bsd);
        setIsModalOpen(true);
      }
      if (bsd.__typename === "Bspaoh") {
        setValidationWorkflowType("ACT_BSPAOH");
        setBsdClicked(bsd);
        setIsModalOpen(true);
      }
    },
    [handleActBsdasri]
  );

  const handleReviewsValidation = useCallback(
    (bsd: Form | Bsda | Bsdasri, siret: string) => {
      if (canApproveOrRefuseReview(bsd, siret)) {
        setBsdClicked(bsd);
        if (bsd.__typename === "Form") {
          setValidationWorkflowType("REVIEW_BSDD_APPROVE");
          setIsModalOpen(true);
        }
        if (bsd.__typename === "Bsda") {
          setValidationWorkflowType("REVIEW_BSDA_APPROVE");
          setIsModalOpen(true);
        }
        if (bsd.__typename === "Bsdasri") {
          setValidationWorkflowType("REVIEW_BSDASRI_APPROVE");
          setIsModalOpen(true);
        }
      } else {
        setBsdClicked(bsd);
        const bsdDisplay = formatBsd(bsd);
        if (bsd.__typename === "Form") {
          if (canDeleteReview(bsdDisplay!, siret)) {
            setValidationWorkflowType("REVIEW_BSDD_DELETE");
          } else {
            setValidationWorkflowType("REVIEW_BSDD_CONSULT");
          }
          setIsModalOpen(true);
        }
        if (bsd.__typename === "Bsda") {
          if (canDeleteReview(bsdDisplay!, siret)) {
            setValidationWorkflowType("REVIEW_BSDA_DELETE");
          } else {
            setValidationWorkflowType("REVIEW_BSDA_CONSULT");
          }
          setIsModalOpen(true);
        }
        if (bsd.__typename === "Bsdasri") {
          if (canDeleteReview(bsdDisplay!, siret)) {
            setValidationWorkflowType("REVIEW_BSDASRI_DELETE");
          } else {
            setValidationWorkflowType("REVIEW_BSDASRI_CONSULT");
          }
          setIsModalOpen(true);
        }
      }
    },
    []
  );

  const onBsdValidation = useCallback(
    (bsd: Bsd) => {
      if (isReviewsTab) {
        handleReviewsValidation(bsd as Form | Bsda | Bsdasri, siret);
      } else {
        const status =
          bsd.status ||
          bsd["bsdaStatus"] ||
          bsd["bsffStatus"] ||
          bsd["bsdasriStatus"] ||
          bsd["bsvhuStatus"] ||
          bsd["bspaohStatus"];

        const bsdDisplay = formatBsd(bsd) ?? { status };

        if (status === FormStatus.Draft || bsd["isDraft"]) {
          handleDraftValidation(bsd as Bsd);
        } else {
          if (
            hasRoadControlButton(
              bsdDisplay as BsdDisplay,
              isCollectedTab,
              isReturnTab
            )
          ) {
            const path = routes.dashboard.roadControl;
            redirectToPath(path, bsd.id);
          } else {
            handleActValidation(bsd as Bsd);
          }
        }
      }
    },
    [
      isReviewsTab,
      isReturnTab,
      isCollectedTab,
      siret,
      handleDraftValidation,
      handleActValidation,
      handleReviewsValidation,
      redirectToPath
    ]
  );

  const onBsdUpdate = useCallback(
    (bsd: BsdDisplay) => {
      const path = getUpdatePath(bsd);
      redirectToPath(path, bsd.id);
    },
    [redirectToPath]
  );

  const onBsdOverview = useCallback(
    (bsd: BsdDisplay) => {
      const path = getOverviewPath(bsd);
      redirectToPath(path, bsd.id);
    },
    [redirectToPath]
  );
  const onBsdRevision = useCallback(
    (bsd: BsdDisplay) => {
      const path = getRevisionPath(bsd);
      redirectToPath(path, bsd.id);
    },
    [redirectToPath]
  );

  const onCorrection = useCallback((bsd: BsdDisplay) => {
    if (bsd.type === BsdType.Bsff) {
      setValidationWorkflowType("ACT_BSFF");
      setBsdClicked(bsd);
      setIsModalOpen(true);
    }
  }, []);

  const onBsdSuite = useCallback((bsd: BsdDisplay) => {
    if (!bsd.temporaryStorageDetail) {
      setValidationWorkflowType("ACT_BSD_SUITE");
    } else {
      setValidationWorkflowType("ACT_BSDD");
    }
    setBsdClicked(bsd);
    setIsModalOpen(true);
  }, []);

  const onAppendix1 = useCallback(
    (bsd: BsdDisplay) => {
      const path = routes.dashboard.bsdds.view;
      redirectToPath(path, bsd.id);
    },
    [redirectToPath]
  );

  const onConsultReview = useCallback((bsd: BsdDisplay) => {
    if (bsd.type === BsdType.Bsdd) {
      setValidationWorkflowType("REVIEW_BSDD_CONSULT");
    }
    if (bsd.type === BsdType.Bsda) {
      setValidationWorkflowType("REVIEW_BSDA_CONSULT");
    }

    if (bsd.type === BsdType.Bsdasri) {
      setValidationWorkflowType("REVIEW_BSDASRI_CONSULT");
    }
    setBsdClicked(bsd);
    setIsModalOpen(true);
  }, []);

  const onEmitterDasriSign = useCallback(
    (bsd: BsdDisplay) => {
      const path = routes.dashboard.bsdasris.sign.emissionSecretCode;
      redirectToPath(path, bsd.id);
    },
    [redirectToPath]
  );

  const onEmitterBsddSign = useCallback((bsd: BsdDisplay) => {
    setValidationWorkflowType("ACT_BSDD");
    setBsdClicked(bsd);
    setIsModalOpen(true);
    setHasEmitterSignSecondaryCta(true);
  }, []);

  return (
    <>
      <ul className="bsd-card-list" {...keyboardProps}>
        {bsds?.map(({ node }, index) => {
          const key = `${node.id}${node.status}`;
          const hasAutomaticSignature = siretsWithAutomaticSignature?.includes(
            node?.emitter?.company?.siret
          );

          return (
            <li className="bsd-card-list__item" key={key}>
              <BsdCard
                bsd={node}
                posInSet={index}
                setSize={bsds.length}
                currentSiret={siret}
                bsdCurrentTab={bsdCurrentTab}
                onValidate={onBsdValidation}
                secondaryActions={{
                  onUpdate: onBsdUpdate,
                  onOverview: onBsdOverview,
                  onRevision: onBsdRevision,
                  onCorrection,
                  onBsdSuite,
                  onAppendix1,
                  onConsultReview,
                  onEmitterDasriSign,
                  onEmitterBsddSign
                }}
                hasAutomaticSignature={hasAutomaticSignature}
              />
            </li>
          );
        })}
      </ul>
      {(validationWorkflowType === "DRAFT" ||
        validationWorkflowType === "INITIAL_DRAFT") && (
        <DraftValidation
          bsd={bsdClicked}
          currentSiret={siret}
          isOpen={isModalOpen}
          onClose={onClose}
        />
      )}

      {validationWorkflowType === "ACT_BSDD" && (
        <ActBsddValidation
          bsd={bsdClicked as Form}
          currentSiret={siret}
          isOpen={isModalOpen}
          onClose={onClose}
          hasEmitterSignSecondaryCta={hasEmitterSignSecondaryCta}
          hasAutomaticSignature={siretsWithAutomaticSignature?.includes(
            bsdClicked?.emitter?.company?.siret
          )}
        />
      )}
      {validationWorkflowType === "ACT_BSD_SUITE" && (
        <ActBsdSuiteValidation
          bsd={bsdClicked}
          isOpen={isModalOpen}
          onClose={onClose}
        />
      )}
      {validationWorkflowType === "ACT_BSDA" && (
        <ActBsdaValidation
          bsd={bsdClicked as Bsda}
          currentSiret={siret}
          isOpen={isModalOpen}
          onClose={onClose}
        />
      )}
      {validationWorkflowType === "ACT_BSFF" && (
        <ActBsffValidation
          bsd={bsdClicked as Bsff}
          currentSiret={siret}
          isOpen={isModalOpen}
          onClose={onClose}
        />
      )}
      {validationWorkflowType === "ACT_BSVHU" && (
        <ActBsvhuValidation
          bsd={bsdClicked as Bsvhu}
          currentSiret={siret}
          isOpen={isModalOpen}
          onClose={onClose}
        />
      )}

      {validationWorkflowType === "ACT_BSPAOH" && (
        <ActBspaohValidation
          bsd={bsdClicked as Bspaoh}
          currentSiret={siret}
          isOpen={isModalOpen}
          onClose={onClose}
        />
      )}

      {validationWorkflowType === "REVIEW_BSDD_DELETE" && isModalOpen && (
        <RevisionModal
          bsdId={bsdClicked?.id!}
          bsdType={BsdType.Bsdd}
          onModalCloseFromParent={onClose}
          actionType={ActionType.DELETE}
        />
      )}
      {validationWorkflowType === "REVIEW_BSDA_DELETE" && isModalOpen && (
        <RevisionModal
          bsdId={bsdClicked?.id!}
          bsdType={BsdType.Bsda}
          onModalCloseFromParent={onClose}
          actionType={ActionType.DELETE}
        />
      )}
      {validationWorkflowType === "REVIEW_BSDD_APPROVE" && isModalOpen && (
        <RevisionModal
          bsdId={bsdClicked?.id!}
          bsdType={BsdType.Bsdd}
          onModalCloseFromParent={onClose}
          actionType={ActionType.UPDATE}
        />
      )}
      {validationWorkflowType === "REVIEW_BSDASRI_DELETE" && isModalOpen && (
        <RevisionModal
          bsdId={bsdClicked?.id!}
          bsdType={BsdType.Bsdasri}
          onModalCloseFromParent={onClose}
          actionType={ActionType.DELETE}
        />
      )}
      {validationWorkflowType === "REVIEW_BSDA_APPROVE" && isModalOpen && (
        <RevisionModal
          bsdId={bsdClicked?.id!}
          bsdType={BsdType.Bsda}
          onModalCloseFromParent={onClose}
          actionType={ActionType.UPDATE}
        />
      )}
      {validationWorkflowType === "REVIEW_BSDASRI_APPROVE" && isModalOpen && (
        <RevisionModal
          bsdId={bsdClicked?.id!}
          bsdType={BsdType.Bsdasri}
          onModalCloseFromParent={onClose}
          actionType={ActionType.UPDATE}
        />
      )}
      {validationWorkflowType === "REVIEW_BSDD_CONSULT" && isModalOpen && (
        <RevisionModal
          bsdId={bsdClicked?.id!}
          bsdType={BsdType.Bsdd}
          onModalCloseFromParent={onClose}
          actionType={ActionType.CONSUlT}
        />
      )}
      {validationWorkflowType === "REVIEW_BSDA_CONSULT" && isModalOpen && (
        <RevisionModal
          bsdId={bsdClicked?.id!}
          bsdType={BsdType.Bsda}
          onModalCloseFromParent={onClose}
          actionType={ActionType.CONSUlT}
        />
      )}

      {validationWorkflowType === "REVIEW_BSDASRI_CONSULT" && isModalOpen && (
        <RevisionModal
          bsdId={bsdClicked?.id!}
          bsdType={BsdType.Bsdasri}
          onModalCloseFromParent={onClose}
          actionType={ActionType.CONSUlT}
        />
      )}
    </>
  );
}

export default React.memo(BsdCardList);
