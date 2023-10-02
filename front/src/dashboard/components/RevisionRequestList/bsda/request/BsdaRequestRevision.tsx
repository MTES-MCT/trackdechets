import { useMutation } from "@apollo/client";
import { Field, Form, Formik } from "formik";
import React, { lazy } from "react";
import { useHistory } from "react-router";
import { useParams } from "react-router-dom";
import * as yup from "yup";
import classNames from "classnames";
import { FieldSwitch, RedErrorMessage } from "common/components";
import Packagings, {
  PACKAGINGS_NAMES,
} from "form/bsda/components/packagings/Packagings";
import { getInitialCompany } from "form/bsdd/utils/initial-state";
import CompanySelector from "form/common/components/company/CompanySelector";
import DateInput from "form/common/components/custom-inputs/DateInput";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import WorkSiteAddress from "form/common/components/work-site/WorkSiteAddress";
import {
  Bsda,
  Mutation,
  MutationCreateBsdaRevisionRequestArgs,
} from "generated/graphql/types";
import { removeEmptyKeys } from "../../../../../common/helper";
import { ReviewableField } from "../../bsdd/request/ReviewableField";
import { CREATE_BSDA_REVISION_REQUEST } from "../../../../../Apps/common/queries/reviews/BsdaReviewQuery";
import styles from "./BsdaRequestRevision.module.scss";
import { BSDA_WASTES } from "generated/constants";
import { BsdaRequestRevisionCancelationInput } from "../BsdaRequestRevisionCancelationInput";
import OperationModeSelect from "common/components/OperationModeSelect";
const TagsInput = lazy(() => import("common/components/tags-input/TagsInput"));

type Props = {
  bsda: Bsda;
};

