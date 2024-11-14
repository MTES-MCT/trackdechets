import {
  parseCreateRegistryDelegationInput,
  parseQueryRegistryDelegationArgs,
  parseQueryRegistryDelegationsArgs
} from "..";
import { CreateRegistryDelegationInput } from "../../../generated/graphql/types";
import { startOfDay } from "../../../utils";

describe("index", () => {
  describe("parseCreateRegistryDelegationInput", () => {
    it("if no start date > default to today at midnight", () => {
      // Given
      const input: CreateRegistryDelegationInput = {
        delegatorOrgId: "40081510600010",
        delegateOrgId: "39070205800012"
      };

      // When
      const delegation = parseCreateRegistryDelegationInput(input);

      // Then
      expect(delegation.delegatorOrgId).toBe("40081510600010");
      expect(delegation.delegateOrgId).toBe("39070205800012");
      expect(delegation.startDate?.toISOString()).toBe(
        startOfDay(new Date()).toISOString()
      );
      expect(delegation.endDate).toBeUndefined();
    });

    it("should fix dates to midnight", () => {
      // Given
      const input: CreateRegistryDelegationInput = {
        delegatorOrgId: "40081510600010",
        delegateOrgId: "39070205800012",
        startDate: new Date("2040-09-30T05:32:11.250Z"),
        endDate: new Date("2050-09-30T05:32:11.250Z")
      };

      // When
      const delegation = parseCreateRegistryDelegationInput(input);

      // Then
      expect(delegation.delegatorOrgId).toBe("40081510600010");
      expect(delegation.delegateOrgId).toBe("39070205800012");
      expect(delegation.startDate?.toISOString()).toBe(
        "2040-09-30T00:00:00.000Z"
      );
      expect(delegation.endDate?.toISOString()).toBe(
        "2050-09-30T23:59:59.999Z"
      );
    });

    it("declaration with minimal info should be valid", () => {
      // Given
      const input: CreateRegistryDelegationInput = {
        delegatorOrgId: "40081510600010",
        delegateOrgId: "39070205800012"
      };

      // When
      const delegation = parseCreateRegistryDelegationInput(input);

      // Then
      expect(delegation).toMatchObject({
        delegatorOrgId: "40081510600010",
        delegateOrgId: "39070205800012"
      });
    });

    it("delegatorOrgId must be a valid orgId", () => {
      // Given
      const input: CreateRegistryDelegationInput = {
        delegatorOrgId: "NOT-A-SIRET",
        delegateOrgId: "39070205800012"
      };

      // When
      expect.assertions(1);
      try {
        parseCreateRegistryDelegationInput(input);
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
      const input: CreateRegistryDelegationInput = {
        delegatorOrgId: "40081510600010",
        delegateOrgId: "NOT-A-SIRET"
      };

      // When
      expect.assertions(1);
      try {
        parseCreateRegistryDelegationInput(input);
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
      const input: CreateRegistryDelegationInput = {
        delegatorOrgId: "40081510600010",
        delegateOrgId: "40081510600010"
      };

      // When
      expect.assertions(1);
      try {
        parseCreateRegistryDelegationInput(input);
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
      const input: CreateRegistryDelegationInput = {
        delegatorOrgId: "40081510600010",
        delegateOrgId: "39070205800012",
        startDate: new Date("2000-01-01")
      };

      // When
      expect.assertions(1);
      try {
        parseCreateRegistryDelegationInput(input);
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
      const input: CreateRegistryDelegationInput = {
        delegatorOrgId: "40081510600010",
        delegateOrgId: "39070205800012",
        endDate: new Date("2000-01-01")
      };

      // When
      expect.assertions(1);
      try {
        parseCreateRegistryDelegationInput(input);
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
      const input: CreateRegistryDelegationInput = {
        delegatorOrgId: "40081510600010",
        delegateOrgId: "39070205800012",
        startDate: new Date("2030-01-05"),
        endDate: new Date("2030-01-01")
      };

      // When
      expect.assertions(1);
      try {
        parseCreateRegistryDelegationInput(input);
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

  describe("parseQueryRegistryDelegationArgs", () => {
    it.each([null, undefined, 100, "no", "morethan25caracterssoitsinvalid"])(
      "should throw if id is invalid (value = %p)",
      delegationId => {
        // Given

        // When
        expect.assertions(1);
        try {
          parseQueryRegistryDelegationArgs({
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
      const result = parseQueryRegistryDelegationArgs({ delegationId });

      // Then
      expect(result.delegationId).toBe(delegationId);
    });
  });

  describe("parseQueryRegistryDelegationsArgs", () => {
    it("should not allow passing where.delegator & where.delegate", () => {
      // Given
      const args = {
        where: {
          delegatorOrgId: "39070205800012",
          delegateOrgId: "39070205800012"
        }
      };

      // When
      expect.assertions(1);
      try {
        parseQueryRegistryDelegationsArgs(args);
      } catch (error) {
        // Then
        expect(error.errors[0]).toMatchObject({
          path: ["where"],
          message:
            "Vous ne pouvez pas renseigner les deux champs (delegatorOrgId et delegateOrgId)."
        });
      }
    });

    it("should not allow empty where.delegator & where.delegate", () => {
      // Given
      const args = { where: {} };

      // When
      expect.assertions(1);
      try {
        parseQueryRegistryDelegationsArgs(args);
      } catch (error) {
        // Then
        expect(error.errors[0]).toMatchObject({
          path: ["where"],
          message:
            "Vous devez renseigner un des champs delegatorOrgId, delegateOrgId ou givenToMe."
        });
      }
    });

    it("should return valid args", () => {
      // Given
      const args = {
        where: { delegatorOrgId: "39070205800012" },
        skip: 0,
        first: 10
      };

      // When
      const { where, skip, first } = parseQueryRegistryDelegationsArgs(args);

      // Then
      expect(where).toMatchObject({ delegatorOrgId: "39070205800012" });
      expect(skip).toBe(0);
      expect(first).toBe(10);
    });
  });
});
