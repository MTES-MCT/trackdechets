import React from "react";
import { TraderInput } from "@td/codegen-ui";
import CompanyContactInfo from "../CompanyContactInfo/CompanyContactInfo";
import { useField } from "formik";
import Trader from "./Trader";

type FormikTraderProps = {
  // N°SIRET de l'établissement courant
  siret?: string;
  disabled?: boolean;
};

const FormikTrader = ({ siret, disabled = false }: FormikTraderProps) => {
  const [field, _, { setValue }] = useField("trader");

  const trader = field.value;
  const setTrader = (trader: TraderInput) => setValue(trader);

  return (
    <Trader
      siret={siret}
      disabled={disabled}
      trader={trader}
      setTrader={setTrader}
      companyContactInfo={<CompanyContactInfo fieldName="trader.company" />}
    />
  );
};

export default FormikTrader;
