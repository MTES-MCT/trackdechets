import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const MEMBERSHIP_REQUEST = `
  query MembershipRequest($id: ID, $siret: String) {
    membershipRequest(id: $id, siret: $siret){
      id
      email
      siret
      name
      status
    }
  }
`;

describe("query membershipRequest", () => {
  afterAll(resetDatabase);

  it("should deny access to unauthenticated users", async () => {
    const { query } = makeClient();
    const { errors } = await query(MEMBERSHIP_REQUEST);
    expect(errors).toHaveLength(1);
    expect(errors[0].extensions.code).toEqual(ErrorCode.UNAUTHENTICATED);
  });

  it("should return an error when trying to pass both id and siret", async () => {
    const user = await userFactory();
    const { query } = makeClient(user);
    const { errors } = await query(MEMBERSHIP_REQUEST, {
      variables: { id: "id", siret: "siret" }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Vous devez faire une recherche par `id` ou `siret` mais pas les deux"
    );
  });

  it("should return error if invitation request by id does not exist", async () => {
    const user = await userFactory();
    const { query } = makeClient(user);
    const { errors } = await query(MEMBERSHIP_REQUEST, {
      variables: { id: "does_not_exist" }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Cette demande de rattachement n'existe pas"
    );
  });

  it("should return null when no request found for authenticated user and siret", async () => {
    const user = await userFactory();
    const company = await companyFactory();
    const { query } = makeClient(user);
    const { data } = await query(MEMBERSHIP_REQUEST, {
      variables: { siret: company.siret }
    });
    expect(data.membershipRequest).toBeNull();
  });

  it("should return an invitation request by id", async () => {
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const requester = await userFactory();
    const membershipRequest = await prisma.membershipRequest.create({
      data: {
        user: { connect: { id: requester.id } },
        company: { connect: { id: company.id } }
      }
    });
    const { query } = makeClient(admin);
    const { data } = await query(MEMBERSHIP_REQUEST, {
      variables: { id: membershipRequest.id }
    });

    expect(data.membershipRequest).toMatchObject({
      status: "PENDING",
      email: requester.email,
      siret: company.siret,
      name: company.name
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
    const { data } = await query(MEMBERSHIP_REQUEST, {
      variables: { siret: company.siret }
    });
    expect(data.membershipRequest).toMatchObject({
      id: membershipRequest.id,
      status: "PENDING",
      email: requester.email,
      siret: company.siret,
      name: company.name
    });
  });
});
