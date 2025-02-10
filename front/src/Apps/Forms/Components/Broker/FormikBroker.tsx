import React from "react";
import { BsdType } from "@td/codegen-ui";
import CompanyContactInfo from "../CompanyContactInfo/CompanyContactInfo";
import useBroker from "./useBroker";
import Broker from "./Broker";
import { useField } from "formik";

type FormikBrokerProps = {
  bsdType: BsdType;
  // N°SIRET de l'établissement courant
  siret?: string;
  disabled?: boolean;
};

const FormikBroker = ({
  bsdType,
  siret,
  disabled = false
}: FormikBrokerProps) => {
  const [field, _, { setValue }] = useField("broker");

  const { broker, setBroker } = useBroker(bsdType, field.value, broker =>
    setValue(broker)
  );

  return (
    <Broker
      siret={siret}
      disabled={disabled}
      broker={broker}
      setBroker={setBroker}
      companyContactInfo={<CompanyContactInfo fieldName="broker.company" />}
    />
  );
};

export default FormikBroker;
