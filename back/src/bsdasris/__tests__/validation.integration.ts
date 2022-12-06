import { ValidationError } from "yup";
import { siretify } from "../../__tests__/factories";
import { validateBsdasri } from "../validation";

import { initialData, readyToTakeOverData } from "./factories";

describe("Mutation.signBsdasri emission", () => {
  it("should validate emission", async () => {
    const dasri = initialData({ siret: siretify(1), name: "emetteur" });
    await validateBsdasri(dasri, { emissionSignature: true });
  });

  it("should validate transport", async () => {
    const dasri = readyToTakeOverData({
      siret: siretify(1),
      name: "transporteur"
    });
    await validateBsdasri(dasri, { transportSignature: true });
  });

  it("should validate emission and transport", async () => {
    const dasri = {
      ...initialData({ siret: siretify(1), name: "emetteur" }),
      ...readyToTakeOverData({
        siret: siretify(2),
        name: "transporteur"
      })
    };
    await validateBsdasri(dasri, {
      emissionSignature: true,
      transportSignature: true
    });
  });

  it("should validate without recipisse when it's a foreign transport", async () => {
    const dasri = readyToTakeOverData({
      vatNumber: "BE0541696005",
      name: "transporteur DE"
    });
    delete dasri.transporterRecepisseNumber;
    delete dasri.transporterRecepisseDepartment;
    delete dasri.transporterRecepisseValidityLimit;
    await validateBsdasri(dasri, { transportSignature: true });
  });

  it("should not validate without recipisse when it's a foreign transport", async () => {
    const dasri = await readyToTakeOverData({
      opt: {
        transporterCompanySiret: siretify(1),
        transporterCompanyName: "transporteur FR"
      }
    });
    delete dasri.transporterRecepisseDepartment;
    delete dasri.transporterRecepisseNumber;
    await expect(() =>
      validateBsdasri(dasri, {
        transportSignature: true
      })
    ).rejects.toThrow(ValidationError);
  });
});
