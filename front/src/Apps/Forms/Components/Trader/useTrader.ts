import { TraderInput, BsdasriTraderInput, BsdType } from "@td/codegen-ui";
import { CommonTraderInput } from "./types";

type AnyTraderInput = TraderInput | BsdasriTraderInput | null;

const mapBsdTrader = (
  trader: AnyTraderInput | null,
  bsdType: BsdType
): CommonTraderInput | null => {
  if (trader) {
    if (bsdType === BsdType.Bsdd) {
      const { receipt, validityLimit, department, ...rest } =
        trader as TraderInput;
      // Utilise le format BSDASRI comme format commun
      return {
        ...rest,
        recepisse: { validityLimit, number: receipt, department }
      };
    } else {
      return trader;
    }
  }
  return null;
};

// Hook multi-bordereaux qui convertit les données en
// lecture et en écriture vers le format commun
export default function useTrader<T extends AnyTraderInput>(
  bsdType: BsdType,
  trader: T,
  setTrader: (traderInput: T) => void
) {
  const setAnyBsdTrader = (traderInput: CommonTraderInput | null) => {
    if (traderInput) {
      if (bsdType === BsdType.Bsdd) {
        const { recepisse, ...rest } = traderInput;
        setTrader({
          ...rest,
          receipt: recepisse?.number,
          department: recepisse?.department,
          validityLimit: recepisse?.validityLimit
        } as T);
      } else {
        setTrader(traderInput as T);
      }
    } else {
      setTrader(null as T);
    }
  };

  return { trader: mapBsdTrader(trader, bsdType), setTrader: setAnyBsdTrader };
}
