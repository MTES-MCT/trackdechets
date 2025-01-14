import React from "react";
import classNames from "classnames";
import RedErrorMessage from "../../common/components/RedErrorMessage";
import TdSwitch from "../../common/components/Switch";
import Tooltip from "../../common/components/Tooltip";
import ProcessingOperation from "../common/components/processing-operation/ProcessingOperation";
import { Field, FieldArray, useFormikContext } from "formik";
import { isDangerous } from "@td/constants";
import { CompanySearchResult, FavoriteType, Form } from "@td/codegen-ui";
import CompanySelector from "../common/components/company/CompanySelector";
import TemporaryStorage from "./components/temporaryStorage/TemporaryStorage";
import styles from "./Recipient.module.scss";
import {
  getInitialBroker,
  getInitialTemporaryStorageDetail,
  getInitialTrader
} from "./utils/initial-state";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import { getInitialCompany } from "../../Apps/common/data/initialState";
import CompanySelectorWrapper from "../../Apps/common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import { useParams } from "react-router-dom";
import CompanyContactInfo from "../../Apps/Forms/Components/CompanyContactInfo/CompanyContactInfo";
import Recepisse from "../../Apps/Dashboard/Components/Recepisse/Recepisse";
import { CompanyType } from "@prisma/client";

function selectCompanyError(
  company: CompanySearchResult,
  expectedCompanyType?: "BROKER" | "TRADER"
) {
  if (company.etatAdministratif !== "A") {
    // Lors de l'écriture de ces lignes, `searchCompanies` renvoie des établissements
    // fermés lorsque l'on fait une recherche pas raison sociale. Si ce problème est traité
    // dans le futur, on pourra s'abstenir de gérer cette erreur.
    return "Cet établissement est fermé";
  }
  if (!company.isRegistered) {
    return "Cet établissement n'est pas inscrit sur Trackdéchets.";
  }
  if (
    expectedCompanyType &&
    !company.companyTypes?.includes(expectedCompanyType)
  ) {
    const translatedType =
      expectedCompanyType === "BROKER" ? "courtier" : "négociant";
    return `Cet établissement n'a pas le profil ${translatedType}`;
  }
  return null;
}

