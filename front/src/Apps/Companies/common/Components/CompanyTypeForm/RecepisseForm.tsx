import Input, { InputProps } from "@codegouvfr/react-dsfr/Input";
import React from "react";

type RecepisseFormProps = {
  title: string;
  inputProps?: {
    receiptNumber?: InputProps["nativeInputProps"];
    validityLimit?: InputProps["nativeInputProps"];
    department?: InputProps["nativeInputProps"];
  };
  inputErrors?: {
    receiptNumber?: string;
    validityLimit?: string;
    department?: string;
  };
};

const RecepisseForm = ({
  title,
  inputProps,
  inputErrors
}: RecepisseFormProps): React.JSX.Element => {
  return (
    <div>
      <div className="fr-grid-row">
        <div className="fr-col-12 fr-mb-2v">
          <p className="fr-text--bold">{title}</p>
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-4">
          <Input
            label="Numéro de récépissé"
            nativeInputProps={{
              ...inputProps?.receiptNumber
            }}
            state={inputErrors?.receiptNumber ? "error" : "default"}
            stateRelatedMessage={inputErrors?.receiptNumber}
          ></Input>
        </div>
        <div className="fr-col-4">
          <Input
            label="Limite de validité"
            nativeInputProps={{
              type: "date",
              ...inputProps?.validityLimit
            }}
            state={inputErrors?.validityLimit ? "error" : "default"}
            stateRelatedMessage={inputErrors?.validityLimit}
          ></Input>
        </div>
        <div className="fr-col-2">
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

export default React.memo(RecepisseForm);
