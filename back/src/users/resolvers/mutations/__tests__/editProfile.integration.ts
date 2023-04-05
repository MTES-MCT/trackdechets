import { resetDatabase } from "../../../../../integration-tests/helper";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { AuthType } from "../../../../auth";
import prisma from "../../../../prisma";
import { ErrorCode } from "../../../../common/errors";

const EDIT_PROFILE = `
  mutation EditProfile($name: String!, $phone: String){
    editProfile(name: $name, phone: $phone){
      name
      email
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
