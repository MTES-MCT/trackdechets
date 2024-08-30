import { UserRole, BspaohStatus } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";
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
        fields {
          sealed
          requiredForNextSignature
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
    expect(data.bspaoh.metadata?.fields?.requiredForNextSignature?.length).toBe(
      17
    );
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
    expect(data.bspaoh.metadata?.fields?.requiredForNextSignature?.length).toBe(
      29
    );
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
    expect(data.bspaoh.metadata?.fields?.requiredForNextSignature?.length).toBe(
      29
    );
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
    expect(data.bspaoh.metadata?.fields?.requiredForNextSignature?.length).toBe(
      32
    );
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
    expect(data.bspaoh.metadata?.fields?.requiredForNextSignature?.length).toBe(
      34
    );
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
    expect(data.bspaoh.metadata?.fields?.requiredForNextSignature?.length).toBe(
      34
    );
  });
});
