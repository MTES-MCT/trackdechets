import {
  Consistence,
  EmitterType,
  OperationMode,
  Prisma,
  QuantityType,
  Status,
  WasteAcceptationStatus,
  CompanyType,
  WasteProcessorType
} from "@td/prisma";
import { format } from "date-fns";
import { prisma } from "@td/prisma";
import {
  formFactory,
  siretify,
  userFactory,
  userWithCompanyFactory,
  companyFactory,
  ecoOrganismeFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { allowedFormats } from "../../../../common/dates";
import type {
  ImportPaperFormInput,
  Mutation,
  Packagings
} from "@td/codegen-back";

const IMPORT_PAPER_FORM = `
  mutation ImportPaperForm($input: ImportPaperFormInput!){
    importPaperForm(input: $input){
      id
      status
      isImportedFromPaper
    }
  }`;

describe("mutation / importPaperForm", () => {
  describe("import a BSD from scratch", () => {
    afterEach(resetDatabase);

    async function getImportPaperFormInput(): Promise<ImportPaperFormInput> {
      const { company: transporterCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { company: recipientCompany } = await userWithCompanyFactory(
        "MEMBER",
        {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        }
      );

      const input = {
        customId: "customId",
        emitter: {
          type: EmitterType.PRODUCER,
          company: {
            siret: siretify(3),
            name: "Émetteur",
            address: "Somewhere",
            phone: "0000000000",
            contact: "Mr Émetteur",
            mail: "emtteur@trackdechets.fr"
          }
        },
        recipient: {
          processingOperation: "R 1",
          cap: "It's a cap",
          company: {
            siret: recipientCompany.siret,
            name: "Destination",
            address: "Somewhere",
            phone: "0000000000",
            contact: "Mr Destination",
            mail: "recipient@trackdechets.fr"
          }
        },
        transporter: {
          isExemptedOfReceipt: true,
          company: {
            siret: transporterCompany.siret,
            name: "Transporteur",
            address: "Somewhere",
            phone: "0000000000",
            contact: "Mr Transporteur",
            mail: "trasnporteur@trackdechets.fr"
          }
        },
        wasteDetails: {
          code: "01 03 04*",
          name: "Déchets divers",
          quantity: 1.0,
          quantityType: QuantityType.REAL,
          packagingInfos: [{ type: "BENNE" as Packagings, quantity: 1 }],
          isSubjectToADR: true,
          onuCode: "ONU",
          consistence: Consistence.SOLID
        },
        signingInfo: {
          sentAt: "2019-12-20T00:00:00.000Z" as any,
          sentBy: "Mr Producer"
        },
        receivedInfo: {
          receivedAt: "2019-12-21T00:00:00.000Z" as any,
          signedAt: "2019-12-20T00:00:00.000Z" as any,
          receivedBy: "Mr Destination",
          wasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
          quantityReceived: 1.0,
          quantityRefused: 0
        },
        processedInfo: {
          processedAt: "2019-12-22T00:00:00.000Z" as any,
          processedBy: "Mr Recipient",
          processingOperationDone: "R 1",
          destinationOperationMode: OperationMode.VALORISATION_ENERGETIQUE,
          processingOperationDescription: "Traitement final"
        },
        ecoOrganisme: null
      };
      return input;
    }

    it("should fail if not authenticated", async () => {
      const { mutate } = makeClient();
      const { errors } = await mutate<Pick<Mutation, "importPaperForm">>(
        IMPORT_PAPER_FORM,
        {
          variables: { input: await getImportPaperFormInput() }
        }
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toEqual("Vous n'êtes pas connecté.");
    });

    it("should import a BSD where user is recipient", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      const { mutate } = makeClient(user);

      const input = await getImportPaperFormInput();
      input.recipient!.company!.siret = company.siret;

      const { data } = await mutate<Pick<Mutation, "importPaperForm">>(
        IMPORT_PAPER_FORM,
        {
          variables: { input }
        }
      );

      expect(data.importPaperForm.status).toEqual("PROCESSED");
      expect(data.importPaperForm.isImportedFromPaper).toEqual(true);
    });

    it("should fail if user is not recipient", async () => {
      const user = await userFactory();

      const { mutate } = makeClient(user);

      const input = await getImportPaperFormInput();

      const { errors } = await mutate<Pick<Mutation, "importPaperForm">>(
        IMPORT_PAPER_FORM,
        {
          variables: { input }
        }
      );

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toEqual(
        "Vous devez apparaitre en tant que destinataire du bordereau (case 2) pour pouvoir importer ce bordereau"
      );
    });

    it("should fail if data is incomplete", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      const { mutate } = makeClient(user);

      const input = await getImportPaperFormInput();
      input.recipient!.company!.siret = company.siret;
      // invalidate input
      input.emitter!.type = null;

      const { errors } = await mutate<Pick<Mutation, "importPaperForm">>(
        IMPORT_PAPER_FORM,
        {
          variables: { input }
        }
      );

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toEqual(
        "Émetteur: Le type d'émetteur est obligatoire"
      );
    });

    it("should import a form with an ecoOrganisme", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });
      const ecoOrganisme = await ecoOrganismeFactory({
        handle: { handleBsdd: true }
      });

      const { mutate } = makeClient(user);

      const input = await getImportPaperFormInput();
      input.emitter!.type = "OTHER";
      input.recipient!.company!.siret = company.siret;
      input.ecoOrganisme = {
        siret: ecoOrganisme.siret,
        name: ecoOrganisme.name
      };

      const { data } = await mutate<Pick<Mutation, "importPaperForm">>(
        IMPORT_PAPER_FORM,
        {
          variables: { input }
        }
      );

      expect(data.importPaperForm.status).toEqual("PROCESSED");

      const updatedForm = await prisma.form.findUnique({
        where: { id: data.importPaperForm.id }
      });

      expect(updatedForm).toMatchObject({
        ecoOrganismeName: ecoOrganisme.name,
        ecoOrganismeSiret: ecoOrganisme.siret
      });
    });

    it("should fail if eco-organisme is not known", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      const { mutate } = makeClient(user);

      const input = await getImportPaperFormInput();
      input.emitter!.type = "OTHER";
      input.recipient!.company!.siret = company.siret;
      input.ecoOrganisme = {
        siret: siretify(3),
        name: "Some Eco-Organisme"
      };

      const { errors } = await mutate<Pick<Mutation, "importPaperForm">>(
        IMPORT_PAPER_FORM,
        {
          variables: { input }
        }
      );

      expect(errors).toEqual([
        expect.objectContaining({
          message: `L'éco-organisme avec le siret "${input.ecoOrganisme.siret}" n'est pas reconnu.`
        })
      ]);
    });

    test.each(allowedFormats)(
      "%p should be a valid format form date fields",
      async f => {
        const { user, company } = await userWithCompanyFactory("MEMBER", {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        });

        const { mutate } = makeClient(user);

        const sentAt = new Date("2021-01-01");
        const receivedAt = new Date("2021-01-02");
        const signedAt = new Date("2021-01-03");
        const processedAt = new Date("2021-01-04");

        const input = await getImportPaperFormInput();
        input.recipient!.company!.siret = company.siret;
        input.signingInfo.sentAt = format(sentAt, f) as any;
        input.receivedInfo.receivedAt = format(receivedAt, f) as any;
        input.receivedInfo.signedAt = format(signedAt, f) as any;
        input.processedInfo.processedAt = format(processedAt, f) as any;

        const { data } = await mutate<Pick<Mutation, "importPaperForm">>(
          IMPORT_PAPER_FORM,
          {
            variables: { input }
          }
        );

        expect(data.importPaperForm.status).toEqual(Status.PROCESSED);
        expect(data.importPaperForm.isImportedFromPaper).toEqual(true);

        const form = await prisma.form.findUniqueOrThrow({
          where: { id: data.importPaperForm.id }
        });
        expect(form.status).toEqual(Status.PROCESSED);
        expect(form.sentAt).toEqual(sentAt);
        expect(form.receivedAt).toEqual(receivedAt);
        expect(form.signedAt).toEqual(signedAt);
        expect(form.processedAt).toEqual(processedAt);
      }
    );

    it("should set status to AWAITING_GROUP in case of groupement code", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      const { mutate } = makeClient(user);

      const input = await getImportPaperFormInput();
      input.recipient!.company!.siret = company.siret;
      input.processedInfo.processingOperationDone = "D 13";
      input.processedInfo.destinationOperationMode = undefined;
      const nextCompany = await companyFactory();
      input.processedInfo.nextDestination = {
        company: {
          siret: nextCompany.siret,
          name: "Incinérateur",
          contact: "John Snow",
          mail: "contact@incinerateur.fr",
          phone: "00 00 00 00 00",
          address: "40 rue des lilas 07100 Annonay"
        },
        processingOperation: "R 1"
      };

      const { data } = await mutate<Pick<Mutation, "importPaperForm">>(
        IMPORT_PAPER_FORM,
        {
          variables: { input }
        }
      );

      expect(data.importPaperForm.status).toEqual("AWAITING_GROUP");
      expect(data.importPaperForm.isImportedFromPaper).toEqual(true);
    });

    it("should set status to NO_TREACEABILITY in case of no traceability", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      const { mutate } = makeClient(user);

      const input = await getImportPaperFormInput();
      input.recipient!.company!.siret = company.siret;
      input.processedInfo.noTraceability = true;
      input.processedInfo.processingOperationDone = "R 13";
      input.processedInfo.destinationOperationMode = undefined;
      input.processedInfo.nextDestination = {
        company: {
          siret: siretify(1),
          name: "Incinérateur",
          contact: "John Snow",
          mail: "contact@incinerateur.fr",
          phone: "00 00 00 00 00",
          address: "40 rue des lilas 07100 Annonay"
        },
        processingOperation: "R 1"
      };

      const { data } = await mutate<Pick<Mutation, "importPaperForm">>(
        IMPORT_PAPER_FORM,
        {
          variables: { input }
        }
      );

      expect(data.importPaperForm.status).toEqual(Status.NO_TRACEABILITY);
      expect(data.importPaperForm.isImportedFromPaper).toEqual(true);
    });
  });

  describe("update an existing BSD with imported data", () => {
    afterEach(resetDatabase);

    async function getBaseData(): Promise<Partial<Prisma.FormCreateInput>> {
      const { company: transporterCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { company: recipientCompany } = await userWithCompanyFactory(
        "MEMBER"
      );

      return {
        status: "SEALED",
        emitterType: EmitterType.PRODUCER,
        emitterCompanySiret: siretify(3),
        emitterCompanyName: "Émetteur",
        emitterCompanyAddress: "Somewhere",
        emitterCompanyPhone: "0000000000",
        emitterCompanyContact: "Mr Émetteur",
        emitterCompanyMail: "emtteur@trackdechets.fr",
        recipientProcessingOperation: "R 1",
        recipientCompanySiret: recipientCompany.siret,
        recipientCompanyName: "Destination",
        recipientCompanyAddress: "Somewhere",
        recipientCompanyPhone: "0000000000",
        recipientCompanyContact: "Mr Destination",
        recipientCompanyMail: "recipient@trackdechets.fr",
        recipientCap: "it's a CAP",
        wasteDetailsCode: "01 03 04*",
        wasteDetailsName: "stériles acidogènes",
        wasteDetailsQuantity: 1.0,
        wasteDetailsQuantityType: QuantityType.ESTIMATED,
        wasteDetailsPackagingInfos: [{ type: "BENNE", quantity: 1 }],
        wasteDetailsConsistence: [Consistence.SOLID],
        wasteDetailsPop: false,
        wasteDetailsIsDangerous: true,
        wasteDetailsOnuCode: "ONU",
        transporters: {
          create: {
            transporterIsExemptedOfReceipt: true,
            transporterCompanySiret: transporterCompany.siret,
            transporterCompanyName: "Transporteur",
            transporterCompanyAddress: "Somewhere",
            transporterCompanyPhone: "0000000000",
            transporterCompanyContact: "Mr Transporteur",
            transporterCompanyMail: "trasnporteur@trackdechets.fr",
            number: 1
          }
        }
      };
    }

    const importedData: ImportPaperFormInput = {
      signingInfo: {
        sentAt: "2019-12-20T00:00:00.000Z" as any,
        sentBy: "Mr Producer"
      },
      receivedInfo: {
        receivedAt: "2019-12-21T00:00:00.000Z" as any,
        receivedBy: "Mr Destination",
        wasteAcceptationStatus: "ACCEPTED",
        quantityReceived: 1.0,
        quantityRefused: 0
      },
      processedInfo: {
        processedAt: "2019-12-22T00:00:00.000Z" as any,
        processedBy: "Mr Recipient",
        processingOperationDone: "R 1",
        destinationOperationMode: "VALORISATION_ENERGETIQUE",
        processingOperationDescription: "Traitement final"
      }
    };

    it("should update a sealed form with imported data when user is recipient", async () => {
      const owner = await userFactory();

      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      // create a form with a sealed status
      const form = await formFactory({
        ownerId: owner.id,
        opt: {
          ...(await getBaseData()),
          status: "SEALED",
          recipientCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);

      await mutate<Pick<Mutation, "importPaperForm">>(IMPORT_PAPER_FORM, {
        variables: {
          input: {
            id: form.id, // update mode
            ...importedData
          }
        }
      });

      const updatedForm = await prisma.form.findUniqueOrThrow({
        where: { id: form.id }
      });

      expect(updatedForm.status).toEqual("PROCESSED");
      expect(updatedForm.isImportedFromPaper).toEqual(true);
      expect(updatedForm.sentAt).toEqual(
        new Date(importedData.signingInfo.sentAt)
      );
      expect(updatedForm.sentBy).toEqual(importedData.signingInfo.sentBy);

      expect(updatedForm.receivedAt).toEqual(
        new Date(importedData.receivedInfo.receivedAt)
      );
      expect(updatedForm.receivedBy).toEqual(
        importedData.receivedInfo.receivedBy
      );
      expect(updatedForm.wasteAcceptationStatus).toEqual(
        importedData.receivedInfo.wasteAcceptationStatus
      );
      expect(updatedForm.quantityReceived?.toNumber()).toEqual(
        importedData.receivedInfo.quantityReceived
      );
      expect(updatedForm.processedAt).toEqual(
        new Date(importedData.processedInfo.processedAt)
      );
      expect(updatedForm.processedBy).toEqual(
        importedData.processedInfo.processedBy
      );
      expect(updatedForm.processingOperationDone).toEqual(
        importedData.processedInfo.processingOperationDone
      );
      expect(updatedForm.processingOperationDescription).toEqual(
        importedData.processedInfo.processingOperationDescription
      );

      // check statusLog was created
      const statusLogs = await prisma.statusLog.findMany();
      expect(statusLogs).toHaveLength(1);
      expect(statusLogs[0].status).toEqual("PROCESSED");
      expect(statusLogs[0].updatedFields).toEqual({
        isImportedFromPaper: true,
        emittedAt: importedData.signingInfo.sentAt,
        emittedBy: importedData.signingInfo.sentBy,
        intermediaries: [],
        sentAt: importedData.signingInfo.sentAt,
        sentBy: importedData.signingInfo.sentBy,
        takenOverAt: importedData.signingInfo.sentAt,
        wasteAcceptationStatus:
          importedData.receivedInfo.wasteAcceptationStatus,
        receivedBy: importedData.receivedInfo.receivedBy,
        receivedAt: importedData.receivedInfo.receivedAt,
        quantityReceived: importedData.receivedInfo.quantityReceived,
        quantityAccepted:
          Number(importedData.receivedInfo.quantityReceived) -
          Number(importedData.receivedInfo.quantityRefused),
        quantityRefused: importedData.receivedInfo.quantityRefused,
        processingOperationDone:
          importedData.processedInfo.processingOperationDone,
        processingOperationDescription:
          importedData.processedInfo.processingOperationDescription,
        processedBy: importedData.processedInfo.processedBy,
        processedAt: importedData.processedInfo.processedAt,
        destinationOperationMode: "VALORISATION_ENERGETIQUE"
      });
    });

    it("should update as sealed form and overwrite existing data", async () => {
      const owner = await userFactory();

      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      // create a form with a sealed status
      const form = await formFactory({
        ownerId: owner.id,
        opt: {
          ...(await getBaseData()),
          status: "SEALED",
          recipientCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);

      const emitterCompanyName = "Émetteur 2";

      await mutate<Pick<Mutation, "importPaperForm">>(IMPORT_PAPER_FORM, {
        variables: {
          input: {
            id: form.id, // update mode
            ...importedData,
            emitter: {
              company: {
                name: emitterCompanyName
              }
            }
          }
        }
      });
      const updatedForm = await prisma.form.findUniqueOrThrow({
        where: { id: form.id }
      });
      expect(updatedForm.status).toEqual("PROCESSED");
      expect(updatedForm.emitterCompanyName).toEqual(emitterCompanyName);
    });

    it("should fail to update a form whose status is not SEALED", async () => {
      const owner = await userFactory();

      const { user, company } = await userWithCompanyFactory("MEMBER");

      // create a form with a sealed status
      const form = await formFactory({
        ownerId: owner.id,
        opt: {
          ...(await getBaseData()),
          status: "DRAFT",
          recipientCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);

      const { errors } = await mutate<Pick<Mutation, "importPaperForm">>(
        IMPORT_PAPER_FORM,
        {
          variables: {
            input: {
              id: form.id, // update mode
              ...importedData
            }
          }
        }
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toEqual(
        `Seul un BSD à l'état "scellé" (SEALED) peut être mis à jour à partir d'un BSD papier`
      );
    });

    it("should fail to update a sealed form if user is not recipient", async () => {
      const owner = await userFactory();

      const user = await userFactory();

      const form = await formFactory({
        ownerId: owner.id,
        opt: {
          ...(await getBaseData()),
          status: "DRAFT"
        }
      });

      const { mutate } = makeClient(user);

      const { errors } = await mutate<Pick<Mutation, "importPaperForm">>(
        IMPORT_PAPER_FORM,
        {
          variables: {
            input: {
              id: form.id, // update mode
              ...importedData
            }
          }
        }
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toEqual(
        "Vous devez apparaitre en tant que destinataire du bordereau (case 2) pour pouvoir importer ce bordereau"
      );
    });

    it("should fail to update a sealed form if data is missing", async () => {
      const owner = await userFactory();

      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      const form = await formFactory({
        ownerId: owner.id,
        opt: {
          ...(await getBaseData()),
          status: "SEALED",
          recipientCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);

      const { errors } = await mutate<Pick<Mutation, "importPaperForm">>(
        IMPORT_PAPER_FORM,
        {
          variables: {
            input: {
              id: form.id, // update mode
              ...importedData,
              signingInfo: {
                sentAt: importedData.signingInfo.sentAt,
                sentBy: "" // invalidate data
              }
            }
          }
        }
      );

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toEqual(
        "Le nom de l'émetteur du bordereau est obligatoire"
      );
    });

    it("should fail when trying to update a SIRET", async () => {
      const owner = await userFactory();

      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      // create a form with a sealed status
      const form = await formFactory({
        ownerId: owner.id,
        opt: {
          ...(await getBaseData()),
          status: "SEALED",
          recipientCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);

      const { errors } = await mutate<Pick<Mutation, "importPaperForm">>(
        IMPORT_PAPER_FORM,
        {
          variables: {
            input: {
              id: form.id, // update mode
              ...importedData,
              emitter: {
                company: {
                  siret: siretify(3)
                }
              }
            }
          }
        }
      );

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toEqual(
        "Vous ne pouvez pas mettre à jour les numéros SIRET des établissements présents sur le BSD"
      );
    });

    it("should set status to AWAITING_GROUP in case of groupement code", async () => {
      const owner = await userFactory();

      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      const form = await formFactory({
        ownerId: owner.id,
        opt: {
          ...(await getBaseData()),
          status: "SEALED",
          recipientCompanySiret: company.siret
        }
      });
      const nextCompany = await companyFactory();
      const { mutate } = makeClient(user);

      const data = { ...importedData };
      data.processedInfo.processingOperationDone = "D 13";
      data.processedInfo.destinationOperationMode = undefined;
      data.processedInfo.nextDestination = {
        company: {
          siret: nextCompany.siret,
          name: "Incinérateur",
          contact: "John Snow",
          mail: "contact@incinerateur.fr",
          phone: "00 00 00 00 00",
          address: "40 rue des lilas 07100 Annonay",
          country: "FR"
        },
        processingOperation: "R 1"
      };

      await mutate<Pick<Mutation, "importPaperForm">>(IMPORT_PAPER_FORM, {
        variables: {
          input: {
            id: form.id, // update mode
            ...data
          }
        }
      });

      const updatedForm = await prisma.form.findUniqueOrThrow({
        where: { id: form.id }
      });
      expect(updatedForm.status).toEqual(Status.AWAITING_GROUP);
    });

    it("should set status to NO_TRACEABILITY in case of no traceability", async () => {
      const owner = await userFactory();

      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      const form = await formFactory({
        ownerId: owner.id,
        opt: {
          ...(await getBaseData()),
          status: "SEALED",
          recipientCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);

      const data = { ...importedData };
      data.processedInfo.noTraceability = true;
      data.processedInfo.nextDestination = {
        company: {
          siret: siretify(1),
          name: "Incinérateur",
          contact: "John Snow",
          mail: "contact@incinerateur.fr",
          phone: "00 00 00 00 00",
          address: "40 rue des lilas 07100 Annonay",
          country: "FR"
        },
        processingOperation: "R 1"
      };

      await mutate<Pick<Mutation, "importPaperForm">>(IMPORT_PAPER_FORM, {
        variables: {
          input: {
            id: form.id, // update mode
            ...data
          }
        }
      });

      const updatedForm = await prisma.form.findUniqueOrThrow({
        where: { id: form.id }
      });
      expect(updatedForm.status).toEqual(Status.NO_TRACEABILITY);
    });
  });
});