export default function Recipient({ disabled }) {
  const { siret } = useParams<{ siret: string }>();

  const { values, setFieldValue } = useFormikContext<Form>();

  const isTempStorage = !!values.recipient?.isTempStorage;
  const isDangerousWaste = isDangerous(values.wasteDetails?.code ?? "");

  const isChapeau = values?.emitter?.type === "APPENDIX1";
  const isGrouping = values?.emitter?.type === "APPENDIX2";

  const hasBroker = !!values.broker;
  const hasTrader = !!values.trader;
  const hasIntermediaries = !!values.intermediaries?.length;

  function handleTempStorageToggle(checked) {
    if (checked) {
      // the switch is toggled on, set isTempStorage to true
      setFieldValue("recipient.isTempStorage", true, false);
      setFieldValue(
        "temporaryStorageDetail",
        getInitialTemporaryStorageDetail(),
        false
      );
    } else {
      // the switch is toggled off, set isTempStorage to false
      setFieldValue("recipient.isTempStorage", false, false);
      setFieldValue("temporaryStorageDetail", null, false);
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
      {!isChapeau && (
        <div className="form__row">
          <TdSwitch
            checked={!!values.recipient?.isTempStorage}
            onChange={handleTempStorageToggle}
            label="Le BSD va passer par une étape d'entreposage provisoire ou
          reconditionnement"
            disabled={disabled}
          />
        </div>
      )}
      {isTempStorage && (
        <div className="notification fr-mt-6v">
          Vous avez sélectionné "Entreposage provisoire ou reconditionnement".
          En cas de doute, et pour éviter une erreur qui serait bloquante pour
          le parcours du déchet, veuillez vérifier avec vos partenaires ce qu'il
          convient de renseigner.
        </div>
      )}
      <h4 className="form__section-heading">
        Installation{" "}
        {isTempStorage
          ? "d'entreposage ou de reconditionnement"
          : "de destination"}
      </h4>
      <div className={styles.recipientTextQuote}>
        <p>
          Pour vous assurer que l'entreprise de destination est autorisée à
          recevoir le déchet, vous pouvez consulter{" "}
          <a
            href="https://www.georisques.gouv.fr/risques/installations/donnees#/"
            className="link"
            target="_blank"
            rel="noopener noreferrer"
          >
            la liste des installations classées.
          </a>
        </p>
      </div>
      <CompanySelector
        name="recipient.company"
        registeredOnlyCompanies={true}
        disabled={disabled}
      />
      <h4 className="form__section-heading">Informations complémentaires</h4>
      {!isTempStorage && (
        <div className="form__row">
          <Field
            component={ProcessingOperation}
            name="recipient.processingOperation"
            enableReuse={isGrouping}
            disabled={disabled}
          />
          <RedErrorMessage name="recipient.processingOperation" />
        </div>
      )}
      <div className="form__row">
        <label>
          Numéro de CAP
          {isDangerousWaste ? (
            <Tooltip
              msg={`Le champ CAP est obligatoire pour les déchets dangereux.
Il est important car il qualifie les conditions de gestion et de traitement du déchet entre le producteur et l'entreprise de destination.`}
            />
          ) : (
            " (Optionnel pour les déchets non dangereux)"
          )}
          <Field
            type="text"
            name="recipient.cap"
            className={classNames("td-input", styles.recipientCap)}
            disabled={disabled}
          />
        </label>
      </div>
      {isTempStorage && values.temporaryStorageDetail && (
        <TemporaryStorage name="temporaryStorageDetail" />
      )}
      <h4 className="form__section-heading">Autres acteurs</h4>
      <ToggleSwitch
        label="Présence d'un courtier"
        checked={hasBroker}
        showCheckedHint={false}
        onChange={hasBroker => {
          if (!hasBroker) {
            setFieldValue("broker", null);
          } else {
            setFieldValue("broker", getInitialBroker());
          }
        }}
        disabled={disabled}
      />
      {hasBroker && (
        <div className="fr-mt-2w">
          <CompanySelectorWrapper
            orgId={siret}
            selectedCompanyOrgId={values.broker?.company?.siret ?? null}
            favoriteType={FavoriteType.Broker}
            selectedCompanyError={company => {
              if (company) {
                return selectCompanyError(company, CompanyType.BROKER);
              }
              return null;
            }}
            disabled={disabled}
            onCompanySelected={company => {
              const prevBroker = values.broker;

              if (company) {
                setFieldValue("broker", {
                  ...prevBroker,
                  company: {
                    ...prevBroker?.company,
                    ...values.broker?.company,
                    siret: company?.siret,
                    orgId: company.orgId,
                    address: company.address,
                    name: company.name,
                    ...(prevBroker?.company?.siret !== company.siret
                      ? {
                          // auto-completion des infos de contact uniquement
                          // s'il y a un changement d'établissement pour
                          // éviter d'écraser les infos de contact spécifiées par l'utilisateur
                          // lors d'une modification de bordereau
                          contact: company.contact ?? "",
                          phone: company.contactPhone ?? "",
                          mail: company.contactEmail ?? ""
                        }
                      : {})
                  },
                  receipt: company.brokerReceipt?.receiptNumber ?? null,
                  department: company.brokerReceipt?.department ?? null,
                  validityLimit: company.brokerReceipt?.validityLimit ?? null
                });
              }
            }}
          />
          <CompanyContactInfo fieldName="broker.company" />
          {values.broker?.receipt && (
            <Recepisse
              title="Récépissé de courtage"
              numero={values.broker?.receipt}
              departement={values.broker?.department}
              validityLimit={values.broker?.validityLimit}
            />
          )}
        </div>
      )}
      <ToggleSwitch
        className="fr-mt-3w"
        label="Présence d'un négociant"
        checked={hasTrader}
        showCheckedHint={false}
        onChange={hasTrader => {
          if (!hasTrader) {
            setFieldValue("trader", null);
          } else {
            setFieldValue("trader", getInitialTrader());
          }
        }}
        disabled={disabled}
      />
      {hasTrader && (
        <div className="fr-mt-2w">
          <CompanySelectorWrapper
            orgId={siret}
            selectedCompanyOrgId={values.trader?.company?.siret ?? null}
            favoriteType={FavoriteType.Trader}
            selectedCompanyError={company => {
              if (company) {
                return selectCompanyError(company, CompanyType.TRADER);
              }
              return null;
            }}
            disabled={disabled}
            onCompanySelected={company => {
              const prevTrader = values.trader;

              if (company) {
                setFieldValue("trader", {
                  ...prevTrader,
                  company: {
                    ...prevTrader?.company,
                    ...values.trader?.company,
                    siret: company?.siret,
                    orgId: company.orgId,
                    address: company.address,
                    name: company.name,
                    ...(prevTrader?.company?.siret !== company.siret
                      ? {
                          // auto-completion des infos de contact uniquement
                          // s'il y a un changement d'établissement pour
                          // éviter d'écraser les infos de contact spécifiées par l'utilisateur
                          // lors d'une modification de bordereau
                          contact: company.contact ?? "",
                          phone: company.contactPhone ?? "",
                          mail: company.contactEmail ?? ""
                        }
                      : {})
                  },
                  receipt: company.traderReceipt?.receiptNumber ?? null,
                  department: company.traderReceipt?.department ?? null,
                  validityLimit: company.traderReceipt?.validityLimit ?? null
                });
              }
            }}
          />
          <CompanyContactInfo fieldName="trader.company" />
          {values.trader?.receipt && (
            <Recepisse
              title="Récépissé de négoce"
              numero={values.trader?.receipt}
              departement={values.trader?.department}
              validityLimit={values.trader?.validityLimit}
            />
          )}
        </div>
      )}
      <ToggleSwitch
        className="fr-mt-3w"
        label="Présence d'intermédiaires"
        checked={hasIntermediaries}
        showCheckedHint={false}
        onChange={hasIntermediary => {
          if (!hasIntermediary) {
            setFieldValue("intermediaries", []);
          } else {
            setFieldValue("intermediaries", [getInitialCompany()]);
          }
        }}
        disabled={disabled}
      />
      {hasIntermediaries && (
        <FieldArray
          name="intermediaries"
          render={({ push, remove }) => (
            <>
              {values.intermediaries.map((i, idx) => (
                <div className="fr-mt-2w" key={idx}>
                  <h6 className="fr-h6">Intermédiaire {idx + 1}</h6>
                  <CompanySelectorWrapper
                    orgId={siret}
                    selectedCompanyOrgId={
                      values.intermediaries[idx]?.siret ?? null
                    }
                    disabled={disabled}
                    onCompanySelected={company => {
                      const prevIntermediary = values.intermediaries[idx];

                      if (company) {
                        setFieldValue(`intermediaries.${idx}`, {
                          ...prevIntermediary,
                          siret: company?.siret,
                          orgId: company.orgId,
                          address: company.address,
                          name: company.name,
                          ...(prevIntermediary?.siret !== company.siret
                            ? {
                                // auto-completion des infos de contact uniquement
                                // s'il y a un changement d'établissement pour
                                // éviter d'écraser les infos de contact spécifiées par l'utilisateur
                                // lors d'une modification de bordereau
                                contact: company.contact ?? "",
                                phone: company.contactPhone ?? "",
                                mail: company.contactEmail ?? ""
                              }
                            : {})
                        });
                      }
                    }}
                  />
                  <CompanyContactInfo fieldName={`intermediaries.${idx}`} />
                  {values.intermediaries.length > 1 && (
                    <button
                      type="button"
                      className="fr-btn fr-btn--tertiary fr-mb-2w"
                      onClick={() => remove(idx)}
                    >
                      Supprimer l'intermédiaire {idx + 1}
                    </button>
                  )}
                  <hr />
                </div>
              ))}
              {values.intermediaries.length < 3 && (
                // Pas plus de trois intermédiaires
                <div className="fr-grid-row fr-grid-row--right fr-mb-4w">
                  <button
                    type="button"
                    className="fr-btn fr-btn--secondary"
                    onClick={() => {
                      push(getInitialCompany());
                    }}
                  >
                    Ajouter un intermédiaire
                  </button>
                </div>
              )}
            </>
          )}
        ></FieldArray>
      )}
    </>
  );
}
