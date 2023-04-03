import {
  BsdaInput,
  BsdaRevisionRequestContentInput
} from "../../generated/graphql/types";
import {
  expandBsdaFromDb,
  expandBsdaRevisionRequestContent,
  flattenBsdaInput,
  flattenBsdaRevisionRequestInput
} from "../converter";

describe("flattenBsdaInput", () => {
  it("should convert tonnes to kg and deal with floating point precision", () => {
    const input: BsdaInput = {
      weight: { value: 4.06 },
      destination: { reception: { weight: 4.06 } }
    };
    const flattened = flattenBsdaInput(input);
    expect(flattened).toEqual({
      weightValue: 4060,
      destinationReceptionWeight: 4060
    });
  });
});

describe("expandBsdaFromDb", () => {
  it("should convert kg to tonnes", () => {
    const dbInput = {
      weightValue: 4060,
      destinationReceptionWeight: 4060
    };
    const expanded = expandBsdaFromDb(dbInput as any);
    expect(expanded).toMatchObject({
      weight: { value: 4.06 },
      destination: { reception: { weight: 4.06 } }
    });
  });
});

describe("flattenBsdaRevisionRequestInput", () => {
  it("should convert tonnes to kg and deal with floating point number", () => {
    const input: BsdaRevisionRequestContentInput = {
      destination: { reception: { weight: 4.06 } }
    };
    const flattened = flattenBsdaRevisionRequestInput(input);
    expect(flattened).toEqual({ destinationReceptionWeight: 4060 });
  });
});

describe("expandBsdaRevisionRequestContent", () => {
  it("should convert kg to tonnes", () => {
    const dbInput = {
      destinationReceptionWeight: 4060
    };
    const expanded = expandBsdaRevisionRequestContent(dbInput as any);
    expect(expanded).toMatchObject({
      destination: { reception: { weight: 4.06 } }
    });
  });
});
