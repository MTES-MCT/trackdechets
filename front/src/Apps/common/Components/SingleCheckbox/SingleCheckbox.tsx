import React from "react";
import Checkbox, { CheckboxProps } from "@codegouvfr/react-dsfr/Checkbox";

const SingleCheckbox = (
  props: CheckboxProps & React.RefAttributes<HTMLFieldSetElement>
) => {
  return (
    <fieldset className="fr-fieldset">
      <div className="fr-fieldset__content">
        <Checkbox {...props} />
      </div>
    </fieldset>
  );
};

export default SingleCheckbox;
