import React, { useEffect } from "react";
import { Formik, Field, Form, useFormikContext } from "formik";
import {
  PROCESSING_OPERATIONS,
  PROCESSING_OPERATIONS_GROUPEMENT_CODES,
} from "generated/constants";
import DateInput from "form/custom-inputs/DateInput";
import CompanySelector from "form/company/CompanySelector";
import {
  Form as TdForm,
  FormStatus,
  Mutation,
  MutationMarkAsProcessedArgs,
  Query,
} from "generated/graphql/types";
import { gql, useMutation } from "@apollo/client";
import { statusChangeFragment } from "common/fragments";
import { WorkflowActionProps } from "./WorkflowAction";
import { updateApolloCache } from "common/helper";
import { ACT_TAB_FORMS, HISTORY_TAB_FORMS } from "dashboard/bsds/queries";
import { TdModalTrigger } from "common/components/Modal";
import { ActionButton } from "common/components";
import { IconCogApproved } from "common/components/Icons";
import { NotificationError } from "common/components/Error";
import cogoToast from "cogo-toast";

const MARK_AS_PROCESSED = gql`
  mutation MarkAsProcessed($id: ID!, $processedInfo: ProcessedFormInput!) {
    markAsProcessed(id: $id, processedInfo: $processedInfo) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

function ProcessedInfo({ form, close }: { form: TdForm; close: () => void }) {
  const {
    values: { processingOperationDone, nextDestination },
    setFieldValue,
  } = useFormikContext<MutationMarkAsProcessedArgs["processedInfo"]>();

  useEffect(() => {
    if (
      PROCESSING_OPERATIONS_GROUPEMENT_CODES.includes(processingOperationDone)
    ) {
      if (nextDestination == null) {
        setFieldValue("nextDestination", {
          processingOperation: "",
          company: {
            siret: "",
            name: "",
            address: "",
            contact: "",
            mail: "",
            phone: "",
          },
        });
      }
    } else {
      setFieldValue("nextDestination", null);
    }
  }, [processingOperationDone, nextDestination, setFieldValue]);

  return (
    <Form>
      <div className="form__row">
        <label>
          Nom du responsable
          <Field
            type="text"
            name="processedBy"
            placeholder="NOM Prénom"
            className="td-input"
          />
        </label>
      </div>
      <div className="form__row">
        <label>
          Date de traitement
          <Field
            component={DateInput}
            name="processedAt"
            className="td-input"
          />
        </label>
      </div>
      <div className="form__row">
        <label>Opération d’élimination / valorisation effectuée</label>
        <Field
          component="select"
          name="processingOperationDone"
          className="td-select"
        >
          <option value="">Choisissez...</option>
          {PROCESSING_OPERATIONS.map(operation => (
            <option key={operation.code} value={operation.code}>
              {operation.code} - {operation.description.substr(0, 50)}
              {operation.description.length > 50 ? "..." : ""}
            </option>
          ))}
        </Field>
        <div>
          Code de traitement initialement prévu par le producteur:{" "}
          {form.recipient?.processingOperation}
        </div>
      </div>
      <div className="form__row">
        <label>
          Description de l'Opération
          <Field
            component="textarea"
            name="processingOperationDescription"
            className="td-textarea"
          />
        </label>
      </div>
      <div className="form__row form__row--inline">
        <Field
          type="checkbox"
          name="noTraceability"
          id="id_noTraceability"
          className="td-checkbox"
        />

        <label htmlFor="id_noTraceability">
          {" "}
          Rupture de traçabilité autorisée par arrêté préfectoral pour ce déchet
          - la responsabilité du producteur du déchet est transférée
        </label>
      </div>
      {nextDestination && (
        <div className="form__row">
          <h4>Destination ultérieure prévue</h4>
          <CompanySelector
            name="nextDestination.company"
            allowForeignCompanies
          />

          <div className="form__row">
            <label>Opération d’élimination / valorisation (code D/R)</label>
            <Field
              component="select"
              name="nextDestination.processingOperation"
              className="td-select"
            >
              <option value="">Choisissez...</option>
              {PROCESSING_OPERATIONS.map(operation => (
                <option key={operation.code} value={operation.code}>
                  {operation.code} - {operation.description.substr(0, 50)}
                  {operation.description.length > 50 ? "..." : ""}
                </option>
              ))}
            </Field>
          </div>
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
        <button type="submit" className="btn btn--primary">
          Je valide
        </button>
      </div>
    </Form>
  );
}

export default function MarkAsProcessed({ form, siret }: WorkflowActionProps) {
  const [markAsProcessed, { error }] = useMutation<
    Pick<Mutation, "markAsProcessed">,
    MutationMarkAsProcessedArgs
  >(MARK_AS_PROCESSED, {
    update: (cache, { data }) => {
      if (!data?.markAsProcessed) {
        return;
      }
      const processedForm = data.markAsProcessed;
      // remove form from the action tab
      updateApolloCache<Pick<Query, "forms">>(cache, {
        query: ACT_TAB_FORMS,
        variables: { siret },
        getNewData: data => ({
          forms: [...data.forms].filter(form => form.id !== processedForm.id),
        }),
      });
      // add the form to the history tab
      updateApolloCache<Pick<Query, "forms">>(cache, {
        query: HISTORY_TAB_FORMS,
        variables: { siret },
        getNewData: data => ({
          forms: [processedForm, ...data.forms],
        }),
      });
    },
    onCompleted: data => {
      if (
        data.markAsProcessed &&
        data.markAsProcessed.status === FormStatus.Processed
      ) {
        cogoToast.success(
          `Le traitement du déchet a bien été validé. Vous pouvez retrouver ce bordereau dans l'onglet "Archives".`
        );
      }
    },
  });

  const actionLabel = "Valider le traitement";

  return (
    <TdModalTrigger
      ariaLabel={actionLabel}
      trigger={open => (
        <ActionButton
          title={actionLabel}
          icon={IconCogApproved}
          onClick={open}
        />
      )}
      modalContent={close => (
        <div>
          <Formik
            initialValues={{
              processingOperationDone: "",
              processingOperationDescription: "",
              processedBy: "",
              processedAt: new Date().toISOString(),
              nextDestination: null,
              noTraceability: false,
            }}
            onSubmit={values => {
              markAsProcessed({
                variables: { id: form.id, processedInfo: values },
              });
            }}
          >
            <ProcessedInfo form={form} close={close} />
          </Formik>
          {error && (
            <NotificationError className="action-error" apolloError={error} />
          )}
        </div>
      )}
    />
  );
}
