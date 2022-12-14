import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { AuthType } from "../../../../auth";
import { ErrorCode } from "../../../../common/errors";
import * as mailsHelper from "../../../../mailer/mailing";
import {
  companyFactory,
  siretify,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import * as geocode from "../../../geo/geocode";
import { CompanyType } from "@prisma/client";
import { renderMail } from "../../../../mailer/templates/renderers";
import { verificationProcessInfo } from "../../../../mailer/templates";
import {
  Mutation,
  StatutDiffusionEtablissement
} from "../../../../generated/graphql/types";
import * as search from "../../../search";

// Mock external search services
const searchCompany = jest.spyOn(search, "searchCompany");

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

// Mock calls to API adresse
const geocodeSpy = jest.spyOn(geocode, "default");
const geoInfo = { latitude: 43.302546, longitude: 5.384324 };
geocodeSpy.mockResolvedValue(geoInfo);

const CREATE_COMPANY = `
  mutation CreateCompany($companyInput: PrivateCompanyInput!) {
    createCompany(companyInput: $companyInput) {
      siret
      vatNumber
      gerepId
      name
      address
      companyTypes
      ecoOrganismeAgreements
      transporterReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
      traderReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
      allowBsdasriTakeOverWithoutSignature
    }
  }
`;

describe("Mutation.createCompany", () => {
  afterEach(async () => {
    await resetDatabase();
    searchCompany.mockReset();
  });

  it("should create company and userAssociation", async () => {
    const user = await userFactory();
    const orgId = siretify(7);
    const companyInput = {
      orgId,
      gerepId: "1234",
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["PRODUCER"]
    };

    searchCompany.mockResolvedValueOnce({
      siret: orgId,
      etatAdministratif: "A"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate<Pick<Mutation, "createCompany">>(
      CREATE_COMPANY,
      {
        variables: {
          companyInput
        }
      }
    );

    expect(data.createCompany).toMatchObject({
      siret: companyInput.orgId,
      gerepId: companyInput.gerepId,
      name: companyInput.companyName,
      companyTypes: companyInput.companyTypes,
      allowBsdasriTakeOverWithoutSignature: false // by default
    });

    const newCompanyExists =
      (await prisma.company.findFirst({
        where: {
          siret: companyInput.orgId
        }
      })) != null;
    expect(newCompanyExists).toBe(true);

    const newCompanyAssociationExists =
      (await prisma.companyAssociation.findFirst({
        where: { company: { siret: companyInput.orgId }, user: { id: user.id } }
      })) != null;
    expect(newCompanyAssociationExists).toBe(true);

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    // association date is filled
    expect(refreshedUser.firstAssociationDate).toBeTruthy();
  });

  it("should create company allowing dasri direct takeOver", async () => {
    const user = await userFactory();

    const orgId = siretify(1);
    const companyInput = {
      orgId,
      gerepId: "1234",
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["PRODUCER"],
      allowBsdasriTakeOverWithoutSignature: true
    };

    searchCompany.mockResolvedValueOnce({
      siret: orgId,
      etatAdministratif: "A"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate<Pick<Mutation, "createCompany">>(
      CREATE_COMPANY,
      {
        variables: {
          companyInput
        }
      }
    );

    expect(data.createCompany).toMatchObject({
      siret: companyInput.orgId,
      gerepId: companyInput.gerepId,
      name: companyInput.companyName,
      companyTypes: companyInput.companyTypes,
      allowBsdasriTakeOverWithoutSignature: true
    });

    const newCompanyExists =
      (await prisma.company.findFirst({
        where: {
          siret: companyInput.orgId
        }
      })) != null;
    expect(newCompanyExists).toBe(true);

    const newCompanyAssociationExists =
      (await prisma.companyAssociation.findFirst({
        where: { company: { siret: companyInput.orgId }, user: { id: user.id } }
      })) != null;
    expect(newCompanyAssociationExists).toBe(true);

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    // association date is filled
    expect(refreshedUser.firstAssociationDate).toBeTruthy();
  });

  it("should link to a transporterReceipt", async () => {
    const user = await userFactory();

    const transporterReceipt = await prisma.transporterReceipt.create({
      data: {
        receiptNumber: "1234",
        validityLimit: "2023-03-31T00:00:00.000Z",
        department: "07"
      }
    });
    const orgId = siretify(1);
    const companyInput = {
      orgId,
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["TRANSPORTER"],
      transporterReceiptId: transporterReceipt.id
    };

    searchCompany.mockResolvedValueOnce({
      siret: orgId,
      etatAdministratif: "A"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate<Pick<Mutation, "createCompany">>(
      CREATE_COMPANY,
      {
        variables: {
          companyInput
        }
      }
    );

    expect(data.createCompany.transporterReceipt.receiptNumber).toEqual(
      transporterReceipt.receiptNumber
    );
    expect(data.createCompany.transporterReceipt.validityLimit).toEqual(
      transporterReceipt.validityLimit.toISOString()
    );
    expect(data.createCompany.transporterReceipt.department).toEqual(
      transporterReceipt.department
    );
  });

  it("should link to a traderReceipt", async () => {
    const user = await userFactory();

    const traderReceipt = await prisma.traderReceipt.create({
      data: {
        receiptNumber: "1234",
        validityLimit: "2023-03-31T00:00:00.000Z",
        department: "07"
      }
    });
    const orgId = siretify(7);
    const companyInput = {
      orgId,
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["TRADER"],
      traderReceiptId: traderReceipt.id
    };

    searchCompany.mockResolvedValueOnce({
      siret: orgId,
      etatAdministratif: "A"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate<Pick<Mutation, "createCompany">>(
      CREATE_COMPANY,
      {
        variables: {
          companyInput
        }
      }
    );

    // check the traderReceipt was created in db
    expect(data.createCompany.traderReceipt.receiptNumber).toEqual(
      traderReceipt.receiptNumber
    );
    expect(data.createCompany.traderReceipt.validityLimit).toEqual(
      traderReceipt.validityLimit.toISOString()
    );
    expect(data.createCompany.traderReceipt.department).toEqual(
      traderReceipt.department
    );
  });

  it("should throw error if the company already exist", async () => {
    const user = await userFactory();
    const company = await companyFactory();

    // try re-creating the same company
    const companyInput = {
      orgId: company.siret,
      gerepId: company.gerepId,
      companyName: company.name,
      address: "3 rue des granges",
      companyTypes: company.companyTypes
    };

    searchCompany.mockResolvedValueOnce({
      siret: company.siret,
      etatAdministratif: "A"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors, data } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    expect(data).toBeNull();
    expect(errors[0].extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
  });

  it("should return an error when creating an unknown eco-organisme", async () => {
    const user = await userFactory();
    const siret = siretify(1);
    searchCompany.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput: {
          orgId: siret,
          companyName: "UN BEL ECO ORGANISME",
          address: "3 rue des granges",
          companyTypes: ["ECO_ORGANISME"]
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Cette entreprise ne fait pas partie de la liste des éco-organismes reconnus par Trackdéchets. Contactez-nous si vous pensez qu'il s'agit d'une erreur : contact@trackdechets.beta.gouv.fr"
      })
    ]);
  });

  it("should return an error when creating an eco-organisme without its agreement", async () => {
    const user = await userFactory();
    const siret = siretify(1);
    const companyInput = {
      orgId: siret,
      companyName: "UN BEL ECO ORGANISME",
      address: "3 rue des granges",
      companyTypes: ["ECO_ORGANISME"]
    };
    searchCompany.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A"
    });

    await prisma.ecoOrganisme.create({
      data: {
        address: "",
        name: "Eco-Organisme",
        siret: companyInput.orgId
      }
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "L'URL de l'agrément de l'éco-organisme est requis."
      })
    ]);
  });

  it("should allow creating a known eco-organisme with its agreement", async () => {
    const user = await userFactory();

    const siret = siretify(1);
    const companyInput = {
      orgId: siret,
      companyName: "UN BEL ECO ORGANISME",
      address: "3 rue des granges",
      companyTypes: ["ECO_ORGANISME"],
      ecoOrganismeAgreements: ["https://legifrance.com/agreement"]
    };
    searchCompany.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A"
    });

    await prisma.ecoOrganisme.create({
      data: {
        address: "",
        name: "Eco-Organisme",
        siret: companyInput.orgId
      }
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate<Pick<Mutation, "createCompany">>(
      CREATE_COMPANY,
      {
        variables: {
          companyInput
        }
      }
    );

    expect(data.createCompany.ecoOrganismeAgreements).toEqual(
      companyInput.ecoOrganismeAgreements
    );
  });

  it("should return an error when creating a producer company with eco-organisme agreements", async () => {
    const user = await userFactory();
    const siret = siretify(1);

    const companyInput = {
      orgId: siret,
      companyName: "UN BEL ECO ORGANISME",
      address: "3 rue des granges",
      companyTypes: ["PRODUCER"],
      ecoOrganismeAgreements: ["https://legifrance.com/agreement"]
    };
    searchCompany.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Impossible de lier des agréments d'éco-organisme : l'entreprise n'est pas un éco-organisme."
      })
    ]);
  });

  it("should send an email about the verification process when VERIFY_COMPANY=true", async () => {
    const OLD_ENV = process.env;

    process.env.VERIFY_COMPANY = "true";

    // get local versions of imports to reload env variables
    jest.resetModules();
    const server = require("../../../../server").server;
    await server.start();
    const makeClient = require("../../../../__tests__/testClient").default;
    const mailsHelper = require("../../../../mailer/mailing");
    const geocode = require("../../../geo/geocode");
    const searchCompanyReload = require("../../../sirene/searchCompany");
    const searchSireneMock = jest.spyOn(searchCompanyReload, "default");
    const siret = siretify(8);
    searchSireneMock.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A"
    });
    // No mails
    const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
    sendMailSpy.mockImplementation(() => Promise.resolve());

    // Mock calls to API adresse
    const geocodeSpy = jest.spyOn(geocode, "default");
    const geoInfo = { latitude: 43.302546, longitude: 5.384324 };
    geocodeSpy.mockResolvedValue(geoInfo);

    const user = await userFactory();
    const companyInput = {
      orgId: siret,
      gerepId: "1234",
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: [CompanyType.WASTEPROCESSOR]
    };

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });
    expect(errors).toBeUndefined();

    const company = await prisma.company.findUnique({
      where: { siret: companyInput.orgId }
    });

    expect(sendMailSpy).toHaveBeenCalledWith(
      renderMail(verificationProcessInfo, {
        to: [{ email: user.email, name: user.name }],
        variables: { company }
      })
    );

    process.env = OLD_ENV;
  }, 30000);

  it("should allow to create a TRANSPORTER company with VAT number", async () => {
    const user = await userFactory();
    const companyInput = {
      orgId: "RO17579668",
      companyName: "Acme in EU",
      address: "Transporter street",
      companyTypes: ["TRANSPORTER"]
    };

    // Company Infos are different
    const testValue = {
      vatNumber: "RO17579668",
      address: "RO Transporter street",
      name: "Acme in RO",
      codePaysEtrangerEtablissement: "RO",
      statutDiffusionEtablissement: "O" as StatutDiffusionEtablissement,
      etatAdministratif: "A"
    };
    searchCompany.mockResolvedValue(testValue);

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    expect(data).toEqual({
      createCompany: {
        allowBsdasriTakeOverWithoutSignature: false,
        companyTypes: ["TRANSPORTER"],
        ecoOrganismeAgreements: [],
        gerepId: null,
        name: "Acme in EU",
        siret: "",
        address: "Transporter street",
        traderReceipt: null,
        transporterReceipt: null,
        vatNumber: "RO17579668"
      }
    });
  });

  it("should return an error when creating any type but a TRANSPORTER company with VAT number", async () => {
    const user = await userFactory();

    for (const type in CompanyType) {
      if (type === "TRANSPORTER") {
        continue;
      }
      const companyInput = {
        orgId: "RO17579668",
        companyName: "Acme in EU",
        address: "Transporter street",
        companyTypes: [type]
      };

      const { mutate } = makeClient({ ...user, auth: AuthType.Session });
      const { errors } = await mutate(CREATE_COMPANY, {
        variables: {
          companyInput
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Impossible de créer un établissement identifié par un numéro de TVA d'un autre type que TRANSPORTER"
        })
      ]);
    }
  });
});
