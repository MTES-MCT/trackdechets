import React from "react";
import * as yup from "yup";
import {
  Broker,
  FormRevisionRequest,
  Mutation,
  MutationSubmitFormRevisionRequestApprovalArgs,
  Trader
} from "@trackdechets/codegen/src/front.gen";
import { TdModalTrigger } from "common/components/Modal";
import { ActionButton, RedErrorMessage } from "common/components";
import { IconCogApproved } from "common/components/Icons";
import { RevisionField } from "./RevisionField";
import { useMutation } from "@apollo/client";
import { SUBMIT_FORM_REVISION_REQUEST_APPROVAL } from "../query";
import { Field, Form, Formik } from "formik";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";

type Props = {
  review: FormRevisionRequest;
};

const validationSchema = yup.object({
  isApproved: yup.string().required()
});

export function BsddApproveRevision({ review }: Props) {
  const [submitFormRevisionRequestApproval, { loading }] = useMutation<
    Pick<Mutation, "submitFormRevisionRequestApproval">,
    MutationSubmitFormRevisionRequestApprovalArgs
  >(SUBMIT_FORM_REVISION_REQUEST_APPROVAL);

  return (
    <TdModalTrigger
      ariaLabel="Acceptation d'une révision"
      trigger={open => (
        <ActionButton icon={<IconCogApproved size="24px" />} onClick={open}>
          Approuver / Refuser
        </ActionButton>
      )}
      modalContent={close => (
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
      )}
    />
  );
}

export function DisplayRevision({ review }: Props) {
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
        label="Présence de polluants organiques persistants"
        bsddValue={review.form.wasteDetails?.pop}
        reviewValue={review.content.wasteDetails?.pop}
        formatter={booleanFormatter}
      />

      <RevisionField
        label="CAP"
        bsddValue={review.form.recipient?.cap}
        reviewValue={review.content.recipient?.cap}
      />

      <RevisionField
        label="Poids reçu"
        bsddValue={review.form.quantityReceived}
        reviewValue={review.content.quantityReceived}
      />

      <RevisionField
        label="Opération réalisée"
        bsddValue={review.form.processingOperationDone}
        reviewValue={review.content.processingOperationDone}
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
        limite de validité: {entity.validityLimit}
      </div>
    </>
  );
}

function booleanFormatter(entity: boolean | undefined): React.ReactNode {
  if (entity == null) return null;

  return entity ? "Oui" : "Non";
}
