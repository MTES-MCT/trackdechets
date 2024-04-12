import { weight, weightConditions, WeightUnits } from "../validation";
import * as yup from "yup";

describe("weight validation", () => {
  test("a negative number should be an invalid weight", async () => {
    const schema = yup.object({ weight: weight().label("Émetteur") });

    const validateFn = () => schema.validate({ weight: -1 });

    await expect(validateFn()).rejects.toThrow(
      "Émetteur : le poids doit être supérieur ou égal à 0"
    );
  });

  test("null should be valid", async () => {
    const schema = yup.object({ weight: weight().label("Émetteur") });
    expect(await schema.isValid({ weight: null })).toEqual(true);
  });

  test("undefined should be valid", async () => {
    const schema = yup.object({ weight: weight().label("Émetteur") });
    expect(await schema.isValid({ weight: undefined })).toEqual(true);
  });

  test("null should not be valid when marking the weight required", async () => {
    const schema = yup.object({
      weight: weight().label("Émetteur").required()
    });
    expect(await schema.isValid({ weight: null })).toEqual(false);
  });

  test("null should not be valid when marking the weight required", async () => {
    const schema = yup.object({
      weight: weight().label("Émetteur").required()
    });
    expect(await schema.isValid({ weight: undefined })).toEqual(false);
  });

  test("0 should be a valid weight", async () => {
    const schema = yup.object({ weight: weight().label("Émetteur") });
    expect(await schema.isValid({ weight: 0 })).toEqual(true);
  });

  test("a positive number should be a valid weight", async () => {
    const schema = yup.object({ weight: weight().label("Émetteur") });
    expect(await schema.isValid({ weight: 1.1 })).toEqual(true);
  });

  test("a weight in T should not be greater than 50 000 T", async () => {
    const schema = yup.object({
      weight: weight(WeightUnits.Tonne).label("Émetteur")
    });
    const validateFn = () => schema.validate({ weight: 50001 });

    await expect(validateFn()).rejects.toThrow(
      "Émetteur : le poids doit être inférieur à 50000 tonnes"
    );
  });

  test("a weight in kilogramme should not be greater than 50 000 T", async () => {
    const schema = yup.object({
      weight: weight(WeightUnits.Kilogramme).label("Émetteur")
    });
    const validateFn = () => schema.validate({ weight: 50000001 });

    await expect(validateFn()).rejects.toThrow(
      "Émetteur : le poids doit être inférieur à 50000 tonnes"
    );
  });

  // test("a weight should be equal to 0 when acceptation status is REFUSED", async () => {
  //   const schema = yup.object({
  //     wasteAcceptationStatus: yup.string(),
  //     weight: weight()
  //       .label("Destinataire")
  //       .when("wasteAcceptationStatus", weightConditions.wasteAcceptationStatus)
  //   });
  //   const validateFn = () =>
  //     schema.validate({ weight: 1, wasteAcceptationStatus: "REFUSED" });

  //   await expect(validateFn()).rejects.toThrow(
  //     "Destinataire : le poids doit être égal à 0 lorsque le déchet est refusé"
  //   );
  // });

  test("a weight should be positive when acceptation status is ACCEPTED", async () => {
    const schema = yup.object({
      wasteAcceptationStatus: yup.string(),
      weight: weight()
        .label("Destinataire")
        .when("wasteAcceptationStatus", weightConditions.wasteAcceptationStatus)
    });
    const validateFn = () =>
      schema.validate({ weight: 0, wasteAcceptationStatus: "ACCEPTED" });

    await expect(validateFn()).rejects.toThrow(
      "Destinataire : le poids doit être supérieur à 0 lorsque le déchet est accepté"
    );
  });

  test("a weight in tonne should not be greater than 40 T when the transport mode is ROAD", async () => {
    const schema = yup.object({
      transportMode: yup.string(),
      weight: weight(WeightUnits.Tonne)
        .label("Destinataire")
        .when(
          "transportMode",
          weightConditions.transportMode(WeightUnits.Tonne)
        )
    });
    const validateFn = () =>
      schema.validate({ weight: 50, transportMode: "ROAD" });

    await expect(validateFn()).rejects.toThrow(
      "Destinataire : le poids doit être inférieur à 40 tonnes lorsque le transport se fait par la route"
    );
  });

  test("a weight in kilogramme should not be greater than 40 T when the transport mode is ROAD", async () => {
    const schema = yup.object({
      transportMode: yup.string(),
      weight: weight(WeightUnits.Kilogramme)
        .label("Destinataire")
        .when(
          "transportMode",
          weightConditions.transportMode(WeightUnits.Kilogramme)
        )
    });
    const validateFn = () =>
      schema.validate({ weight: 50000, transportMode: "ROAD" });

    await expect(validateFn()).rejects.toThrow(
      "Destinataire : le poids doit être inférieur à 40 tonnes lorsque le transport se fait par la route"
    );
  });
});
