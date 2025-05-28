import Decimal from "decimal.js";
import { WasteQuantities, wasteQuantities } from "../../common/wasteQuantities";

export const bsddWasteQuantities = ({
  wasteAcceptationStatus,
  quantityReceived,
  quantityRefused
}: {
  wasteAcceptationStatus?: string | null;
  quantityReceived?: Decimal | number | null;
  quantityRefused?: Decimal | number | null;
}): WasteQuantities | null => {
  return wasteQuantities({
    wasteAcceptationStatus,
    quantityReceived,
    quantityRefused
  });
};
