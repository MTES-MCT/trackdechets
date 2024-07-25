import React from "react";
import {
  CompanyTypeInputErrors,
  CompanyTypeInputProps
} from "./CompanyTypeForm";
import RecepisseForm from "./RecepisseForm";

type BrokerRecepisseFormProps = {
  inputProps: Pick<CompanyTypeInputProps, "brokerReceipt">;
  inputErrors: Pick<CompanyTypeInputErrors, "brokerReceipt">;
};

const BrokerRecepisseForm: React.FC<BrokerRecepisseFormProps> = ({
  inputProps,
  inputErrors
}) => {
  return (
    <RecepisseForm
      title="Récépissé Courtier"
      inputProps={inputProps.brokerReceipt}
      inputErrors={inputErrors.brokerReceipt}
    />
  );
};

export default React.memo(BrokerRecepisseForm);
