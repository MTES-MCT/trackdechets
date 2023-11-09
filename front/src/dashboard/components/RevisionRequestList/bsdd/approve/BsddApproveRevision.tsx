import React from "react";
import * as yup from "yup";
import {
  Broker,
  FormRevisionRequest,
  Mutation,
  MutationSubmitFormRevisionRequestApprovalArgs,
  PackagingInfo,
  Trader
} from "codegen-ui";
import { TdModalTrigger } from "../../../../../Apps/common/Components/Modal/Modal";
import {
  ActionButton,
  Modal,
  RedErrorMessage
} from "../../../../../common/components";
import { IconCogApproved } from "../../../../../Apps/common/Components/Icons/Icons";
import { RevisionField } from "./RevisionField";
import { useMutation } from "@apollo/client";
import { SUBMIT_FORM_REVISION_REQUEST_APPROVAL } from "../../../../../Apps/common/queries/reviews/BsddReviewsQuery";
import { Field, Form, Formik } from "formik";
import { RadioButton } from "../../../../../form/common/components/custom-inputs/RadioButton";
import { formatDate } from "../../../../../common/datetime";
import { getPackagingInfosSummary } from "../../../../../form/bsdd/utils/packagings";
import { useRouteMatch } from "react-router-dom";
import { getOperationModeLabel } from "../../../../../common/operationModes";

type Props = {
  review: FormRevisionRequest;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
};

const validationSchema = yup.object({
  isApproved: yup.string().required()
});

export function BsddApproveRevision({
  review,
  isModalOpenFromParent,
  onModalCloseFromParent
}: Props) {
  const isV2Routes = !!useRouteMatch("/v2/dashboard/");

  const [submitFormRevisionRequestApproval, { loading, error }] = useMutation<
    Pick<Mutation, "submitFormRevisionRequestApproval">,
    MutationSubmitFormRevisionRequestApprovalArgs
  >(SUBMIT_FORM_REVISION_REQUEST_APPROVAL);
  const title = "Acceptation d'une révision";
  if (isV2Routes && isModalOpenFromParent) {
    const formatRevisionAdapter = {
      ...review["review"],
      form: { ...review }
    };
    return (
      <Modal onClose={onModalCloseFromParent!} ariaLabel={title} isOpen>
        <DisplayModalContent
          review={formatRevisionAdapter}
          close={onModalCloseFromParent}
          submitFormRevisionRequestApproval={submitFormRevisionRequestApproval}
          error={error}
          loading={loading}
        />
      </Modal>
    );
  }
  return !isV2Routes ? (
    <TdModalTrigger
      ariaLabel={title}
      trigger={open => (
        <ActionButton icon={<IconCogApproved size="24px" />} onClick={open}>
          Approuver / Refuser
        </ActionButton>
      )}
      modalContent={close => (
        <DisplayModalContent
          review={review}
          close={close}
          submitFormRevisionRequestApproval={submitFormRevisionRequestApproval}
          error={error}
          loading={loading}
        />
      )}
    />
  ) : null;
}

