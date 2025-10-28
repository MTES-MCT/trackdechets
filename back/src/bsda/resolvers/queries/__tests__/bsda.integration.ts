import { UserRole } from "@td/prisma";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Query } from "@td/codegen-back";
import {
  userWithCompanyFactory,
  companyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { fullBsda } from "../../../fragments";
import {
  bsdaFactory,
  bsdaTransporterFactory
} from "../../../__tests__/factories";
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

  it("should handle GraphQL BSDA with multiple transporters and metadata without enum error", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);

    // Create a BSDA with the first transporter
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        // Sign emission to move past EMISSION step
        emitterEmissionSignatureAuthor: "John Doe",
        emitterEmissionSignatureDate: new Date(),
        // Sign work to move past WORK step
        workerWorkSignatureAuthor: "Worker John",
        workerWorkSignatureDate: new Date()
      },
      // Sign the first transporter to trigger TRANSPORT_2 as next step
      transporterOpt: {
        transporterTransportSignatureAuthor: "Transporter John",
        transporterTransportSignatureDate: new Date()
      }
    });

    // Add a second transporter to enable multi-modal transport
    await bsdaTransporterFactory({
      bsdaId: bsda.id,
      opts: {
        transporterCompanyName: "Second Transport",
        transporterCompanySiret: "12345678901234",
        transporterCompanyAddress: "Second Transport Address",
        transporterCompanyContact: "Second Contact",
        transporterCompanyPhone: "02 02 02 02 02",
        transporterCompanyMail: "second@transport.com",
        transporterTransportMode: "ROAD"
      }
    });

    const GET_BSDA_WITH_METADATA = gql`
      query GetBsdaWithMetadata($id: ID!) {
        bsda(id: $id) {
          id
          metadata {
            errors {
              message
              path
              requiredFor
            }
          }
        }
      }
    `;

    const { query } = makeClient(user);

    // When
    const { data, errors } = await query(GET_BSDA_WITH_METADATA, {
      variables: { id: bsda.id }
    });

    // Then
    expect(errors).toBeUndefined();

    // Should successfully return data
    expect(data).toBeDefined();
    expect((data as any).bsda.id).toBe(bsda.id);
    expect((data as any).bsda.metadata).toBeDefined();
  });
});
