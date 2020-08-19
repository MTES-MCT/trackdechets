import { getExportsFileName } from "../filename";

describe("getExportsFileName", () => {
  test("one siret, no wasteCode", () => {
    const siret = "xxxxxxxxxxxxxx";
    const filename = getExportsFileName("OUTGOING", [siret]);
    expect(filename).toEqual(`TD-registre-sortant-${siret}`);
  });

  test("several sirets, no waste code", () => {
    const filename = getExportsFileName("OUTGOING", [
      "xxxxxxxxxxxxxx",
      "yyyyyyyyyyyyyy"
    ]);
    expect(filename).toEqual("TD-registre-sortant");
  });

  test("one siret, waste code", () => {
    const siret = "xxxxxxxxxxxxxx";
    const wasteCode = "09 98 67*";
    const filename = getExportsFileName("OUTGOING", [siret], wasteCode);
    expect(filename).toEqual(`TD-registre-sortant-${siret}-${wasteCode}`);
  });
});
