import { format } from "date-fns";
import { getRegistryFileName } from "../filename";

describe("getRegistryFileName", () => {
  test("one siret", () => {
    const siret = "11111111111111";
    const filename = getRegistryFileName("OUTGOING", [siret]);
    const today = format(new Date(), "yyyyMMdd");
    expect(filename).toEqual(`TD-Registre-${today}-Sortant-${siret}`);
  });
  test("several sirets", () => {
    const today = format(new Date(), "yyyyMMdd");
    const filename = getRegistryFileName("OUTGOING", [
      "11111111111111",
      "22222222222222"
    ]);
    expect(filename).toEqual(`TD-Registre-${today}-Sortant`);
  });
});
