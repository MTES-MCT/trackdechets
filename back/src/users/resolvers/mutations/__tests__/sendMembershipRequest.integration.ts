import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import * as mailsHelper from "../../../../mailer/mailing";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { associateUserToCompany } from "../../../database";
import { userMails } from "../../../mails";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

const SEND_MEMBERSHIP_REQUEST = `
  mutation SendMembershipRequest($siret: String!){
    sendMembershipRequest(siret: $siret){
      id
      email
      siret
      sentTo
      status
    }
  }
`;

describe("mutation sendMembershipRequest", () => {
  afterAll(resetDatabase);

  afterEach(sendMailSpy.mockClear);

  it("should deny access to unauthenticated users", async () => {
    const { mutate } = makeClient();
    const { company } = await userWithCompanyFactory("ADMIN");
    const { errors } = await mutate(SEND_MEMBERSHIP_REQUEST, {
      variables: { siret: company.siret }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual("Vous n'êtes pas connecté.");
  });

  it("should send a request to all admins of the company and create a MembershipRequest record", async () => {
    const requester = await userFactory();
    const admin = await userFactory({ email: "john.snow@trackdechets.fr" });
    const company = await companyFactory();
    await associateUserToCompany(admin.id, company.siret, "ADMIN");
    const { mutate } = makeClient(requester);
    const { data } = await mutate(SEND_MEMBERSHIP_REQUEST, {
      variables: { siret: company.siret }
    });
    const { id, status, sentTo, email, siret } = data.sendMembershipRequest;
    expect(status).toEqual("PENDING");
    // emails should be hidden
    expect(sentTo).toEqual(["jo****@trackdechets.fr"]);
    expect(email).toEqual(requester.email);
    expect(siret).toEqual(company.siret);
    const membershipRequest = await prisma.membershipRequest.findUnique({
      where: { id }
    });

    // check relation to user was created
    const linkedUser = await prisma.membershipRequest
      .findUnique({ where: { id } })
      .user();
    expect(linkedUser.id).toEqual(requester.id);

    // check relation to company was created
    const linkedCompany = await prisma.membershipRequest
      .findUnique({ where: { id } })
      .company();
    expect(linkedCompany.id).toEqual(company.id);

    expect(membershipRequest.sentTo).toEqual(["john.snow@trackdechets.fr"]);
    expect(membershipRequest.status).toEqual("PENDING");
    expect(membershipRequest.statusUpdatedBy).toBeNull();

    expect(sendMailSpy).toHaveBeenNthCalledWith(
      1,
      userMails.membershipRequest(
        [{ email: admin.email, name: admin.name }],
        `${process.env.UI_URL_SCHEME}://${process.env.UI_HOST}/membership-request/${membershipRequest.id}`,
        requester,
        company
      )
    );

    expect(sendMailSpy).toHaveBeenNthCalledWith(
      2,
      userMails.membershipRequestConfirmation(requester, company)
    );
  });

  it("should return an error if company does not exist", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const { errors } = await mutate(SEND_MEMBERSHIP_REQUEST, {
      variables: { siret: "12365478958956" }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Cet établissement n'existe pas dans Trackdéchets"
    );
  });

  it("should return an error if user is already member of the company", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);
    const { errors } = await mutate(SEND_MEMBERSHIP_REQUEST, {
      variables: { siret: company.siret }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Vous êtes déjà membre de cet établissement"
    );
  });

  it("should return an error if a pending request already exists", async () => {
    const requester = await userFactory();
    const company = await companyFactory();

    await prisma.membershipRequest.create({
      data: {
        user: { connect: { id: requester.id } },
        company: { connect: { id: company.id } }
      }
    });

    const { mutate } = makeClient(requester);

    const { errors } = await mutate(SEND_MEMBERSHIP_REQUEST, {
      variables: { siret: company.siret }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Une demande de rattachement a déjà été faite pour cet établissement"
    );
  });
});
