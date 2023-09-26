import { getContextualBsdaSchema } from "../validate";
import { EditionRules } from "../rules";
import { BsdaSignatureType } from "../../../generated/graphql/types";

describe("validate", () => {
  describe("'isRequired' is a signature step", () => {
    it("field is not required before specified step", async () => {
      // Given
      const bsda = {};
      const customEditionRules = {
        emitterCompanySiret: {
          sealedBy: "WORK" as BsdaSignatureType,
          isRequired: "TRANSPORT" as BsdaSignatureType
        }
      } as EditionRules;

      // When
      const schema = getContextualBsdaSchema(
        {
          currentSignatureType: "EMISSION"
        },
        customEditionRules
      );

      // Then
      try {
        await schema.parseAsync(bsda);
      } catch (error) {
        expect(error).toBeUndefined();
      }
    });

    it.each(["WORK", "TRANSPORT", "OPERATION"])(
      "field should be required from specified step and further (step %p)",
      async currentSignatureType => {
        // Given
        const bsda = {};
        const customEditionRules = {
          emitterCompanySiret: {
            sealedBy: "WORK" as BsdaSignatureType,
            isRequired: "EMISSION" as BsdaSignatureType
          }
        } as EditionRules;

        // When
        const schema = getContextualBsdaSchema(
          {
            currentSignatureType: currentSignatureType as BsdaSignatureType
          },
          customEditionRules
        );

        // Then
        try {
          await schema.parseAsync(bsda);
        } catch (error) {
          expect(error.issues[0].message).toBe(
            "Le champ emitterCompanySiret est obligatoire."
          );
        }
      }
    );
  });
});
