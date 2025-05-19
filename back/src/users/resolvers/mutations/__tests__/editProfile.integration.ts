import { resetDatabase } from "../../../../../integration-tests/helper";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { AuthType } from "../../../../auth/auth";
import { prisma } from "@td/prisma";
import { ErrorCode } from "../../../../common/errors";

const EDIT_PROFILE = `
  mutation EditProfile($name: String, $phone: String){
    editProfile(name: $name, phone: $phone){
      name
      phone
    }
  }
`;

describe("mutation editProfile", () => {
  afterAll(resetDatabase);
  it("should edit user profile", async () => {
    const user = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const name = "New Name";
    const phone = "01234567891";
    await mutate(EDIT_PROFILE, { variables: { name, phone } });
    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });
    expect(updatedUser.name).toEqual(name);
    expect(updatedUser.phone).toEqual(phone);
  });

  it("should be able to edit only the phone number", async () => {
    // Given
    const user = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const newPhone = "01234567891";

    // When
    await mutate(EDIT_PROFILE, { variables: { phone: newPhone } });
    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });

    // Then
    expect(updatedUser.name).toEqual(user.name);
    expect(updatedUser.phone).toEqual(newPhone);
  });

  it("should be able to edit only the name", async () => {
    // Given
    const user = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const newName = "New Name";

    // When
    await mutate(EDIT_PROFILE, { variables: { name: newName } });
    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });

    // Then
    expect(updatedUser.name).toEqual(newName);
    expect(updatedUser.phone).toEqual(user.phone);
  });

  it("should not be able to empty the name", async () => {
    // Given
    const user = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const newName = "";

    // When
    const { errors } = await mutate(EDIT_PROFILE, {
      variables: { name: newName }
    });
    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });

    // Then
    expect(errors).toEqual([
      expect.objectContaining({
        message: `The name cannot be an empty string`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
    expect(updatedUser.name).toEqual(user.name);
    expect(updatedUser.phone).toEqual(user.phone);
  });

  it("should be able to empty the phone number", async () => {
    // Given
    const user = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const newPhone = "";

    // When
    await mutate(EDIT_PROFILE, { variables: { phone: newPhone } });
    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });

    // Then
    expect(updatedUser.name).toEqual(user.name);
    expect(updatedUser.phone).toEqual(newPhone);
  });

  it("should fail to edit profile when name payload contains unsafe chars", async () => {
    const user = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const name = "hackers{{lolo}}";

    const { errors } = await mutate(EDIT_PROFILE, { variables: { name } });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Les caractères suivants sont interdits: { } % < > $ ' " =`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
});
