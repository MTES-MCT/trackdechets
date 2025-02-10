import { BrokerInput, BsdaBrokerInput, BsdType } from "@td/codegen-ui";
import { CommonBrokerInput } from "./types";

type AnyBrokerInput = BrokerInput | BsdaBrokerInput | null;

export const mapBsdBroker = (
  broker: AnyBrokerInput | null,
  bsdType: BsdType
): CommonBrokerInput | null => {
  if (broker) {
    switch (bsdType) {
      case BsdType.Bsdd: {
        const { receipt, validityLimit, department, ...rest } =
          broker as BrokerInput;
        // Utilise le format BSDA comme format commun
        return {
          ...rest,
          recepisse: { validityLimit, number: receipt, department }
        };
      }
      default:
        return broker;
    }
  }
  return null;
};

// Hook multi-bordereaux qui convertit les données en
// lecture et en écriture vers le format commun
export default function useBroker<T extends AnyBrokerInput>(
  bsdType: BsdType,
  broker: T,
  setBroker: (brokerInput: T) => void
) {
  const setAnyBsdBroker = (brokerInput: CommonBrokerInput | null) => {
    if (brokerInput) {
      if (bsdType === BsdType.Bsdd) {
        const { recepisse, ...rest } = brokerInput;
        setBroker({
          ...rest,
          receipt: recepisse?.number,
          department: recepisse?.department,
          validityLimit: recepisse?.validityLimit
        } as T);
      } else {
        setBroker(brokerInput as T);
      }
    } else {
      setBroker(null as T);
    }
  };

  return { broker: mapBsdBroker(broker, bsdType), setBroker: setAnyBsdBroker };
}
