import RedErrorMessage from "../../../../common/components/RedErrorMessage";
import { Field, useField } from "formik";
import React from "react";

import {
  FormCompany
} from "codegen-ui";

interface ExtraEuropeanCompanyManualProps {
  name: string;
  optional: boolean;
  extraEuropeanCompanyId?: string | null;
  onExtraEuropeanCompanyId: (value: string) => void;
}

export default function ExtraEuropeanCompanyManualInput({
  name,
  optional,
  extraEuropeanCompanyId,
  onExtraEuropeanCompanyId
}: ExtraEuropeanCompanyManualProps) {
  const [field] = useField<FormCompany>({ name });

  return (
    <div className="tw-my-6">
      <h4 className="form__section-heading">Entreprise extra-européenne</h4>
      <div className="form__row">
          <label>
              Identifiant de l'entreprise
              <input
                type="text"
                value={extraEuropeanCompanyId!}
                onChange={(e) => onExtraEuropeanCompanyId(e.target.value)}
                className="td-input"
              />
          </label>
      </div>
      <div className="form__row">
        <label>
          Nom de l'entreprise
          <Field
            type="text"
            className="td-input"
            name={`${field.name}.name`}
            placeholder="Nom"
            optional={optional}
          />
        </label>
        <RedErrorMessage name={`${field.name}.name`} />
        <label>
          Adresse de l'entreprise
          <Field
            type="text"
            className="td-input"
            name={`${field.name}.address`}
            placeholder="Adresse"
            optional={optional}
          />
        </label>
        <RedErrorMessage name={`${field.name}.address`} />
        <label>
          Pays de l'entreprise
          <Field
            type="text"
            className="td-input"
            name={`${field.name}.country`}
            optional={optional}
            placeholder="code pays deux lettres majuscules norme ISO 3166-1"
          />
        </label>
        <RedErrorMessage name={`${field.name}.country`} />
        <label>
          Personne à contacter
          <Field
            type="text"
            name={`${field.name}.contact`}
            placeholder="NOM Prénom"
            className="td-input"
            optional={optional}
          />
        </label>
        <RedErrorMessage name={`${field.name}.contact`} />
      </div>
      <div className="form__row">
        <label>
          Téléphone ou Fax
          <Field
            type="text"
            name={`${field.name}.phone`}
            placeholder="Numéro"
            className={`td-input`}
            optional={optional}
          />
        </label>

        <RedErrorMessage name={`${field.name}.phone`} />
      </div>
      <div className="form__row">
        <label>
          Email
          <Field
            type="email"
            name={`${field.name}.mail`}
            className={`td-input`}
            optional={optional}
          />
        </label>

        <RedErrorMessage name={`${field.name}.mail`} />
      </div>

    </div>
  );
}
