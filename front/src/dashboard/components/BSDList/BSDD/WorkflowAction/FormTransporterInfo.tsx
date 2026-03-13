import * as React from "react";
import { Maybe, Transporter } from "@td/codegen-ui";
import { Field } from "formik";
import { RedErrorMessage } from "../../../../../common/components";

interface FormTransporterInfoProps {
  transporter: Maybe<Transporter> | undefined;
}

export function FormTransporterInfo({ transporter }: FormTransporterInfoProps) {
  //   const { values, setFieldValue } = useFormikContext<FormValues>();

  if (!transporter) return null;

  return (
    <>
      <div className="form__row">
        <label>
          Personne à contacter
          <div className="td-date-wrapper">
            <Field
              className="td-input"
              name="transporterCompanyContact"
              placeholder="NOM Prénom"
              style={{ minWidth: 200 }}
            />
          </div>
        </label>
        <RedErrorMessage name="transporterCompanyContact" />
      </div>

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-6">
          <div className="form__row">
            <label>
              Téléphone
              <Field
                className="td-input"
                name="transporterCompanyPhone"
                placeholder="Téléphone"
              />
            </label>
            <RedErrorMessage name="transporterCompanyPhone" />
          </div>
        </div>

        <div className="fr-col-6">
          <div className="form__row">
            <label>
              Courriel
              <Field
                className="td-input"
                name="transporterCompanyMail"
                placeholder="exemple@mail.com"
              />
            </label>
            <RedErrorMessage name="transporterCompanyMail" />
          </div>
        </div>
      </div>
    </>
  );
}
