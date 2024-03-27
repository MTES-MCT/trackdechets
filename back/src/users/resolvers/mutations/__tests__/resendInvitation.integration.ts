import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import { createUserAccountHash } from "../../../database";
import { AuthType } from "../../../../auth";
import makeClient from "../../../../__tests__/testClient";
import { sendMail } from "../../../../mailer/mailing";
import { renderMail, inviteUserToJoin } from "@td/mail";

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
});
