import { z } from "zod";
import { MAX_WEIGHT_TONNES, WeightUnits } from "../validation";

export const weightSchema = (unit = WeightUnits.Kilogramme) => {
  return z
    .number()
    .max(
      unit == WeightUnits.Kilogramme
        ? MAX_WEIGHT_TONNES * 1000
        : MAX_WEIGHT_TONNES,
      `le poids doit être inférieur à ${MAX_WEIGHT_TONNES} tonnes`
    );
};
