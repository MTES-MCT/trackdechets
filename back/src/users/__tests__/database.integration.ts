import { resetDatabase } from "../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { ErrorCode } from "../../common/errors";
import {
  userWithCompanyFactory,
  userFactory,
  companyFactory
} from "../../__tests__/factories";
import { associateUserToCompany, createUserAccountHash } from "../database";
import { getUserRoles } from "../../permissions";

describe("createUserAccountHash", () => {
  afterAll(resetDatabase);

  it("should return user account hash", async () => {
    const email = "john.snow@trackdechets.fr";
    const role = "MEMBER";
    const siret = "00000000000000";
    await createUserAccountHash(email, role, siret);
    const userAccountHashes = await prisma.userAccountHash.findMany();
    expect(userAccountHashes).toHaveLength(1);
    expect(userAccountHashes[0].email).toEqual(email);
    expect(userAccountHashes[0].role).toEqual(role);
    expect(userAccountHashes[0].companySiret).toEqual(siret);
  });

  it("should throw error if hash already exist", async () => {
    expect.assertions(2);
    const email = "john.snow@trackdechets.fr";
    const role = "MEMBER";
    const siret = "00000000000000";
    await prisma.userAccountHash.create({
      data: {
        email,
        role,
        companySiret: siret,
        hash: "hash"
      }
    });
    try {
      await createUserAccountHash(email, role, siret);
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(err.message).toEqual("Cet utilisateur a déjà été invité");
    }
  });
});

describe("associateUserToCompany", () => {
  it("should throw error if association already exists", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    try {
      await associateUserToCompany(user.id, company.siret, "MEMBER");
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(err.message).toEqual(
        "L'utilisateur est déjà membre de l'établissement"
      );
    }
  });

  it("should associate an user to a company", async () => {
    const user = await userFactory();
    const company = await companyFactory();

    await associateUserToCompany(user.id, company.siret, "MEMBER");
    const refreshedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });
    const userRoles = await getUserRoles(user.id);
    expect(userRoles).toEqual({ [company.orgId]: "MEMBER" });
    expect(refreshedUser.firstAssociationDate).toBeTruthy();
  });
});
