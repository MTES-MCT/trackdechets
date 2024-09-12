import {
  parseCreateRndtsDeclarationDelegationInput,
  parseQueryRndtsDeclarationDelegationArgs
} from "..";
import { CreateRndtsDeclarationDelegationInput } from "../../../generated/graphql/types";

describe("index", () => {
  describe("parseCreateRndtsDeclarationDelegationInput", () => {
    it("declaration with minimal info should be valid", () => {
      // Given
      const input: CreateRndtsDeclarationDelegationInput = {
        delegatorOrgId: "40081510600010",
        delegateOrgId: "39070205800012"
      };

      // When
      const delegation = parseCreateRndtsDeclarationDelegationInput(input);

      // Then
      expect(delegation).toMatchObject({
        delegatorOrgId: "40081510600010",
        delegateOrgId: "39070205800012"
      });
    });

    it("delegatorOrgId must be a valid orgId", () => {
      // Given
      const input: CreateRndtsDeclarationDelegationInput = {
        delegatorOrgId: "NOT-A-SIRET",
        delegateOrgId: "39070205800012"
      };

      // When
      expect.assertions(1);
      try {
        parseCreateRndtsDeclarationDelegationInput(input);
      } catch (error) {
        // Then
        expect(error.errors[0]).toMatchObject({
          path: ["delegatorOrgId"],
          message: "NOT-A-SIRET n'est pas un numéro de SIRET valide"
        });
      }
    });

    it("delegateOrgId must be a valid orgId", () => {
      // Given
      const input: CreateRndtsDeclarationDelegationInput = {
        delegatorOrgId: "40081510600010",
        delegateOrgId: "NOT-A-SIRET"
      };

      // When
      expect.assertions(1);
      try {
        parseCreateRndtsDeclarationDelegationInput(input);
      } catch (error) {
        // Then
        expect(error.errors[0]).toMatchObject({
          path: ["delegateOrgId"],
          message: "NOT-A-SIRET n'est pas un numéro de SIRET valide"
        });
      }
    });

    it("delegateOrgId must be different from delegatorOrgId", () => {
      // Given
      const input: CreateRndtsDeclarationDelegationInput = {
        delegatorOrgId: "40081510600010",
        delegateOrgId: "40081510600010"
      };

      // When
      expect.assertions(1);
      try {
        parseCreateRndtsDeclarationDelegationInput(input);
      } catch (error) {
        // Then
        expect(error.errors[0]).toMatchObject({
          path: ["delegatorOrgId"],
          message: "Le délégant et le délégataire doivent être différents."
        });
      }
    });

    it("validity start date cannot be in the past", () => {
      // Given
      const input: CreateRndtsDeclarationDelegationInput = {
        delegatorOrgId: "40081510600010",
        delegateOrgId: "39070205800012",
        validityStartDate: new Date("2000-01-01")
      };

      // When
      expect.assertions(1);
      try {
        parseCreateRndtsDeclarationDelegationInput(input);
      } catch (error) {
        // Then
        expect(error.errors[0]).toMatchObject({
          path: ["validityStartDate"],
          message:
            "La date de début de validité ne peut pas être dans le passé."
        });
      }
    });

    it("validity end date cannot be in the past", () => {
      // Given
      const input: CreateRndtsDeclarationDelegationInput = {
        delegatorOrgId: "40081510600010",
        delegateOrgId: "39070205800012",
        validityEndDate: new Date("2000-01-01")
      };

      // When
      expect.assertions(1);
      try {
        parseCreateRndtsDeclarationDelegationInput(input);
      } catch (error) {
        // Then
        expect(error.errors[0]).toMatchObject({
          path: ["validityEndDate"],
          message: "La date de fin de validité ne peut pas être dans le passé."
        });
      }
    });

    it("validity end date cannot be before validity start date", () => {
      // Given
      const input: CreateRndtsDeclarationDelegationInput = {
        delegatorOrgId: "40081510600010",
        delegateOrgId: "39070205800012",
        validityStartDate: new Date("2030-01-05"),
        validityEndDate: new Date("2030-01-01")
      };

      // When
      expect.assertions(1);
      try {
        parseCreateRndtsDeclarationDelegationInput(input);
      } catch (error) {
        // Then
        expect(error.errors[0]).toMatchObject({
          path: ["validityEndDate"],
          message:
            "La date de début de validité doit être avant la date de fin."
        });
      }
    });
  });

  describe("parseQueryRndtsDeclarationDelegationArgs", () => {
    it.each([null, undefined, 100, "no", "morethan25caracterssoitsinvalid"])(
      "should throw if id is invalid (value = %p)",
      id => {
        // Given

        // When
        expect.assertions(1);
        try {
          parseQueryRndtsDeclarationDelegationArgs({ id: id as string });
        } catch (error) {
          // Then
          expect(error.errors[0]).toMatchObject({
            path: ["id"],
            message: "L'id doit faire 25 caractères."
          });
        }
      }
    );

    it("should return valid id", () => {
      // Given
      const id = "cl81ooom5138122w9sbznzdkg";

      // When
      const result = parseQueryRndtsDeclarationDelegationArgs({ id });

      // Then
      expect(result.id).toBe(id);
    });
  });
});
