import React, { useState } from "react";
import { useField, useFormikContext } from "formik";
import CompanySelector from "../company/CompanySelector";

export default function TemporaryStorage(props) {
  const [field] = useField(props);
  const [isActive, setIsActive] = useState(field.value != null);

  return (
    <>
      <h4>Entreposage provisoire ou reconditionnement ?</h4>
      <div className="form__group">
        <label>
          <input
            type="checkbox"
            checked={isActive}
            onChange={() => setIsActive(!isActive)}
          />
          Le BSD va passer par une étape d'entreposage provisoire ou
          reconditionnement
        </label>
      </div>

      {isActive && (
        <>
          <h5>Installation d'entreposage ou de reconditionnement</h5>
          <CompanySelector name={`${props.name}.temporaryStorer.company`} />
        </>
      )}
    </>
  );
}
