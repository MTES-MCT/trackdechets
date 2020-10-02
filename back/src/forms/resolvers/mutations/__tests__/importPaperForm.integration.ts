import { ImportPaperFormInput } from "../../../../generated/graphql/types";
import makeClient from "../../../../__tests__/testClient";
import {
  getReadableId,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import {
  Form,
  FormCreateInput,
  prisma
} from "../../../../generated/prisma-client";
import { resetDatabase } from "../../../../../integration-tests/helper";

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

    function getImportPaperFormInput() {
      const input: ImportPaperFormInput = {
        customId: "customId",
        emitter: {
          type: "PRODUCER",
          company: {
            siret: "98767567182671",
            name: "Émetteur",
            address: "Somewhere",
            phone: "0000000000",
            contact: "Mr Émetteur",
            mail: "emtteur@trackdechets.fr"
          }
        },
        recipient: {
          processingOperation: "R 1",
          company: {
            siret: "98017829178192",
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
            siret: "09167289178291",
            name: "Transporteur",
            address: "Somewhere",
            phone: "0000000000",
            contact: "Mr Transporteur",
            mail: "trasnporteur@trackdechets.fr"
          }
        },
        wasteDetails: {
          code: "01 03 04*",
          quantity: 1.0,
          quantityType: "ESTIMATED",
          packagings: ["BENNE"],
          onuCode: "ONU"
        },
        signingInfo: {
          sentAt: "2019-12-20T00:00:00.000Z",
          sentBy: "Mr Producer"
        },
        receivedInfo: {
          receivedAt: "2019-12-21T00:00:00.000Z",
          receivedBy: "Mr Destination",
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 1.0
        },
        processedInfo: {
          processedAt: "2019-12-22T00:00:00.000Z",
          processedBy: "Mr Recipient",
          processingOperationDone: "R 1",
          processingOperationDescription: "Traitement final"
        }
      };
      return input;
    }

    it("should fail if not authenticated", async () => {
      const { mutate } = makeClient();
      const { errors } = await mutate(IMPORT_PAPER_FORM, {
        variables: { input: getImportPaperFormInput() }
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toEqual("Vous n'êtes pas connecté.");
    });

    it("should import a BSD where user is recipient", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const { mutate } = makeClient(user);

      const input = getImportPaperFormInput();
      input.recipient.company.siret = company.siret;

      const { data } = await mutate(IMPORT_PAPER_FORM, {
        variables: { input }
      });

      expect(data.importPaperForm.status).toEqual("PROCESSED");
      expect(data.importPaperForm.isImportedFromPaper).toEqual(true);
    });

    it("should fail if user is not recipient", async () => {
      const user = await userFactory();

      const { mutate } = makeClient(user);

      const input = getImportPaperFormInput();

      const { errors } = await mutate(IMPORT_PAPER_FORM, {
        variables: { input }
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toEqual(
        "Vous devez apparaitre en tant que destinataire du bordereau (case 2) pour pouvoir importer ce bordereau"
      );
    });

    it("should fail if data is incomplete", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const { mutate } = makeClient(user);

      const input = getImportPaperFormInput();
      input.recipient.company.siret = company.siret;
      // invalidate input
      input.emitter.type = null;

      const { errors } = await mutate(IMPORT_PAPER_FORM, {
        variables: { input }
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toEqual(
        "Émetteur: Le type d'émetteur est obligatoire"
      );
    });

    it("should import a form with an ecoOrganisme", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const ecoOrganisme = await prisma.createEcoOrganisme({
        name: "EO",
        siret: "67281782716256",
        address: "Somewhere"
      });

      const { mutate } = makeClient(user);

      const input = getImportPaperFormInput();
      input.recipient.company.siret = company.siret;
      input.ecoOrganisme = { id: ecoOrganisme.id };

      const { data } = await mutate(IMPORT_PAPER_FORM, {
        variables: { input }
      });

      expect(data.importPaperForm.status).toEqual("PROCESSED");

      const formEcoOrganisme = await prisma
        .form({ id: data.importPaperForm.id })
        .ecoOrganisme();

      expect(formEcoOrganisme.id).toEqual(ecoOrganisme.id);
    });
  });

  describe("update an existing BSD with imported data", () => {
    afterEach(resetDatabase);

    const baseData: Partial<Form> = {
      status: "SEALED",
      emitterType: "PRODUCER",
      emitterCompanySiret: "98767567182671",
      emitterCompanyName: "Émetteur",
      emitterCompanyAddress: "Somewhere",
      emitterCompanyPhone: "0000000000",
      emitterCompanyContact: "Mr Émetteur",
      emitterCompanyMail: "emtteur@trackdechets.fr",
      recipientProcessingOperation: "R 1",
      recipientCompanySiret: "52156984789632",
      recipientCompanyName: "Destination",
      recipientCompanyAddress: "Somewhere",
      recipientCompanyPhone: "0000000000",
      recipientCompanyContact: "Mr Destination",
      recipientCompanyMail: "recipient@trackdechets.fr",
      transporterIsExemptedOfReceipt: true,
      transporterCompanySiret: "09167289178291",
      transporterCompanyName: "Transporteur",
      transporterCompanyAddress: "Somewhere",
      transporterCompanyPhone: "0000000000",
      transporterCompanyContact: "Mr Transporteur",
      transporterCompanyMail: "trasnporteur@trackdechets.fr",
      wasteDetailsCode: "01 03 04*",
      wasteDetailsQuantity: 1.0,
      wasteDetailsQuantityType: "ESTIMATED",
      wasteDetailsPackagings: ["BENNE"],
      wasteDetailsOnuCode: "ONU"
    };

    const importedData = {
      signingInfo: {
        sentAt: "2019-12-20T00:00:00.000Z",
        sentBy: "Mr Producer"
      },
      receivedInfo: {
        receivedAt: "2019-12-21T00:00:00.000Z",
        receivedBy: "Mr Destination",
        wasteAcceptationStatus: "ACCEPTED",
        quantityReceived: 1.0
      },
      processedInfo: {
        processedAt: "2019-12-22T00:00:00.000Z",
        processedBy: "Mr Recipient",
        processingOperationDone: "R 1",
        processingOperationDescription: "Traitement final"
      }
    };

    it("should update a sealed form with imported data when user is recipient", async () => {
      const owner = await userFactory();

      const { user, company } = await userWithCompanyFactory("MEMBER");

      const formCreateInput: FormCreateInput = {
        ...baseData,
        readableId: getReadableId(),
        owner: {
          connect: { id: owner.id }
        },
        status: "SEALED",
        recipientCompanySiret: company.siret // user is recipient
      };

      // create a form with a sealed status
      const form = await prisma.createForm(formCreateInput);

      const { mutate } = makeClient(user);

      await mutate(IMPORT_PAPER_FORM, {
        variables: {
          input: {
            id: form.id, // update mode
            ...importedData
          }
        }
      });
      const updatedForm = await prisma.form({ id: form.id });

      expect(updatedForm.status).toEqual("PROCESSED");
      expect(updatedForm.isImportedFromPaper).toEqual(true);
      expect(updatedForm.sentAt).toEqual(importedData.signingInfo.sentAt);
      expect(updatedForm.sentBy).toEqual(importedData.signingInfo.sentBy);

      expect(updatedForm.receivedAt).toEqual(
        importedData.receivedInfo.receivedAt
      );
      expect(updatedForm.receivedBy).toEqual(
        importedData.receivedInfo.receivedBy
      );
      expect(updatedForm.wasteAcceptationStatus).toEqual(
        importedData.receivedInfo.wasteAcceptationStatus
      );
      expect(updatedForm.quantityReceived).toEqual(
        importedData.receivedInfo.quantityReceived
      );
      expect(updatedForm.processedAt).toEqual(
        importedData.processedInfo.processedAt
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
      const statusLogs = await prisma.statusLogs();
      expect(statusLogs).toHaveLength(1);
      expect(statusLogs[0].status).toEqual("PROCESSED");
      expect(statusLogs[0].updatedFields).toEqual({
        isImportedFromPaper: true,
        signedByTransporter: true,
        sentAt: importedData.signingInfo.sentAt,
        sentBy: importedData.signingInfo.sentBy,
        wasteAcceptationStatus:
          importedData.receivedInfo.wasteAcceptationStatus,
        receivedBy: importedData.receivedInfo.receivedBy,
        receivedAt: importedData.receivedInfo.receivedAt,
        quantityReceived: importedData.receivedInfo.quantityReceived,
        processingOperationDone:
          importedData.processedInfo.processingOperationDone,
        processingOperationDescription:
          importedData.processedInfo.processingOperationDescription,
        processedBy: importedData.processedInfo.processedBy,
        processedAt: importedData.processedInfo.processedAt
      });
    });

    it("should update as sealed form and overwrite existing data", async () => {
      const owner = await userFactory();

      const { user, company } = await userWithCompanyFactory("MEMBER");

      const formCreateInput: FormCreateInput = {
        ...baseData,
        readableId: getReadableId(),
        owner: {
          connect: { id: owner.id }
        },
        status: "SEALED",
        recipientCompanySiret: company.siret // user is recipient
      };

      // create a form with a sealed status
      const form = await prisma.createForm(formCreateInput);

      const { mutate } = makeClient(user);

      const emitterCompanyName = "Émetteur 2";

      await mutate(IMPORT_PAPER_FORM, {
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
      const updatedForm = await prisma.form({ id: form.id });
      expect(updatedForm.status).toEqual("PROCESSED");
      expect(updatedForm.emitterCompanyName).toEqual(emitterCompanyName);
    });

    it("should fail to update a form whose status is not SEALED", async () => {
      const owner = await userFactory();

      const { user, company } = await userWithCompanyFactory("MEMBER");

      const formCreateInput: FormCreateInput = {
        ...baseData,
        readableId: getReadableId(),
        owner: {
          connect: { id: owner.id }
        },
        status: "DRAFT",
        recipientCompanySiret: company.siret // user is recipient
      };

      // create a form with a sealed status
      const form = await prisma.createForm(formCreateInput);

      const { mutate } = makeClient(user);

      const { errors } = await mutate(IMPORT_PAPER_FORM, {
        variables: {
          input: {
            id: form.id, // update mode
            ...importedData
          }
        }
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toEqual(
        `Seul un BSD à l'état "scellé" (SEALED) peut être mis à jour à partir d'un BSD papier`
      );
    });

    it("should fail to update a sealed form if user is not recipient", async () => {
      const owner = await userFactory();

      const user = await userFactory();

      const formCreateInput: FormCreateInput = {
        ...baseData,
        readableId: getReadableId(),
        owner: {
          connect: { id: owner.id }
        },
        status: "SEALED"
      };

      // create a form with a sealed status
      const form = await prisma.createForm(formCreateInput);

      const { mutate } = makeClient(user);

      const { errors } = await mutate(IMPORT_PAPER_FORM, {
        variables: {
          input: {
            id: form.id, // update mode
            ...importedData
          }
        }
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toEqual(
        "Vous devez apparaitre en tant que destinataire du bordereau (case 2) pour pouvoir mettre à jour ce bordereau"
      );
    });

    it("should fail to update a sealed form if data is missing", async () => {
      const owner = await userFactory();

      const { user, company } = await userWithCompanyFactory("MEMBER");

      const formCreateInput: FormCreateInput = {
        ...baseData,
        readableId: getReadableId(),
        owner: {
          connect: { id: owner.id }
        },
        status: "SEALED",
        recipientCompanySiret: company.siret // user is recipient
      };

      // create a form with a sealed status
      const form = await prisma.createForm(formCreateInput);

      const { mutate } = makeClient(user);

      const { errors } = await mutate(IMPORT_PAPER_FORM, {
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
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toEqual(
        "Le nom de l'émetteur du bordereau est obligatoire"
      );
    });

    it("should fail when trying to update a SIRET", async () => {
      const owner = await userFactory();

      const { user, company } = await userWithCompanyFactory("MEMBER");

      const formCreateInput: FormCreateInput = {
        ...baseData,
        readableId: getReadableId(),
        owner: {
          connect: { id: owner.id }
        },
        status: "SEALED",
        recipientCompanySiret: company.siret // user is recipient
      };

      // create a form with a sealed status
      const form = await prisma.createForm(formCreateInput);

      const { mutate } = makeClient(user);

      const { errors } = await mutate(IMPORT_PAPER_FORM, {
        variables: {
          input: {
            id: form.id, // update mode
            ...importedData,
            emitter: {
              company: {
                siret: "36987459856321"
              }
            }
          }
        }
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toEqual(
        "Vous ne pouvez pas mettre à jour les numéros SIRET des établissements présents sur le BSD"
      );
    });
  });
});
