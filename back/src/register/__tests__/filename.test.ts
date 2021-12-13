import { format } from "date-fns";
import { getRegisterFileName } from "../filename";

describe("getRegisterFileName", () => {
  test("one siret", () => {
    const siret = "11111111111111";
    const filename = getRegisterFileName("OUTGOING", [siret]);
    const today = format(new Date(), "yyyyMMdd");
    expect(filename).toEqual(`TD-Registre-${today}-Sortant-${siret}`);
  });
  test("several sirets", () => {
    const today = format(new Date(), "yyyyMMdd");
    const filename = getRegisterFileName("OUTGOING", [
      "11111111111111",
      "22222222222222"
    ]);
    expect(filename).toEqual(`TD-Registre-${today}-Sortant`);
  });
});
