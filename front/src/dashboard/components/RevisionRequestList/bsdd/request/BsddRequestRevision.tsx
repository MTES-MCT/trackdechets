import { useMutation } from "@apollo/client";
import classNames from "classnames";
import { FieldSwitch, RedErrorMessage } from "common/components";
import Packagings from "form/bsdd/components/packagings/Packagings";
import {
  WasteCodeSelect,
  bsddWasteCodeValidator,
} from "form/bsdd/components/waste-code";
import {
  getInitialBroker,
  getInitialTrader,
} from "form/bsdd/utils/initial-state";
import { getPackagingInfosSummary } from "form/bsdd/utils/packagings";
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
import { useParams } from "react-router-dom";
import * as yup from "yup";
import { removeEmptyKeys } from "../../../../../common/helper";
import { CREATE_FORM_REVISION_REQUEST } from "Apps/common/queries/reviews/BsddReviewsQuery";
import styles from "./BsddRequestRevision.module.scss";
import { ReviewableField } from "./ReviewableField";
import { BsddRequestRevisionCancelationInput } from "../BsddRequestRevisionCancelationInput";

type Props = {
  bsdd: Bsdd;
};

const initialReview = {
  wasteDetails: {
    code: "",
    name: "",
    pop: "",
    packagingInfos: [],
  },
  trader: getInitialTrader(),
  broker: getInitialBroker(),
  recipient: {
    cap: "",
  },
  quantityReceived: null,
  processingOperationDone: "",
  processingOperationDescription: "",
  temporaryStorageDetail: {
    temporaryStorer: {
      quantityReceived: null,
    },
    destination: {
      cap: "",
      processingOperation: "",
    },
  },
  isCanceled: false,
};

const validationSchema = yup.object({
  comment: yup
    .string()
    .required(
      "Vous devez ajouter un commentaire expliquant la demande de révision"
    ),
});

export function BsddRequestRevision({ bsdd }: Props) {
  const { siret } = useParams<{ siret: string }>();
  const history = useHistory();
  const [createFormRevisionRequest, { loading, error }] = useMutation<
    Pick<Mutation, "createFormRevisionRequest">,
    MutationCreateFormRevisionRequestArgs
  >(CREATE_FORM_REVISION_REQUEST);

  const isTempStorage = !!bsdd.temporaryStorageDetail;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        Demander une révision du bordereau {bsdd.readableId}
      </h2>

      <Formik
        initialValues={{
          comment: "",
          content: initialReview,
          emitter: { type: bsdd?.emitter?.type },
        }}
        validationSchema={validationSchema}
        onSubmit={async ({ content, comment }) => {
          let cleanedContent;

          if (content.isCanceled) cleanedContent = { isCanceled: true };
          else cleanedContent = removeEmptyKeys(content);

          await createFormRevisionRequest({
            variables: {
              input: {
                formId: bsdd.id,
                content: cleanedContent ?? {},
                comment,
                authoringCompanySiret: siret,
              },
            },
          });
          history.goBack();
        }}
      >
        {({ setFieldValue, values }) => {
          // One cannot ask for cancelation AND modifications, they are exclusive
          const areModificationsDisabled = values.content.isCanceled;

          return (
            <Form>
              <div className={styles.fields}>
                <BsddRequestRevisionCancelationInput
                  bsdd={bsdd}
                  defaultValue={initialReview.isCanceled}
                  onChange={value => setFieldValue("content.isCanceled", value)}
                />

                <div
                  style={{
                    display: areModificationsDisabled ? "none" : "inline",
                  }}
                >
                  <hr />

                  {isTempStorage ? (
                    <>
                      <ReviewableField
                        title="CAP destination finale"
                        value={bsdd.temporaryStorageDetail?.destination?.cap}
                        name="content.temporaryStorageDetail.destination.cap"
                        defaultValue={
                          initialReview.temporaryStorageDetail?.destination?.cap
                        }
                      >
                        <Field
                          name="content.temporaryStorageDetail.destination.cap"
                          className="td-input td-input--medium"
                        />
                      </ReviewableField>
                      <ReviewableField
                        title="CAP entreposage provisoire ou reconditionnement"
                        value={bsdd.recipient?.cap}
                        name="content.recipient.cap"
                        defaultValue={initialReview.recipient.cap}
                      >
                        <Field
                          name="content.recipient.cap"
                          className="td-input td-input--medium"
                        />
                      </ReviewableField>
                    </>
                  ) : (
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
                  )}

                  <ReviewableField
                    title="Code déchet"
                    value={bsdd.wasteDetails?.code}
                    name="content.wasteDetails.code"
                    defaultValue={initialReview.wasteDetails.code}
                  >
                    <Field
                      name="content.wasteDetails.code"
                      component={WasteCodeSelect}
                      validate={bsddWasteCodeValidator}
                    />
                  </ReviewableField>

                  <ReviewableField
                    title="Description du déchet"
                    value={bsdd.wasteDetails?.name}
                    name="content.wasteDetails.name"
                    defaultValue={initialReview.wasteDetails.name}
                  >
                    <Field
                      name="content.wasteDetails.name"
                      className="td-input"
                    />
                  </ReviewableField>

                  <ReviewableField
                    title="Présence de polluants organiques persistants"
                    value={Boolean(bsdd.wasteDetails?.pop) ? "Oui" : "Non"}
                    name="content.wasteDetails.pop"
                    defaultValue={initialReview.wasteDetails.pop}
                    initialValue={false}
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
                    title="Conditionnement"
                    value={
                      bsdd.wasteDetails?.packagingInfos
                        ? getPackagingInfosSummary(
                            bsdd.wasteDetails.packagingInfos
                          )
                        : ""
                    }
                    name="content.wasteDetails.packagingInfos"
                    defaultValue={initialReview.wasteDetails.packagingInfos}
                  >
                    <Field
                      name="content.wasteDetails.packagingInfos"
                      component={Packagings}
                    />
                  </ReviewableField>

                  <ReviewableField
                    title="Quantité reçue (tonnes)"
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

                  {isTempStorage && (
                    <ReviewableField
                      title="Quantité reçue sur l'installation d'entreposage provisoire ou reconditionnement (tonnes)"
                      value={
                        bsdd.temporaryStorageDetail?.temporaryStorer
                          ?.quantityReceived
                      }
                      name="content.temporaryStorageDetail.temporaryStorer.quantityReceived"
                      defaultValue={
                        initialReview.temporaryStorageDetail?.temporaryStorer
                          ?.quantityReceived
                      }
                    >
                      <Field
                        name="content.temporaryStorageDetail.temporaryStorer.quantityReceived"
                        className="td-input td-input--small"
                        component={NumberInput}
                      />
                    </ReviewableField>
                  )}

                  <ReviewableField
                    title="Code de l'opération D/R"
                    value={bsdd.processingOperationDone}
                    name="content.processingOperationDone"
                    defaultValue={initialReview.processingOperationDone}
                  >
                    <Field
                      component={ProcessingOperation}
                      name="content.processingOperationDone"
                      enableReuse
                    />
                  </ReviewableField>

                  <ReviewableField
                    title="Description de l'opération D/R"
                    value={bsdd.processingOperationDescription}
                    name="content.processingOperationDescription"
                    defaultValue={initialReview.processingOperationDescription}
                  >
                    <Field
                      name="content.processingOperationDescription"
                      className="td-input"
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
                          if (broker?.brokerReceipt) {
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
                          if (trader?.traderReceipt) {
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
                </div>

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
                  type="button"
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
          );
        }}
      </Formik>
    </div>
  );
}
