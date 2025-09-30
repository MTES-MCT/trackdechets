import { AdminRequestValidationMethod } from "@td/prisma";
import {
  acceptAdminRequestInputSchema,
  createAdminRequestInputSchema
} from "../schema";

describe("createAdminRequestInputSchema", () => {
  it("should allow SIRET", () => {
    // Given
    const input = {
      companyOrgId: "43759200900017",
      validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
    };

    // When
    const res = createAdminRequestInputSchema.parse(input);

    // Then
    expect(res).not.toBeNull();
  });

  it("should allow VAT number", () => {
    // Given
    const input = {
      companyOrgId: "ESA50092402",
      validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
    };

    // When
    const res = createAdminRequestInputSchema.parse(input);

    // Then
    expect(res).not.toBeNull();
  });

  it("should not allow unfit string", () => {
    // Given
    const input = {
      companyOrgId: "test",
      validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
    };

    // When
    expect.assertions(1);
    try {
      createAdminRequestInputSchema.parse(input);
    } catch (err) {
      expect(err.issues[0].message).toBe(
        "L'identifiant de l'établissement companyOrgId doit être un SIRET ou un numéro de TVA valide."
      );
    }
  });
});

describe("acceptAdminRequestInputSchema", () => {
  it("should allow SIRET", () => {
    // Given
    const input = {
      orgId: "43759200900017",
      code: "00000000"
    };

    // When
    const res = acceptAdminRequestInputSchema.parse(input);

    // Then
    expect(res).not.toBeNull();
  });

  it("should allow VAT number", () => {
    // Given
    const input = {
      orgId: "ESA50092402",
      code: "00000000"
    };

    // When
    const res = acceptAdminRequestInputSchema.parse(input);

    // Then
    expect(res).not.toBeNull();
  });

  it("should not allow unfit string", () => {
    // Given
    const input = {
      orgId: "test",
      code: "00000000"
    };

    // When
    expect.assertions(1);
    try {
      acceptAdminRequestInputSchema.parse(input);
    } catch (err) {
      expect(err.issues[0].message).toBe(
        "L'identifiant de l'établissement orgId doit être un SIRET ou un numéro de TVA valide."
      );
    }
  });
});
