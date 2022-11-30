import { format } from "date-fns";
import { siretify } from "../../__tests__/factories";
import { getRegistryFileName } from "../filename";

describe("getRegistryFileName", () => {
  test("one siret", () => {
    const siret = siretify(1);
    const filename = getRegistryFileName("OUTGOING", [siret]);
    const today = format(new Date(), "yyyyMMdd");
    expect(filename).toEqual(`TD-Registre-${today}-Sortant-${siret}`);
  });
  test("several sirets", () => {
    const today = format(new Date(), "yyyyMMdd");
    const filename = getRegistryFileName("OUTGOING", [
      siretify(1),
      siretify(1)
    ]);
    expect(filename).toEqual(`TD-Registre-${today}-Sortant`);
  });
});