const initialReview = {
  emitter: {
    pickupSite: {
      name: "",
      address: "",
      city: "",
      postalCode: "",
      infos: "",
    },
  },
  waste: {
    code: "",
    pop: "",
    sealNumbers: [],
    materialName: "",
  },
  packagings: [],
  broker: {
    company: getInitialCompany(),
    recepisse: {
      number: "",
      department: "",
      validityLimit: null,
    },
  },
  destination: {
    cap: "",
    reception: {
      weight: null,
    },
    operation: {
      code: "",
      mode: null,
      description: "",
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

export function BsdaRequestRevision({ bsda }: Props) {
  const { siret } = useParams<{ siret: string }>();
  const history = useHistory();
  const [createBsdaRevisionRequest, { loading, error }] = useMutation<
    Pick<Mutation, "createBsdaRevisionRequest">,
    MutationCreateBsdaRevisionRequestArgs
  >(CREATE_BSDA_REVISION_REQUEST);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        Demander une révision du bordereau {bsda.id}
      </h2>

      <Formik
        initialValues={{ comment: "", content: initialReview }}
        validationSchema={validationSchema}
        onSubmit={async ({ content, comment }) => {
          let cleanedContent;

          if (content.isCanceled) cleanedContent = { isCanceled: true };
          else cleanedContent = removeEmptyKeys(content);

          await createBsdaRevisionRequest({
            variables: {
              input: {
                bsdaId: bsda.id,
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
                <BsdaRequestRevisionCancelationInput
                  bsda={bsda}
                  defaultValue={initialReview.isCanceled}
                  onChange={value => setFieldValue("content.isCanceled", value)}
                />

                <div
                  style={{
                    display: areModificationsDisabled ? "none" : "inline",
                  }}
                >
                  <hr />

                  <ReviewableField
                    title="Code déchet"
                    value={bsda.waste?.code}
                    name="content.waste.code"
                    defaultValue={initialReview.waste.code}
                  >
                    <Field
                      as="select"
                      name="content.waste.code"
                      className="td-select"
                    >
                      <option />
                      {BSDA_WASTES.map(item => (
                        <option value={item.code} key={item.code}>
                          {item.code} - {item.description}
                        </option>
                      ))}
                    </Field>
                  </ReviewableField>

                  <ReviewableField
                    title="Description du déchet"
                    value={bsda.waste?.materialName}
                    name="content.waste.materialName"
                    defaultValue={initialReview.waste.materialName}
                  >
                    <Field
                      name="content.waste.materialName"
                      className="td-input td-input--medium"
                    />
                  </ReviewableField>

                  <ReviewableField
                    title="Numéros de scellés"
                    value={bsda.waste?.sealNumbers?.join(", ")}
                    name="content.waste.sealNumbers"
                    defaultValue={initialReview.waste.sealNumbers}
                  >
                    <TagsInput name="content.waste.sealNumbers" />
                  </ReviewableField>

                  <ReviewableField
                    title="Présence de polluants organiques persistants"
                    value={Boolean(bsda.waste?.pop) ? "Oui" : "Non"}
                    name="content.waste.pop"
                    defaultValue={initialReview.waste.pop}
                  >
                    <Field
                      type="checkbox"
                      component={FieldSwitch}
                      name="content.waste.pop"
                      label=""
                    />{" "}
                    {Boolean(values.content.waste.pop) ? "Oui" : "Non"}
                  </ReviewableField>

                  <ReviewableField
                    title="CAP"
                    value={bsda.destination?.cap}
                    name="content.destination.cap"
                    defaultValue={initialReview.destination.cap}
                  >
                    <Field
                      name="content.destination.cap"
                      className="td-input td-input--medium"
                    />
                  </ReviewableField>

                  <ReviewableField
                    title="Conditionnement"
                    value={bsda.packagings
                      ?.map(p => `${p.quantity} ${PACKAGINGS_NAMES[p.type]}`)
                      .join(", ")}
                    name="content.packagings"
                    defaultValue={initialReview.packagings}
                  >
                    <Field name="content.packagings" component={Packagings} />
                  </ReviewableField>

                  <ReviewableField
                    title="Quantité traitée (en tonnes)"
                    value={bsda.destination?.reception?.weight}
                    name="content.destination.reception.weight"
                    defaultValue={initialReview.destination?.reception?.weight}
                  >
                    <Field
                      name="content.destination.reception.weight"
                      className="td-input td-input--small"
                      component={NumberInput}
                    />
                  </ReviewableField>

                  <ReviewableField
                    title="Code de l'opération D/R"
                    value={bsda.destination?.operation?.code}
                    name="content.destination.operation.code"
                    defaultValue={initialReview.destination?.operation?.code}
                  >
                    <Field
                      as="select"
                      name="content.destination.operation.code"
                      className="td-select"
                    >
                      <option value="...">Sélectionnez une valeur...</option>
                      <option value="R 5">
                        R 5 - Recyclage ou récupération d'autres matières
                        inorganiques (dont vitrification)
                      </option>
                      <option value="D 5">
                        D 5 - Mise en décharge aménagée et autorisée en ISDD ou
                        ISDND
                      </option>
                      <option value="D 9">
                        D 9 - Traitement chimique ou prétraitement (dont
                        vitrification)
                      </option>
                      <option value="R 13">
                        R 13 - Opérations de transit incluant le groupement sans
                        transvasement préalable à R 5
                      </option>
                      <option value="D 15">
                        D 15 - Transit incluant le groupement sans transvasement
                      </option>
                    </Field>

                    <OperationModeSelect
                      operationCode={bsda.destination?.operation?.code}
                      name="content.destination.operation.mode"
                    />
                  </ReviewableField>

                  <ReviewableField
                    title="Description de l'opération D/R"
                    value={bsda.destination?.operation?.description}
                    name="content.destination.operation.description"
                    defaultValue={
                      initialReview.destination?.operation?.description
                    }
                  >
                    <Field
                      name="content.destination.operation.description"
                      className="td-input"
                    />
                  </ReviewableField>

                  <ReviewableField
                    title="Courtier"
                    value={
                      bsda.broker?.company?.name ? (
                        <div>{bsda.broker.company.name}</div>
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
                              "content.broker.recepisse.number",
                              broker.brokerReceipt.receiptNumber
                            );
                            setFieldValue(
                              "content.broker.recepisse.validityLimit",
                              broker.brokerReceipt.validityLimit
                            );
                            setFieldValue(
                              "content.broker.recepisse.department",
                              broker.brokerReceipt.department
                            );
                          } else {
                            setFieldValue(
                              "content.broker.recepisse.number",
                              ""
                            );
                            setFieldValue(
                              "content.broker.recepisse.validityLimit",
                              null
                            );
                            setFieldValue(
                              "content.broker.recepisse.department",
                              ""
                            );
                          }
                        }}
                      />
                      <div className="form__row">
                        <label>
                          Numéro de récépissé
                          <Field
                            type="text"
                            name="content.broker.recepisse.number"
                            className="td-input"
                          />
                        </label>

                        <RedErrorMessage name="content.broker.recepisse.number" />
                      </div>
                      <div className="form__row">
                        <label>
                          Département
                          <Field
                            type="text"
                            name="content.broker.recepisse.department"
                            placeholder="Ex: 83"
                            className={classNames(
                              "td-input",
                              styles.recipientDepartment
                            )}
                          />
                        </label>

                        <RedErrorMessage name="content.broker.recepisse.department" />
                      </div>
                      <div className="form__row">
                        <label>
                          Limite de validité
                          <Field
                            component={DateInput}
                            name="content.broker.recepisse.validityLimit"
                            className={classNames(
                              "td-input",
                              styles.recipientValidityLimit
                            )}
                          />
                        </label>

                        <RedErrorMessage name="content.broker.recepisse.validityLimit" />
                      </div>
                    </>
                  </ReviewableField>

                  <ReviewableField
                    title="Adresse de chantier ou de collecte"
                    value={[
                      bsda.emitter?.pickupSite?.address,
                      bsda.emitter?.pickupSite?.postalCode,
                      bsda.emitter?.pickupSite?.city,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    name="content.emitter.pickupSite"
                    defaultValue={initialReview.emitter?.pickupSite}
                  >
                    <div className="form__row">
                      <WorkSiteAddress
                        address={values.content?.emitter?.pickupSite?.address}
                        city={values.content?.emitter?.pickupSite?.city}
                        postalCode={
                          values.content?.emitter?.pickupSite?.postalCode
                        }
                        onAddressSelection={details => {
                          // `address` is passed as `name` because of adresse api return fields
                          setFieldValue(
                            `content.emitter.pickupSite.address`,
                            details.name
                          );
                          setFieldValue(
                            `content.emitter.pickupSite.city`,
                            details.city
                          );
                          setFieldValue(
                            `content.emitter.pickupSite.postalCode`,
                            details.postcode
                          );
                        }}
                        designation="du chantier ou lieu de collecte"
                      />
                    </div>

                    <div className="form__row">
                      <label>
                        Informations complémentaires (optionnel)
                        <Field
                          component="textarea"
                          className="textarea-pickup-site td-textarea"
                          placeholder="Champ libre pour préciser..."
                          name="content.emitter.pickupSite.infos"
                        />
                      </label>
                    </div>
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
