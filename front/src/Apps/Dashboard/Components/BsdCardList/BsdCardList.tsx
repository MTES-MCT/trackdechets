import React, { useCallback, useState } from "react";
import { generatePath, useHistory, useLocation } from "react-router-dom";
import { BsdCardListProps } from "./bsdCardListTypes";
import BsdCard from "../BsdCard/BsdCard";
import {
  Bsd,
  BsdType,
  BsdasriStatus,
  FormStatus,
  Bsdasri,
} from "../../../../generated/graphql/types";

import "./bsdCardList.scss";
import routes from "Apps/routes";
import { BsdDisplay, BsdWithReview } from "Apps/common/types/bsdTypes";
import {
  canApproveOrRefuseReview,
  hasEmportDirect,
  hasRoadControlButton,
  isSynthesis,
} from "Apps/Dashboard/dashboardServices";
import { mapBsdasri } from "Apps/Dashboard/bsdMapper";
import ValidationFragment from "../Validation/ValidationFragment";

function BsdCardList({
  siret,
  bsds,
  bsdCurrentTab,
  siretsWithAutomaticSignature,
}: BsdCardListProps): JSX.Element {
  const history = useHistory();
  const location = useLocation();
  const isReviewsTab = bsdCurrentTab === "reviewsTab";
  const isActTab = bsdCurrentTab === "actTab";
  const isToCollectTab = bsdCurrentTab === "toCollectTab";
  const isCollectedTab = bsdCurrentTab === "collectedTab";

  const redirectToPath = useCallback(
    (path, id) => {
      if (path) {
        history.push({
          pathname: generatePath(path, {
            siret,
            id,
          }),
          state: { background: location },
        });
      }
    },
    [history, location, siret]
  );

  const [validationWorkflowType, setValidationWorkflowType] =
    useState<string>();
  const [bsdClicked, setBsdClicked] = useState<Bsd | BsdDisplay>();

  const [isModalOpen, setIsModalOpen] = useState(true);

  const [hasEmitterSignSecondaryCta, setHasEmitterSignSecondaryCta] =
    useState(false);

  const onClose = useCallback(() => {
    setIsModalOpen(false);
    setBsdClicked(undefined);
    setValidationWorkflowType("");
    setHasEmitterSignSecondaryCta(false);
  }, []);

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
        bsd.__typename === "Bsvhu"
      ) {
        setValidationWorkflowType("INITIAL_DRAFT");
        setBsdClicked(bsd);
        setIsModalOpen(true);
      }

      if (bsd.__typename === "Bsdasri") {
        const path = routes.dashboardv2.bsdasris.sign.publish;
        redirectToPath(path, bsd.id);
      }
    },
    [redirectToPath]
  );

  const handleActBsdasri = useCallback(
    (bsd: Bsd) => {
      const status = bsd["bsdasriStatus"];
      if (status === BsdasriStatus.Initial) {
        if (isActTab) {
          const path = routes.dashboardv2.bsdasris.sign.emission;
          redirectToPath(path, bsd.id);
        }
        if (isToCollectTab) {
          const formattedBsdAsBsdDisplay = mapBsdasri(bsd as Bsdasri);
          if (
            hasEmportDirect(formattedBsdAsBsdDisplay, siret, isToCollectTab)
          ) {
            const path = routes.dashboardv2.bsdasris.sign.directTakeover;
            redirectToPath(path, bsd.id);
          }
          if (
            isSynthesis(formattedBsdAsBsdDisplay.bsdWorkflowType?.toString())
          ) {
            const path = routes.dashboardv2.bsdasris.sign.synthesisTakeover;
            redirectToPath(path, bsd.id);
          } else {
            const path = routes.dashboardv2.bsdasris.sign.emissionSecretCode;
            redirectToPath(path, bsd.id);
          }
        }
      }
      if (status === BsdasriStatus.SignedByProducer) {
        const path = routes.dashboardv2.bsdasris.sign.transporter;
        redirectToPath(path, bsd.id);
      }
      if (status === BsdasriStatus.Sent) {
        const path = routes.dashboardv2.bsdasris.sign.reception;
        redirectToPath(path, bsd.id);
      }
      if (status === BsdasriStatus.Received) {
        const path = routes.dashboardv2.bsdasris.sign.operation;
        redirectToPath(path, bsd.id);
      }
    },
    [redirectToPath, isActTab, isToCollectTab, siret]
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
    },
    [handleActBsdasri]
  );

  const handleReviewsValidation = useCallback(
    (bsd: Bsd | BsdWithReview, siret: string) => {
      //@ts-ignore
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
      } else {
        setBsdClicked(bsd);
        if (bsd.__typename === "Form") {
          setValidationWorkflowType("REVIEW_BSDD_CONSULT");
          setIsModalOpen(true);
        }
        if (bsd.__typename === "Bsda") {
          setValidationWorkflowType("REVIEW_BSDA_CONSULT");
          setIsModalOpen(true);
        }
      }
    },
    []
  );

  const onBsdValidation = useCallback(
    (bsd: Bsd | BsdWithReview) => {
      if (isReviewsTab) {
        handleReviewsValidation(bsd, siret);
      } else {
        const status =
          bsd.status ||
          bsd["bsdaStatus"] ||
          bsd["bsffStatus"] ||
          bsd["bsdasriStatus"] ||
          bsd["bsvhuStatus"];
        if (status === FormStatus.Draft || bsd["isDraft"]) {
          handleDraftValidation(bsd as Bsd);
        } else {
          if (hasRoadControlButton({ status } as BsdDisplay, isCollectedTab)) {
            const path = routes.dashboardv2.roadControl;
            redirectToPath(path, bsd.id);
          } else {
            handleActValidation(bsd as Bsd);
          }
        }
      }
    },
    [
      isReviewsTab,
      isCollectedTab,
      siret,
      handleDraftValidation,
      handleActValidation,
      handleReviewsValidation,
      redirectToPath,
    ]
  );

  const handleEditTransportInfo = useCallback((bsd: Bsd, infoName: string) => {
    if (bsd.__typename === "Form") {
      if (infoName === "transporterCustomInfo") {
        setValidationWorkflowType("UPDATE_CUSTOM_INFO_BSDD");
      } else if (infoName === "transporterNumberPlate") {
        setValidationWorkflowType("UPDATE_PLATE_INFO_BSDD");
      }
    }

    if (bsd.__typename === "Bsda") {
      setValidationWorkflowType("UPDATE_INFO_BSDA");
    }

    if (bsd.__typename === "Bsff") {
      if (infoName === "transporterCustomInfo") {
        setValidationWorkflowType("UPDATE_CUSTOM_INFO_BSFF");
      } else {
        setValidationWorkflowType("UPDATE_CUSTOM_PLATE_BSFF");
      }
    }

    if (bsd.__typename === "Bsdasri") {
      if (infoName === "transporterCustomInfo") {
        setValidationWorkflowType("UPDATE_CUSTOM_INFO_BSDASRI");
      } else {
        setValidationWorkflowType("UPDATE_PLATE_BSDASRI");
      }
    }

    setBsdClicked(bsd);
    setIsModalOpen(true);
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
      const path = routes.dashboardv2.bsdds.view;
      redirectToPath(path, bsd.id);
    },
    [redirectToPath]
  );

  const onDeleteReview = useCallback((bsd: BsdDisplay) => {
    if (bsd.type === BsdType.Bsdd) {
      setValidationWorkflowType("REVIEW_BSDD_DELETE");
    }
    if (bsd.type === BsdType.Bsda) {
      setValidationWorkflowType("REVIEW_BSDA_DELETE");
    }
    setBsdClicked(bsd);
    setIsModalOpen(true);
  }, []);

  const onEmitterDasriSign = useCallback(
    (bsd: BsdDisplay) => {
      const path = routes.dashboardv2.bsdasris.sign.emissionSecretCode;
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

  const formatReviewsToBsdDisplay = useCallback(node => {
    // format reviews from bsdd and bsda in one list
    // BSDD
    const newBsddNode = { ...node?.form };
    const reviewBsdd = { ...node };
    delete reviewBsdd?.form;
    newBsddNode.review = reviewBsdd;
    // BSDA
    const newBsdaNode = { ...node?.bsda };
    const reviewBsda = { ...node };
    delete reviewBsda?.bsda;
    newBsddNode.review = reviewBsdd;
    return { ...newBsddNode, ...newBsdaNode };
  }, []);

  const secondaryActions = {
    onBsdSuite,
    onAppendix1,
    onDeleteReview,
    onEmitterDasriSign,
    onEmitterBsddSign,
  };

  return (
    <>
      <ul className="bsd-card-list">
        {bsds?.map(({ node }) => {
          let bsdNode = node;
          // A supprimer le block isReviewsTab quand on pourra afficher une révision avec la requete bsds
          if (isReviewsTab) {
            bsdNode = formatReviewsToBsdDisplay(node);
          }

          const hasAutomaticSignature = siretsWithAutomaticSignature?.includes(
            bsdNode?.emitter?.company?.siret
          );

          return (
            <li
              className="bsd-card-list__item"
              key={`${node.id}${node.status}`}
            >
              <BsdCard
                bsd={bsdNode}
                currentSiret={siret}
                bsdCurrentTab={bsdCurrentTab}
                onValidate={onBsdValidation}
                onEditTransportInfo={handleEditTransportInfo}
                secondaryActions={secondaryActions}
                hasAutomaticSignature={hasAutomaticSignature}
              />
            </li>
          );
        })}
      </ul>
      <ValidationFragment
        validationWorkflowType={validationWorkflowType}
        bsdClicked={bsdClicked}
        siret={siret}
        isModalOpen={isModalOpen}
        onClose={onClose}
        hasEmitterSignSecondaryCta={hasEmitterSignSecondaryCta}
        siretsWithAutomaticSignature={siretsWithAutomaticSignature}
      />
    </>
  );
}

export default React.memo(BsdCardList);
