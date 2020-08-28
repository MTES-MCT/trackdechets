import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "../../../../generated/prisma-client";
import { AuthType } from "../../../../auth";

const INVITE_USER_TO_COMPANY = `
  mutation InviteUserToCompany($email: String!, $siret: String!, $role: UserRole!){
    inviteUserToCompany(email: $email, siret: $siret, role: $role){
      users {
        email
      }
    }
  }
`;
const sendMailMock = jest.fn();
jest.mock("../../../../common/mails.helper", () => ({
  sendMail: jest.fn(mail => sendMailMock(mail))
}));

describe("mutation inviteUserToCompany", () => {
  afterAll(resetDatabase);

  test("admin user can invite existing user to company", async () => {
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const user = await userFactory();
    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });
    const { data } = await mutate(INVITE_USER_TO_COMPANY, {
      variables: { email: user.email, siret: company.siret, role: "MEMBER" }
    });
    expect(data.inviteUserToCompany.users).toEqual([
      { email: admin.email },
      { email: user.email }
    ]);
    const companyAssociations = await prisma
      .user({ id: user.id })
      .companyAssociations();
    expect(companyAssociations).toHaveLength(1);
    expect(companyAssociations[0].role).toEqual("MEMBER");
    const userCompany = await prisma
      .companyAssociation({
        id: companyAssociations[0].id
      })
      .company();
    expect(userCompany.siret).toEqual(company.siret);
  });
});
