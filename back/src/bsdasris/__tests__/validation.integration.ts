import { validateBsdasri } from "../validation";

import { initialData, readyToTakeOverData } from "./factories";

describe("Mutation.signBsdasri emission", () => {
  it("should validate emission", async () => {
    const dasri = initialData({ siret: 12312345600000, name: "emetteur" });
    await validateBsdasri(dasri, { emissionSignature: true });
  });

  it("should validate transport", async () => {
    const dasri = readyToTakeOverData({
      siret: 53075596600047,
      name: "transporteur"
    });
    await validateBsdasri(dasri, { transportSignature: true });
  });

  it("should validate emission and transport", async () => {
    const dasri = {
      ...initialData({ siret: 12312345600000, name: "emetteur" }),
      ...readyToTakeOverData({
        siret: 53075596600047,
        name: "transporteur"
      })
    };
    await validateBsdasri(dasri, {
      emissionSignature: true,
      transportSignature: true
    });
  });

  it("should not require recipisse when it's a foreign transport", async () => {
    const dasri = readyToTakeOverData({
      vatNumber: "DE53075596600047",
      name: "transporteur DE"
    });
    delete dasri.transporterRecepisseNumber;
    delete dasri.transporterRecepisseDepartment;
    delete dasri.transporterRecepisseValidityLimit;
    await validateBsdasri(dasri, { transportSignature: true });
  });
});
