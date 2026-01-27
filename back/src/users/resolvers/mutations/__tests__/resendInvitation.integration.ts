import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory,
  adminFactory
} from "../../../../__tests__/factories";
import { createUserAccountHash } from "../../../database";
import { AuthType } from "../../../../auth/auth";
import makeClient from "../../../../__tests__/testClient";
import { sendMail } from "../../../../mailer/mailing";
import { renderMail, inviteUserToJoin } from "@td/mail";
import { ErrorCode, NotCompanyAdminErrorMsg } from "../../../../common/errors";
import { prisma } from "@td/prisma";

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

const RESEND_INVITATION = `
  mutation ResendInvitation($email: String!, $siret: String!){
    resendInvitation(email: $email, siret: $siret)
  }
`;

describe("mutation resendInvitation", () => {
  afterEach(resetDatabase);

  it("should resend a pending invitation", async () => {
    // set up an user, a company, its admin and an invitation (UserAccountHash)
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const usrToInvite = "john.snow@trackdechets.fr";
    const invitation = await createUserAccountHash(
      usrToInvite,
      "MEMBER",
      company.siret!
    );

    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });

    // Call the mutation to resend the invitation
    const res = await mutate(RESEND_INVITATION, {
      variables: { email: usrToInvite, siret: company.siret }
    });

    expect(res).toEqual({ data: { resendInvitation: true } });

    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(1);
    expect((sendMail as jest.Mock).mock.calls[0][0]).toEqual(
      renderMail(inviteUserToJoin, {
        to: [{ name: usrToInvite, email: usrToInvite }],
        variables: {
          companyName: company.name,
          hash: invitation.hash,
          companyOrgId: company.siret
        }
      })
    );
  });

  it("should not resend expired invitations", async () => {
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const usrToInvite = "expired.resend@trackdechets.fr";
    // create an expired invitation
    await prisma.userAccountHash.create({
      data: {
        email: usrToInvite,
        role: "MEMBER",
        companySiret: company.siret!,
        hash: "expired-resend",
        expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
      }
    });

    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });

    const { errors } = await mutate(RESEND_INVITATION, {
      variables: { email: usrToInvite, siret: company.siret }
    });

    expect(errors).toHaveLength(1);
    expect(errors?.[0].message).toEqual("Invitation non trouvée");
  });

  test("TD admin user can resend a pending invitation", async () => {
    const company = await companyFactory();
    const usrToInvite = "john.snow@trackdechets.fr";
    await createUserAccountHash(usrToInvite, "MEMBER", company.siret!);
    const tdAdminUser = await adminFactory();
    const { mutate } = makeClient({ ...tdAdminUser, auth: AuthType.Session });
    // Call the mutation to resend the invitation
    const res = await mutate(RESEND_INVITATION, {
      variables: { email: usrToInvite, siret: company.siret }
    });

    expect(res).toEqual({ data: { resendInvitation: true } });
  });

  test("user who isn't an admin of a company can't resend a pending invitation", async () => {
    const company = await companyFactory();
    const usrToInvite = "john.snow@trackdechets.fr";
    await createUserAccountHash(usrToInvite, "MEMBER", company.siret!);
    const notAdminUser = await userFactory({
      isAdmin: false
    });
    const { mutate } = makeClient({ ...notAdminUser, auth: AuthType.Session });

    // Call the mutation to resend the invitation
    const { errors } = await mutate(RESEND_INVITATION, {
      variables: { email: usrToInvite, siret: company.siret }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: NotCompanyAdminErrorMsg(company.orgId),
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });
});
