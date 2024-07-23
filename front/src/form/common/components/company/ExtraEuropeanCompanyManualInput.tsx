import { Field, useField, useFormikContext } from "formik";
import React from "react";

import { FormCompany } from "@td/codegen-ui";
import CountrySelector from "./CountrySelector";
import RedErrorMessage from "../../../../common/components/RedErrorMessage";
import Tooltip from "../../../../common/components/Tooltip";

interface ExtraEuropeanCompanyManualProps {
  name: string;
  optional: boolean;
  extraEuropeanCompanyId?: string | null;
  onExtraEuropeanCompanyId: (value: string) => void;
  vatNumber?: string | null;
  onVatNumberChange: (value: string) => void;
}

export default function ExtraEuropeanCompanyManualInput({
  name,
  optional,
  extraEuropeanCompanyId,
  onExtraEuropeanCompanyId,
  vatNumber,
  onVatNumberChange
}: ExtraEuropeanCompanyManualProps) {
  const [field] = useField<FormCompany>({ name });
  const { setFieldValue } = useFormikContext();

  return (
    <div>
      <h4 className="form__section-heading">Entreprise extra-européenne</h4>
      <div className="form__row">
        <label>
          Identifiant de l'entreprise
          <Tooltip msg="À renseigner si numéro de TVA inexistant" />
          <input
            type="text"
            value={extraEuropeanCompanyId!}
            onChange={e => onExtraEuropeanCompanyId(e.target.value)}
            className="td-input"
          />
        </label>
        <label>
          Numéro de TVA (optionnel)
          <Tooltip msg="À renseigner si le numéro de TVA n'est pas reconnu dans le champ de recherche" />
          <input
            type="text"
            value={vatNumber!}
            name={`${field.name}.vatNumber`}
            onChange={e => onVatNumberChange(e.target.value)}
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
          <CountrySelector
            value={field.value.country!}
            onChange={value => setFieldValue(`${field.name}.country`, value)}
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
