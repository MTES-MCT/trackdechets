import React, { useContext, useEffect } from "react";
import { Field, useFormikContext } from "formik";
import CompanySelector from "../../../common/components/company/CompanySelector";
import {
  Bsda,
  BsdaStatus,
  BsdaType,
  CompanyType,
  Query,
  QueryCompanyPrivateInfosArgs
} from "@td/codegen-ui";
import RedErrorMessage from "../../../../common/components/RedErrorMessage";
import DateInput from "../../../common/components/custom-inputs/DateInput";
import Select from "react-select";
import { IntermediariesSelector } from "../../components/intermediaries/IntermediariesSelector";
import { getInitialCompany } from "../../../../Apps/common/data/initialState";
import { BsdaContext } from "../../FormContainer";
import { COMPANY_SELECTOR_PRIVATE_INFOS } from "../../../../Apps/common/queries/company/query";
import { useLazyQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

const DestinationCAPModificationAlert = () => (
  <div className="fr-alert fr-alert--info fr-my-4v">
    <p>
      En cas de modification de la mention CAP de l'exutoire, le producteur en
      sera informé par courriel.
    </p>
  </div>
);

const showCAPModificationAlert = bsdaContext => {
  return (
    bsdaContext?.status !== BsdaStatus.Initial &&
    Boolean(bsdaContext?.worker?.company?.siret) &&
    Boolean(bsdaContext?.emitter?.company?.siret)
  );
};

const showDestinationCAPModificationAlert = bsdaContext => {
  return (
    !bsdaContext?.nextDestination?.siret &&
    showCAPModificationAlert(bsdaContext)
  );
};

const showNextDestinationCAPModificationAlert = bsdaContext => {
  return (
    Boolean(bsdaContext?.nextDestination?.siret) &&
    showCAPModificationAlert(bsdaContext)
  );
};

export function Destination({ disabled }) {
  const { values, setFieldValue } = useFormikContext<Bsda>();
  const bsdaContext = useContext(BsdaContext);
  const hasNextDestination = Boolean(
    values.destination?.operation?.nextDestination?.company
  );
  const isDechetterie = values?.type === BsdaType.Collection_2710;

  const { siret } = useParams<{ siret: string }>();

  const [getCompanyQuery, { data: dataCompany }] = useLazyQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(COMPANY_SELECTOR_PRIVATE_INFOS);

  useEffect(() => {
    if (isDechetterie) {
      getCompanyQuery({
        variables: { clue: siret! }
      });

      if (
        dataCompany?.companyPrivateInfos?.companyTypes?.includes(
          CompanyType.WasteCenter
        )
      ) {
        const company = dataCompany?.companyPrivateInfos;
        setFieldValue("destination.company", {
          orgId: company?.orgId,
          siret: company?.siret,
          name: company?.name,
          address: company?.address,
          contact: values?.destination?.company?.contact || company?.contact,
          mail: values?.destination?.company?.mail || company?.contactEmail,
          phone: values?.destination?.company?.phone || company?.contactPhone,
          vatNumber: company?.vatNumber,
          country: company?.codePaysEtrangerEtablissement
        });
      }
    }
  }, [
    isDechetterie,
    setFieldValue,
    dataCompany?.companyPrivateInfos,
    getCompanyQuery,
    siret,
    values?.destination?.company?.contact,
    values?.destination?.company?.mail,
    values?.destination?.company?.phone
  ]);

  const hasBroker = Boolean(values.broker);
  function onBrokerToggle() {
    if (hasBroker) {
      setFieldValue("broker", null);
    } else {
      setFieldValue(
        "broker",
        {
          company: getInitialCompany(),
          recepisse: {
            number: "",
            department: "",
            validityLimit: null
          }
        },
        false
      );
    }
  }

  function onAddIntermediary() {
    setFieldValue(
      "intermediaries",
      (values.intermediaries ?? []).concat([
        {
          siret: "",
          orgId: "",
          name: "",
          address: "",
          contact: "",
          mail: "",
          phone: "",
          vatNumber: "",
          country: ""
        }
      ])
    );
  }

  function onNextDestinationToggle() {
    // When we toggle the next destination switch, we swap destination <-> nextDestination
    // That's because the final destination is always displayed first:
    // - when it's a "simple" bsda, `destination.company` is displayed at the top
    // - otherwise, `destination.operation.nextDestination` is displayed first
    if (hasNextDestination) {
      const { company, cap, plannedOperationCode } =
        values.destination?.operation?.nextDestination ?? {};
      setFieldValue(
        "destination",
        {
          company,
          cap,
          plannedOperationCode,
          operation: {
            ...values.destination?.operation,
            nextDestination: null
          }
        },
        false
      );
    } else {
      const { company, cap, plannedOperationCode } = values.destination ?? {};
      setFieldValue(
        "destination",
        {
          company: getInitialCompany(),
          cap: "",
          plannedOperationCode: "",
          operation: {
            ...values.destination?.operation,
            nextDestination: {
              company,
              cap,
              plannedOperationCode
            }
          }
        },
        false
      );
    }
  }

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}

      {isDechetterie && !hasNextDestination ? (
        <div className="form__row">
          <div className="notification">
            Vous effectuez une collecte en déchetterie. Il n'y a pas de
            destination à saisir, votre entreprise a été automatiquement
            sélectionnée.
          </div>
          <div className="form__row">
            <label>
              Personne à contacter
              <Field
                type="text"
                name="destination.company.contact"
                className="td-input"
                disabled={disabled}
              />
            </label>
          </div>
          <div className="form__row">
            <label>
              Téléphone
              <Field
                type="text"
                name="destination.company.phone"
                className="td-input td-input--small"
                disabled={disabled}
              />
            </label>
          </div>
          <div className="form__row">
            <label>
              Mail
              <Field
                type="text"
                name="destination.company.mail"
                className="td-input td-input--medium"
                disabled={disabled}
              />
            </label>
          </div>
        </div>
      ) : (
        <>
          <CompanySelector
            disabled={disabled}
            name={
              hasNextDestination
                ? "destination.operation.nextDestination.company"
                : "destination.company"
            }
            heading="Installation de destination finale (exutoire)"
            registeredOnlyCompanies={true}
          />
          <div className="form__row">
            <label>
              N° CAP :
              <Field
                disabled={hasNextDestination ? false : disabled}
                type="text"
                name={
                  hasNextDestination
                    ? "destination.operation.nextDestination.cap"
                    : "destination.cap"
                }
                className="td-input td-input--medium"
              />
            </label>
            {showDestinationCAPModificationAlert(bsdaContext) && (
              <DestinationCAPModificationAlert />
            )}
          </div>
        </>
      )}

      <div className="form__row">
        <label>Opération d'élimination / valorisation prévue (code D/R)</label>
        <Field
          as="select"
          name={
            hasNextDestination
              ? "destination.operation.nextDestination.plannedOperationCode"
              : "destination.plannedOperationCode"
          }
          className="td-select"
          disabled={hasNextDestination ? false : disabled}
        >
          <option />
          {isDechetterie && !hasNextDestination ? (
            <>
              <option value="R 13">
                R 13 - Opérations de transit incluant le groupement sans
                transvasement préalable à R 5
              </option>
              <option value="D 15">
                D 15 - Transit incluant le groupement sans transvasement
              </option>
            </>
          ) : (
            <>
              <option value="R 5">
                R 5 - Recyclage ou récupération d'autres matières inorganiques
                (dont vitrification)
              </option>
              <option value="D 5">
                D 5 - Mise en décharge aménagée et autorisée en ISDD ou ISDND
              </option>
              <option value="D 9">
                D 9 - Traitement chimique ou prétraitement (dont vitrification)
              </option>
            </>
          )}
        </Field>
      </div>

      {values.type !== BsdaType.Collection_2710 && (
        <div className="tw-mt-8 tw-pt-6 tw-border-t-2">
          <div className="form__row">
            <label>
              <input
                type="checkbox"
                onChange={onNextDestinationToggle}
                disabled={disabled}
                checked={hasNextDestination}
                className="td-checkbox"
              />
              Je souhaite ajouter une installation intermédiaire de transit ou
              de groupement d'amiante
            </label>
          </div>

          {hasNextDestination && (
            <>
              <CompanySelector
                disabled={disabled}
                name="destination.company"
                heading="Installation de transit ou de groupement"
                registeredOnlyCompanies={true}
              />

              <div className="form__row">
                <label>
                  N° CAP : (optionnel)
                  <Field
                    disabled={disabled}
                    type="text"
                    name="destination.cap"
                    className="td-input td-input--medium"
                  />
                </label>
                {showNextDestinationCAPModificationAlert(bsdaContext) && (
                  <DestinationCAPModificationAlert />
                )}
              </div>

              <div className="form__row">
                <label>
                  Opération d'élimination / valorisation prévue (code D/R)
                </label>
                <Field
                  as="select"
                  name="destination.plannedOperationCode"
                  className="td-select"
                  disabled={disabled}
                >
                  <option />
                  <option value="R 13">
                    R 13 - Opérations de transit incluant le groupement sans
                    transvasement préalable à R 5
                  </option>
                  <option value="D 15">
                    D 15 - Transit incluant le groupement sans transvasement
                  </option>
                </Field>
              </div>
            </>
          )}
        </div>
      )}

      <h4 className="form__section-heading">Informations complémentaires</h4>

      <div className="form__row tw-mb-6">
        <div className="td-input">
          <label> Ajout d'intermédiaires:</label>
          <Select
            placeholder="Ajouter un intermédiaire"
            options={[
              ...(!hasBroker
                ? [
                    {
                      value: "BROKER",
                      label: "Je suis passé par un courtier"
                    }
                  ]
                : []),
              {
                value: "INTERMEDIARY",
                label: "Ajouter un autre type d'intermédiaire"
              }
            ]}
            onChange={option => {
              switch ((option as { value: string })?.value) {
                case "INTERMEDIARY":
                  return onAddIntermediary();
                case "BROKER":
                  return onBrokerToggle();
                default:
                  return;
              }
            }}
            classNamePrefix="react-select"
          />
        </div>
      </div>
      {hasBroker && (
        <div className="form__row td-input tw-mb-6">
          <h4 className="form__section-heading">Courtier</h4>
          <CompanySelector
            name="broker.company"
            onCompanySelected={broker => {
              if (broker?.brokerReceipt) {
                setFieldValue(
                  "broker.recepisse.number",
                  broker.brokerReceipt.receiptNumber
                );
                setFieldValue(
                  "broker.recepisse.validityLimit",
                  broker.brokerReceipt.validityLimit
                );
                setFieldValue(
                  "broker.recepisse.department",
                  broker.brokerReceipt.department
                );
              } else {
                setFieldValue("broker.recepisse.number", "");
                setFieldValue("broker.recepisse.validityLimit", null);
                setFieldValue("broker.recepisse.department", "");
              }
            }}
          />

          <div className="form__row">
            <label>
              Numéro de récépissé
              <Field
                type="text"
                name="broker.recepisse.number"
                className="td-input td-input--medium"
              />
            </label>

            <RedErrorMessage name="broker.recepisse.number" />
          </div>
          <div className="form__row">
            <label>
              Département
              <Field
                type="text"
                name="broker.recepisse.department"
                placeholder="Ex: 83"
                className="td-input td-input--small"
              />
            </label>

            <RedErrorMessage name="broker.recepisse.department" />
          </div>
          <div className="form__row">
            <label>
              Limite de validité
              <Field
                component={DateInput}
                name="broker.recepisse.validityLimit"
                className="td-input td-input--small"
              />
            </label>

            <RedErrorMessage name="broker.recepisse.validityLimit" />
          </div>
          <div className="tw-mt-2">
            <button
              className="btn btn--danger tw-mr-1"
              type="button"
              onClick={onBrokerToggle}
            >
              Supprimer le courtier
            </button>
          </div>
        </div>
      )}

      {Boolean(values.intermediaries?.length) && (
        <Field
          name="intermediaries"
          component={IntermediariesSelector}
          disabled={disabled}
          maxNbOfIntermediaries={3}
        />
      )}
    </>
  );
}
