import React from "react";
import {
  CompanyTypeInputErrors,
  CompanyTypeInputProps
} from "./CompanyTypeForm";
import RecepisseForm from "./RecepisseForm";

type TraderRecepisseFormProps = {
  inputProps: Pick<CompanyTypeInputProps, "traderReceipt">;
  inputErrors: Pick<CompanyTypeInputErrors, "traderReceipt">;
};

const TraderRecepisseForm: React.FC<TraderRecepisseFormProps> = ({
  inputProps,
  inputErrors
}) => {
  return (
    <RecepisseForm
      title="Récépissé Négociant"
      inputProps={inputProps.traderReceipt}
      inputErrors={inputErrors.traderReceipt}
    />
  );
};

export default React.memo(TraderRecepisseForm);