function DisplayModalContent({
  review,
  close,
  submitFormRevisionRequestApproval,
  error,
  loading
}) {
  return (
    <div>
      <DisplayRevision review={review} />

      <Formik
        initialValues={{
          isApproved: ""
        }}
        onSubmit={async ({ isApproved }) => {
          await submitFormRevisionRequestApproval({
            variables: { id: review.id, isApproved: isApproved === "TRUE" }
          });
          close();
        }}
        validationSchema={validationSchema}
      >
        {() => (
          <Form>
            <div>
              <fieldset className="form__row">
                <Field
                  name="isApproved"
                  id="TRUE"
                  label="J'accepte la révision"
                  component={RadioButton}
                />
                <Field
                  name="isApproved"
                  id="FALSE"
                  label="Je refuse la révision"
                  component={RadioButton}
                />
              </fieldset>
              <RedErrorMessage name="isApproved" />
            </div>

            {error && (
              <div
                style={{ marginTop: "2em", marginBottom: "2em" }}
                className="notification notification--warning"
              >
                {error.message}
              </div>
            )}

            <div className="form__actions">
              <button
                type="button"
                className="btn btn--outline-primary"
                onClick={close}
              >
                Annuler
              </button>

              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading}
              >
                Valider
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export function DisplayRevision({ review }: Props) {
  if (review.content.isCanceled) {
    return (
      <>
        <div>
          <p className="tw-pb-6">
            L'entreprise <strong>{review.authoringCompany.name}</strong> a
            demandé l'annulation du bordereau{" "}
            <strong>#{review.form.readableId}</strong>
          </p>
        </div>

        <div className="tw-flex tw-py-2">
          <p className="tw-w-1/4 tw-font-bold">Commentaire</p>
          <p className="tw-w-3/4">{review.comment}</p>
        </div>
      </>
    );
  }

  return (
    <div>
      <p className="tw-pb-6">
        L'entreprise <strong>{review.authoringCompany.name}</strong> a proposé
        les révisions suivantes pour le bordereau{" "}
        <strong>#{review.form.readableId}</strong>
      </p>

      <div className="tw-flex tw-py-2">
        <p className="tw-w-1/4 tw-font-bold">Commentaire</p>
        <p className="tw-w-3/4">{review.comment}</p>
      </div>

      <RevisionField
        label="Code déchet"
        bsddValue={review.form.wasteDetails?.code}
        reviewValue={review.content.wasteDetails?.code}
      />

      <RevisionField
        label="Description déchet"
        bsddValue={review.form.wasteDetails?.name}
        reviewValue={review.content.wasteDetails?.name}
      />

      <RevisionField
        label="Présence de polluants organiques persistants"
        bsddValue={review.form.wasteDetails?.pop}
        reviewValue={review.content.wasteDetails?.pop}
        formatter={booleanFormatter}
      />

      <RevisionField
        label="Description déchet"
        bsddValue={review.form.wasteDetails?.packagingInfos}
        reviewValue={review.content.wasteDetails?.packagingInfos}
        formatter={packagingInfosFormatter}
      />

      <RevisionField
        label="CAP (destination finale)"
        bsddValue={review.form.temporaryStorageDetail?.destination?.cap}
        reviewValue={review.content.temporaryStorageDetail?.destination?.cap}
      />

      <RevisionField
        label={
          review.form?.temporaryStorageDetail
            ? "CAP (entreposage provisoire ou reconditionnement)"
            : "CAP"
        }
        bsddValue={review.form.recipient?.cap}
        reviewValue={review.content.recipient?.cap}
      />

      <RevisionField
        label="Quantité reçue (tonnes)"
        bsddValue={review.form.quantityReceived}
        reviewValue={review.content.quantityReceived}
      />

      <RevisionField
        label="Quantité reçue sur l'installation d'entreposage provisoire ou reconditionnement (tonnes)"
        bsddValue={
          review.form.temporaryStorageDetail?.temporaryStorer?.quantityReceived
        }
        reviewValue={
          review.content.temporaryStorageDetail?.temporaryStorer
            ?.quantityReceived
        }
      />

      <RevisionField
        label="Opération réalisée"
        bsddValue={review.form.processingOperationDone}
        reviewValue={
          [
            review.content.processingOperationDone,
            review.content.destinationOperationMode &&
              `(${getOperationModeLabel(
                review.content.destinationOperationMode ?? ""
              )})`
          ]
            .filter(Boolean)
            .join(" ") || null
        }
      />

      <RevisionField
        label="Description de l'opération réalisée"
        bsddValue={review.form.processingOperationDescription}
        reviewValue={review.content.processingOperationDescription}
      />

      <RevisionField
        label="Courtier"
        bsddValue={review.form.broker}
        reviewValue={review.content.broker}
        formatter={traderAndBrokerFormatter}
      />

      <RevisionField
        label="Négociant"
        bsddValue={review.form.trader}
        reviewValue={review.content.trader}
        formatter={traderAndBrokerFormatter}
      />
    </div>
  );
}

function traderAndBrokerFormatter(
  entity: Trader | Broker | undefined
): React.ReactNode {
  if (!entity?.company?.name) return null;

  return (
    <>
      <div>
        {entity.company?.name} ({entity.company?.siret}) -{" "}
        {entity.company?.address}
      </div>
      <div>
        Récepissé: {entity.receipt} - Département: {entity.department} - Date
        limite de validité:{" "}
        {entity.validityLimit ? formatDate(entity.validityLimit) : ""}
      </div>
    </>
  );
}

function booleanFormatter(entity: boolean | undefined): React.ReactNode {
  if (entity == null) return null;

  return entity ? "Oui" : "Non";
}

function packagingInfosFormatter(
  entity: PackagingInfo[] | undefined
): React.ReactNode {
  if (entity == null || entity.length === 0) return null;

  return getPackagingInfosSummary(entity);
}
