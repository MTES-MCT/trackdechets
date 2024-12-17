import { UserRole, BspaohStatus } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Query } from "@td/codegen-back";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

import { bspaohFactory } from "../../../__tests__/factories";

const GET_BSPAOH = gql`
  query GetBpaoh($id: ID!) {
    bspaoh(id: $id) {
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

describe("Query.Bspaoh", () => {
  afterEach(resetDatabase);

  it("should return INITIAL bspaoh sealed/required fields", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const bsd = await bspaohFactory({
      opt: {
        status: BspaohStatus.INITIAL,
        emitterCompanySiret: emitterCompany.siret
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(data.bspaoh.metadata?.fields?.sealed?.length).toBe(0);
  });

  it("should return missing fields in error metadata", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const bsd = await bspaohFactory({
      opt: {
        status: BspaohStatus.INITIAL,
        emitterCompanySiret: emitterCompany.siret,
        destinationCompanyPhone: null
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(data.bspaoh.metadata?.errors?.[0]?.path).toStrictEqual([
      "destination",
      "company",
      "phone"
    ]);
  });

  it("should return EMISSION signed bspaoh sealed fields", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const bsd = await bspaohFactory({
      opt: {
        status: BspaohStatus.SIGNED_BY_PRODUCER,
        emitterCompanySiret: emitterCompany.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(data.bspaoh.metadata?.fields?.sealed?.length).toBe(19);
  });

  it("should return EMISSION signed bspaoh sealed fields with destination sealed", async () => {
    const emitterCompany = await companyFactory();
    const { user, company: transporterCompany } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const bsd = await bspaohFactory({
      opt: {
        status: BspaohStatus.SIGNED_BY_PRODUCER,
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

    const { data } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(data.bspaoh.metadata?.fields?.sealed?.length).toBe(25);
  });

  it("should return TRANSPORTER signed bspaoh sealed fields", async () => {
    const { user, company: transporterCompany } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const emitterCompany = await companyFactory();
    const bsd = await bspaohFactory({
      opt: {
        status: BspaohStatus.SENT,
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

    const { data } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(data.bspaoh.metadata?.fields?.sealed?.length).toBe(41);
  });

  it("should return RECEPTION signed bspaoh sealed fields", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const transporterCompany = await companyFactory();

    const bsd = await bspaohFactory({
      opt: {
        status: BspaohStatus.RECEIVED,
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date(),
        destinationReceptionSignatureDate: new Date(),
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

    const { data } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(data.bspaoh.metadata?.fields?.sealed?.length).toBe(49);
  });

  it("should return OPERATION signed bspaoh sealed fields", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const transporterCompany = await companyFactory();

    const bsd = await bspaohFactory({
      opt: {
        status: BspaohStatus.PROCESSED,
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date(),
        destinationReceptionSignatureDate: new Date(),
        destinationOperationSignatureDate: new Date(),
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

    const { data } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(data.bspaoh.metadata?.fields?.sealed?.length).toBe(52);
  });
});
