import classNames from "classnames";
import RedErrorMessage from "common/components/RedErrorMessage";
import TdSwitch from "common/components/Switch";
import Tooltip from "common/components/Tooltip";
import ProcessingOperation from "form/common/components/processing-operation/ProcessingOperation";
import { Field, useFormikContext } from "formik";
import { isDangerous } from "generated/constants";
import { Form } from "generated/graphql/types";
import React from "react";
import CompanySelector from "../common/components/company/CompanySelector";
import DateInput from "../common/components/custom-inputs/DateInput";
import { RadioButton } from "../common/components/custom-inputs/RadioButton";
import TemporaryStorage from "./components/temporaryStorage/TemporaryStorage";
import styles from "./Recipient.module.scss";
import {
  getInitialBroker,
  getInitialTemporaryStorageDetail,
  getInitialTrader,
} from "./utils/initial-state";

export default function Recipient() {
  const { values, setFieldValue } = useFormikContext<Form>();

  const hasTrader = !!values.trader;
  const hasBroker = !!values.broker;
  const isTempStorage = !!values.recipient?.isTempStorage;
  const isDangerousWaste = isDangerous(values.wasteDetails?.code ?? "");

  function handleNoneToggle() {
    setFieldValue("broker", null, false);
    setFieldValue("trader", null, false);
  }

  function handleTraderToggle() {
    if (hasTrader) {
      // the switch is toggled off, set trader to null
      setFieldValue("trader", null, false);
    } else {
      // the switch is toggled on, set trader to initial value
      setFieldValue("broker", null, false);
      setFieldValue("trader", getInitialTrader(), false);
    }
  }

  function handleBrokerToggle() {
    if (hasBroker) {
      setFieldValue("broker", null, false);
    } else {
      setFieldValue("trader", null, false);
      setFieldValue("broker", getInitialBroker(), false);
    }
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
      <div className="form__row">
        <TdSwitch
          checked={!!values.recipient?.isTempStorage}
          onChange={handleTempStorageToggle}
          label="Le BSD va passer par une étape d'entreposage provisoire ou
          reconditionnement"
        />
      </div>
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
            la liste des installation classées.
          </a>
        </p>
      </div>
      <CompanySelector name="recipient.company" />
      <h4 className="form__section-heading">Informations complémentaires</h4>
      <div className="form__row">
        <Field
          component={ProcessingOperation}
          name="recipient.processingOperation"
        />

        <RedErrorMessage name="recipient.processingOperation" />
      </div>
      <div className="form__row">
        <label>
          Numéro de CAP
          {isDangerousWaste ? (
            <Tooltip
              msg={`Le champ CAP est obligatoire pour les déchets dangereux.
Il est important car il qualifie les conditions de gestion et de traitement du déchets entre le producteur et l'entreprise de destination.`}
            />
          ) : (
            " (Optionnel pour les déchets non dangereux)"
          )}
          <Field
            type="text"
            name="recipient.cap"
            className={classNames("td-input", styles.recipientCap)}
          />
        </label>
      </div>
      <div className="form__row">
        <div className="tw-flex">
          <legend className="tw-font-semibold"> Intermédiaire :</legend>
          <Field
            name="intermediate"
            id="NONE"
            label="Aucun"
            component={RadioButton}
            onChange={handleNoneToggle}
            checked={!hasTrader && !hasBroker}
          />
          <Field
            name="intermediate"
            id="TRADER"
            component={RadioButton}
            checked={hasTrader}
            onChange={handleTraderToggle}
            label="Je suis passé par un négociant"
          />
          <Field
            name="intermediate"
            id="BROKER"
            label="Je suis passé par un courtier"
            component={RadioButton}
            checked={hasBroker}
            onChange={handleBrokerToggle}
          />
        </div>
      </div>
      {hasTrader && (
        <div className="form__row">
          <h4 className="form__section-heading">Négociant</h4>
          <CompanySelector
            name="trader.company"
            onCompanySelected={trader => {
              if (trader.traderReceipt) {
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
        </div>
      )}
      {hasBroker && (
        <div className="form__row">
          <h4 className="form__section-heading">Courtier</h4>
          <CompanySelector
            name="broker.company"
            onCompanySelected={broker => {
              if (broker.brokerReceipt) {
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
        </div>
      )}
      {isTempStorage && values.temporaryStorageDetail && (
        <TemporaryStorage name="temporaryStorageDetail" />
      )}
    </>
  );
}
