import React from "react";
import classNames from "classnames";
import RedErrorMessage from "../../common/components/RedErrorMessage";
import TdSwitch from "../../common/components/Switch";
import Tooltip from "../../Apps/common/Components/Tooltip/Tooltip";
import ProcessingOperation from "../common/components/processing-operation/ProcessingOperation";
import { Field, useFormikContext } from "formik";
import { isDangerous } from "@td/constants";
import { BsdType, Form } from "@td/codegen-ui";
import CompanySelector from "../common/components/company/CompanySelector";
import TemporaryStorage from "./components/temporaryStorage/TemporaryStorage";
import styles from "./Recipient.module.scss";
import { getInitialTemporaryStorageDetail } from "./utils/initial-state";
import { useParams } from "react-router-dom";
import FormikBroker from "../../Apps/Forms/Components/Broker/FormikBroker";
import FormikTrader from "../../Apps/Forms/Components/Trader/FormikTrader";
import FormikIntermediaryList from "../../Apps/Forms/Components/IntermediaryList/FormikIntermediaryList";

export default function Recipient({ disabled }) {
  const { siret } = useParams<{ siret: string }>();

  const { values, setFieldValue } = useFormikContext<Form>();

  const isTempStorage = !!values.recipient?.isTempStorage;
  const isDangerousWaste = isDangerous(values.wasteDetails?.code ?? "");

  const isChapeau = values?.emitter?.type === "APPENDIX1";
  const isGrouping = values?.emitter?.type === "APPENDIX2";

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
              className="fr-ml-1"
              title={`Le champ CAP est obligatoire pour les déchets dangereux.
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

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <FormikBroker
          bsdType={BsdType.Bsdd}
          siret={siret}
          disabled={disabled}
        />
        <FormikTrader siret={siret} disabled={disabled} />
        <FormikIntermediaryList siret={siret} disabled={disabled} />
      </div>
    </>
  );
}
