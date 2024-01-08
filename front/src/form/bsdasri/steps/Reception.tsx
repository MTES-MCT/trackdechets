import { RedErrorMessage } from "../../../common/components";
import Acceptation, {
  AcceptOnlyField
} from "../components/acceptation/Acceptation";
import { Field, useFormikContext } from "formik";
import React from "react";
import { BsdasriStatus, Bsdasri, BsdasriType } from "@td/codegen-ui";
import Packagings from "../components/packagings/Packagings";

import DateInput from "../../common/components/custom-inputs/DateInput";
import classNames from "classnames";

export default function Reception({ status, disabled = false }) {
  const { values } = useFormikContext<Bsdasri>();
  const receptionEmphasis = false;
  const receptionDisabled = disabled || BsdasriStatus.Received === status;
  const showReceptionFields = [
    BsdasriStatus.Sent,
    BsdasriStatus.Received
  ].includes(status);
  const AcceptationComponent =
    values.type === BsdasriType.Synthesis ? AcceptOnlyField : Acceptation;

  return showReceptionFields ? (
    <>
      <div
        className={classNames("form__row", {
          "field-emphasis": receptionEmphasis
        })}
      >
        <Field
          name="destination.reception.acceptation"
          component={AcceptationComponent}
          disabled={receptionDisabled}
        />
      </div>
      <div
        className={classNames("form__row", {
          "field-emphasis": receptionEmphasis
        })}
      >
        <label>
          Date de réception
          <div className="td-date-wrapper">
            <Field
              name="destination.reception.date"
              component={DateInput}
              className="td-input"
              disabled={receptionDisabled}
            />
          </div>
        </label>
        <RedErrorMessage name="destination.reception.date" />
      </div>
      <div
        className={classNames("form__row", {
          "field-emphasis": receptionEmphasis
        })}
      >
        <Field
          name="destination.reception.packagings"
          component={Packagings}
          disabled={receptionDisabled}
        />
      </div>
    </>
  ) : (
    <p>Cette section sera disponible quand le déchet aura été envoyé</p>
  );
}
