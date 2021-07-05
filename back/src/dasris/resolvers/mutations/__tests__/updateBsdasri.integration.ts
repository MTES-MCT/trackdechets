import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { bsdasriFactory } from "../../../__tests__/factories";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus } from "@prisma/client";
import prisma from "../../../../prisma";
import { Mutation } from "../../../../generated/graphql/types";

const UPDATE_DASRI = `
mutation UpdateDasri($id: ID!, $input: BsdasriUpdateInput!) {
  updateBsdasri(id: $id, input: $input) {
    id
    status
    emitter {
       company {
          mail
        }
      }
  }
}`;
describe("Mutation.updateBsdasri", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user to edit a dasri", async () => {
    const { mutate } = makeClient();

    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: {
          id: dasri.id,
          input: { emitter: { company: { mail: "test@test.test" } } }
        }
      }
    );

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
    const dasri = await bsdasriFactory({
      ownerId: anotherUser.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { user: connectedUser } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(connectedUser);
    const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: {
          id: dasri.id,
          input: {
            emitter: { company: { mail: "test@test.test" } }
          }
        }
      }
    );

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
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        isDeleted: true,
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      emitter: { company: { mail: "test@test.test" } }
    };

    const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: {
          id: dasri.id,
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau avec l'identifiant "${dasri.id}" n'existe pas.`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it.each([BsdasriStatus.PROCESSED, BsdasriStatus.REFUSED])(
    "should disallow to update a %p dasri",
    async status => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const dasri = await bsdasriFactory({
        ownerId: user.id,
        opt: {
          status: status,
          emitterCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const input = {
        emitter: { company: { mail: "test@test.test" } }
      };

      const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
        UPDATE_DASRI,
        {
          variables: {
            id: dasri.id,
            input
          }
        }
      );

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
  it.each(["draft", "published"])(
    "should be possible to update a %p dasri",
    async draftStatus => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const dasri = await bsdasriFactory({
        ownerId: user.id,
        opt: {
          status: BsdasriStatus.INITIAL,
          isDraft: draftStatus === "draft",
          emitterCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const input = {
        emitter: { company: { mail: "test@test.test" } }
      };

      const { data } = await mutate<Pick<Mutation, "updateBsdasri">>(
        UPDATE_DASRI,
        {
          variables: {
            id: dasri.id,
            input
          }
        }
      );

      expect(data.updateBsdasri.emitter.company.mail).toBe("test@test.test");
    }
  );

  it("should disallow emitter fields update after emission signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.SIGNED_BY_PRODUCER,
        emitterCompanySiret: company.siret,
        emissionSignatureAuthor: user.name,
        emissionSignatory: { connect: { id: user.id } },
        emissionSignatureDate: new Date().toISOString()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      emitter: {
        company: {
          mail: "test@test.test"
        }
      }
    };

    const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: { id: dasri.id, input }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
    expect(errors[0].message).toContain(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés:"
    );
  });

  it("should allow transporter and recipient fields update after emission signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    let dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.SIGNED_BY_PRODUCER,
        emitterCompanySiret: company.siret,
        emissionSignatureAuthor: user.name,
        emissionSignatory: { connect: { id: user.id } },
        emissionSignatureDate: new Date().toISOString()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
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

    await mutate<Pick<Mutation, "updateBsdasri">>(UPDATE_DASRI, {
      variables: { id: dasri.id, input }
    });

    dasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id }
    });

    expect(dasri.recipientCompanyMail).toEqual("recipient@test.test");
    expect(dasri.transporterCompanyMail).toEqual("transporter@test.test");
  });

  it("should disallow emitter and transporter fields update after transport signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret: company.siret,
        transportSignatureAuthor: user.name,
        transportSignatory: { connect: { id: user.id } },
        transportSignatureDate: new Date().toISOString()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
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

    const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: { id: dasri.id, input }
      }
    );

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
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret: company.siret,
        transportSignatureAuthor: user.name,
        transportSignatory: { connect: { id: user.id } },
        transportSignatureDate: new Date().toISOString()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      transport: {
        handedOverAt: new Date().toISOString()
      }
    };

    await mutate<Pick<Mutation, "updateBsdasri">>(UPDATE_DASRI, {
      variables: { id: dasri.id, input }
    });
    const updatedDasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id }
    });
    expect(updatedDasri.handedOverToRecipientAt).not.toBeNull();
  });

  it("should disallow transporter handedOverAt field update after reception signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.RECEIVED,
        emitterCompanySiret: company.siret,
        receptionSignatureAuthor: user.name,
        receptionSignatory: { connect: { id: user.id } },
        receptionSignatureDate: new Date().toISOString()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      transport: {
        handedOverAt: new Date().toISOString()
      }
    };
    // handedOverToRecipientAt can be updated even after dasri is sent, but not when it is received
    const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: { id: dasri.id, input }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés: handedOverToRecipientAt",

        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
    const updatedDasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id }
    });
    expect(updatedDasri.handedOverToRecipientAt).toBeNull();
  });
  it("should allow recipient fields update after transport signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret: company.siret,
        transportSignatureAuthor: user.name,
        transportSignatory: { connect: { id: user.id } },
        transportSignatureDate: new Date().toISOString()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      recipient: {
        company: {
          mail: "recipient@test.test"
        }
      }
    };

    await mutate<Pick<Mutation, "updateBsdasri">>(UPDATE_DASRI, {
      variables: { id: dasri.id, input }
    });
    const updatedDasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id }
    });
    expect(updatedDasri.recipientCompanyMail).toBe("recipient@test.test");
  });

  it("should disallow emitter, transporter and reception fields update after reception signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.RECEIVED,
        emitterCompanySiret: company.siret,
        receptionSignatureAuthor: user.name,
        receptionSignatory: { connect: { id: user.id } },
        receptionSignatureDate: new Date().toISOString()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      recipient: {
        company: {
          mail: "test@test.test"
        }
      },
      reception: { wasteAcceptation: { status: "ACCEPTED" } }
    };

    const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: { id: dasri.id, input }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés: recipientCompanyMail,recipientWasteAcceptationStatus",

        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should allow operation fields update after reception signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    let dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.RECEIVED,
        emitterCompanySiret: company.siret,
        receptionSignatureAuthor: user.name,
        receptionSignatory: { connect: { id: user.id } },
        receptionSignatureDate: new Date().toISOString()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      operation: { processingOperation: "D10", quantity: { value: 20 } }
    };

    await mutate<Pick<Mutation, "updateBsdasri">>(UPDATE_DASRI, {
      variables: { id: dasri.id, input }
    });

    dasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id }
    });
    expect(dasri.processingOperation).toEqual("D10");
  });
});
