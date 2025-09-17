import React from "react";
import { BsdType } from "@td/codegen-ui";
import CompanyContactInfo from "../CompanyContactInfo/CompanyContactInfo";
import { useField } from "formik";
import Trader from "./Trader";
import useTrader from "./useTrader";

type FormikTraderProps = {
  bsdType: BsdType;
  // SIRET de l'établissement courant
  siret?: string;
  disabled?: boolean;
};

const FormikTrader = ({
  bsdType = BsdType.Bsdd,
  siret,
  disabled = false
}: FormikTraderProps) => {
  const [field, _, { setValue }] = useField("trader");

  const { trader, setTrader } = useTrader(bsdType, field.value, trader =>
    setValue(trader)
  );

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
