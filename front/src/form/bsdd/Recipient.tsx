import React from "react";
import classNames from "classnames";
import RedErrorMessage from "../../common/components/RedErrorMessage";
import TdSwitch from "../../common/components/Switch";
import Tooltip from "../../common/components/Tooltip";
import ProcessingOperation from "../common/components/processing-operation/ProcessingOperation";
import { Field, FieldArray, useFormikContext } from "formik";
import { isDangerous } from "@td/constants";
import {
  BsdType,
  CompanySearchResult,
  CompanyType,
  FavoriteType,
  Form
} from "@td/codegen-ui";
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
import FormikBroker from "../../Apps/Forms/Components/Broker/FormikBroker";
import FormikTrader from "../../Apps/Forms/Components/Trader/FormikTrader";

function selectCompanyError(
  company: CompanySearchResult,
  expectedCompanyType?: CompanyType
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
    const translatedType = () => {
      if (expectedCompanyType === CompanyType.Broker) {
        return "courtier";
      }
      if (expectedCompanyType === CompanyType.Trader) {
        return "négociant";
      }
      return "";
    };

    return `Cet établissement n'a pas le profil ${translatedType()}`;
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
      <FormikBroker bsdType={BsdType.Bsdd} siret={siret} disabled={disabled} />
      <div className="fr-mt-3w">
        <FormikTrader siret={siret} disabled={disabled} />
      </div>
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
