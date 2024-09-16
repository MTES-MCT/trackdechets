import {
  parseCreateRndtsDeclarationDelegationInput,
  parseQueryRndtsDeclarationDelegationArgs,
  parseQueryRndtsDeclarationDelegationsArgs
} from "..";
import { CreateRndtsDeclarationDelegationInput } from "../../../generated/graphql/types";

describe("index", () => {
  describe("parseCreateRndtsDeclarationDelegationInput", () => {
    it("should clean up dates", () => {
      // Given
      const input: CreateRndtsDeclarationDelegationInput = {
        delegatorOrgId: "40081510600010",
        delegateOrgId: "39070205800012",
        startDate: new Date("2040-09-30T05:32:11.250Z"),
        endDate: new Date("2050-09-30T05:32:11.250Z")
      };

      // When
      const delegation = parseCreateRndtsDeclarationDelegationInput(input);

      // Then
      expect(delegation).toMatchObject({
        delegatorOrgId: "40081510600010",
        delegateOrgId: "39070205800012",
        startDate: new Date("2040-09-29T22:00:00.000Z"),
        endDate: new Date("2050-09-30T21:59:59.999Z")
      });
    });

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
        startDate: new Date("2000-01-01")
      };

      // When
      expect.assertions(1);
      try {
        parseCreateRndtsDeclarationDelegationInput(input);
      } catch (error) {
        // Then
        expect(error.errors[0]).toMatchObject({
          path: ["startDate"],
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
        endDate: new Date("2000-01-01")
      };

      // When
      expect.assertions(1);
      try {
        parseCreateRndtsDeclarationDelegationInput(input);
      } catch (error) {
        // Then
        expect(error.errors[0]).toMatchObject({
          path: ["endDate"],
          message: "La date de fin de validité ne peut pas être dans le passé."
        });
      }
    });

    it("validity end date cannot be before validity start date", () => {
      // Given
      const input: CreateRndtsDeclarationDelegationInput = {
        delegatorOrgId: "40081510600010",
        delegateOrgId: "39070205800012",
        startDate: new Date("2030-01-05"),
        endDate: new Date("2030-01-01")
      };

      // When
      expect.assertions(1);
      try {
        parseCreateRndtsDeclarationDelegationInput(input);
      } catch (error) {
        // Then
        expect(error.errors[0]).toMatchObject({
          path: ["endDate"],
          message:
            "La date de début de validité doit être avant la date de fin."
        });
      }
    });
  });

  describe("parseQueryRndtsDeclarationDelegationArgs", () => {
    it.each([null, undefined, 100, "no", "morethan25caracterssoitsinvalid"])(
      "should throw if id is invalid (value = %p)",
      delegationId => {
        // Given

        // When
        expect.assertions(1);
        try {
          parseQueryRndtsDeclarationDelegationArgs({
            delegationId: delegationId as string
          });
        } catch (error) {
          // Then
          expect(error.errors[0]).toMatchObject({
            path: ["delegationId"],
            message: "L'id doit faire 25 caractères."
          });
        }
      }
    );

    it("should return valid delegationId", () => {
      // Given
      const delegationId = "cl81ooom5138122w9sbznzdkg";

      // When
      const result = parseQueryRndtsDeclarationDelegationArgs({ delegationId });

      // Then
      expect(result.delegationId).toBe(delegationId);
    });
  });

  describe("parseQueryRndtsDeclarationDelegationsArgs", () => {
    it("should not allow passing where.delegator & where.delegate", () => {
      // Given
      const args = {
        where: {
          delegatorId: "cl81ooom5138122w9sbznzdkg",
          delegateId: "cl81ooom5138122w9sbznzdop"
        }
      };

      // When
      expect.assertions(1);
      try {
        parseQueryRndtsDeclarationDelegationsArgs(args);
      } catch (error) {
        // Then
        expect(error.errors[0]).toMatchObject({
          path: ["where"],
          message:
            "Vous ne pouvez pas renseigner les deux champs (delegatorId et delegateId)."
        });
      }
    });

    it("should not allow empty where.delegator & where.delegate", () => {
      // Given
      const args = { where: {} };

      // When
      expect.assertions(1);
      try {
        parseQueryRndtsDeclarationDelegationsArgs(args);
      } catch (error) {
        // Then
        expect(error.errors[0]).toMatchObject({
          path: ["where"],
          message:
            "Vous devez renseigner un des deux champs (delegatorId ou delegateId)."
        });
      }
    });

    it("should return valid args", () => {
      // Given
      const args = {
        where: { delegatorId: "cl81ooom5138122w9sbznzdkg" },
        after: "cl81ooom5138122w9sbznzdop",
        first: 10
      };

      // When
      const { where, after, first } =
        parseQueryRndtsDeclarationDelegationsArgs(args);

      // Then
      expect(where).toMatchObject({ delegatorId: "cl81ooom5138122w9sbznzdkg" });
      expect(after).toBe("cl81ooom5138122w9sbznzdop");
      expect(first).toBe(10);
    });
  });
});
