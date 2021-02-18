import { Field, useFormikContext } from "formik";
import React from "react";
import RedErrorMessage from "common/components/RedErrorMessage";
import CompanySelector from "./company/CompanySelector";
import DateInput from "./custom-inputs/DateInput";
import {
  getInitalTrader,
  getInitialTemporaryStorageDetail,
} from "./initial-state";
import { Form } from "generated/graphql/types";
import ProcessingOperation from "./processing-operation/ProcessingOperation";
import TemporaryStorage from "./temporaryStorage/TemporaryStorage";
import TdSwitch from "../common/components/Switch";

import styles from "./Recipient.module.scss";
import classNames from "classnames";

export default function Recipient() {
  const { values, setFieldValue } = useFormikContext<Form>();

  const hasTrader = !!values.trader;
  const isTempStorage = !!values.recipient?.isTempStorage;

  function handleTraderToggle() {
    if (hasTrader) {
      // the switch is toggled off, set trader to null
      setFieldValue("trader", null, false);
    } else {
      // the switch is toggled on, set trader to initial value
      setFieldValue("trader", getInitalTrader(), false);
    }
  }

  function handleTempStorageToggle() {
    if (isTempStorage) {
      // the switch is toggled off, set isTempStorage to false
      setFieldValue("recipient.isTempStorage", false, false);
      setFieldValue("temporaryStorageDetail", null, false);
    } else {
      // the switch is toggled on, set isTempStorage to true
      setFieldValue("recipient.isTempStorage", true, false);
      setFieldValue(
        "temporaryStorageDetail",
        getInitialTemporaryStorageDetail(),
        false
      );
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
          Numéro de CAP (optionnel)
          <Field
            type="text"
            name="recipient.cap"
            className={classNames("td-input", styles.recipientCap)}
          />
        </label>
      </div>
      <div className="form__row">
        <TdSwitch
          checked={hasTrader}
          onChange={handleTraderToggle}
          label="Je suis passé par un négociant"
        />
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
      {isTempStorage && <TemporaryStorage name="temporaryStorageDetail" />}
    </>
  );
}
