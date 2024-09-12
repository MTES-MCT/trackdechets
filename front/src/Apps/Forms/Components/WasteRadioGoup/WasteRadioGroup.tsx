import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import React from "react";

const WasteRadioGroup = ({ title, options, disabled }) => {
  return (
    <>
      <h4 className="fr-h4">{title}</h4>
      <RadioButtons
        disabled={disabled}
        className="fr-col-sm-10"
        options={options}
      />
    </>
  );
};

export default WasteRadioGroup;
