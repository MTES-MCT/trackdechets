import { resetDatabase } from "../../../../integration-tests/helper";
import prisma from "../../../prisma";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import acceptPendingInvitations from "../acceptPendingInvitations";

describe("acceptPendingInvitations", () => {
  afterAll(resetDatabase);

  it(
    "should not accept or delete pending invitations for " +
      "users that have not joined yet",
    async () => {
      const company = await companyFactory();
      const invitation = await prisma.userAccountHash.create({
        data: {
          email: "john.snow@trackdechets.fr",
          companySiret: company.siret!,
          role: "MEMBER",
          hash: "hash1"
        }
      });
      await acceptPendingInvitations();
      const untouchedInvitation =
        await prisma.userAccountHash.findUniqueOrThrow({
          where: {
            id: invitation.id
          }
        });
      expect(untouchedInvitation).not.toBeNull();
      expect(untouchedInvitation.acceptedAt).toBeNull();
    }
  );

  it(
    "should delete a pending invitation when user has" +
      "joined and is already company member",
    async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const invitation = await prisma.userAccountHash.create({
        data: {
          email: user.email,
          companySiret: company.siret!,
          role: "MEMBER",
          hash: "hash2"
        }
      });
      await acceptPendingInvitations();
      const deletedInvitation = await prisma.userAccountHash.findUnique({
        where: {
          id: invitation.id
        }
      });
      expect(deletedInvitation).toBeNull();
    }
  );

  it(
    "should accept a pending invitation when user has joined but " +
      "is not company member yet",
    async () => {
      const user = await userFactory();
      const company = await companyFactory();
      const invitation = await prisma.userAccountHash.create({
        data: {
          email: user.email,
          companySiret: company.siret!,
          role: "MEMBER",
          hash: "hash3"
        }
      });
      await acceptPendingInvitations();
      const acceptedInvitation = await prisma.userAccountHash.findUniqueOrThrow(
        {
          where: {
            id: invitation.id
          }
        }
      );
      expect(acceptedInvitation.acceptedAt).not.toBeNull();
    }
  );
});
