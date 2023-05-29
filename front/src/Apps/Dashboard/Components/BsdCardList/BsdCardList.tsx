import React, { useCallback, useState } from "react";
import { generatePath, useHistory, useLocation } from "react-router-dom";
import { BsdCardListProps } from "./bsdCardListTypes";
import BsdCard from "../BsdCard/BsdCard";
import {
  Bsd,
  Bsda,
  BsdasriStatus,
  Bsff,
  Bsvhu,
  Form,
  FormStatus,
} from "../../../../generated/graphql/types";

import "./bsdCardList.scss";
import {
  getOverviewPath,
  getRevisionPath,
  getUpdatePath,
} from "../../dashboardUtils";
import DraftValidation from "Apps/Dashboard/Components/Validation/Draft/DraftValidation";
import routes from "common/routes";
import ActBsddValidation from "Apps/Dashboard/Components/Validation/Act/ActBsddValidation";
import ActBsdSuiteValidation from "Apps/Dashboard/Components/Validation/Act/ActBsdSuiteValidation";
import ActBsdaValidation from "Apps/Dashboard/Components/Validation/Act/ActBsdaValidation";
import ActBsffValidation from "Apps/Dashboard/Components/Validation/Act/ActBsffValidation";
import ActBsvhuValidation from "Apps/Dashboard/Components/Validation/Act/ActBsvhuValidation";

function BsdCardList({
  siret,
  bsds,
  bsdCurrentTab,
}: BsdCardListProps): JSX.Element {
  const history = useHistory();
  const location = useLocation();

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
  const [bsdClicked, setBsdClicked] = useState<Bsd>();

  const [isModalOpen, setIsModalOpen] = useState(true);

  const onClose = () => {
    setIsModalOpen(false);
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
        const path = routes.dashboardv2.bsdasris.sign.emission;
        redirectToPath(path, bsd.id);
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
    [redirectToPath]
  );

  const handleActValidation = useCallback(
    (bsd: Bsd) => {
      if (bsd.__typename === "Form") {
        if (!bsd?.temporaryStorageDetail) {
          setValidationWorkflowType("ACT_BSDD");
        } else {
          setValidationWorkflowType("ACT_BSD_SUITE");
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

  const onBsdValidation = useCallback(
    (bsd: Bsd) => {
      if (bsd.status === FormStatus.Draft || bsd["isDraft"]) {
        handleDraftValidation(bsd);
      } else {
        handleActValidation(bsd);
      }
    },
    [handleDraftValidation, handleActValidation]
  );

  const onBsdUpdate = useCallback(
    (bsd: Bsd) => {
      const path = getUpdatePath(bsd);
      redirectToPath(path, bsd.id);
    },
    [redirectToPath]
  );

  const onBsdOverview = useCallback(
    (bsd: Bsd) => {
      const path = getOverviewPath(bsd);
      redirectToPath(path, bsd.id);
    },
    [redirectToPath]
  );
  const onBsdRevision = useCallback(
    (bsd: Bsd) => {
      const path = getRevisionPath(bsd);
      redirectToPath(path, bsd.id);
    },
    [redirectToPath]
  );

  const onBsdSuite = useCallback((bsd: Bsd) => {
    if (!bsd["temporaryStorageDetail"]) {
      setValidationWorkflowType("ACT_BSD_SUITE");
    } else {
      setValidationWorkflowType("ACT_BSDD");
    }
    setBsdClicked(bsd);
    setIsModalOpen(true);
  }, []);

  const onAppendix1 = useCallback(
    (bsd: Bsd) => {
      const path = routes.dashboardv2.bsdds.view;
      redirectToPath(path, bsd.id);
    },
    [redirectToPath]
  );

  return (
    <>
      <ul className="bsd-card-list">
        {bsds?.map(bsd => {
          const { node } = bsd;
          return (
            <li className="bsd-card-list__item" key={node.id}>
              <BsdCard
                bsd={node}
                currentSiret={siret}
                bsdCurrentTab={bsdCurrentTab}
                onValidate={onBsdValidation}
                onUpdate={onBsdUpdate}
                onOverview={onBsdOverview}
                onRevision={onBsdRevision}
                onBsdSuite={onBsdSuite}
                onAppendix1={onAppendix1}
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
    </>
  );
}

export default React.memo(BsdCardList);
