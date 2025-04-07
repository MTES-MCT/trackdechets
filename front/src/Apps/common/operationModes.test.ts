import { OperationMode } from "@td/codegen-ui";
import {
  getOperationModesFromOperationCode,
  CODES_AND_EXPECTED_OPERATION_MODES
} from "./operationModes";

const addSpaceAfterFirstCharacter = (input: string): string => {
  return input[0] + " " + input.slice(1);
};

const test = (code: string, expectedModes: OperationMode[]) => {
  // Without spaces
  const mode = getOperationModesFromOperationCode(code);
  expect(mode).toEqual(expectedModes);

  // With spaces
  const modeWithSpace = getOperationModesFromOperationCode(
    addSpaceAfterFirstCharacter(code)
  );
  expect(modeWithSpace).toEqual(expectedModes);
};

describe("getOperationModesFromOperationCode", () => {
  it.each(Object.keys(CODES_AND_EXPECTED_OPERATION_MODES))("Code %p", code => {
    test(code, CODES_AND_EXPECTED_OPERATION_MODES[code]);
  });
});
