import { getRegisterFileName } from "../filename";

describe("getRegisterFileName", () => {
  test("one siret", () => {
    const siret = "11111111111111";
    const filename = getRegisterFileName("OUTGOING", [siret]);
    expect(filename).toEqual(`TD-Registre-Sortant-${siret}`);
  });
  test("several sirets", () => {
    const filename = getRegisterFileName("OUTGOING", [
      "11111111111111",
      "22222222222222"
    ]);
    expect(filename).toEqual(`TD-Registre-Sortant`);
  });
});
