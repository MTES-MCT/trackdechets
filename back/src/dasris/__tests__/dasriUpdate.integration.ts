import { resetDatabase } from "../../../integration-tests/helper";
import { ErrorCode } from "../../common/errors";
import { dasriFactory } from "./factories";
import { userWithCompanyFactory } from "../../__tests__/factories";
import makeClient from "../../__tests__/testClient";
import { DasriStatus } from "@prisma/client";
import prisma from "../../prisma";

const DASRI_UPDATE = `
mutation DasriUpdate($input: DasriUpdateInput!) {
  dasriUpdate(dasriUpdateInput: $input) {
    id
    readableId
    customId
    status

    emitter {
      company {
        name
        siret
        mail
      }
  
    }
    emission {
      wasteCode
      wasteDetailsOnuCode
      wasteDetails {
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
        mail
      }
    }
    transport {
      handedOverAt	
      takenOverAt
      wasteDetails {
        quantity
        quantityType
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
        mail
      }
    }
    reception {
      wasteDetails {
         quantity
        quantityType
      }
      wasteAcceptation {
        status
        refusalReason
        
        refusedQuantity
      }
      
    }
    operation {
      processingOperation
    }
    createdAt
    updatedAt
  }
}`;
describe("Mutation.dasriUpdate", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user to edit a dasri", async () => {
    const { mutate } = makeClient();

    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await dasriFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { errors } = await mutate(DASRI_UPDATE, {
      variables: { input: { id: dasri.id } }
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

  it("should disallow a user to update a dasri they are not part of", async () => {
    const { user: anotherUser, company } = await userWithCompanyFactory(
      "MEMBER"
    );
    const dasri = await dasriFactory({
      ownerId: anotherUser.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { user: connectedUser } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(connectedUser);
    const { errors } = await mutate(DASRI_UPDATE, {
      variables: {
        input: {
          id: dasri.id,
          emitter: { company: { mail: "test@test.test" } }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should disallow a user to update a deleted dasri", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await dasriFactory({
      ownerId: user.id,
      opt: {
        isDeleted: true,
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      id: dasri.id,
      emitter: { company: { mail: "test@test.test" } }
    };

    const { errors } = await mutate(DASRI_UPDATE, {
      variables: {
        input
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau avec l'identifiant "${dasri.id}" n'existe pas.`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it.each([DasriStatus.PROCESSED, DasriStatus.REFUSED])(
    "should disallow to update a %p dasri",
    async status => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const dasri = await dasriFactory({
        ownerId: user.id,
        opt: {
          status: status,
          emitterCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const input = {
        id: dasri.id,
        emitter: { company: { mail: "test@test.test" } }
      };

      const { errors } = await mutate(DASRI_UPDATE, {
        variables: {
          input
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: `Ce bordereau n'est plus modifiable`,
          extensions: expect.objectContaining({
            code: ErrorCode.FORBIDDEN
          })
        })
      ]);
    }
  );
  it.each([DasriStatus.DRAFT, DasriStatus.SEALED])(
    "should be possible to update a %p dasri",
    async status => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const dasri = await dasriFactory({
        ownerId: user.id,
        opt: {
          status: status,
          emitterCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const input = {
        id: dasri.id,
        emitter: { company: { mail: "test@test.test" } }
      };

      const { data } = await mutate(DASRI_UPDATE, {
        variables: {
          input
        }
      });

      expect(data.dasriUpdate.emitter.company.mail).toBe("test@test.test");
    }
  );

  it("should disallow emitter fields update after emission signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await dasriFactory({
      ownerId: user.id,
      opt: {
        status: DasriStatus.READY_FOR_TAKEOVER,
        emitterCompanySiret: company.siret,
        emissionSignedBy: user.name,
        emissionSignatory: { connect: { id: user.id } },
        emissionSignedAt: new Date()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      id: dasri.id,
      emitter: {
        company: {
          mail: "test@test.test"
        }
      }
    };

    const { errors } = await mutate(DASRI_UPDATE, {
      variables: { input }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés: emitterCompanyMail",

        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should allow transporter and recipient fields update after emission signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    let dasri = await dasriFactory({
      ownerId: user.id,
      opt: {
        status: DasriStatus.READY_FOR_TAKEOVER,
        emitterCompanySiret: company.siret,
        emissionSignedBy: user.name,
        emissionSignatory: { connect: { id: user.id } },
        emissionSignedAt: new Date()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      id: dasri.id,
      transporter: {
        company: {
          mail: "transporter@test.test"
        }
      },
      recipient: {
        company: {
          mail: "recipient@test.test"
        }
      }
    };

    await mutate(DASRI_UPDATE, {
      variables: { input }
    });

    dasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });
    expect(dasri.recipientCompanyMail).toEqual("recipient@test.test"); // status did not change
    expect(dasri.transporterCompanyMail).toEqual("transporter@test.test"); // status did not change
  });

  it("should disallow emitter and transporter fields update after transport signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await dasriFactory({
      ownerId: user.id,
      opt: {
        status: DasriStatus.SENT,
        emitterCompanySiret: company.siret,
        transportSignedBy: user.name,
        transportSignatory: { connect: { id: user.id } },
        transportSignedAt: new Date()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      id: dasri.id,
      emitter: {
        company: {
          mail: "test@test.test"
        }
      },
      transporter: {
        company: {
          mail: "test@test.test"
        }
      }
    };

    const { errors } = await mutate(DASRI_UPDATE, {
      variables: { input }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés: emitterCompanyMail,transporterCompanyMail",

        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should allow transporter handedOverAt field update after transport signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await dasriFactory({
      ownerId: user.id,
      opt: {
        status: DasriStatus.SENT,
        emitterCompanySiret: company.siret,
        transportSignedBy: user.name,
        transportSignatory: { connect: { id: user.id } },
        transportSignedAt: new Date()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      id: dasri.id,

      transport: {
        handedOverAt: new Date()
      }
    };

    await mutate(DASRI_UPDATE, {
      variables: { input }
    });
    const updatedDasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });
    expect(updatedDasri.handedOverToRecipientAt).not.toBeNull();
  });

  it("should disallow transporter handedOverAt field update after reception signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await dasriFactory({
      ownerId: user.id,
      opt: {
        status: DasriStatus.RECEIVED,
        emitterCompanySiret: company.siret,
        receptionSignedBy: user.name,
        receptionSignatory: { connect: { id: user.id } },
        receptionSignedAt: new Date()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      id: dasri.id,
      transport: {
        handedOverAt: new Date()
      }
    };
    // handedOverToRecipientAt can be updated even after dasri is sent, but not when it is received
    const { errors } = await mutate(DASRI_UPDATE, {
      variables: { input }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés: handedOverToRecipientAt",

        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
    const updatedDasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });
    expect(updatedDasri.handedOverToRecipientAt).toBeNull();
  });
  it("should allow recipient fields update after transport signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await dasriFactory({
      ownerId: user.id,
      opt: {
        status: DasriStatus.SENT,
        emitterCompanySiret: company.siret,
        transportSignedBy: user.name,
        transportSignatory: { connect: { id: user.id } },
        transportSignedAt: new Date()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      id: dasri.id,

      recipient: {
        company: {
          mail: "recipient@test.test"
        }
      }
    };

    const { data } = await mutate(DASRI_UPDATE, {
      variables: { input }
    });

    expect(data.dasriUpdate.recipient.company.mail).toBe("recipient@test.test");
  });

  it("should disallow emitter, transporter and reception fields update after reception signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await dasriFactory({
      ownerId: user.id,
      opt: {
        status: DasriStatus.RECEIVED,
        emitterCompanySiret: company.siret,
        receptionSignedBy: user.name,
        receptionSignatory: { connect: { id: user.id } },
        receptionSignedAt: new Date()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      id: dasri.id,

      recipient: {
        company: {
          mail: "test@test.test"
        }
      },
      reception: { wasteDetails: { quantity: 22 } }
    };

    const { errors } = await mutate(DASRI_UPDATE, {
      variables: { input }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés: recipientCompanyMail,recipientWasteQuantity",

        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should allow operation fields update after reception signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    let dasri = await dasriFactory({
      ownerId: user.id,
      opt: {
        status: DasriStatus.RECEIVED,
        emitterCompanySiret: company.siret,
        receptionSignedBy: user.name,
        receptionSignatory: { connect: { id: user.id } },
        receptionSignedAt: new Date()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      id: dasri.id,

      operation: { processingOperation: "D10" }
    };

    await mutate(DASRI_UPDATE, {
      variables: { input }
    });

    dasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });
    expect(dasri.processingOperation).toEqual("D10");
  });
});
