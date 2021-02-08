import { Field, useFormikContext } from "formik";
import React, { useEffect, useState } from "react";
import RedErrorMessage from "common/components/RedErrorMessage";
import CompanySelector from "./company/CompanySelector";
import DateInput from "./custom-inputs/DateInput";
import { initalTemporaryStorageDetail, initialTrader } from "./initial-state";
import { Form } from "generated/graphql/types";
import ProcessingOperation from "./processing-operation/ProcessingOperation";
import TemporaryStorage from "./temporaryStorage/TemporaryStorage";
import TdSwitch from "../common/components/Switch";

import styles from "./Recipient.module.scss";
import classNames from "classnames";

export default function Recipient() {
  const { values, setFieldValue } = useFormikContext<Form>();

  const [hasTrader, setHasTrader] = useState(!!values.trader?.company?.siret);

  useEffect(() => {
    // set initial value for trader when the switch is toggled
    if (hasTrader && !values.trader) {
      setFieldValue("trader", initialTrader, false);
    }

    // set trader to null when the switch is toggled off
    if (!hasTrader && values.trader) {
      setFieldValue("trader", null, false);
    }
  }, [hasTrader, values, setFieldValue]);

  useEffect(() => {
    // set initial value for temp storage when the switch is toggled
    if (values.recipient?.isTempStorage && !values.temporaryStorageDetail) {
      setFieldValue(
        "temporaryStorageDetail",
        initalTemporaryStorageDetail,
        false
      );
    }

    // set temp storage to null when the switch is toggled off
    if (!values.recipient?.isTempStorage && values.temporaryStorageDetail) {
      setFieldValue("temporaryStorageDetail", null, false);
    }

    if (
      values.recipient?.processingOperation &&
      values.temporaryStorageDetail &&
      !values.temporaryStorageDetail.destination?.processingOperation
    ) {
      setFieldValue(
        "temporaryStorageDetail.destination.processingOperation",
        values.recipient.processingOperation,
        false
      );
    }
  }, [values, setFieldValue]);

  return (
    <>
      <div className="form__row">
        <TdSwitch
          checked={!!values.recipient?.isTempStorage}
          onChange={() =>
            setFieldValue(
              "recipient.isTempStorage",
              !values.recipient?.isTempStorage
            )
          }
          label="Le BSD va passer par une étape d'entreposage provisoire ou
          reconditionnement"
        />
      </div>
      <h4 className="form__section-heading">
        Installation{" "}
        {values.recipient?.isTempStorage
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
          onChange={() => setHasTrader(!hasTrader)}
          label="Je suis passé par un négociant"
        />
      </div>
      {hasTrader && values.trader && (
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
      {values.recipient?.isTempStorage && values.temporaryStorageDetail && (
        <TemporaryStorage name="temporaryStorageDetail" />
      )}
    </>
  );
}
