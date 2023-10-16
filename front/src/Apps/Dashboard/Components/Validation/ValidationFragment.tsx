import React from "react";
import DraftValidation from "./Draft/DraftValidation";
import ActBsddValidation from "./Act/ActBsddValidation";
import ActBsdSuiteValidation from "./Act/ActBsdSuiteValidation";
import ActBsdaValidation from "./Act/ActBsdaValidation";
import ActBsvhuValidation from "./Act/ActBsvhuValidation";
import { BsddCancelRevision } from "dashboard/components/RevisionRequestList/bsdd/approve/BsddCancelRevision";
import { BsdaCancelRevision } from "dashboard/components/RevisionRequestList/bsda/approve/BsdaCancelRevision";
import { BsddApproveRevision } from "dashboard/components/RevisionRequestList/bsdd/approve";
import { BsdaApproveRevision } from "dashboard/components/RevisionRequestList/bsda/approve/BsdaApproveRevision";
import { BsddConsultRevision } from "dashboard/components/RevisionRequestList/bsdd/approve/BsddConsultRevision";
import { BsdaConsultRevision } from "dashboard/components/RevisionRequestList/bsda/approve/BsdaConsultRevision";
import { UpdateTransporterCustomInfo } from "dashboard/components/BSDList/BSFF/BsffActions/UpdateTransporterCustomInfo";
import { default as TransporterInfoEditBsdd } from "dashboard/components/BSDList/BSDD/TransporterInfoEdit";
import { UpdateTransporterPlates } from "dashboard/components/BSDList/BSFF/BsffActions/UpdateTransporterPlates";
import { TransporterInfoEdit as TransporterInfoEditBsda } from "dashboard/components/BSDList/BSDa/WorkflowAction/TransporterInfoEdit";
import ActBsffValidation from "./Act/ActBsffValidation";
import { Bsda, Bsdasri, Bsff, Bsvhu, Form } from "generated/graphql/types";
import { BsffFragment } from "dashboard/components/BSDList/BSFF";
import { UpdateBsdasriTransporterPlates } from "dashboard/components/BSDList/BSDasri/BSDasriActions/UpdateBsdasriTransporterPlates";
import { UpdateBsdasriTransporterInfo } from "dashboard/components/BSDList/BSDasri/BSDasriActions/UpdateBsdasriTransporterInfo";

const ValidationFragment = ({
  validationWorkflowType,
  bsdClicked,
  siret,
  isModalOpen,
  onClose,
  hasEmitterSignSecondaryCta,
  siretsWithAutomaticSignature,
}) => {
  return (
    <>
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

      {validationWorkflowType === "REVIEW_BSDD_DELETE" && (
        <BsddCancelRevision
          // @ts-ignore
          review={bsdClicked?.review}
          isModalOpenFromParent={isModalOpen}
          onModalCloseFromParent={onClose}
        />
      )}
      {validationWorkflowType === "REVIEW_BSDA_DELETE" && (
        <BsdaCancelRevision
          // @ts-ignore
          review={bsdClicked?.review}
          isModalOpenFromParent={isModalOpen}
          onModalCloseFromParent={onClose}
        />
      )}
      {validationWorkflowType === "REVIEW_BSDD_APPROVE" && (
        <BsddApproveRevision
          // @ts-ignore
          review={bsdClicked}
          isModalOpenFromParent={isModalOpen}
          onModalCloseFromParent={onClose}
        />
      )}
      {validationWorkflowType === "REVIEW_BSDA_APPROVE" && (
        <BsdaApproveRevision
          // @ts-ignore
          review={bsdClicked}
          isModalOpenFromParent={isModalOpen}
          onModalCloseFromParent={onClose}
        />
      )}
      {validationWorkflowType === "REVIEW_BSDD_CONSULT" && (
        <BsddConsultRevision
          // @ts-ignore
          review={bsdClicked}
          isModalOpenFromParent={isModalOpen}
          onModalCloseFromParent={onClose}
        />
      )}
      {validationWorkflowType === "REVIEW_BSDA_CONSULT" && (
        <BsdaConsultRevision
          // @ts-ignore
          review={bsdClicked}
          isModalOpenFromParent={isModalOpen}
          onModalCloseFromParent={onClose}
        />
      )}
      {validationWorkflowType === "UPDATE_CUSTOM_INFO_BSDD" && (
        <TransporterInfoEditBsdd
          fieldName="customInfo"
          verboseFieldName="champ libre"
          form={bsdClicked as Form}
          isModalOpenFromParent={isModalOpen}
          onModalCloseFromParent={onClose}
        />
      )}
      {validationWorkflowType === "UPDATE_CUSTOM_INFO_BSFF" && (
        <UpdateTransporterCustomInfo
          bsff={bsdClicked as unknown as BsffFragment}
          isModalOpenFromParent={isModalOpen}
          onModalCloseFromParent={onClose}
        />
      )}
      {validationWorkflowType === "UPDATE_PLATE_INFO_BSDD" && (
        <TransporterInfoEditBsdd
          fieldName="numberPlate"
          verboseFieldName="plaque d'immatriculation"
          form={bsdClicked as Form}
          isModalOpenFromParent={isModalOpen}
          onModalCloseFromParent={onClose}
        />
      )}
      {validationWorkflowType === "UPDATE_CUSTOM_PLATE_BSFF" && (
        <UpdateTransporterPlates
          bsff={bsdClicked as unknown as BsffFragment}
          isModalOpenFromParent={isModalOpen}
          onModalCloseFromParent={onClose}
        />
      )}
      {validationWorkflowType === "UPDATE_INFO_BSDA" && (
        <TransporterInfoEditBsda
          bsda={bsdClicked as Bsda}
          isModalOpenFromParent={isModalOpen}
          onModalCloseFromParent={onClose}
        />
      )}
      {validationWorkflowType === "UPDATE_PLATE_BSDASRI" && (
        <UpdateBsdasriTransporterPlates
          bsdasri={bsdClicked as Bsdasri}
          isModalOpenFromParent={isModalOpen}
          onModalCloseFromParent={onClose}
        />
      )}
      {validationWorkflowType === "UPDATE_CUSTOM_INFO_BSDASRI" && (
        <UpdateBsdasriTransporterInfo
          bsdasri={bsdClicked as Bsdasri}
          isModalOpenFromParent={isModalOpen}
          onModalCloseFromParent={onClose}
        />
      )}
    </>
  );
};

export default React.memo(ValidationFragment);
