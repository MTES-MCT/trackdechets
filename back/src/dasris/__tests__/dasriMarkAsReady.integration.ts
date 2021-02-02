import { resetDatabase } from "../../../integration-tests/helper";
import { ErrorCode } from "../../common/errors";
import { userWithCompanyFactory } from "../../__tests__/factories";
import makeClient from "../../__tests__/testClient";

import { dasriFactory } from "./factories";
import prisma from "../../prisma";

const DASRI_MARK_AS_READY = `
mutation DasriMarkAsReady($id: ID!){
  dasriMarkAsReady(id: $id)  {
    id
    readableId
    customId
    status

    emitter {
      company {
        name
        siret
        contact
        phone
        address
        mail
      }
      workSite {
        name
        address
        city
        postalCode
      }
    }
    emission {
      wasteCode
      wasteDetailsOnuCode
      wasteDetails {
        volume
        quantity
        quantityType
      }
      handedOverAt
      signedBy
      signedAt
    }

    transporter {
      company {
        siret
      }
    }
    transport {
      handedOverAt
      takenOverAt
      wasteDetails {
        quantity
        quantityType
        volume
      }
      wasteAcceptation {
        status
        refusalReason

        refusedQuantity
      }
      signedAt
      signedBy
    }
    recipient {
      company {
        name
        siret
      }
    }
    reception {
      wasteDetails {
        volume
        quantity
        quantityType
      }
      wasteAcceptation {
        status
        refusalReason
        refusedQuantity
      }
      signedBy
      signedAt
    }
    operation {
      processedAt
      processingOperation
      signedBy
      signedAt
    }
    createdAt
    updatedAt
  }
}
`;
describe("Mutation.dasriMarkAsReady", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await dasriFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(); // unauthenticated user
    const { errors } = await mutate(DASRI_MARK_AS_READY, {
      variables: {
        id: dasri.id
      }
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

  it("should mark a draft dasri as accepted", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await dasriFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        transporterCompanySiret: "90000000000000",
        recipientCompanySiret: "80000000000000",
        transporterCompanyMail: "transporter@test.fr",
        recipientCompanyMail: "recipient@test.fr"
      }
    });
    const { mutate } = makeClient(user); // emitter

    const { data } = await mutate(DASRI_MARK_AS_READY, {
      variables: {
        id: dasri.id
      }
    });

    expect(data.dasriMarkAsReady.status).toBe("SEALED");

    const sealedDasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });

    expect(sealedDasri.status).toEqual("SEALED");
  });

  it("should not mark a draft dasri as accepted if mandatory fields are not filled", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await dasriFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret // missing fields
      }
    });
    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate(DASRI_MARK_AS_READY, {
      variables: {
        id: dasri.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "transporterCompanyMail est un champ requis et doit avoir une valeur",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);

    const sealedDasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });

    expect(sealedDasri.status).toEqual("DRAFT");
  });
});
