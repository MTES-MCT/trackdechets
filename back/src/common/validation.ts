import { TransportMode, WasteAcceptationStatus } from "@prisma/client";
import * as yup from "yup";
import { ConditionBuilder, ConditionConfig } from "yup/lib/Condition";

// Poids maximum en tonnes tout mode de transport confondu
const MAX_WEIGHT_TONNES = 50000;

// Poids maximum en tonnes quand le transport se fait sur route
const MAX_WEIGHT_BY_ROAD_TONNES = 40;

export enum WeightUnits {
  Tonne,
  Kilogramme
}

export const weight = (unit = WeightUnits.Kilogramme) =>
  yup
    .number()
    .nullable()
    .min(0, "${path} : le poids doit être supérieur ou égal à 0")
    .max(
      unit == WeightUnits.Kilogramme
        ? MAX_WEIGHT_TONNES * 1000
        : MAX_WEIGHT_TONNES,
      `\${path} : le poids doit être inférieur à ${MAX_WEIGHT_TONNES} tonnes`
    );

// Differents conditions than can be applied to a weight based on the
// value of other sibling fields
type WeightConditions = {
  wasteAcceptationStatus: ConditionBuilder<yup.NumberSchema>;
  transportMode: (unit: WeightUnits) => ConditionConfig<yup.NumberSchema>;
};

export const weightConditions: WeightConditions = {
  wasteAcceptationStatus: (status, weight) => {
    if (status === WasteAcceptationStatus.REFUSED) {
      return weight.test({
        name: "is-0",
        test: weight => weight === 0,
        message:
          "${path} : le poids doit être égal à 0 lorsque le déchet est refusé"
      });
    } else if (
      [
        WasteAcceptationStatus.ACCEPTED,
        WasteAcceptationStatus.PARTIALLY_REFUSED
      ]
    ) {
      return weight.positive(
        "${path} : le poids doit être supérieur à 0 lorsque le déchet est accepté ou accepté partiellement"
      );
    }
    return weight;
  },
  transportMode: unit => ({
    is: TransportMode.ROAD,
    then: weight =>
      weight.max(
        unit == WeightUnits.Kilogramme
          ? MAX_WEIGHT_BY_ROAD_TONNES * 1000
          : MAX_WEIGHT_BY_ROAD_TONNES,
        `\${path} : le poids doit être inférieur à ${MAX_WEIGHT_BY_ROAD_TONNES}` +
          ` tonnes lorsque le transport se fait par la route`
      )
  })
};
