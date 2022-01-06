import { useMutation } from "@apollo/client";
import classNames from "classnames";
import { FieldSwitch, RedErrorMessage } from "common/components";
import { WasteCode, wasteCodeValidator } from "form/bsdd/components/waste-code";
import {
  getInitialBroker,
  getInitialTrader,
} from "form/bsdd/utils/initial-state";
import CompanySelector from "form/common/components/company/CompanySelector";
import DateInput from "form/common/components/custom-inputs/DateInput";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import ProcessingOperation from "form/common/components/processing-operation/ProcessingOperation";
import { Field, Form, Formik } from "formik";
import {
  Form as Bsdd,
  Mutation,
  MutationCreateFormRevisionRequestArgs,
} from "generated/graphql/types";
import React from "react";
import { useHistory } from "react-router";
import * as yup from "yup";
import { removeEmptyKeys } from "../../../../../common/helper";
import { CREATE_FORM_REVISION_REQUEST } from "../query";
import styles from "./BsddRequestRevision.module.scss";
import { ReviewableField } from "./ReviewableField";

type Props = {
  bsdd: Bsdd;
};

const initialReview = {
  wasteDetails: {
    code: "",
    pop: false,
  },
  trader: getInitialTrader(),
  broker: getInitialBroker(),
  recipient: {
    cap: "",
  },
  quantityReceived: null,
  processingOperationDone: "",
  temporaryStorageDetail: {
    destination: {
      cap: "",
      processingOperation: "",
    },
  },
};

const validationSchema = yup.object({
  comment: yup
    .string()
    .required(
      "Vous devez ajouter un commentaire expliquant la demande de révision"
    ),
});

