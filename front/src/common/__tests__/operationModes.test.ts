import { OperationMode } from "generated/graphql/types";
import { getOperationModesFromOperationCode } from "../operationModes";

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
    "D 9",
    "D 9 F",
    "D 10",
    "D 11",
    "D 12",
  ])("Code %p > [ELIMINATION]", code => {
    const mode = getOperationModesFromOperationCode(code);

    expect(mode).toEqual([OperationMode.Elimination]);
  });

  it.each(["D 13", "D 14", "D 15", "R 12", "R 13"])(
    "Regroupement code %p > []",
    code => {
      const mode = getOperationModesFromOperationCode(code);

      expect(mode).toEqual([]);
    }
  );

  it.each(["R 1"])("Code %p > [ENERGY_RECOVERY]", code => {
    const mode = getOperationModesFromOperationCode(code);

    expect(mode).toEqual([OperationMode.ValorisationEnergetique]);
  });

  it.each(["R 2", "R 3", "R 4", "R 5", "R 7", "R 9", "R 11"])(
    "Code %p > [REUSE, RECYCLING]",
    code => {
      const mode = getOperationModesFromOperationCode(code);

      expect(mode).toEqual([
        OperationMode.Reutilisation,
        OperationMode.Recyclage,
      ]);
    }
  );

  it.each(["R 6", "R 8", "R 10"])("Code %p > [RECYCLING]", code => {
    const mode = getOperationModesFromOperationCode(code);

    expect(mode).toEqual([OperationMode.Recyclage]);
  });
});
