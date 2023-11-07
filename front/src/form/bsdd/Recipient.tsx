import React from "react";
import toast from "react-hot-toast";
import classNames from "classnames";
import Select from "react-select";
import RedErrorMessage from "../../common/components/RedErrorMessage";
import TdSwitch from "../../common/components/Switch";
import Tooltip from "../../common/components/Tooltip";
import ProcessingOperation from "../common/components/processing-operation/ProcessingOperation";
import { Field, useFormikContext } from "formik";
import { isDangerous } from "shared/constants";
import { Form } from "codegen-ui";
import CompanySelector from "../common/components/company/CompanySelector";
import DateInput from "../common/components/custom-inputs/DateInput";
import TemporaryStorage from "./components/temporaryStorage/TemporaryStorage";
import styles from "./Recipient.module.scss";
import {
  getInitialBroker,
  getInitialTemporaryStorageDetail,
  getInitialTrader
} from "./utils/initial-state";
import { IntermediariesSelector } from "../bsda/components/intermediaries/IntermediariesSelector";

type IntermediariesSelect = {
  value: string;
  label: string;
};

export default function Recipient({ disabled }) {
  const { values, setFieldValue } = useFormikContext<Form>();
  const hasTrader = !!values.trader;
  const hasBroker = !!values.broker;
  const isTempStorage = !!values.recipient?.isTempStorage;
  const isDangerousWaste = isDangerous(values.wasteDetails?.code ?? "");
  // limite arbitraire du nombre d'intermédiaires qu'on peut ajouter
  const isAddIntermediaryButtonEnabled = values.intermediaries.length <= 20;

  const isChapeau = values?.emitter?.type === "APPENDIX1";
  const isGrouping = values?.emitter?.type === "APPENDIX2";

  const intermediariesOptions: IntermediariesSelect[] = [
    ...(!hasTrader && !hasBroker
      ? [
          {
            value: "TRADER",
            label: "Je suis passé par un négociant"
          }
        ]
      : []),
    ...(!hasTrader && !hasBroker
      ? [
          {
            value: "BROKER",
            label: "Je suis passé par un courtier"
          }
        ]
      : []),
    ...(isAddIntermediaryButtonEnabled
      ? [
          {
            value: "INTERMEDIARY",
            label: "Ajouter un autre type d'intermédiaire"
          }
        ]
      : [])
  ];

  function handleTraderToggle() {
    setFieldValue("trader", getInitialTrader(), false);
  }

  function handleBrokerToggle() {
    setFieldValue("broker", getInitialBroker(), false);
  }

  function handleIntermediaryAdd() {
    setFieldValue(
      "intermediaries",
      values.intermediaries.concat([
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
    toast.success(
      "Nouvel intermédiaire ajouté en bas de page: merci de chercher un SIRET ou un nom d'entreprise pour lancer une recherche.",
      {
        duration: 3,
        position: "bottom-right"
      }
    );
  }

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
        <div className="notification tw-mt-2">
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
      <div className="form__row">
        <Field
          component={ProcessingOperation}
          name="recipient.processingOperation"
          enableReuse={isGrouping}
          disabled={disabled}
        />
        <RedErrorMessage name="recipient.processingOperation" />
      </div>
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
      <div className="form__row">
        <div className="td-input">
          <label> Ajout d'intermédiaires:</label>
          <Select
            placeholder="Ajouter un intermédiaire"
            options={intermediariesOptions}
            onChange={option => {
              switch ((option as IntermediariesSelect).value) {
                case "INTERMEDIARY":
                  return handleIntermediaryAdd();
                case "TRADER":
                  return handleTraderToggle();
                case "BROKER":
                  return handleBrokerToggle();
                default:
                  return;
              }
            }}
            classNamePrefix="react-select"
            isDisabled={disabled}
          />
        </div>
      </div>
      {hasTrader && (
        <div className="form__row">
          <h4 className="form__section-heading">Négociant</h4>
          <CompanySelector
            name="trader.company"
            onCompanySelected={trader => {
              if (trader?.traderReceipt) {
                setFieldValue(
                  "trader.receipt",
                  trader.traderReceipt.receiptNumber
                );
                setFieldValue(
                  "trader.validityLimit",
                  trader.traderReceipt.validityLimit
                );
                setFieldValue(
                  "trader.department",
                  trader.traderReceipt.department
                );
              } else {
                setFieldValue("trader.receipt", "");
                setFieldValue("trader.validityLimit", null);
                setFieldValue("trader.department", "");
              }
            }}
          />

          <div className="form__row">
            <label>
              Numéro de récépissé
              <Field type="text" name="trader.receipt" className="td-input" />
            </label>

            <RedErrorMessage name="trader.receipt" />
          </div>
          <div className="form__row">
            <label>
              Département
              <Field
                type="text"
                name="trader.department"
                placeholder="Ex: 83"
                className={classNames("td-input", styles.recipientDepartment)}
              />
            </label>

            <RedErrorMessage name="trader.department" />
          </div>
          <div className="form__row">
            <label>
              Limite de validité
              <Field
                component={DateInput}
                name="trader.validityLimit"
                className={classNames(
                  "td-input",
                  styles.recipientValidityLimit
                )}
              />
            </label>

            <RedErrorMessage name="trader.validityLimit" />
          </div>
          <div className="tw-mt-2">
            <button
              className="btn btn--danger tw-mr-1"
              type="button"
              onClick={async () => {
                setFieldValue("trader", null, false);
              }}
            >
              Supprimer le négociant
            </button>
          </div>
        </div>
      )}
      {hasBroker && (
        <div className="form__row">
          <h4 className="form__section-heading">Courtier</h4>
          <CompanySelector
            name="broker.company"
            onCompanySelected={broker => {
              if (broker?.brokerReceipt) {
                setFieldValue(
                  "broker.receipt",
                  broker.brokerReceipt.receiptNumber
                );
                setFieldValue(
                  "broker.validityLimit",
                  broker.brokerReceipt.validityLimit
                );
                setFieldValue(
                  "broker.department",
                  broker.brokerReceipt.department
                );
              } else {
                setFieldValue("broker.receipt", "");
                setFieldValue("broker.validityLimit", null);
                setFieldValue("broker.department", "");
              }
            }}
          />

          <div className="form__row">
            <label>
              Numéro de récépissé
              <Field type="text" name="broker.receipt" className="td-input" />
            </label>

            <RedErrorMessage name="broker.receipt" />
          </div>
          <div className="form__row">
            <label>
              Département
              <Field
                type="text"
                name="broker.department"
                placeholder="Ex: 83"
                className={classNames("td-input", styles.recipientDepartment)}
              />
            </label>

            <RedErrorMessage name="broker.department" />
          </div>
          <div className="form__row">
            <label>
              Limite de validité
              <Field
                component={DateInput}
                name="broker.validityLimit"
                className={classNames(
                  "td-input",
                  styles.recipientValidityLimit
                )}
              />
            </label>

            <RedErrorMessage name="broker.validityLimit" />
          </div>
          <div className="tw-mt-2">
            <button
              className="btn btn--danger tw-mr-1"
              type="button"
              onClick={async () => {
                setFieldValue("broker", null, false);
              }}
            >
              Supprimer le courtier
            </button>
          </div>
        </div>
      )}
      <div className="form__row">
        {Boolean(values.intermediaries?.length) && (
          <h4 className="form__section-heading">
            Autre{values.intermediaries?.length > 1 ? "s" : ""} type
            {values.intermediaries?.length > 1 ? "s" : ""} d'intermédiaire
            {values.intermediaries?.length > 1 ? "s" : ""}
          </h4>
        )}
        {Boolean(values.intermediaries?.length) && (
          <Field
            name="intermediaries"
            component={IntermediariesSelector}
            maxNbOfIntermediaries={3}
          />
        )}
      </div>
      {isTempStorage && values.temporaryStorageDetail && (
        <TemporaryStorage name="temporaryStorageDetail" />
      )}
    </>
  );
}
