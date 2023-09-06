import { OperationMode } from "generated/graphql/types";
import { getOperationModesFromOperationCode } from "../operationModes";

describe("getOperationModesFromOperationCode", () => {
  it.each([
    // With spaces
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
    // Without spaces
    "D1",
    "D2",
    "D3",
    "D4",
    "D5",
    "D6",
    "D7",
    "D8",
    "D9",
    "D9F",
    "D10",
    "D11",
    "D12",
  ])("Code %p > [ELIMINATION]", code => {
    const mode = getOperationModesFromOperationCode(code);

    expect(mode).toEqual([OperationMode.Elimination]);
  });

  it.each([
    // With spaces
    "D 13",
    "D 14",
    "D 15",
    "R 12",
    "R 13",
    // Without spaces
    "D13",
    "D14",
    "D15",
    "R12",
    "R13",
  ])("Regroupement code %p > []", code => {
    const mode = getOperationModesFromOperationCode(code);

    expect(mode).toEqual([]);
  });

  it.each([
    // With spaces
    "R 1",
    // Without spaces
    "R1",
  ])("Code %p > [ENERGY_RECOVERY]", code => {
    const mode = getOperationModesFromOperationCode(code);

    expect(mode).toEqual([OperationMode.ValorisationEnergetique]);
  });

  it.each([
    // With spaces
    "R 2",
    "R 3",
    "R 4",
    "R 5",
    "R 7",
    "R 9",
    "R 11",
    // Without spaces
    "R2",
    "R3",
    "R4",
    "R5",
    "R7",
    "R9",
    "R11",
  ])("Code %p > [REUSE, RECYCLING]", code => {
    const mode = getOperationModesFromOperationCode(code);

    expect(mode).toEqual([
      OperationMode.Reutilisation,
      OperationMode.Recyclage,
    ]);
  });

  it.each([
    // With spaces
    "R 6",
    "R 8",
    "R 10",
    // Without spaces
    "R6",
    "R8",
    "R10",
  ])("Code %p > [RECYCLING]", code => {
    const mode = getOperationModesFromOperationCode(code);

    expect(mode).toEqual([OperationMode.Recyclage]);
  });
});
