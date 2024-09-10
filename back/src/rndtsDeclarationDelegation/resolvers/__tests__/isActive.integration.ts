import { nowPlusXHours } from "../../../utils";
import { rndtsDeclarationDelegationFactory } from "../../__tests__/factories";
import { getDelegation } from "../queries/__tests__/rndtsDeclarationDelegation.integration";

describe("isActive", () => {
  it("should return true if no validityEndDate", async () => {
    // Given
    const { delegation, delegateUser } =
      await rndtsDeclarationDelegationFactory();

    // When
    const { errors, data } = await getDelegation(delegateUser, delegation.id);

    // Then
    expect(errors).toBeUndefined();
    expect(data.rndtsDeclarationDelegation.isActive).toBeTruthy();
  });

  it("should return true if validityEndDate in the future", async () => {
    // Given
    const { delegation, delegateUser } =
      await rndtsDeclarationDelegationFactory({
        validityEndDate: nowPlusXHours(4).toISOString() as any
      });

    // When
    const { errors, data } = await getDelegation(delegateUser, delegation.id);

    // Then
    expect(errors).toBeUndefined();
    expect(data.rndtsDeclarationDelegation.isActive).toBeTruthy();
  });

  it("should return false because validityStartDate is in the future", async () => {
    // Given
    const { delegation, delegateUser } =
      await rndtsDeclarationDelegationFactory({
        validityStartDate: nowPlusXHours(1)
      });

    // When
    const { errors, data } = await getDelegation(delegateUser, delegation.id);

    // Then
    expect(errors).toBeUndefined();
    expect(data.rndtsDeclarationDelegation.isActive).toBeFalsy();
  });

  it("should return false because validityEndDate is in the past", async () => {
    // Given
    const { delegation, delegateUser } =
      await rndtsDeclarationDelegationFactory({
        validityStartDate: nowPlusXHours(-4).toISOString() as any,
        validityEndDate: nowPlusXHours(-3).toISOString() as any
      });

    // When
    const { errors, data } = await getDelegation(delegateUser, delegation.id);

    // Then
    expect(errors).toBeUndefined();
    expect(data.rndtsDeclarationDelegation.isActive).toBeFalsy();
  });

  it("should return false because isAccepted is false", async () => {
    // Given
    const { delegation, delegateUser } =
      await rndtsDeclarationDelegationFactory({
        isAccepted: false
      });

    // When
    const { errors, data } = await getDelegation(delegateUser, delegation.id);

    // Then
    expect(errors).toBeUndefined();
    expect(data.rndtsDeclarationDelegation.isActive).toBeFalsy();
  });
});
