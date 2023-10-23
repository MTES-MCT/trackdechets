import {
  check,
  getSealedRules,
  isAheadOfStepAndCheck,
  getContextualBsdaSchema
} from "../validate";
import { EditionRules } from "../rules";
import { BsdaSignatureType } from "../../../generated/graphql/types";
import { ZodBsda } from "../schema";

describe("check", () => {
  it("if function > should return the result of the executed function", () => {
    // Given
    const bsda1 = { type: "GATHERING" } as ZodBsda;
    const bsda2 = { type: "COLLECTION_2710" } as ZodBsda;
    const c = bsda => bsda.type === "GATHERING";

    // When
    const res1 = check(bsda1, c);
    const res2 = check(bsda2, c);

    // Then
    expect(res1).toEqual(true);
    expect(res2).toEqual(false);
  });

  it("if undefined > should default to true", () => {
    // Given
    const bsda = { type: "GATHERING" } as ZodBsda;
    const c = undefined;

    // When
    const res = check(bsda, c);

    // Then
    expect(res).toEqual(true);
  });
});

describe("isAheadOfStepAndCheck", () => {
  it("if signature step is prior to seal step > should return false", () => {
    // Given
    const fieldCheck = { from: "TRANSPORT" as BsdaSignatureType };
    const signatures: BsdaSignatureType[] = ["EMISSION"];
    const bsda = {} as ZodBsda;

    // When
    const res = isAheadOfStepAndCheck(bsda, signatures, fieldCheck);

    // Then
    expect(res).toEqual(false);
  });

  it("if signature step is prior to seal step and when=fn() > should return false", () => {
    // Given
    const fieldCheck = {
      from: "TRANSPORT" as BsdaSignatureType,
      when: bsda => bsda.type === "GATHERING"
    };
    const signatures: BsdaSignatureType[] = ["EMISSION"];
    const bsda = { type: "GATHERING" } as ZodBsda;

    // When
    const res = isAheadOfStepAndCheck(bsda, signatures, fieldCheck);

    // Then
    expect(res).toEqual(false);
  });

  it.each(["EMISSION", "WORK"])(
    "if signature step is ahead of seal step > should return true (step %p)",
    signature => {
      // Given
      const fieldCheck = { from: signature as BsdaSignatureType };
      const signatures: BsdaSignatureType[] = ["EMISSION", "WORK"];
      const bsda = {} as ZodBsda;

      // When
      const res = isAheadOfStepAndCheck(bsda, signatures, fieldCheck);

      // Then
      expect(res).toStrictEqual(true);
    }
  );

  it("if signature step is ahead of seal step but fieldCheck is undefined > should return false (step %p) ", () => {
    // Given
    const fieldCheck = undefined;
    const signatures: BsdaSignatureType[] = ["EMISSION", "TRANSPORT"];
    const bsda = {} as ZodBsda;

    // When
    const res = isAheadOfStepAndCheck(bsda, signatures, fieldCheck);

    // Then
    expect(res).toEqual(false);
  });

  it("if signature step is ahead of seal step but when=fn() > should return the result of the fn() ", () => {
    // Given
    const fieldCheck = {
      from: "EMISSION" as BsdaSignatureType,
      when: bsda => bsda.type === "GATHERING"
    };
    const signatures: BsdaSignatureType[] = ["EMISSION"];
    const bsda1 = { type: "GATHERING" } as ZodBsda;
    const bsda2 = { type: "COLLECTION_2710" } as ZodBsda;

    // When
    const res1 = isAheadOfStepAndCheck(bsda1, signatures, fieldCheck);
    const res2 = isAheadOfStepAndCheck(bsda2, signatures, fieldCheck);

    // Then
    expect(res1).toStrictEqual(true);
    expect(res2).toEqual(false);
  });
});

