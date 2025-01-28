import React from "react";
import RhfCompanyContactInfo from "../RhfCompanyContactInfo/RhfCompanyContactInfo";
import Broker from "./Broker";
import { useFormContext } from "react-hook-form";
import useBroker from "./useBroker";
import { BsdType } from "@td/codegen-ui";

type RhfBrokerProps = {
  bsdType: BsdType;
  // N°SIRET de l'établissement courant
  siret?: string;
  disabled?: boolean;
  // Permet d'afficher ou non le switch "Présence d'un courtier"
  // Utile sur les révisions où il n'est pas possible de supprimer
  // un courtier existant.
  showSwitch?: boolean;
};

const RhfBroker = ({
  bsdType,
  siret,
  disabled = false,
  showSwitch
}: RhfBrokerProps) => {
  const { watch, setValue, formState } = useFormContext();

  const { broker, setBroker } = useBroker(bsdType, watch("broker"), broker =>
    setValue("broker", broker, { shouldDirty: true, shouldTouch: true })
  );

  return (
    <Broker
      siret={siret}
      disabled={disabled}
      broker={broker}
      setBroker={setBroker}
      companyContactInfo={
        <RhfCompanyContactInfo
          fieldName="broker.company"
          errorObject={formState.errors}
        />
      }
      showSwitch={showSwitch}
    />
  );
};

export default RhfBroker;
