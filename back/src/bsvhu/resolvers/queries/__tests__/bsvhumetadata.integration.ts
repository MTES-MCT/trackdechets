import { UserRole, BsvhuStatus } from "@td/prisma";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Query } from "@td/codegen-back";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

import { bsvhuFactory } from "../../../__tests__/factories.vhu";

const GET_BSVHU = gql`
  query GetBsvhu($id: ID!) {
    bsvhu(id: $id) {
      id
      status
      metadata {
        errors {
          message
          path
        }
        fields {
          sealed
        }
      }
    }
  }
`;

describe("Query.Bsvhu", () => {
  afterEach(resetDatabase);

  it("should return INITIAL bsvhu sealed fields", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const bsd = await bsvhuFactory({
      opt: {
        status: BsvhuStatus.INITIAL,
        emitterCompanySiret: emitterCompany.siret
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhu">>(GET_BSVHU, {
      variables: { id: bsd.id }
    });
    expect(data.bsvhu.metadata?.fields?.sealed?.length).toBe(0);
  });

  it("should return missing fields in error metadata", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const bsd = await bsvhuFactory({
      opt: {
        status: BsvhuStatus.INITIAL,
        emitterCompanySiret: emitterCompany.siret,
        destinationCompanyPhone: null
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhu">>(GET_BSVHU, {
      variables: { id: bsd.id }
    });
    expect(data.bsvhu.metadata?.errors?.[0]?.path).toStrictEqual([
      "destination",
      "company",
      "phone"
    ]);
  });

  it("should return EMISSION signed bsvhu sealed fields", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const bsd = await bsvhuFactory({
      opt: {
        status: BsvhuStatus.SIGNED_BY_PRODUCER,
        emitterCompanySiret: emitterCompany.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhu">>(GET_BSVHU, {
      variables: { id: bsd.id }
    });

    expect(data.bsvhu.metadata?.fields?.sealed?.length).toBe(0);
  });

  it("should return EMISSION signed bsvhu sealed fields with emitter fields sealed", async () => {
    const emitterCompany = await companyFactory();
    const { user, company: transporterCompany } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const bsd = await bsvhuFactory({
      opt: {
        status: BsvhuStatus.SIGNED_BY_PRODUCER,
        emitterCompanySiret: emitterCompany.siret,
        emitterEmissionSignatureDate: new Date(),
        transporters: {
          create: {
            transporterCompanySiret: transporterCompany.siret,
            number: 1
          }
        }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhu">>(GET_BSVHU, {
      variables: { id: bsd.id }
    });

    expect(data.bsvhu.metadata?.fields?.sealed?.length).toBe(19);
  });

  it("should return TRANSPORTER signed bsvhu sealed fields", async () => {
    const { user, company: transporterCompany } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const emitterCompany = await companyFactory();
    const bsd = await bsvhuFactory({
      opt: {
        status: BsvhuStatus.SENT,
        emitterCompanySiret: emitterCompany.siret,
        emitterEmissionSignatureDate: new Date(),
        transporters: {
          create: {
            transporterCompanySiret: transporterCompany.siret,
            transporterTransportSignatureDate: new Date(),
            number: 1
          }
        }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhu">>(GET_BSVHU, {
      variables: { id: bsd.id }
    });

    expect(data.bsvhu.metadata?.fields?.sealed?.length).toBe(54);
  });

  it("should return OPERATION signed bsvhu sealed fields", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);

    const bsd = await bsvhuFactory({
      opt: {
        status: BsvhuStatus.PROCESSED,
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date(),
        destinationOperationSignatureDate: new Date(),
        transporters: {
          create: {
            transporterTransportSignatureDate: new Date(),
            number: 1
          }
        }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhu">>(GET_BSVHU, {
      variables: { id: bsd.id }
    });

    expect(data.bsvhu.metadata?.fields?.sealed?.length).toBe(100);
  });
});
