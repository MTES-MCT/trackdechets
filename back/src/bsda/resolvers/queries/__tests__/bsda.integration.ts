import { UserRole } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "@td/codegen-back";
import {
  userWithCompanyFactory,
  companyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { fullBsda } from "../../../fragments";
import { bsdaFactory } from "../../../__tests__/factories";
import { ErrorCode } from "../../../../common/errors";

const GET_BSDA = gql`
  query GetBsda($id: ID!) {
    bsda(id: $id) {
      ...FullBsda
    }
  }
  ${fullBsda}
`;

describe("Query.Bsda", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();
    const { company } = await userWithCompanyFactory("MEMBER");

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { errors } = await query<Pick<Query, "bsda">>(GET_BSDA, {
      variables: { id: bsda.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should forbid access to user not on the bsd", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { user: otherUser } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(otherUser);

    const { errors } = await query<Pick<Query, "bsda">>(GET_BSDA, {
      variables: { id: bsda.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à accéder à ce bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should allow access to admin user not on the bsd", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { user: otherUser } = await userWithCompanyFactory(
      "MEMBER",
      {},
      { isAdmin: true }
    );

    const { query } = makeClient(otherUser);

    const { data } = await query<Pick<Query, "bsda">>(GET_BSDA, {
      variables: { id: bsda.id }
    });

    expect(data.bsda.id).toBe(bsda.id);
  });

  it("should get a bsda by id", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const form = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsda">>(GET_BSDA, {
      variables: { id: form.id }
    });

    expect(data.bsda.id).toBe(form.id);
  });

  it("should get a bsda by id if current user is an intermediary", async () => {
    const otherCompany = await companyFactory();
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: otherCompany.siret,
        intermediaries: {
          create: [
            { siret: company.siret!, name: company.name, contact: "joe" }
          ]
        }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsda">>(GET_BSDA, {
      variables: { id: bsda.id }
    });
    expect(data.bsda.id).toBe(bsda.id);
  });

  it("should allow a foreign multi-modal transporter N>1 to read their BSDA", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      siret: null,
      vatNumber: "IT13029381004"
    });
    const form = await bsdaFactory({
      transporterOpt: {
        transporterCompanySiret: null,
        transporterCompanyVatNumber: company.vatNumber
      }
    });

    const { query } = makeClient(user);
    const { data, errors } = await query<Pick<Query, "bsda">>(GET_BSDA, {
      variables: {
        id: form.id
      }
    });

    expect(errors).toBeUndefined();

    expect(data.bsda.id).toBe(form.id);
  });
});
