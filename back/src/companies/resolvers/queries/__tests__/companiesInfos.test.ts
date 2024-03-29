import { siretify } from "../../../../__tests__/factories";
import { companiesInfosSchema } from "../companiesInfos";

describe("companiesInfosSchema", () => {
  it("should return the orgIds (SIRET & VAT)", async () => {
    // Given
    const args = { orgIds: ["12973792129144", "BE0541696005"] };

    // When
    const { orgIds } = await companiesInfosSchema.validate(args);

    // Then
    expect(args.orgIds).toEqual(orgIds);
  });

  it("should remove duplicates", async () => {
    // Given
    const args = { orgIds: ["12973792129144", "12973792129144"] };

    // When
    const { orgIds } = await companiesInfosSchema.validate(args);

    // Then
    expect(orgIds.length).toEqual(1);
    expect(orgIds).toEqual(["12973792129144"]);
  });

  it("orgIds is required", async () => {
    // Given

    // When
    expect.assertions(1);
    try {
      await companiesInfosSchema.validate({});
    } catch (e) {
      // Then
      expect(e.message).toBe("orgIds field must have at least 1 items");
    }
  });

  it.each([null, undefined, [""], [null], [undefined], []])(
    "should not accept nulls ('%p')",
    async orgIds => {
      // Given
      const args = { orgIds };

      // When
      expect.assertions(1);
      try {
        await companiesInfosSchema.validate(args);
      } catch (e) {
        // Then
        expect(e.message).toBe("orgIds field must have at least 1 items");
      }
    }
  );

  it("should not accept invalid orgIds", async () => {
    // Given
    const args = { orgIds: ["not-a-siret"] };

    // When
    expect.assertions(1);
    try {
      await companiesInfosSchema.validate(args);
    } catch (e) {
      // Then
      expect(e.message).toBe("'not-a-siret' n'est pas un orgId valide");
    }
  });

  it("should not accept more than 100 orgIds", async () => {
    // Given
    const orgIds: string[] = [];
    for (let i = 0; i <= 100; i++) orgIds.push(siretify(i));
    const args = { orgIds };

    // When
    expect.assertions(1);
    try {
      await companiesInfosSchema.validate(args);
    } catch (e) {
      // Then
      expect(e.message).toBe(
        "orgIds field must have less than or equal to 100 items"
      );
    }
  });
});
