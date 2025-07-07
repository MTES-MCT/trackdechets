import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  brokerData,
  bsdasriFactory,
  initialData,
  intermediaryData,
  readyToPublishData,
  readyToReceiveData,
  readyToTakeOverData,
  traderData
} from "../../../__tests__/factories";
import {
  userWithCompanyFactory,
  ecoOrganismeFactory,
  companyFactory,
  transporterReceiptFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus } from "@prisma/client";
import { prisma } from "@td/prisma";
import type { Mutation } from "@td/codegen-back";
import { fullGroupingBsdasriFragment } from "../../../fragments";
import { gql } from "graphql-tag";

const UPDATE_DASRI = gql`
  ${fullGroupingBsdasriFragment}
  mutation UpdateDasri($id: ID!, $input: BsdasriInput!) {
    updateBsdasri(id: $id, input: $input) {
      ...FullGroupingBsdasriFragment
    }
  }
`;

describe("Mutation.updateBsdasri", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should disallow unauthenticated user to edit a dasri", async () => {
    const { mutate } = makeClient();

    const { company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
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
    const { company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
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
          "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparaît pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should deny dasri update to intermdiary", async () => {
    const { user, company: intermediary } = await userWithCompanyFactory(
      "MEMBER"
    );
    const company = await companyFactory();

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(company),
        intermediaries: {
          create: [intermediaryData(intermediary)]
        }
      }
    });

    const { mutate } = makeClient(user);
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
          "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparaît pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should disallow a user to update a deleted dasri", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
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
        userId: user.id,
        opt: {
          status: BsdasriStatus.INITIAL,
          isDraft: draftStatus === "draft",
          emitterCompanySiret: company.siret,
          ...readyToPublishData(company)
        }
      });

      const { mutate } = makeClient(user);
      const newCompany = await companyFactory();
      const input = {
        emitter: { company: { mail: "test@test.test" } },
        destination: { company: { siret: newCompany.siret } }
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

      expect(data.updateBsdasri.emitter!.company!.mail).toBe("test@test.test");
      expect(data.updateBsdasri.type).toBe("SIMPLE");
      // check input is sirenified
      expect(data.updateBsdasri.destination!.company!.name).toBe(
        newCompany.name
      );
    }
  );

  it("should be possible for a trader to update a dasri", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");

    const { company: destination } = await userWithCompanyFactory("MEMBER");

    const { company: trader, user } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        ...traderData(trader)
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

    expect(data.updateBsdasri.emitter!.company!.mail).toBe("test@test.test");
  });

  it("should be possible for a broker to update a dasri", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");

    const { company: destination } = await userWithCompanyFactory("MEMBER");

    const { company: broker, user } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        ...brokerData(broker)
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

    expect(data.updateBsdasri.emitter!.company!.mail).toBe("test@test.test");
  });

  it("should set broker data to null and void recepisse", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { company: destination } = await userWithCompanyFactory("MEMBER");

    const { company: broker } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        ...brokerData(broker)
      }
    });

    const { mutate } = makeClient(user);

    const input = {
      broker: null
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

    expect(data.updateBsdasri.broker).toBe(null);
  });

  it("should set trader data to null and void recepisse", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { company: destination } = await userWithCompanyFactory("MEMBER");

    const { company: broker } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        ...traderData(broker)
      }
    });

    const { mutate } = makeClient(user);

    const input = {
      trader: null
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

    expect(data.updateBsdasri.broker).toBe(null);
  });

  it("should update intermediaries on a dasri", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");

    const { company: destination, user } = await userWithCompanyFactory(
      "MEMBER"
    );

    const intermediary = await companyFactory();

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination)
      }
    });

    const { mutate } = makeClient(user);

    const input = {
      intermediaries: [
        {
          siret: intermediary.siret,
          name: intermediary.name,
          address: intermediary.address,
          contact: intermediary.contact
        }
      ]
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

    expect(data.updateBsdasri.intermediaries).toStrictEqual([
      {
        siret: intermediary.siret,
        orgId: intermediary.siret,
        vatNumber: null,
        mail: null,
        name: intermediary.name,
        address: intermediary.address,
        country: "FR",
        phone: null,
        contact: intermediary.contact
      }
    ]);
  });

  it("should update intermediaries to null on a dasri", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");

    const { company: destination, user } = await userWithCompanyFactory(
      "MEMBER"
    );

    const intermediary = await companyFactory();

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        intermediaries: {
          create: [intermediaryData(intermediary)]
        }
      }
    });

    const { mutate } = makeClient(user);

    const { data } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: {
          id: dasri.id,
          input: { intermediaries: [] }
        }
      }
    );

    expect(data.updateBsdasri.intermediaries).toStrictEqual([]);
  });

  it("should forbid invalid transporter plates", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SIGNED_BY_PRODUCER,
        isDraft: false,
        emitterCompanySiret: company.siret,
        ...readyToPublishData(await companyFactory()),
        ...readyToTakeOverData(company)
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      transporter: { transport: { plates: "AA" } }
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
        message:
          "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
      })
    ]);
  });

  it("should allow invalid transporter plates if bsd was create before V2025020", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SIGNED_BY_PRODUCER,
        isDraft: false,
        emitterCompanySiret: company.siret,
        ...readyToPublishData(await companyFactory()),
        ...readyToTakeOverData(company),
        createdAt: new Date("2025-01-04T00:00:00.000Z") // created before V2025020
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      transporter: { transport: { plates: "AA" } }
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

    expect(errors).toBeUndefined();
  });

  it("should update transporter recepisse with data pulled from db", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      userId: user.id,
      opt: {
        status: BsdasriStatus.INITIAL,
        isDraft: true,
        emitterCompanySiret: company.siret,
        transporterCompanySiret: company.siret,
        ...readyToPublishData(await companyFactory())
      }
    });

    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    await transporterReceiptFactory({
      company: transporter
    });
    const { mutate } = makeClient(user);
    const input = {
      transporter: { company: { siret: transporter.siret } }
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
    // recepisse is pulled from db
    expect(data.updateBsdasri.transporter!.recepisse!.number).toEqual(
      "the number"
    );
    expect(data.updateBsdasri.transporter!.recepisse!.department).toEqual("83");
    expect(data.updateBsdasri.transporter!.recepisse!.validityLimit).toEqual(
      "2055-01-01T00:00:00.000Z"
    );
  });

  it("should empty transporter recepisse if transporter has no receipt data", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      userId: user.id,
      opt: {
        status: BsdasriStatus.INITIAL,
        isDraft: true,
        emitterCompanySiret: company.siret,
        transporterCompanySiret: company.siret,
        transporterRecepisseNumber: "xyz",
        transporterRecepisseDepartment: "13",
        transporterRecepisseValidityLimit: new Date(),
        ...readyToPublishData(await companyFactory())
      }
    });

    // no associated receipt
    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const { mutate } = makeClient(user);
    const input = {
      transporter: { company: { siret: transporter.siret } }
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
    // no receipt in db, recpisse fields are emptied
    expect(data.updateBsdasri.transporter!.recepisse).toEqual(null);
  });

  it("should store recepisse exemption", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    // no associated receipt
    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });

    const dasri = await bsdasriFactory({
      userId: user.id,
      opt: {
        status: BsdasriStatus.INITIAL,
        isDraft: true,
        emitterCompanySiret: company.siret,
        transporterCompanySiret: transporter.siret,
        transporterRecepisseNumber: "xyz",
        transporterRecepisseDepartment: "13",
        transporterRecepisseValidityLimit: new Date(),
        ...readyToPublishData(await companyFactory())
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      transporter: { recepisse: { isExempted: true } }
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
    // no receipt in db
    expect(data.updateBsdasri.transporter!.recepisse?.isExempted).toEqual(true);
  });

  it("should allow eco organisme fields update for INITIAL bsdasris", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const emitterCompany = await companyFactory();
    const ecoOrg = await ecoOrganismeFactory({
      handle: { handleBsdasri: true }
    });
    const { company: ecoOrgCompany } = await userWithCompanyFactory("MEMBER", {
      siret: ecoOrg.siret,
      name: "eco-org"
    });
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        status: BsdasriStatus.INITIAL,
        emitterCompanySiret: company.siret,

        ...readyToPublishData(emitterCompany)
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      ecoOrganisme: { siret: ecoOrg.siret, name: "eco-org" }
    };

    await mutate<Pick<Mutation, "updateBsdasri">>(UPDATE_DASRI, {
      variables: { id: dasri.id, input }
    });

    const updated = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(updated.ecoOrganismeSiret).toEqual(ecoOrgCompany.siret);
    expect(updated.ecoOrganismeName).toEqual("eco-org");
  });

  it("should allow eco organisme fields nulling for INITIAL bsdasris", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const ecoOrg = await ecoOrganismeFactory({
      handle: { handleBsdasri: true }
    });
    const { company: ecoOrgCompany } = await userWithCompanyFactory("MEMBER", {
      siret: ecoOrg.siret
    });
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        status: BsdasriStatus.INITIAL,

        ecoOrganismeName: ecoOrgCompany.siret,
        ecoOrganismeSiret: ecoOrgCompany.name,
        ...readyToPublishData(await companyFactory())
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      ecoOrganisme: null
    };

    await mutate<Pick<Mutation, "updateBsdasri">>(UPDATE_DASRI, {
      variables: { id: dasri.id, input }
    });
    const updated = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(updated.ecoOrganismeSiret).toEqual(null);
    expect(updated.ecoOrganismeName).toEqual(null);
  });
  it("should disallow emitter fields update after emission signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SIGNED_BY_PRODUCER,
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureAuthor: user.name,
        emissionSignatory: { connect: { id: user.id } },
        emitterEmissionSignatureDate: new Date().toISOString(),
        ...readyToPublishData(await companyFactory()),
        destinationCompanySiret: destination.company.siret
      }
    });

    const { mutate } = makeClient(destination.user);
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
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : L'adresse e-mail de l'émetteur"
    );
  });

  it("should disallow eco organisme fields update after emission signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const ecoOrg = await ecoOrganismeFactory({
      handle: { handleBsdasri: true }
    });
    const destination = await userWithCompanyFactory("MEMBER");

    await userWithCompanyFactory("MEMBER", {
      siret: ecoOrg.siret
    });
    const dasri = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SIGNED_BY_PRODUCER,
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureAuthor: user.name,
        emissionSignatory: { connect: { id: user.id } },
        emitterEmissionSignatureDate: new Date().toISOString(),
        ...readyToPublishData(await companyFactory()),
        destinationCompanySiret: destination.company.siret
      }
    });

    const { mutate } = makeClient(destination.user);
    const input = {
      ecoOrganisme: { siret: ecoOrg.siret, name: "eco-org" }
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
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : Le nom de l'éco-organisme, Le SIRET de l'éco-organisme"
    );
  });
  it("should allow transporter and destination fields update after emission signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        status: BsdasriStatus.SIGNED_BY_PRODUCER,
        emitterEmissionSignatureAuthor: user.name,
        emissionSignatory: { connect: { id: user.id } },
        emitterEmissionSignatureDate: new Date().toISOString(),
        ...readyToPublishData(await companyFactory())
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      transporter: {
        company: {
          mail: "transporter@test.test"
        }
      },
      destination: {
        company: {
          mail: "recipient@test.test"
        }
      },
      identification: {
        numbers: ["abc", "def"]
      }
    };

    await mutate<Pick<Mutation, "updateBsdasri">>(UPDATE_DASRI, {
      variables: { id: dasri.id, input }
    });

    const updatedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });

    expect(updatedDasri.destinationCompanyMail).toEqual("recipient@test.test");
    expect(updatedDasri.transporterCompanyMail).toEqual(
      "transporter@test.test"
    );
    expect(updatedDasri.type).toBe("SIMPLE");
  });

  it("should disallow emitter and transporter fields update after transport signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        status: BsdasriStatus.SENT,

        transporterTransportSignatureAuthor: user.name,
        transportSignatory: { connect: { id: user.id } },
        transporterTransportSignatureDate: new Date().toISOString(),
        ...readyToPublishData(await companyFactory())
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
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : L'adresse e-mail de l'émetteur, L'email du transporteur",

        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("BUGFIX: it should ignore null emitter weight update", async () => {
    // a bug in a helper function used to raise an error when receiving null weight on a persisted null weight
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),

        ...readyToPublishData(await companyFactory()),
        emitterWasteWeightValue: null,
        emitterWasteWeightIsEstimate: null,
        status: BsdasriStatus.SIGNED_BY_PRODUCER
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      emitter: {
        emission: {
          weight: { value: null }
        }
      },
      transporter: {
        company: { mail: "trs@test.com" }
      }
    };

    const { errors, data } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: { id: dasri.id, input }
      }
    );

    expect(errors).toBeUndefined();

    expect(data.updateBsdasri?.transporter!.company?.mail).toEqual(
      "trs@test.com"
    );
  });

  it("should allow transporter handedOverAt field update after transport signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory();
    const transporter = await companyFactory();
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        ...readyToTakeOverData(transporter),
        status: BsdasriStatus.SENT,
        transporterTransportSignatureAuthor: user.name,
        transportSignatory: { connect: { id: user.id } },
        transporterTransportSignatureDate: new Date().toISOString()
      }
    });

    const handedOverAt = new Date().toISOString();

    const { mutate } = makeClient(user);
    const input = {
      transporter: {
        transport: {
          handedOverAt
        }
      }
    };

    await mutate<Pick<Mutation, "updateBsdasri">>(UPDATE_DASRI, {
      variables: { id: dasri.id, input }
    });

    const updatedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(updatedDasri.handedOverToRecipientAt).not.toBe(handedOverAt);
  });

  it("should disallow transporter handedOverAt field update after reception signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory();
    const transporter = await companyFactory();
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        ...readyToTakeOverData(transporter),
        status: BsdasriStatus.RECEIVED,

        destinationReceptionSignatureAuthor: user.name,
        receptionSignatory: { connect: { id: user.id } },
        destinationReceptionSignatureDate: new Date().toISOString()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      transporter: {
        transport: {
          handedOverAt: new Date().toISOString()
        }
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
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : Remis au destinataire",

        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
    const updatedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(updatedDasri.handedOverToRecipientAt).toBeNull();
  });

  it("should compute destinationReceptionWasteVolume ", async () => {
    const emitter = await companyFactory();
    const { user, company: destination } = await userWithCompanyFactory(
      "MEMBER"
    );
    const transporter = await companyFactory();
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitter),
        ...readyToPublishData(destination),
        ...readyToTakeOverData(transporter),
        status: BsdasriStatus.SENT,

        transporterTransportSignatureAuthor: user.name,
        transportSignatory: { connect: { id: user.id } },
        transporterTransportSignatureDate: new Date().toISOString()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      destination: {
        reception: {
          packagings: [
            { type: "BOITE_CARTON", quantity: 3, volume: 3 },
            { type: "BOITE_CARTON", quantity: 2, volume: 1 }
          ]
        }
      }
    };

    const { data } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: { id: dasri.id, input }
      }
    );

    expect(data.updateBsdasri.destination!.reception!.volume).toEqual(11); // 3 * 3 + 2 * 1= 11
    const updatedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(updatedDasri.destinationReceptionWasteVolume).toEqual(11);
  });

  it("should allow destination fields update after transport signature", async () => {
    const { user, company: destination } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitter = await companyFactory();

    const transporter = await companyFactory();
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitter),
        ...readyToPublishData(destination),
        ...readyToTakeOverData(transporter),
        status: BsdasriStatus.SENT,
        transporterTransportSignatureAuthor: user.name,
        transportSignatory: { connect: { id: user.id } },
        transporterTransportSignatureDate: new Date().toISOString()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      destination: {
        company: {
          mail: "recipient@test.test"
        }
      },
      identification: {
        numbers: ["xyz", "bnh"]
      }
    };

    await mutate<Pick<Mutation, "updateBsdasri">>(UPDATE_DASRI, {
      variables: { id: dasri.id, input }
    });
    const updatedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(updatedDasri.destinationCompanyMail).toBe("recipient@test.test");
  });

  it("should disallow emitter, transporter and reception fields update after reception signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(company),
        ...readyToTakeOverData(company),
        ...readyToReceiveData(),
        status: BsdasriStatus.RECEIVED,
        emitterCompanySiret: company.siret,
        destinationReceptionSignatureAuthor: user.name,
        receptionSignatory: { connect: { id: user.id } },
        destinationReceptionSignatureDate: new Date().toISOString()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      destination: {
        company: {
          mail: "test@test.test"
        },
        reception: { acceptation: { status: "REFUSED" } }
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
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : L'adresse e-mail du destinataire, Le statut d'acceptation du destinataire",

        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should allow operation fields update after reception signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(company),
        ...readyToTakeOverData(company),
        ...readyToReceiveData(),
        status: BsdasriStatus.RECEIVED,
        emitterCompanySiret: company.siret,
        destinationReceptionSignatureAuthor: user.name,
        receptionSignatory: { connect: { id: user.id } },
        destinationReceptionSignatureDate: new Date().toISOString()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      destination: {
        operation: { code: "D10", mode: "ELIMINATION", weight: { value: 20 } }
      }
    };

    await mutate<Pick<Mutation, "updateBsdasri">>(UPDATE_DASRI, {
      variables: { id: dasri.id, input }
    });

    const updatedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });

    expect(updatedDasri.destinationOperationCode).toEqual("D10");
  });

  it("should not allow code D9 and mode ELIMINATION", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(company),
        ...readyToTakeOverData(company),
        ...readyToReceiveData(),
        status: BsdasriStatus.RECEIVED,
        emitterCompanySiret: company.siret,
        destinationReceptionSignatureAuthor: user.name,
        receptionSignatory: { connect: { id: user.id } },
        destinationReceptionSignatureDate: new Date().toISOString()
      }
    });

    // When
    const { mutate } = makeClient(user);
    const input = {
      destination: {
        operation: { code: "D9", mode: "ELIMINATION" }
      }
    };
    const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: { id: dasri.id, input }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
    );
  });

  it("should allow code D9 and no mode", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(company),
        ...readyToTakeOverData(company),
        ...readyToReceiveData(),
        status: BsdasriStatus.RECEIVED,
        emitterCompanySiret: company.siret,
        destinationReceptionSignatureAuthor: user.name,
        receptionSignatory: { connect: { id: user.id } },
        destinationReceptionSignatureDate: new Date().toISOString()
      }
    });

    // When
    const { mutate } = makeClient(user);
    const input = {
      destination: {
        operation: { code: "D9" }
      }
    };
    const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: { id: dasri.id, input }
      }
    );

    // Then
    expect(errors).toBeUndefined();
  });

  it("should allow updating neither code nor mode", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(company),
        ...readyToTakeOverData(company),
        ...readyToReceiveData(),
        status: BsdasriStatus.RECEIVED,
        emitterCompanySiret: company.siret,
        destinationReceptionSignatureAuthor: user.name,
        receptionSignatory: { connect: { id: user.id } },
        destinationReceptionSignatureDate: new Date().toISOString()
      }
    });

    // When
    const { mutate } = makeClient(user);
    const input = {
      destination: {
        operation: { weight: { value: 20 } }
      }
    };
    const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: { id: dasri.id, input }
      }
    );

    // Then
    expect(errors).toBeUndefined();
  });

  describe("[TRA-16173] Destination CAP", () => {
    it("destination CAP can be updated before RECEPTION", async () => {
      // Given
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const dasri = await bsdasriFactory({
        opt: {
          ...initialData(company),
          ...readyToPublishData(company),
          ...readyToTakeOverData(company),
          status: BsdasriStatus.SENT,
          emitterCompanySiret: company.siret,
          destinationCap: "DESTINATION-CAP"
        }
      });

      // When
      const { mutate } = makeClient(user);
      const input = {
        destination: {
          cap: "NEW-DESTINATION-CAP"
        }
      };
      const { errors, data } = await mutate<Pick<Mutation, "updateBsdasri">>(
        UPDATE_DASRI,
        {
          variables: { id: dasri.id, input }
        }
      );

      // Then
      expect(errors).toBeUndefined();
      expect(data.updateBsdasri.destination?.cap).toBe("NEW-DESTINATION-CAP");
    });

    it("destination CAP can NOT be updated after RECEPTION", async () => {
      // Given
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const dasri = await bsdasriFactory({
        opt: {
          ...initialData(company),
          ...readyToPublishData(company),
          ...readyToTakeOverData(company),
          ...readyToReceiveData(),
          status: BsdasriStatus.RECEIVED,
          emitterCompanySiret: company.siret,
          destinationReceptionSignatureAuthor: user.name,
          receptionSignatory: { connect: { id: user.id } },
          destinationReceptionSignatureDate: new Date().toISOString(),
          destinationCap: "DESTINATION-CAP"
        }
      });

      // When
      const { mutate } = makeClient(user);
      const input = {
        destination: {
          cap: "NEW-DESTINATION-CAP"
        }
      };
      const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
        UPDATE_DASRI,
        {
          variables: { id: dasri.id, input }
        }
      );

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : Le CAP du destinataire"
      );
    });
  });
});
