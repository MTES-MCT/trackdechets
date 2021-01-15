import { resetDatabase } from "../../../../../integration-tests/helper";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { AuthType } from "../../../../auth";
import prisma from "../../../../prisma";

const EDIT_PROFILE = `
  mutation EditProfile($name: String, $email: String, $phone: String){
    editProfile(name: $name, email: $email, phone: $phone){
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
    const email = "newemail@trackdechets.fr";
    const phone = "01234567891";
    await mutate(EDIT_PROFILE, { variables: { name, email, phone } });
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    expect(updatedUser.name).toEqual(name);
    expect(updatedUser.email).toEqual(email);
    expect(updatedUser.phone).toEqual(phone);
  });
});
