import Input, { InputProps } from "@codegouvfr/react-dsfr/Input";
import React from "react";

type VhuAgrementFormProps = {
  title: string;
  inputProps?: {
    agrementNumber?: InputProps["nativeInputProps"];
    department?: InputProps["nativeInputProps"];
  };
  inputErrors?: {
    agrementNumber?: string;
    department?: string;
  };
};

const VhuAgrementForm: React.FC<VhuAgrementFormProps> = ({
  title,
  inputProps,
  inputErrors
}) => {
  return (
    <div>
      <div className="fr-grid-row">
        <div className="fr-col-12">
          <p className="fr-text--bold">{title}</p>
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-6">
          <Input
            label="Numéro d'agrément"
            nativeInputProps={{
              ...inputProps?.agrementNumber
            }}
            state={inputErrors?.agrementNumber ? "error" : "default"}
            stateRelatedMessage={inputErrors?.agrementNumber}
          ></Input>
        </div>
        <div className="fr-col-3">
          <Input
            label="Département"
            nativeInputProps={{
              placeholder: "75",
              ...inputProps?.department
            }}
            state={inputErrors?.department ? "error" : "default"}
            stateRelatedMessage={inputErrors?.department}
          ></Input>
        </div>
      </div>
    </div>
  );
};

export default React.memo(VhuAgrementForm);
