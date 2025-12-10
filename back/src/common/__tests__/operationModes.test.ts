import {
  CODES_AND_EXPECTED_OPERATION_MODES,
  getOperationModes
} from "@td/constants";

const test = (code: string) => {
  // Without spaces
  const mode = getOperationModes(code);
  const modeWithoutSpace = getOperationModes(code.replace(/ /g, ""));
  expect(mode).toEqual(modeWithoutSpace);
};

describe("getOperationModes", () => {
  it.each(Object.keys(CODES_AND_EXPECTED_OPERATION_MODES))("Code %p", code => {
    test(code);
  });
});
