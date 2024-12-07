import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  companyFactory,
  siretify,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type { Query } from "@td/codegen-back";

const MEMBERSHIP_REQUEST = `
  query MembershipRequest($id: ID, $siret: String) {
    membershipRequest(id: $id, siret: $siret){
      id
      email
      siret
      name
      status
      sentTo
    }
  }
`;

describe("query membershipRequest", () => {
  afterAll(resetDatabase);

  it("should deny access to unauthenticated users", async () => {
    const { query } = makeClient();
    const { errors } = await query<Pick<Query, "membershipRequest">>(
      MEMBERSHIP_REQUEST
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].extensions?.code).toEqual(ErrorCode.UNAUTHENTICATED);
  });

  it("should return an error when trying to pass both id and siret", async () => {
    const user = await userFactory();
    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "membershipRequest">>(
      MEMBERSHIP_REQUEST,
      {
        variables: { id: "id", siret: siretify(7) }
      }
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Vous devez faire une recherche par `id` ou `siret` mais pas les deux"
    );
  });

  it("should return error if invitation request by id does not exist", async () => {
    const user = await userFactory();
    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "membershipRequest">>(
      MEMBERSHIP_REQUEST,
      {
        variables: { id: "does_not_exist" }
      }
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Cette demande de rattachement n'existe pas"
    );
  });

  it("should throw when no request found for authenticated user and siret", async () => {
    const user = await userFactory();
    const company = await companyFactory();
    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "membershipRequest">>(
      MEMBERSHIP_REQUEST,
      {
        variables: { siret: company.siret }
      }
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe("Demande de rattachement non trouvée");
  });

  it("should return an invitation request by id", async () => {
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const requester = await userFactory();
    const membershipRequest = await prisma.membershipRequest.create({
      data: {
        user: { connect: { id: requester.id } },
        company: { connect: { id: company.id } },
        sentTo: [admin.email, "someotheradmin@test.fr"]
      }
    });
    const { query } = makeClient(admin);
    const { data } = await query<Pick<Query, "membershipRequest">>(
      MEMBERSHIP_REQUEST,
      {
        variables: { id: membershipRequest.id }
      }
    );

    expect(data.membershipRequest).toMatchObject({
      status: "PENDING",
      email: requester.email,
      siret: company.siret,
      name: company.name,
      sentTo: [admin.email, "so****@test.fr"] // emails not belonging to user email domain are partially redacted
    });
  });

  it("should return a membership request by siret", async () => {
    const { user: _admin, company } = await userWithCompanyFactory("ADMIN");
    const requester = await userFactory();
    const membershipRequest = await prisma.membershipRequest.create({
      data: {
        user: { connect: { id: requester.id } },
        company: { connect: { id: company.id } }
      }
    });
    const { query } = makeClient(requester);
    const { data } = await query<Pick<Query, "membershipRequest">>(
      MEMBERSHIP_REQUEST,
      {
        variables: { siret: company.siret }
      }
    );
    expect(data.membershipRequest).toMatchObject({
      id: membershipRequest.id,
      status: "PENDING",
      email: requester.email,
      siret: company.siret,
      name: company.name
    });
  });

  it("should return a membership request by id when company is a foreign transporter", async () => {
    const { user: admin, company } = await userWithCompanyFactory("ADMIN", {
      siret: null,
      orgId: "IT13029381004",
      vatNumber: "IT13029381004"
    });
    const requester = await userFactory();
    const membershipRequest = await prisma.membershipRequest.create({
      data: {
        user: { connect: { id: requester.id } },
        company: { connect: { id: company.id } }
      }
    });
    const { query } = makeClient(admin);
    const { data, errors } = await query<Pick<Query, "membershipRequest">>(
      MEMBERSHIP_REQUEST,
      {
        variables: { id: membershipRequest.id }
      }
    );
    expect(errors).toBeUndefined();
    expect(data.membershipRequest).toMatchObject({
      id: membershipRequest.id,
      status: "PENDING",
      email: requester.email,
      siret: company.orgId,
      name: company.name
    });
  });
});
