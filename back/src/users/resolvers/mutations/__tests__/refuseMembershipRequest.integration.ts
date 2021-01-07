import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "src/prisma";
import {
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import * as mailsHelper from "../../../../mailer/mailing";
import { userMails } from "../../../mails";
import { AuthType } from "../../../../auth";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

const REFUSE_MEMBERSHIP_REQUEST = `
  mutation RefuseMembershipRequest($id: ID!){
    refuseMembershipRequest(id: $id){
      siret
      users {
        email
        role
      }
    }
  }
`;

describe("mutation refuseMembershipRequest", () => {
  afterAll(resetDatabase);

  afterEach(sendMailSpy.mockClear);

  it("should deny access to unauthenticated users", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate(REFUSE_MEMBERSHIP_REQUEST, {
      variables: { id: "id" }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual("Vous n'êtes pas connecté.");
  });

  it("should return error if the request does not exist", async () => {
    const user = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(REFUSE_MEMBERSHIP_REQUEST, {
      variables: { id: "does_not_exist" }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Cette demande de rattachement n'existe pas"
    );
  });

  it("should return an error if user is not admin of the company", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const requester = await userFactory();
    const membershipRequest = await prisma.membershipRequest.create({
      data: {
        user: { connect: { id: requester.id } },
        company: { connect: { id: company.id } }
      }
    });
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(REFUSE_MEMBERSHIP_REQUEST, {
      variables: { id: membershipRequest.id, role: "MEMBER" }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      `Vous n'êtes pas administrateur de l'entreprise portant le siret "${company.siret}".`
    );
  });

  it("should return an error if the request is already accepted", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const requester = await userFactory();
    const membershipRequest = await prisma.membershipRequest.create({
      data: {
        user: { connect: { id: requester.id } },
        company: { connect: { id: company.id } },
        status: "ACCEPTED",
        statusUpdatedBy: "john.snow@trackdechets.fr"
      }
    });
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(REFUSE_MEMBERSHIP_REQUEST, {
      variables: { id: membershipRequest.id, role: "MEMBER" }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Cette demande de rattachement a déjà été acceptée par un autre administrateur"
    );
  });

  it("should return an error if the request is already refused", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const requester = await userFactory();
    const membershipRequest = await prisma.membershipRequest.create({
      data: {
        user: { connect: { id: requester.id } },
        company: { connect: { id: company.id } },
        status: "REFUSED",
        statusUpdatedBy: "john.snow@trackdechets.fr"
      }
    });
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(REFUSE_MEMBERSHIP_REQUEST, {
      variables: { id: membershipRequest.id, role: "MEMBER" }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Cette demande de rattachement a déjà été refusée par un autre administrateur"
    );
  });

  it("should refuse a membership request", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const requester = await userFactory();
    const membershipRequest = await prisma.membershipRequest.create({
      data: {
        user: { connect: { id: requester.id } },
        company: { connect: { id: company.id } }
      }
    });
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate(REFUSE_MEMBERSHIP_REQUEST, {
      variables: { id: membershipRequest.id }
    });
    expect(data.refuseMembershipRequest.users).toHaveLength(1);
    const refusedMembershipRequest = await prisma.membershipRequest.findUnique({
      where: {
        id: membershipRequest.id
      }
    });
    expect(refusedMembershipRequest.status).toEqual("REFUSED");
    expect(refusedMembershipRequest.statusUpdatedBy).toEqual(user.email);
    const associationExists =
      (await prisma.companyAssociation.findFirst({
        where: {
          user: { id: requester.id },
          company: { id: company.id }
        }
      })) != null;
    expect(associationExists).toEqual(false);
    expect(sendMailSpy).toHaveBeenCalledWith(
      userMails.membershipRequestRefused(requester, company)
    );
  });
});
