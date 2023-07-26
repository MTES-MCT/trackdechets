import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import * as mailsHelper from "../../../../mailer/mailing";
import {
  companyFactory,
  siretify,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { associateUserToCompany } from "../../../database";
import { renderMail } from "../../../../mailer/templates/renderers";
import {
  membershipRequestConfirmation,
  membershipRequest as membershipRequestMail
} from "../../../../mailer/templates";
import { Mutation } from "../../../../generated/graphql/types";
import { subMinutes } from "date-fns";

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

  it("should send a request to all admins of the company and create a MembershipRequest record. Admins emails partially hidden.", async () => {
    const requester = await userFactory();
    const admin = await userFactory({
      email: "john.snow@trackdechets.fr",
      createdAt: subMinutes(new Date(), 5)
    });
    const company = await companyFactory();
    await associateUserToCompany(admin.id, company.siret, "ADMIN");
    const { mutate } = makeClient(requester);
    const { data } = await mutate<Pick<Mutation, "sendMembershipRequest">>(
      SEND_MEMBERSHIP_REQUEST,
      {
        variables: { siret: company.siret }
      }
    );
    const { id, status, sentTo, email, siret } = data.sendMembershipRequest!;
    expect(status).toEqual("PENDING");
    // emails should be hidden
    expect(sentTo).toEqual(["jo****@trackdechets.fr"]);
    expect(email).toEqual(requester.email);
    expect(siret).toEqual(company.siret);
    const membershipRequest = await prisma.membershipRequest.findUniqueOrThrow({
      where: { id }
    });

    // check relation to user was created
    const linkedUser = await prisma.membershipRequest
      .findUniqueOrThrow({ where: { id } })
      .user();
    expect(linkedUser?.id).toEqual(requester.id);

    // check relation to company was created
    const linkedCompany = await prisma.membershipRequest
      .findUniqueOrThrow({ where: { id } })
      .company();
    expect(linkedCompany?.id).toEqual(company.id);

    expect(membershipRequest.sentTo).toEqual(["john.snow@trackdechets.fr"]);
    expect(membershipRequest.status).toEqual("PENDING");
    expect(membershipRequest.statusUpdatedBy).toBeNull();

    expect(sendMailSpy).toHaveBeenNthCalledWith(
      1,
      renderMail(membershipRequestMail, {
        to: [{ email: admin.email, name: admin.name }],
        variables: {
          membershipRequestId: membershipRequest.id,
          companyName: company.name,
          companySiret: company.siret,
          userEmail: requester.email
        }
      })
    );
    // admin emails are not displayed because they do not belong to the same domain
    expect(sendMailSpy).toHaveBeenNthCalledWith(
      2,
      renderMail(membershipRequestConfirmation, {
        to: [{ email: requester.email, name: requester.name }],
        variables: {
          companyName: company.name,
          companySiret: company.siret,
          adminEmailsInfo: ""
        }
      })
    );
  });

  it("should send a request to all admins of the company and create a MembershipRequest record. Admins emails shown.", async () => {
    const userIndex = (await prisma.user.count()) + 1;

    const requester = await userFactory({
      email: `requester${userIndex}@trackdechets.fr`
    });
    const admin = await userFactory({
      email: `admin${userIndex}@trackdechets.fr`,
      createdAt: subMinutes(new Date(), 5)
    });
    const company = await companyFactory();
    await associateUserToCompany(admin.id, company.siret, "ADMIN");
    const { mutate } = makeClient(requester);
    const { data } = await mutate<Pick<Mutation, "sendMembershipRequest">>(
      SEND_MEMBERSHIP_REQUEST,
      {
        variables: { siret: company.siret }
      }
    );
    const { id, status, sentTo, email, siret } = data.sendMembershipRequest!;
    expect(status).toEqual("PENDING");
    // emails should be hidden
    expect(sentTo).toEqual([`admin${userIndex}@trackdechets.fr`]);
    expect(email).toEqual(requester.email);
    expect(siret).toEqual(company.siret);
    const membershipRequest = await prisma.membershipRequest.findUniqueOrThrow({
      where: { id }
    });

    // check relation to user was created
    const linkedUser = await prisma.membershipRequest
      .findUniqueOrThrow({ where: { id } })
      .user();
    expect(linkedUser?.id).toEqual(requester.id);

    // check relation to company was created
    const linkedCompany = await prisma.membershipRequest
      .findUniqueOrThrow({ where: { id } })
      .company();
    expect(linkedCompany?.id).toEqual(company.id);

    expect(membershipRequest.sentTo).toEqual([
      `admin${userIndex}@trackdechets.fr`
    ]);
    expect(membershipRequest.status).toEqual("PENDING");
    expect(membershipRequest.statusUpdatedBy).toBeNull();

    expect(sendMailSpy).toHaveBeenNthCalledWith(
      1,
      renderMail(membershipRequestMail, {
        to: [{ email: admin.email, name: admin.name }],
        variables: {
          membershipRequestId: membershipRequest.id,
          companyName: company.name,
          companySiret: company.siret,
          userEmail: requester.email
        }
      })
    );
    // admin emails   not displayed because they  belong to the same domain
    expect(sendMailSpy).toHaveBeenNthCalledWith(
      2,
      renderMail(membershipRequestConfirmation, {
        to: [{ email: requester.email, name: requester.name }],
        variables: {
          companyName: company.name,
          companySiret: company.siret,
          adminEmailsInfo: `Si vous n'avez pas de retour au bout de quelques jours, vous pourrez contacter: ${admin.email}`
        }
      })
    );
  });
  it("should return an error if company does not exist", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const { errors } = await mutate(SEND_MEMBERSHIP_REQUEST, {
      variables: { siret: siretify(1) }
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

  it("should return an error if a pending request already exists. Admin emails displayed.", async () => {
    // admin email tld != requester email tld, admin email not displayed
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
      "Une demande de rattachement a déjà été faite pour cet établissement."
    );
  });

  it("should return an error if a pending request already exists. Admin emails shown.", async () => {
    // admin email tld == requester email tld, admin email shown

    const userIndex = (await prisma.user.count()) + 1;

    const requester = await userFactory({
      email: `requester${userIndex}@trackdechets.fr`
    });
    const admin = await userFactory({
      email: `admin${userIndex}@trackdechets.fr`
    });
    const company = await companyFactory();
    await associateUserToCompany(admin.id, company.siret, "ADMIN");

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
      `Une demande de rattachement a déjà été faite pour cet établissement. Vous pouvez contacter directement: ${admin.email}`
    );
  });
});
