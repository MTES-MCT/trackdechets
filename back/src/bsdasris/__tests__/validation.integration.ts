import { validateBsdasri } from "../validation";

import { initialData, readyToTakeOverData } from "./factories";

describe("Mutation.signBsdasri emission", () => {
  it("should validate emission", async () => {
    const dasri = initialData({ siret: 12312345600000, name: "emetteur" });
    await validateBsdasri(dasri, { emissionSignature: true });
  });

  it("should validate transport", async () => {
    const dasri = readyToTakeOverData({
      siret: 12312345600001,
      name: "transporteur"
    });
    await validateBsdasri(dasri, { transportSignature: true });
  });

  it("should validate emission and transport", async () => {
    const dasri = {
      ...initialData({ siret: 12312345600000, name: "emetteur" }),
      ...readyToTakeOverData({
        siret: 12312345600001,
        name: "transporteur"
      })
    };
    await validateBsdasri(dasri, {
      emissionSignature: true,
      transportSignature: true
    });
  });
});
