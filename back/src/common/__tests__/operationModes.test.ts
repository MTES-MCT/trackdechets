import { OperationMode } from "@prisma/client";
import { getOperationModesFromOperationCode } from "../operationModes";
import { trim } from "../strings";

const test = (code: string, expectedModes: OperationMode[]) => {
  // With spaces
  const mode = getOperationModesFromOperationCode(code);
  expect(mode).toEqual(expectedModes);

  // Without spaces
  const modeTrimmed = getOperationModesFromOperationCode(trim(code));
  expect(modeTrimmed).toEqual(expectedModes);
};

describe("getOperationModesFromOperationCode", () => {
  it.each([
    "D 1",
    "D 2",
    "D 3",
    "D 4",
    "D 5",
    "D 6",
    "D 7",
    "D 8",

    "D 9 F",
    "D 10",
    "D 11",
    "D 12"
  ])("Code %p > [ELIMINATION]", code => {
    test(code, [OperationMode.ELIMINATION]);
  });

  it.each(["D 13", "D 14", "D 15", "R 12", "R 13", "D 9"])(
    "Regroupement code %p > []",
    code => {
      test(code, []);
    }
  );

  it.each(["R 0"])("Code %p > [REUTILISATION]", code => {
    test(code, [OperationMode.REUTILISATION]);
  });

  it.each(["R 1"])("Code %p > [ENERGY_RECOVERY]", code => {
    test(code, [OperationMode.VALORISATION_ENERGETIQUE]);
  });

  it.each(["R 2", "R 3", "R 4", "R 5", "R 7", "R 9", "R 11"])(
    "Code %p > [REUSE, RECYCLING]",
    code => {
      test(code, [OperationMode.REUTILISATION, OperationMode.RECYCLAGE]);
    }
  );

  it.each(["R 6", "R 8", "R 10"])("Code %p > [RECYCLING]", code => {
    test(code, [OperationMode.RECYCLAGE]);
  });
});
