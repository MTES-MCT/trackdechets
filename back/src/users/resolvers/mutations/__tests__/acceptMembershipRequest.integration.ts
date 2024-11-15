import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth";
import { sendMail } from "../../../../mailer/mailing";
import {
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { renderMail, membershipRequestAccepted } from "@td/mail";
import { Mutation } from "../../../../generated/graphql/types";
import { UserRole } from "@prisma/client";
import { getDefaultNotifications } from "../../../notifications";

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

const ACCEPT_MEMBERSHIP_REQUEST = `
  mutation AcceptMembershipRequest($id: ID!, $role: UserRole!){
    acceptMembershipRequest(id: $id, role: $role){
      siret
      users {
        email
        role
      }
    }
  }
`;

describe("mutation acceptMembershipRequest", () => {
  afterAll(resetDatabase);
  afterEach((sendMail as jest.Mock).mockClear);

  it("should deny access to unauthenticated users", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate(ACCEPT_MEMBERSHIP_REQUEST, {
      variables: { id: "id", role: "MEMBER" }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual("Vous n'êtes pas connecté.");
  });

  it("should return error if the request does not exist", async () => {
    const user = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(ACCEPT_MEMBERSHIP_REQUEST, {
      variables: { id: "does_not_exist", role: "MEMBER" }
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
    const { errors } = await mutate(ACCEPT_MEMBERSHIP_REQUEST, {
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
    const { errors } = await mutate(ACCEPT_MEMBERSHIP_REQUEST, {
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
    const { errors } = await mutate(ACCEPT_MEMBERSHIP_REQUEST, {
      variables: { id: membershipRequest.id, role: "MEMBER" }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Cette demande de rattachement a déjà été refusée par un autre administrateur"
    );
  });

  it.each([UserRole.ADMIN, UserRole.MEMBER, UserRole.READER, UserRole.DRIVER])(
    "should associate requesting user to company with role %p",
    async role => {
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const requester = await userFactory();
      const membershipRequest = await prisma.membershipRequest.create({
        data: {
          user: { connect: { id: requester.id } },
          company: { connect: { id: company.id } }
        }
      });
      const { mutate } = makeClient({ ...user, auth: AuthType.Session });
      const { data } = await mutate<Pick<Mutation, "acceptMembershipRequest">>(
        ACCEPT_MEMBERSHIP_REQUEST,
        {
          variables: { id: membershipRequest.id, role }
        }
      );
      expect(data.acceptMembershipRequest.users).toHaveLength(2);
      const members = data.acceptMembershipRequest.users!.map(u => u.email);
      expect(members).toContain(user.email);

      const acceptedMembershipRequest =
        await prisma.membershipRequest.findUniqueOrThrow({
          where: {
            id: membershipRequest.id
          }
        });

      expect(acceptedMembershipRequest.status).toEqual("ACCEPTED");
      expect(acceptedMembershipRequest.statusUpdatedBy).toEqual(user.email);

      const companyAssociations = await prisma.companyAssociation.findMany({
        where: { user: { id: requester.id }, company: { id: company.id } }
      });

      expect(companyAssociations).toHaveLength(1);
      expect(companyAssociations[0].role).toEqual(role);

      const expectedNotifications = getDefaultNotifications(role);

      expect(companyAssociations[0]).toMatchObject(expectedNotifications);

      // when a new user is invited and accepts invitation, `automaticallyAccepted` is false
      expect(companyAssociations[0].automaticallyAccepted).toEqual(false);

      expect(sendMail as jest.Mock).toHaveBeenCalledWith(
        renderMail(membershipRequestAccepted, {
          to: [{ email: requester.email, name: requester.name }],
          variables: { companyName: company.name, companySiret: company.siret }
        })
      );
    }
  );
});