export function BsddRequestRevision({ bsdd }: Props) {
  const history = useHistory();
  const [createFormRevisionRequest, { loading, error }] = useMutation<
    Pick<Mutation, "createFormRevisionRequest">,
    MutationCreateFormRevisionRequestArgs
  >(CREATE_FORM_REVISION_REQUEST);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        Demander une révision du bordereau {bsdd.readableId}
      </h2>

      <Formik
        initialValues={{ comment: "", content: initialReview }}
        validationSchema={validationSchema}
        onSubmit={async ({ content, comment }) => {
          const cleanedContent = removeEmptyKeys(content);

          await createFormRevisionRequest({
            variables: {
              input: {
                formId: bsdd.id,
                content: cleanedContent ?? {},
                comment,
              },
            },
          });
          history.goBack();
        }}
      >
        {({ setFieldValue, values }) => (
          <Form>
            <div className={styles.fields}>
              <ReviewableField
                title="CAP"
                value={bsdd.recipient?.cap}
                name="content.recipient.cap"
                defaultValue={initialReview.recipient.cap}
              >
                <Field
                  name="content.recipient.cap"
                  className="td-input td-input--medium"
                />
              </ReviewableField>

              <ReviewableField
                title="Code déchet"
                value={bsdd.wasteDetails?.code}
                name="content.wasteDetails.code"
                defaultValue={initialReview.wasteDetails.code}
              >
                <WasteCode
                  name="content.wasteDetails.code"
                  validate={wasteCodeValidator}
                />
              </ReviewableField>

              <ReviewableField
                title="Présence de polluants organiques persistants"
                value={Boolean(bsdd.wasteDetails?.pop) ? "Oui" : "Non"}
                name="content.wasteDetails.pop"
                defaultValue={initialReview.wasteDetails.pop}
              >
                <Field
                  type="checkbox"
                  component={FieldSwitch}
                  name="content.wasteDetails.pop"
                  label=""
                />{" "}
                {Boolean(values.content.wasteDetails.pop) ? "Oui" : "Non"}
              </ReviewableField>

              <ReviewableField
                title="Quantité traitée"
                value={bsdd.quantityReceived}
                name="content.quantityReceived"
                defaultValue={initialReview.quantityReceived}
              >
                <Field
                  name="content.quantityReceived"
                  className="td-input td-input--small"
                  component={NumberInput}
                />
              </ReviewableField>

              <ReviewableField
                title="Code de l'opération D/R"
                value={bsdd.processingOperationDone}
                name="content.processingOperationDone"
                defaultValue={initialReview.processingOperationDone}
              >
                <Field
                  component={ProcessingOperation}
                  name="content.processingOperationDone"
                />
              </ReviewableField>

              <ReviewableField
                title="Courtier"
                value={
                  bsdd.broker?.company?.name ? (
                    <div>{bsdd.broker.company.name}</div>
                  ) : (
                    "Aucun"
                  )
                }
                name="content.broker"
                defaultValue={initialReview.broker}
              >
                <>
                  <CompanySelector
                    name="content.broker.company"
                    onCompanySelected={broker => {
                      if (broker.brokerReceipt) {
                        setFieldValue(
                          "content.broker.receipt",
                          broker.brokerReceipt.receiptNumber
                        );
                        setFieldValue(
                          "content.broker.validityLimit",
                          broker.brokerReceipt.validityLimit
                        );
                        setFieldValue(
                          "broker.department",
                          broker.brokerReceipt.department
                        );
                      } else {
                        setFieldValue("content.broker.receipt", "");
                        setFieldValue("content.broker.validityLimit", null);
                        setFieldValue("content.broker.department", "");
                      }
                    }}
                  />
                  <div className="form__row">
                    <label>
                      Numéro de récépissé
                      <Field
                        type="text"
                        name="content.broker.receipt"
                        className="td-input"
                      />
                    </label>

                    <RedErrorMessage name="content.broker.receipt" />
                  </div>
                  <div className="form__row">
                    <label>
                      Département
                      <Field
                        type="text"
                        name="content.broker.department"
                        placeholder="Ex: 83"
                        className={classNames(
                          "td-input",
                          styles.recipientDepartment
                        )}
                      />
                    </label>

                    <RedErrorMessage name="content.broker.department" />
                  </div>
                  <div className="form__row">
                    <label>
                      Limite de validité
                      <Field
                        component={DateInput}
                        name="content.broker.validityLimit"
                        className={classNames(
                          "td-input",
                          styles.recipientValidityLimit
                        )}
                      />
                    </label>

                    <RedErrorMessage name="content.broker.validityLimit" />
                  </div>
                </>
              </ReviewableField>

              <ReviewableField
                title="Négociant"
                value={
                  bsdd.trader?.company?.name ? (
                    <div>{bsdd.trader.company.name}</div>
                  ) : (
                    "Aucun"
                  )
                }
                name="content.trader"
                defaultValue={initialReview.trader}
              >
                <>
                  <CompanySelector
                    name="content.trader.company"
                    onCompanySelected={trader => {
                      if (trader.traderReceipt) {
                        setFieldValue(
                          "content.trader.receipt",
                          trader.traderReceipt.receiptNumber
                        );
                        setFieldValue(
                          "content.trader.validityLimit",
                          trader.traderReceipt.validityLimit
                        );
                        setFieldValue(
                          "trader.department",
                          trader.traderReceipt.department
                        );
                      } else {
                        setFieldValue("content.trader.receipt", "");
                        setFieldValue("content.trader.validityLimit", null);
                        setFieldValue("content.trader.department", "");
                      }
                    }}
                  />
                  <div className="form__row">
                    <label>
                      Numéro de récépissé
                      <Field
                        type="text"
                        name="content.trader.receipt"
                        className="td-input"
                      />
                    </label>

                    <RedErrorMessage name="content.trader.receipt" />
                  </div>
                  <div className="form__row">
                    <label>
                      Département
                      <Field
                        type="text"
                        name="content.trader.department"
                        placeholder="Ex: 83"
                        className={classNames(
                          "td-input",
                          styles.recipientDepartment
                        )}
                      />
                    </label>

                    <RedErrorMessage name="content.trader.department" />
                  </div>
                  <div className="form__row">
                    <label>
                      Limite de validité
                      <Field
                        component={DateInput}
                        name="content.trader.validityLimit"
                        className={classNames(
                          "td-input",
                          styles.recipientValidityLimit
                        )}
                      />
                    </label>

                    <RedErrorMessage name="content.trader.validityLimit" />
                  </div>
                </>
              </ReviewableField>

              <div className="form__row">
                <label>Commentaire à propos de la révision</label>
                <Field name="comment" as="textarea" className="td-textarea" />
                <RedErrorMessage name="comment" />
              </div>
            </div>

            {error && (
              <div className="notification notification--warning">
                {error.message}
              </div>
            )}

            <div className={styles.actions}>
              <button
                className="btn btn--outline-primary"
                onClick={() => {
                  history.goBack();
                }}
              >
                Annuler
              </button>
              <button
                className="btn btn--primary"
                type="submit"
                disabled={loading}
              >
                Envoyer
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
