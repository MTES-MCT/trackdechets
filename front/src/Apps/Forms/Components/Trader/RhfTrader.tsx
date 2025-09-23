import React from "react";
import RhfCompanyContactInfo from "../RhfCompanyContactInfo/RhfCompanyContactInfo";
import { useFormContext } from "react-hook-form";
import Trader from "./Trader";
import { TraderInput } from "@td/codegen-ui";

type RhfTraderProps = {
  // SIRET de l'établissement courant
  siret?: string;
  disabled?: boolean;
  // Permet d'afficher ou non le switch "Présence d'un négociant"
  // Utile sur les révisions où il n'est pas possible de supprimer
  // un négociant existant.
  showSwitch?: boolean;
};

const RhfTrader = ({ siret, disabled = false, showSwitch }: RhfTraderProps) => {
  const { watch, setValue, formState } = useFormContext();

  const trader = watch("trader");
  const setTrader = (trader: TraderInput) =>
    setValue("trader", trader, { shouldDirty: true, shouldTouch: true });

  return (
    <Trader
      siret={siret}
      disabled={disabled}
      trader={trader}
      setTrader={setTrader}
      companyContactInfo={
        <RhfCompanyContactInfo
          fieldName="trader.company"
          errorObject={formState.errors}
        />
      }
      showSwitch={showSwitch}
    />
  );
};

export default RhfTrader;
