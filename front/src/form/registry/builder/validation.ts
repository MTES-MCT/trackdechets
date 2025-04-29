import { z } from "zod";

export const nonEmptyString = z
  .string({
    required_error: "Champ requis"
  })
  .min(1, {
    message: "Champ requis"
  });

export const optionalString = z
  .string()
  .nullish()
  .transform(val => val || null);

export const nonEmptyNumber = z
  .string({
    required_error: "Champ requis"
  })
  .min(1, {
    message: "Champ requis"
  })
  .or(z.number())
  .transform(val => {
    if (val === null || val === undefined) return null;
    return typeof val === "string" ? parseFloat(val) : val;
  });

export const optionalNumber = z
  .string()
  .or(z.number())
  .nullish()
  .transform(val => {
    if (val === null || val === undefined) return null;
    return typeof val === "string" ? parseFloat(val) : val;
  });

export const booleanString = z
  .enum(["true", "false"])
  .or(z.boolean())
  .transform(val => val === "true" || val === true);

export const optionalBooleanString = z
  .enum(["true", "false"])
  .or(z.boolean())
  .nullish()
  .transform(val =>
    val === "true" || val === true
      ? true
      : val === "false" || val === false
      ? false
      : null
  );

export const filteredArray = z
  .array(z.string())
  .transform(arr => arr.filter(Boolean));
