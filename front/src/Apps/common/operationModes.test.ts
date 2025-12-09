import { OperationMode } from "@td/codegen-ui";
import {
  CODES_AND_EXPECTED_OPERATION_MODES,
  getOperationModes
} from "@td/constants";

const addSpaceAfterFirstCharacter = (input: string): string => {
  return input[0] + " " + input.slice(1);
};

const test = (code: string, expectedModes: OperationMode[]) => {
  // Without spaces
  const mode = getOperationModes(code);
  expect(mode).toEqual(expectedModes);

  // With spaces
  const modeWithSpace = getOperationModes(addSpaceAfterFirstCharacter(code));
  expect(modeWithSpace).toEqual(expectedModes);
};

describe("getOperationModes", () => {
  it.each(Object.keys(CODES_AND_EXPECTED_OPERATION_MODES))("Code %p", code => {
    test(code, CODES_AND_EXPECTED_OPERATION_MODES[code]);
  });
});
