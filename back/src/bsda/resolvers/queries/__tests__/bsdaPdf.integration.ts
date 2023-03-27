import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import { bsdaFactory } from "../../../__tests__/factories";
import { Query } from "../../../../generated/graphql/types";

import { gql } from "apollo-server-express";

const BSDA_PDF = gql`
  query BsdaPdf($id: ID!) {
    bsdaPdf(id: $id) {
      token
    }
  }
`;

describe("Query.BsdaPdf", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();
    const bsda = await bsdaFactory({
      opt: {}
    });

    const { errors } = await query<Pick<Query, "bsdaPdf">>(BSDA_PDF, {
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

  it("should forbid access to user not on the bsd (simple bsda)", async () => {
    const bsda = await bsdaFactory({
      opt: {}
    });
    const { user } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "bsdaPdf">>(BSDA_PDF, {
      variables: { id: bsda.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous n'êtes pas autorisé à accéder au récépissé PDF de ce BSDA.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should return a token for requested id", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdaPdf">>(BSDA_PDF, {
      variables: { id: bsda.id }
    });

    expect(data.bsdaPdf.token).toBeTruthy();
  });

  it("should return a token for requested id if current user is not on the bsda but on a parent bsda", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const forwardingBsda = await bsdaFactory({
      opt: {
        forwarding: { connect: { id: bsda.id } }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdaPdf">>(BSDA_PDF, {
      variables: { id: forwardingBsda.id }
    });

    expect(data.bsdaPdf.token).toBeTruthy();
  });

  it("should return a token for requested id if current user is an intermediary", async () => {
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

    const { data } = await query<Pick<Query, "bsdaPdf">>(BSDA_PDF, {
      variables: { id: bsda.id }
    });

    expect(data.bsdaPdf.token).toBeTruthy();
  });
});
