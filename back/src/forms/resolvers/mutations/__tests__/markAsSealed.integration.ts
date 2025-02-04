import {
  CompanyType,
  CompanyVerificationStatus,
  Status,
  WasteProcessorType,
  CollectorType
} from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Mutation, MutationMarkAsSealedArgs } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  companyFactory,
  destinationFactory,
  ecoOrganismeFactory,
  formFactory,
  formWithTempStorageFactory,
  siretify,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { sendMail } from "../../../../mailer/mailing";
import { renderMail, yourCompanyIsIdentifiedOnABsd } from "@td/mail";
import { MARK_AS_SEALED } from "./mutations";
import { updateAppendix2Queue } from "../../../../queue/producers/updateAppendix2";
import { waitForJobsCompletion } from "../../../../queue/helpers";

jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

// Mock external search services
const mockSearchCompany = jest.fn();
jest.mock("../../../../companies/sirene/searchCompany", () => ({
  __esModule: true,
  default: (...args) => mockSearchCompany(...args)
}));

describe("Mutation.markAsSealed", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    mockSearchCompany.mockReset();
    process.env.VERIFY_COMPANY = "false";
  });

  afterEach(() => {
    jest.resetAllMocks();
    process.env = OLD_ENV;
    return resetDatabase();
  });

  it("should fail if SEALED is not a possible next state", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
    );
  });

  it("should fail if destination has inappropriate profile", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.\n" +
          "Erreur(s): Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
          " Il lui appartient de mettre à jour son profil.",

        extensions: {
          code: "BAD_USER_INPUT"
        }
      })
    ]);
  });

  it.each(["emitter", "recipient", "trader", "broker", "transporter"])(
    "%p of the BSD can seal it",
    async role => {
      const companyType = (role: string) =>
        ({
          emitter: CompanyType.PRODUCER,
          recipient: CompanyType.WASTEPROCESSOR,
          trader: CompanyType.TRADER,
          broker: CompanyType.BROKER,
          transporter: CompanyType.TRANSPORTER
        }[role]);

      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: { set: [companyType(role) as CompanyType] },
        ...(role === "recipient"
          ? {
              wasteProcessorTypes: [
                WasteProcessorType.DANGEROUS_WASTES_INCINERATION
              ]
            }
          : {})
      });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          ...(role === "transporter"
            ? {
                transporters: {
                  create: { transporterCompanySiret: company.siret, number: 1 }
                }
              }
            : { [`${role}CompanySiret`]: company.siret }),
          ...(role !== "recipient"
            ? { recipientCompanySiret: (await destinationFactory()).siret }
            : {}),
          ...(["trader", "broker"].includes(role)
            ? {
                [`${role}CompanyName`]: "Trader or Broker",
                [`${role}CompanyContact`]: "Mr Trader or Broker",
                [`${role}CompanyMail`]: "traderbroker@trackdechets.fr",
                [`${role}CompanyAddress`]: "Wall street",
                [`${role}CompanyPhone`]: "00 00 00 00 00",
                [`${role}Receipt`]: "receipt",
                [`${role}Department`]: "07",
                [`${role}ValidityLimit`]: new Date("2023-01-01")
              }
            : {})
        }
      });

      const { mutate } = makeClient(user);
      await mutate(MARK_AS_SEALED, {
        variables: {
          id: form.id
        }
      });

      const formDb = await prisma.form.findUniqueOrThrow({
        where: { id: form.id },
        include: { transporters: true }
      });

      expect(formDb.status).toEqual("SEALED");

      // check relevant statusLog is created
      const statusLogs = await prisma.statusLog.findMany({
        where: {
          form: { id: form.id },
          user: { id: user.id },
          status: "SEALED"
        }
      });
      expect(statusLogs.length).toEqual(1);
    }
  );

  it("the eco-organisme of the BSD can seal it", async () => {
    const emitterCompany = await companyFactory();
    const recipientCompany = await destinationFactory();

    const { user, company: ecoOrganismeCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const eo = await ecoOrganismeFactory({
      siret: ecoOrganismeCompany.siret!,
      handle: { handleBsdd: true }
    });

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterType: "OTHER",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        ecoOrganismeSiret: eo.siret,
        ecoOrganismeName: eo.name
      }
    });

    const { mutate } = makeClient(user);
    await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    form = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { forwardedIn: true }
    });

    expect(form.status).toEqual("SEALED");
  });

  it("the eco-organisme of the BSD can seal it with the producer emitterType", async () => {
    const emitterCompany = await companyFactory();
    const recipientCompany = await destinationFactory();
    const { user, company: eo } = await userWithCompanyFactory("MEMBER");
    await ecoOrganismeFactory({
      siret: eo.siret!,
      handle: { handleBsdd: true }
    });

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterType: "PRODUCER",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        ecoOrganismeSiret: eo.siret,
        ecoOrganismeName: eo.name
      }
    });

    const { mutate } = makeClient(user);
    await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    form = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { forwardedIn: true }
    });

    expect(form.status).toEqual("SEALED");
  });

  it("the eco-organisme of the BSD can seal it with the APPENDIX1 emitterType", async () => {
    const emitterCompany = await companyFactory();
    const recipientCompany = await destinationFactory();
    const { user, company: eo } = await userWithCompanyFactory("MEMBER");
    await ecoOrganismeFactory({
      siret: eo.siret!,
      handle: { handleBsdd: true }
    });

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        wasteDetailsCode: "16 06 01*",
        emitterType: "APPENDIX1",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        ecoOrganismeSiret: eo.siret,
        ecoOrganismeName: eo.name
      }
    });

    const { mutate } = makeClient(user);
    await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    form = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { forwardedIn: true }
    });

    expect(form.status).toEqual("SEALED");
  });

  it("the eco-organisme of the BSD can seal it with the APPENDIX2 emitterType", async () => {
    const emitterCompany = await companyFactory();
    const recipientCompany = await destinationFactory();
    const { user, company: eo } = await userWithCompanyFactory("MEMBER");
    await ecoOrganismeFactory({
      siret: eo.siret!,
      handle: { handleBsdd: true }
    });

    const groupedForm1 = await formFactory({
      ownerId: user.id,
      opt: { status: "AWAITING_GROUP", quantityReceived: 1 }
    });

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterType: "APPENDIX2",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        ecoOrganismeSiret: eo.siret,
        ecoOrganismeName: eo.name,
        grouping: {
          create: [
            {
              initialFormId: groupedForm1.id,
              quantity: groupedForm1.quantityReceived!.toNumber()
            }
          ]
        }
      }
    });

    const { mutate } = makeClient(user);
    await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    form = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { forwardedIn: true }
    });

    expect(form.status).toEqual("SEALED");
  });

  it("should not be sealed with the APPENDIX2 emitterType when 0 form are grouped", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await destinationFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterType: "APPENDIX2",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret,
        grouping: undefined
      }
    });

    const { mutate } = makeClient(user);

    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });

    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe(
      "Veuillez sélectionner des bordereaux à regrouper afin de pouvoir publier ce bordereau de regroupement (Annexe 2)."
    );
  });

  it("should fail if user is not authorized", async () => {
    const owner = await userFactory();
    const { user } = await userWithCompanyFactory("MEMBER");

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: emitterCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });
    expect(errors[0].extensions?.code).toBe("FORBIDDEN");

    const resultingForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    expect(resultingForm.status).toEqual("DRAFT");
  });

  it("the BSD can not be sealed if data do not validate", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: { set: [CompanyType.WASTEPROCESSOR] },
      wasteProcessorTypes: {
        set: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    });

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: "", // this field is required and will make the mutation fail
        emitterCompanyContact: "", // this field is required and will make the mutation fail
        recipientCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    // check error message is relevant and only failing fields are reported
    const errMessage =
      "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.\n" +
      "Erreur(s): Émetteur: Le siret de l'entreprise est obligatoire\n" +
      "Émetteur: Le contact dans l'entreprise est obligatoire";
    expect(errors[0].message).toBe(errMessage);

    form = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { forwardedIn: true }
    });
    expect(form.status).toEqual("DRAFT");

    // no statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: { form: { id: form.id }, user: { id: user.id } }
    });
    expect(statusLogs.length).toEqual(0);
  });
  it("the BSD can not be sealed if waste detail name is missing", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
    });
    const recipientCompany = await destinationFactory();
    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret,
        wasteDetailsCode: "05 01 04*",
        wasteDetailsName: "" // this field is required and will make the mutation fail
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    const errMessage =
      "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.\n" +
      "Erreur(s): L'appellation du déchet est obligatoire.";

    expect(errors[0].message).toBe(errMessage);

    form = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { forwardedIn: true }
    });
    expect(form.status).toEqual("DRAFT");

    // no statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: { form: { id: form.id }, user: { id: user.id } }
    });
    expect(statusLogs.length).toEqual(0);
  });
  it.each(["toto", "lorem ipsum", "01 02 03", "101309*"])(
    "wrong waste code (%p) must invalidate mutation",
    async wrongWasteCode => {
      const { user, company: recipientCompany } = await userWithCompanyFactory(
        "MEMBER",
        {
          companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
        }
      );

      const emitterCompany = await companyFactory();

      let form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          emitterCompanySiret: emitterCompany.siret,
          recipientCompanySiret: recipientCompany.siret,
          wasteDetailsCode: wrongWasteCode
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate(MARK_AS_SEALED, {
        variables: {
          id: form.id
        }
      });

      expect(errors[0].message).toEqual(
        expect.stringContaining(
          "Le code déchet n'est pas reconnu comme faisant partie de la liste officielle du code de l'environnement."
        )
      );
      form = await prisma.form.findUniqueOrThrow({
        where: { id: form.id },
        include: { forwardedIn: true }
      });

      expect(form.status).toEqual("DRAFT");

      // check no SEALED statusLog is created
      const statusLogs = await prisma.statusLog.findMany({
        where: {
          form: { id: form.id },
          user: { id: user.id },
          status: "SEALED"
        }
      });
      expect(statusLogs.length).toEqual(0);
    }
  );

  it(
    "should be required to provide onuCode for dangerous wastes" +
      " when `wasteDetailsIsSubjectToADR` is not speified ",
    async () => {
      const { user, company: emitterCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const recipientCompany = await destinationFactory();
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          emitterCompanySiret: emitterCompany.siret,
          recipientCompanySiret: recipientCompany.siret,
          wasteDetailsCode: "05 01 04*",
          wasteDetailsOnuCode: null,
          wasteDetailsIsSubjectToADR: null
        }
      });

      const { mutate } = makeClient(user);

      const { errors } = await mutate(MARK_AS_SEALED, {
        variables: {
          id: form.id
        }
      });
      expect(errors).toEqual([
        expect.objectContaining({
          message: [
            "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.",
            `Erreur(s): La mention ADR est obligatoire pour les déchets dangereux. Merci d'indiquer "non soumis" si nécessaire.`
          ].join("\n")
        })
      ]);
    }
  );

  it("should be optional to provide onuCode for non-dangerous wastes", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const recipientCompany = await destinationFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        wasteDetailsCode: "01 01 01",
        wasteDetailsIsDangerous: false,
        wasteDetailsIsSubjectToADR: false,
        wasteDetailsOnuCode: null
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "markAsSealed">>(
      MARK_AS_SEALED,
      {
        variables: {
          id: form.id
        }
      }
    );

    expect(data.markAsSealed.status).toBe("SEALED");
  });

  it("should be required to provide cap for dangerous wastes", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const recipientCompany = await destinationFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        wasteDetailsCode: "05 01 04*",
        recipientCap: null
      }
    });

    const { mutate } = makeClient(user);

    const { errors } = await mutate<Pick<Mutation, "markAsSealed">>(
      MARK_AS_SEALED,
      {
        variables: {
          id: form.id
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message: [
          "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.",
          `Erreur(s): Le champ CAP est obligatoire pour les déchets dangereux`
        ].join("\n")
      })
    ]);
  });

  it("should be optional to provide cap for non-dangerous wastes", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const recipientCompany = await destinationFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        wasteDetailsCode: "01 01 01",
        wasteDetailsIsDangerous: false,
        recipientCap: null
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "markAsSealed">>(
      MARK_AS_SEALED,
      {
        variables: {
          id: form.id
        }
      }
    );

    expect(data.markAsSealed.status).toBe("SEALED");
  });

  describe("Mention ADR", () => {
    describe("new ADR switch", () => {
      it.each([undefined, null, ""])(
        "if wastes is subject to ADR, onuCode cannot be %p",
        async wasteDetailsOnuCode => {
          // Given
          const { user, company: emitterCompany } =
            await userWithCompanyFactory("MEMBER");
          const recipientCompany = await destinationFactory();
          const form = await formFactory({
            ownerId: user.id,
            opt: {
              status: "DRAFT",
              emitterCompanySiret: emitterCompany.siret,
              recipientCompanySiret: recipientCompany.siret,
              wasteDetailsIsSubjectToADR: true,
              wasteDetailsOnuCode
            }
          });

          // When
          const { mutate } = makeClient(user);
          const { errors } = await mutate(MARK_AS_SEALED, {
            variables: {
              id: form.id
            }
          });

          // Then
          expect(errors).not.toBeUndefined();
          expect(errors).toEqual([
            expect.objectContaining({
              message: [
                "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.",
                `Erreur(s): Le déchet est soumis à l'ADR. Vous devez préciser la mention correspondante.`
              ].join("\n")
            })
          ]);
        }
      );

      it.each([undefined, null, ""])(
        "if waste is not subject to ADR, onuCode can be %p",
        async wasteDetailsOnuCode => {
          // Given
          const { user, company: emitterCompany } =
            await userWithCompanyFactory("MEMBER");
          const recipientCompany = await destinationFactory();
          const form = await formFactory({
            ownerId: user.id,
            opt: {
              status: "DRAFT",
              emitterCompanySiret: emitterCompany.siret,
              recipientCompanySiret: recipientCompany.siret,
              wasteDetailsIsSubjectToADR: false,
              wasteDetailsOnuCode
            }
          });

          // When
          const { mutate } = makeClient(user);
          const { errors } = await mutate(MARK_AS_SEALED, {
            variables: {
              id: form.id
            }
          });

          // Then
          expect(errors).toBeUndefined();
        }
      );

      it("should not be allowed to provide onuCode for wastes not subject to ADR", async () => {
        // Given
        const { user, company: emitterCompany } = await userWithCompanyFactory(
          "MEMBER"
        );
        const recipientCompany = await destinationFactory();
        const form = await formFactory({
          ownerId: user.id,
          opt: {
            status: "DRAFT",
            emitterCompanySiret: emitterCompany.siret,
            recipientCompanySiret: recipientCompany.siret,
            wasteDetailsIsSubjectToADR: false,
            wasteDetailsOnuCode: "Some ADR mention"
          }
        });

        // When
        const { mutate } = makeClient(user);
        const { errors } = await mutate(MARK_AS_SEALED, {
          variables: {
            id: form.id
          }
        });

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors).toEqual([
          expect.objectContaining({
            message: [
              "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.",
              `Erreur(s): Le déchet n'est pas soumis à l'ADR. Vous ne pouvez pas préciser de mention ADR.`
            ].join("\n")
          })
        ]);
      });

      it("waste subject to ADR + onuCode", async () => {
        // Given
        const { user, company: emitterCompany } = await userWithCompanyFactory(
          "MEMBER"
        );
        const recipientCompany = await destinationFactory();
        const form = await formFactory({
          ownerId: user.id,
          opt: {
            status: "DRAFT",
            emitterCompanySiret: emitterCompany.siret,
            recipientCompanySiret: recipientCompany.siret,
            wasteDetailsIsSubjectToADR: true,
            wasteDetailsOnuCode: "ADR mention!"
          }
        });

        // When
        const { mutate } = makeClient(user);
        const { errors } = await mutate(MARK_AS_SEALED, {
          variables: {
            id: form.id
          }
        });

        // Then
        expect(errors).toBeUndefined();
      });
    });

    describe("legacy", () => {
      it.each([undefined, null, ""])(
        "if waste is not dangerous, onuCode can be %p",
        async wasteDetailsOnuCode => {
          // Given
          const { user, company: emitterCompany } =
            await userWithCompanyFactory("MEMBER");
          const recipientCompany = await destinationFactory();
          const form = await formFactory({
            ownerId: user.id,
            opt: {
              status: "DRAFT",
              emitterCompanySiret: emitterCompany.siret,
              recipientCompanySiret: recipientCompany.siret,
              wasteDetailsIsSubjectToADR: null,
              wasteDetailsCode: "01 01 01",
              wasteDetailsIsDangerous: false,
              wasteDetailsOnuCode
            }
          });

          // When
          const { mutate } = makeClient(user);
          const { errors } = await mutate(MARK_AS_SEALED, {
            variables: {
              id: form.id
            }
          });

          // Then
          expect(errors).toBeUndefined();
        }
      );

      it.each([undefined, null, ""])(
        "if waste is dangerous, onuCode can not be %p",
        async wasteDetailsOnuCode => {
          // Given
          const { user, company: emitterCompany } =
            await userWithCompanyFactory("MEMBER");
          const recipientCompany = await destinationFactory();
          const form = await formFactory({
            ownerId: user.id,
            opt: {
              status: "DRAFT",
              emitterCompanySiret: emitterCompany.siret,
              recipientCompanySiret: recipientCompany.siret,
              wasteDetailsIsSubjectToADR: null,
              wasteDetailsCode: "01 03 04*",
              wasteDetailsIsDangerous: true,
              wasteDetailsOnuCode
            }
          });

          // When
          const { mutate } = makeClient(user);
          const { errors } = await mutate(MARK_AS_SEALED, {
            variables: {
              id: form.id
            }
          });

          // Then
          expect(errors).not.toBeUndefined();
          expect(errors).toEqual([
            expect.objectContaining({
              message: [
                "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.",
                `Erreur(s): La mention ADR est obligatoire pour les déchets dangereux. Merci d'indiquer "non soumis" si nécessaire.`
              ].join("\n")
            })
          ]);
        }
      );

      it("waste is dangerous + onuCode", async () => {
        // Given
        const { user, company: emitterCompany } = await userWithCompanyFactory(
          "MEMBER"
        );
        const recipientCompany = await destinationFactory();
        const form = await formFactory({
          ownerId: user.id,
          opt: {
            status: "DRAFT",
            emitterCompanySiret: emitterCompany.siret,
            recipientCompanySiret: recipientCompany.siret,
            wasteDetailsIsSubjectToADR: null,
            wasteDetailsCode: "01 03 04*",
            wasteDetailsIsDangerous: true,
            wasteDetailsOnuCode: "Some ADR mention"
          }
        });

        // When
        const { mutate } = makeClient(user);
        const { errors } = await mutate(MARK_AS_SEALED, {
          variables: {
            id: form.id
          }
        });

        // Then
        expect(errors).toBeUndefined();
      });
    });
  });

  it("should be optional to provide packagings", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const recipientCompany = await destinationFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        wasteDetailsPackagingInfos: []
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "markAsSealed">>(
      MARK_AS_SEALED,
      {
        variables: {
          id: form.id
        }
      }
    );

    expect(data.markAsSealed.status).toBe("SEALED");
  });

  it("should mark appendix2 forms as grouped", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const groupedForm1 = await formFactory({
      ownerId: user.id,
      opt: { status: "AWAITING_GROUP", quantityReceived: 1 }
    });

    // it should also work for BSD with temporary storage
    const groupedForm2 = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        status: "GROUPED",
        quantityReceived: 0.02
      },
      forwardedInOpts: { quantityReceived: 0.007 }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterType: "APPENDIX2",
        emitterCompanySiret: company.siret,
        grouping: {
          create: [
            {
              initialFormId: groupedForm1.id,
              quantity: groupedForm1.quantityReceived!.toNumber()
            },
            {
              initialFormId: groupedForm2.id,
              quantity: groupedForm2.forwardedIn!.quantityReceived!.toNumber()
            }
          ]
        }
      }
    });

    const { mutate } = makeClient(user);

    const mutateFn = () =>
      mutate(MARK_AS_SEALED, {
        variables: { id: form.id }
      });

    await waitForJobsCompletion({
      fn: mutateFn,
      queue: updateAppendix2Queue,
      expectedJobCount: 2
    });

    const updatedGroupedForm1 = await prisma.form.findUniqueOrThrow({
      where: { id: groupedForm1.id }
    });
    expect(updatedGroupedForm1.status).toEqual("GROUPED");
    const updatedGroupedForm2 = await prisma.form.findUniqueOrThrow({
      where: { id: groupedForm2.id }
    });
    expect(updatedGroupedForm2.status).toEqual("GROUPED");
  });

  it("should mark partially accepted appendix2 forms as grouped", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await destinationFactory();
    const groupedForm1 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "AWAITING_GROUP",
        // quantité acceptée = 0.52
        quantityReceived: 1,
        quantityRefused: 0.48,
        wasteAcceptationStatus: "PARTIALLY_REFUSED"
      }
    });

    // it should also work for BSD with temporary storage
    const groupedForm2 = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        status: "GROUPED",
        quantityReceived: 0.02
      },
      forwardedInOpts: {
        // quantité acceptée = 0.52
        quantityReceived: 1,
        quantityRefused: 0.48,
        wasteAcceptationStatus: "PARTIALLY_REFUSED"
      }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterType: "APPENDIX2",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret,
        grouping: {
          create: [
            {
              initialFormId: groupedForm1.id,
              quantity: 0.52
            },
            {
              initialFormId: groupedForm2.id,
              quantity: 0.52
            }
          ]
        }
      }
    });

    const { mutate } = makeClient(user);

    const mutateFn = () =>
      mutate(MARK_AS_SEALED, {
        variables: { id: form.id }
      });

    await waitForJobsCompletion({
      fn: mutateFn,
      queue: updateAppendix2Queue,
      expectedJobCount: 2
    });

    const updatedGroupedForm1 = await prisma.form.findUniqueOrThrow({
      where: { id: groupedForm1.id }
    });
    expect(updatedGroupedForm1.status).toEqual("GROUPED");
    const updatedGroupedForm2 = await prisma.form.findUniqueOrThrow({
      where: { id: groupedForm2.id }
    });
    expect(updatedGroupedForm2.status).toEqual("GROUPED");
  });

  it("should mark appendix2 forms as grouped despite rogue decimal digits", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await destinationFactory();
    const groupedForm1 = await formFactory({
      ownerId: user.id,
      opt: { status: "AWAITING_GROUP", quantityReceived: 1.000000000000001 }
    });

    const groupedForm2 = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        status: "AWAITING_GROUP",
        quantityReceived: 0.02
      }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterType: "APPENDIX2",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret,
        grouping: {
          create: [
            {
              initialFormId: groupedForm1.id,
              quantity: 1
            },
            {
              initialFormId: groupedForm2.id,
              quantity: groupedForm2.forwardedIn!.quantityReceived!.toNumber()
            }
          ]
        }
      }
    });

    const { mutate } = makeClient(user);

    const mutateFn = () =>
      mutate(MARK_AS_SEALED, {
        variables: { id: form.id }
      });

    await waitForJobsCompletion({
      fn: mutateFn,
      queue: updateAppendix2Queue,
      expectedJobCount: 2
    });

    const updatedGroupedForm1 = await prisma.form.findUniqueOrThrow({
      where: { id: groupedForm1.id }
    });
    expect(updatedGroupedForm1.status).toEqual("GROUPED");
    const updatedGroupedForm2 = await prisma.form.findUniqueOrThrow({
      where: { id: groupedForm2.id }
    });
    expect(updatedGroupedForm2.status).toEqual("GROUPED");
  });

  it.each([0.1, 1])(
    "should not mark appendix2 forms as grouped if they are partially grouped - quantity grouped:  %p",
    async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const destination = await destinationFactory();
      const groupedForm1 = await formFactory({
        ownerId: user.id,
        opt: { status: "AWAITING_GROUP", quantityReceived: 1.000001 }
      });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          emitterType: "APPENDIX2",
          emitterCompanySiret: company.siret,
          recipientCompanySiret: destination.siret,
          grouping: {
            create: [
              {
                initialFormId: groupedForm1.id,
                quantity: 0.2
              }
            ]
          }
        }
      });

      const { mutate } = makeClient(user);

      await mutate(MARK_AS_SEALED, {
        variables: { id: form.id }
      });

      const updatedGroupedForm1 = await prisma.form.findUniqueOrThrow({
        where: { id: groupedForm1.id }
      });
      expect(updatedGroupedForm1.status).toEqual("AWAITING_GROUP");
    }
  );

  it("should throw an error if destination is not registered in TD", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const recipientCompanySiret = siretify(3);
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret
      }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: [
          "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.",
          `Erreur(s): Destinataire : l'établissement avec le SIRET ${recipientCompanySiret} n'est pas inscrit sur Trackdéchets`
        ].join("\n")
      })
    ]);
  });

  it("should throw an error if destination is not registered as waste processor or TTR", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const destination = await companyFactory({
      // assume profile is not COLLECTOR or WASTEPROCESSOR
      companyTypes: { set: [CompanyType.PRODUCER] }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: destination.siret
      }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: [
          "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.",
          `Erreur(s): L'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET "${destination.siret}" n'est pas inscrite sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements`,
          "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
            " Il lui appartient de mettre à jour son profil."
        ].join("\n")
      })
    ]);
  });

  it("should throw an error if destination after temporary storage is not registered in TD", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const collector = await companyFactory({
      companyTypes: { set: [CompanyType.COLLECTOR] },
      collectorTypes: { set: [CollectorType.DANGEROUS_WASTES] }
    });

    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: collector.siret
      }
    });

    const recipientCompanySiret = siretify(3);
    await prisma.form.update({
      where: { id: form.id },
      data: {
        forwardedIn: {
          update: { recipientCompanySiret }
        }
      }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Destination finale : l'établissement avec le SIRET ${recipientCompanySiret} n'est pas inscrit sur Trackdéchets`
      })
    ]);
  });

  it("should throw an error if destination after temp storage is not registered as waste processor or TTR", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const collector = await companyFactory({
      companyTypes: { set: [CompanyType.COLLECTOR] },
      collectorTypes: { set: [CollectorType.DANGEROUS_WASTES] }
    });
    const destination = await companyFactory({
      // assume profile is not COLLECTOR or WASTEPROCESSOR
      companyTypes: { set: [CompanyType.PRODUCER] }
    });
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: collector.siret
      }
    });
    await prisma.form.update({
      where: { id: form.id },
      data: {
        forwardedIn: {
          update: { recipientCompanySiret: destination.siret }
        }
      }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `L'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET "${destination.siret}" n'est pas inscrite sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements`
      })
    ]);
  });

  it("should throw an error if VERIFY_COMPANY=true and destination is not verified", async () => {
    // patch process.env and reload server
    process.env.VERIFY_COMPANY = "true";
    const server = require("../../../../server").server;
    await server.start();
    const makeClient = require("../../../../__tests__/testClient").default;

    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const destination = await companyFactory({
      companyTypes: { set: [CompanyType.WASTEPROCESSOR] },

      wasteProcessorTypes: {
        set: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      },

      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.DRAFT,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: destination.siret
      }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: [
          `Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.`,
          `Erreur(s): Le compte de l'installation de destination ou d’entreposage ou de reconditionnement prévue avec le SIRET ${destination.siret} n'a pas encore été vérifié. Cette installation ne peut pas être visée sur le bordereau.`
        ].join("\n")
      })
    ]);
  });

  it("should throw an error if VERIFY_COMPANY=true and destination after temp storage is not verified", async () => {
    // patch process.env and reload server
    process.env.VERIFY_COMPANY = "true";
    const server = require("../../../../server").server;
    await server.start();
    const makeClient = require("../../../../__tests__/testClient").default;

    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const collector = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION],

      verificationStatus: CompanyVerificationStatus.VERIFIED
    });
    const destination = await companyFactory({
      companyTypes: { set: [CompanyType.WASTEPROCESSOR] },
      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED
    });
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        status: Status.DRAFT,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: collector.siret
      }
    });
    await prisma.form.update({
      where: { id: form.id },
      data: {
        forwardedIn: {
          update: { recipientCompanySiret: destination.siret }
        }
      }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le compte de l'installation de destination ou d’entreposage ou de reconditionnement prévue avec le SIRET ${destination.siret} n'a pas encore été vérifié. Cette installation ne peut pas être visée sur le bordereau.`
      })
    ]);
  });

  it("should send an email to emitter contact if emitter company is not registered", async () => {
    const { user, company: destination } = await userWithCompanyFactory(
      "MEMBER",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: siretify(3),
        emitterCompanyContact: "John Snow",
        emitterCompanyMail: "john.snow@trackdechets.fr",
        recipientCompanySiret: destination.siret
      }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });

    const expectedMail = {
      ...renderMail(yourCompanyIsIdentifiedOnABsd, {
        to: [
          { email: form.emitterCompanyMail!, name: form.emitterCompanyContact! }
        ],
        variables: {
          emitter: {
            siret: form.emitterCompanySiret!,
            name: form.emitterCompanyName!
          },
          destination: {
            siret: form.recipientCompanySiret!,
            name: form.recipientCompanyName!
          }
        }
      }),
      params: { hideRegisteredUserInfo: true }
    };

    expect(sendMail as jest.Mock).toHaveBeenCalledWith(expectedMail);
  });

  it("should not send an email to emitter contact if contact email already appears in a previous BSD", async () => {
    const { user, company: destination } = await userWithCompanyFactory(
      "MEMBER",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR]
      }
    );
    const emitterCompanySiret = siretify(3);
    // a previous non draft BSD already exists
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        emitterCompanySiret,
        emitterCompanyContact: "John Snow",
        emitterCompanyMail: "john.snow@trackdechets.fr",
        recipientCompanySiret: destination.siret
      }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret,
        emitterCompanyContact: "John Snow",
        emitterCompanyMail: "john.snow@trackdechets.fr",
        recipientCompanySiret: destination.siret
      }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });

    expect(sendMail as jest.Mock).not.toHaveBeenCalled();
  });

  it("should throw a ValidationError if missing broker contact info", async () => {
    const { user, company: emitter } = await userWithCompanyFactory("MEMBER", {
      companyTypes: [CompanyType.PRODUCER]
    });
    const recipient = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const broker = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.DRAFT,
        emitterCompanySiret: emitter.siret,
        recipientCompanySiret: recipient.siret,
        brokerCompanySiret: broker.siret
      }
    });

    const { mutate } = makeClient(user);

    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.\n" +
          "Erreur(s): Courtier : Le nom de l'entreprise est obligatoire\n" +
          "Courtier : L'adresse de l'entreprise est obligatoire\n" +
          "Courtier : Le contact dans l'entreprise est obligatoire\n" +
          "Courtier : Le téléphone de l'entreprise est obligatoire\n" +
          "Courtier : L'email de l'entreprise est obligatoire\n" +
          "Courtier : Numéro de récepissé obligatoire\n" +
          "Courtier : Département obligatoire\n" +
          "Courtier : Date de validité obligatoire"
      })
    ]);
  });

  it("should throw a ValidationError if missing trader contact info", async () => {
    const { user, company: emitter } = await userWithCompanyFactory("MEMBER", {
      companyTypes: [CompanyType.PRODUCER]
    });
    const recipient = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const broker = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.DRAFT,
        emitterCompanySiret: emitter.siret,
        recipientCompanySiret: recipient.siret,
        traderCompanySiret: broker.siret
      }
    });

    const { mutate } = makeClient(user);

    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.\n" +
          "Erreur(s): Négociant: Le nom de l'entreprise est obligatoire\n" +
          "Négociant: L'adresse de l'entreprise est obligatoire\n" +
          "Négociant: Le contact dans l'entreprise est obligatoire\n" +
          "Négociant: Le téléphone de l'entreprise est obligatoire\n" +
          "Négociant: L'email de l'entreprise est obligatoire\n" +
          "Négociant: Numéro de récepissé obligatoire\n" +
          "Négociant : Département obligatoire\n" +
          "Négociant : Date de validité obligatoire"
      })
    ]);
  });

  it("should fail if bsd has a foreign ship and the wrong emitterType", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        recipientCompanySiret: company.siret,
        emitterCompanySiret: null,
        emitterType: "OTHER",
        emitterIsForeignShip: true,
        emitterCompanyOmiNumber: "OMI1234567"
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: [
          "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.",
          `Erreur(s): Émetteur: Le type d'émetteur doit être \"PRODUCER\" lorsque l'émetteur est un navire étranger`
        ].join("\n")
      })
    ]);
  });

  it("should fail if bsd has a private producer and the wrong emitterType", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        recipientCompanySiret: company.siret,
        emitterCompanySiret: null,
        emitterCompanyContact: null,
        emitterType: "OTHER",
        emitterIsPrivateIndividual: true
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: [
          "Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.",
          `Erreur(s): Émetteur: Le type d'émetteur doit être \"PRODUCER\" ou \"APPENDIX1_PRODUCER\" lorsque l'émetteur est un particulier`
        ].join("\n")
      })
    ]);
  });

  it("should seal and automatically transition to SIGNED_BY_PRODUCER when private individual emitter", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        recipientCompanySiret: company.siret,
        emitterCompanySiret: null,
        emitterCompanyContact: null,
        emitterType: "PRODUCER",
        emitterIsPrivateIndividual: true,
        emitterCompanyName: "MR Paul Jetta",
        emitterCompanyAddress: "3 bd de la poubelle toxique"
      }
    });

    const { mutate } = makeClient(user);
    await mutate<Pick<Mutation, "markAsSealed">>(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    expect(updatedForm.status).toEqual("SIGNED_BY_PRODUCER");
    expect(updatedForm.emittedAt).not.toBeNull();
    expect(updatedForm.emittedBy).toEqual("Signature auto (particulier)");
  });

  it("should seal and automatically transition to SIGNED_BY_PRODUCER when foreign ship emitter", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        recipientCompanySiret: company.siret,
        emitterCompanySiret: null,
        emitterCompanyContact: null,
        emitterType: "PRODUCER",
        emitterIsForeignShip: true,
        emitterCompanyOmiNumber: "OMI1234567",
        emitterCompanyName: "Navire étranger",
        emitterCompanyAddress: "Quelque part en mer"
      }
    });

    const { mutate } = makeClient(user);
    await mutate<Pick<Mutation, "markAsSealed">, MutationMarkAsSealedArgs>(
      MARK_AS_SEALED,
      {
        variables: {
          id: form.id
        }
      }
    );

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    expect(updatedForm.status).toEqual("SIGNED_BY_PRODUCER");
    expect(updatedForm.emittedAt).not.toBeNull();
    expect(updatedForm.emittedBy).toEqual("Signature auto (navire étranger)");
  });

  it("should be possible to seal a form without transporter", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret
      }
    });

    await prisma.form.update({
      where: { id: form.id },
      data: { transporters: { deleteMany: {} } }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_SEALED, {
      variables: {
        id: form.id
      }
    });

    expect(errors).toBeUndefined();

    const sealedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(sealedForm.status).toEqual("SEALED");
  });
});
