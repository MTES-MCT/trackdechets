import { mergeValidationRules } from "../utils";
import { object } from "yup";

describe("merge correctly the validation schemas", () => {
  test("with a single schema", () => {
    const rules = mergeValidationRules([{ Query: { test: object({}) } }]);

    expect(rules.Query.test.validate).toBeDefined();
  });

  test("with many schema", () => {
    const rules = mergeValidationRules([
      { Query: { test: object({}) }, Mutation: { test: object({}) } },
      { Query: { other: object({}) }, Mutation: { other: object({}) } },
      {
        Query: { stillAnother: object({}) },
        Mutation: { stillAnother: object({}) },
        SubType: { subType: object({}) }
      }
    ]);

    expect(rules.Query.test.validate).toBeDefined();
    expect(rules.Mutation.test.validate).toBeDefined();
    expect(rules.Query.other.validate).toBeDefined();
    expect(rules.Mutation.other.validate).toBeDefined();
    expect(rules.SubType.subType.validate).toBeDefined();
  });
});