describe("getSealedRules", () => {
  it("if signature step is prior to seal step > should not return the rule", () => {
    // Given
    const rules = {
      type: {
        sealed: { from: "TRANSPORT" }
      }
    } as EditionRules;
    const signatures: BsdaSignatureType[] = ["EMISSION"];
    const bsda = {} as ZodBsda;

    // When
    const res = getSealedRules(signatures, bsda, rules);

    // Then
    expect(res).toEqual([]);
  });

  it("if signature step is prior to seal step and when=fn() > should not return the rule", () => {
    // Given
    const rules = {
      type: {
        sealed: { from: "TRANSPORT", when: bsda => bsda.type === "GATHERING" }
      }
    } as EditionRules;
    const signatures: BsdaSignatureType[] = ["EMISSION"];
    const bsda = { type: "GATHERING" } as ZodBsda;

    // When
    const res = getSealedRules(signatures, bsda, rules);

    // Then
    expect(res).toEqual([]);
  });

  it.each(["EMISSION", "WORK"])(
    "if signature step is ahead of seal step > should return the rule (step %p)",
    signature => {
      // Given
      const rules = {
        type: {
          sealed: { from: signature }
        }
      } as EditionRules;
      const signatures: BsdaSignatureType[] = ["EMISSION", "WORK"];
      const bsda = {} as ZodBsda;

      // When
      const res = getSealedRules(signatures, bsda, rules);

      // Then
      expect(res).toStrictEqual([["type", rules.type]]);
    }
  );

  it("if signature step is ahead of seal step but when=fn() > should return the result of the fn() ", () => {
    // Given
    const rules = {
      type: {
        sealed: { from: "EMISSION", when: bsda => bsda.type === "GATHERING" }
      }
    } as EditionRules;
    const signatures: BsdaSignatureType[] = ["EMISSION"];
    const bsda1 = { type: "GATHERING" } as ZodBsda;
    const bsda2 = { type: "COLLECTION_2710" } as ZodBsda;

    // When
    const res1 = getSealedRules(signatures, bsda1, rules);
    const res2 = getSealedRules(signatures, bsda2, rules);

    // Then
    expect(res1).toStrictEqual([["type", rules.type]]);
    expect(res2).toEqual([]);
  });
});

describe("validate", () => {
  describe("required", () => {
    it("if required is omitted > should not be required", async () => {
      // Given
      const bsda = {};
      const customEditionRules = {
        type: {}
      } as EditionRules;

      // When
      const schema = getContextualBsdaSchema(
        {
          currentSignatureType: "TRANSPORT"
        },
        customEditionRules
      );

      // Then
      const parsed = await schema.parseAsync(bsda);
      expect(parsed).toBeDefined();
    });

    it.each(["EMISSION", "WORK"])(
      "if signature step is prior to require step > should not be required (step: %p)",
      async signature => {
        // Given
        const bsda = {};
        const customEditionRules = {
          type: {
            required: { from: "TRANSPORT" as BsdaSignatureType }
          }
        } as EditionRules;

        // When
        const schema = getContextualBsdaSchema(
          {
            currentSignatureType: signature as BsdaSignatureType
          },
          customEditionRules
        );

        // Then
        const parsed = await schema.parseAsync(bsda);
        expect(parsed).toBeDefined();
      }
    );

    it.each(["EMISSION", "WORK"])(
      "if signature step is prior to require step and when=fn() > should not be required (step: %p)",
      async signature => {
        // Given
        const bsda = { type: "GATHERING" };
        const customEditionRules = {
          type: {
            required: {
              from: "TRANSPORT" as BsdaSignatureType,
              when: bsda => bsda.type === "GATHERING"
            }
          }
        } as EditionRules;

        // When
        const schema = getContextualBsdaSchema(
          {
            currentSignatureType: signature as BsdaSignatureType
          },
          customEditionRules
        );

        // Then
        const parsed = await schema.parseAsync(bsda);
        expect(parsed).toBeDefined();
      }
    );

    it.each(["EMISSION", "WORK"])(
      "if signature step is ahead of require step > should be required (step: %p)",
      async signature => {
        // Given
        const bsda = {};
        const customEditionRules = {
          type: {
            required: { from: "EMISSION" as BsdaSignatureType }
          }
        } as EditionRules;

        // When
        const schema = getContextualBsdaSchema(
          {
            currentSignatureType: signature as BsdaSignatureType
          },
          customEditionRules
        );

        // Then
        try {
          await schema.parseAsync(bsda);
        } catch (error) {
          expect(error.issues[0].message).toBe(
            "Le champ type est obligatoire."
          );
        }
      }
    );

    it("if when=fn() > should return result of fn()", async () => {
      // Given
      const bsda1 = { type: "GATHERING" };
      const bsda2 = { type: "COLLECTION_2710" };
      const customEditionRules = {
        type: {
          required: {
            from: "EMISSION" as BsdaSignatureType,
            when: bsda => bsda.type === "GATHERING"
          }
        }
      } as EditionRules;

      // When
      const schema = getContextualBsdaSchema(
        {
          currentSignatureType: "TRANSPORT"
        },
        customEditionRules
      );

      // Then
      const parsed = await schema.parseAsync(bsda1);
      expect(parsed).toBeDefined();

      // Then
      try {
        await schema.parseAsync(bsda2);
      } catch (error) {
        expect(error.issues[0].message).toBe("Le champ type est obligatoire.");
      }
    });
  });
});
