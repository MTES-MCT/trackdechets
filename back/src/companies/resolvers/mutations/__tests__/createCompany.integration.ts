import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth";
import { ErrorCode } from "../../../../common/errors";
import { sendMail } from "../../../../mailer/mailing";
import {
  companyFactory,
  siretify,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { geocode } from "../../../geo/geocode";
import {
  CollectorType,
  CompanyType,
  CompanyVerificationMode,
  CompanyVerificationStatus,
  WasteProcessorType,
  WasteVehiclesType
} from "@prisma/client";
import {
  onboardingFirstStep,
  renderMail,
  verificationProcessInfo,
  verifiedForeignTransporterCompany
} from "@td/mail";
import {
  Mutation,
  StatutDiffusionEtablissement
} from "../../../../generated/graphql/types";
import { searchCompany } from "../../../search";
import { sendVerificationCodeLetter } from "../../../../common/post";
import gql from "graphql-tag";
import { ALL_NOTIFICATIONS } from "../../../../users/notifications";

// Mock external search services
jest.mock("../../../search");

// Mock email sending service
jest.mock("../../../../common/post");

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

// Mock calls to API adresse
jest.mock("../../../geo/geocode");
const geoInfo = { latitude: 43.302546, longitude: 5.384324 };
(geocode as jest.Mock).mockResolvedValue(geoInfo);

const CREATE_COMPANY = gql`
  mutation CreateCompany($companyInput: PrivateCompanyInput!) {
    createCompany(companyInput: $companyInput) {
      orgId
      siret
      vatNumber
      gerepId
      name
      address
      companyTypes
      collectorTypes
      wasteProcessorTypes
      wasteVehiclesTypes
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
      brokerReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
      workerCertification {
        hasSubSectionFour
        hasSubSectionThree
        certificationNumber
        validityLimit
        organisation
      }
      vhuAgrementDemolisseur {
        agrementNumber
        department
      }
      vhuAgrementBroyeur {
        agrementNumber
        department
      }
      allowBsdasriTakeOverWithoutSignature
      verificationStatus
    }
  }
`;

describe("Mutation.createCompany", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterEach(async () => {
    await resetDatabase();
    jest.resetAllMocks();
    process.env = OLD_ENV; // Restore old environment
  });

  it.each([
    CompanyType.PRODUCER,
    CompanyType.COLLECTOR,
    CompanyType.WASTE_VEHICLES,
    CompanyType.WASTE_CENTER,
    CompanyType.BROKER,
    CompanyType.WORKER
  ])("should create company and userAssociation", async companyType => {
    const user = await userFactory();
    const orgId = siretify(7);
    const companyInput = {
      siret: orgId,
      gerepId: "1234",
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: [companyType],
      website: "https://trackdechets.beta.gouv.fr"
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
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
      siret: companyInput.siret,
      gerepId: companyInput.gerepId,
      name: companyInput.companyName,
      companyTypes: companyInput.companyTypes,
      allowBsdasriTakeOverWithoutSignature: false // by default
    });

    const newCompanyExists =
      (await prisma.company.findFirst({
        where: {
          siret: companyInput.siret
        }
      })) != null;
    expect(newCompanyExists).toBe(true);

    const newCompanyAssociation = await prisma.companyAssociation.findFirst({
      where: {
        company: { siret: companyInput.siret },
        user: { id: user.id }
      }
    });

    expect(newCompanyAssociation).not.toBeNull();
    expect(newCompanyAssociation?.notifications).toEqual(ALL_NOTIFICATIONS);

    const refreshedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });

    // association date is filled
    expect(refreshedUser.firstAssociationDate).toBeTruthy();
  });

  it("should create company allowing dasri direct takeOver", async () => {
    const user = await userFactory();

    const orgId = siretify(1);
    const companyInput = {
      siret: orgId,
      gerepId: "1234",
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["PRODUCER"],
      allowBsdasriTakeOverWithoutSignature: true
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
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
      siret: companyInput.siret,
      gerepId: companyInput.gerepId,
      name: companyInput.companyName,
      companyTypes: companyInput.companyTypes,
      allowBsdasriTakeOverWithoutSignature: true
    });

    const newCompanyExists =
      (await prisma.company.findFirst({
        where: {
          siret: companyInput.siret
        }
      })) != null;
    expect(newCompanyExists).toBe(true);

    const newCompanyAssociationExists =
      (await prisma.companyAssociation.findFirst({
        where: { company: { siret: companyInput.siret }, user: { id: user.id } }
      })) != null;
    expect(newCompanyAssociationExists).toBe(true);

    const refreshedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });

    // association date is filled
    expect(refreshedUser.firstAssociationDate).toBeTruthy();
  });
  it("should fail to a create a company with companyTypes.CREMATORIUM", async () => {
    const user = await userFactory();
    const orgId = siretify(7);
    const companyInput = {
      siret: orgId,
      gerepId: "1234",
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["CREMATORIUM"]
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "createCompany">>(
      CREATE_COMPANY,
      {
        variables: {
          companyInput
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le type CREMATORIUM est déprécié, utiliser WasteProcessorTypes.CREMATION."
      })
    ]);
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
      siret: orgId,
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["TRANSPORTER"],
      transporterReceiptId: transporterReceipt.id
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
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

    expect(data.createCompany.transporterReceipt!.receiptNumber).toEqual(
      transporterReceipt.receiptNumber
    );
    expect(data.createCompany.transporterReceipt!.validityLimit).toEqual(
      transporterReceipt.validityLimit.toISOString()
    );
    expect(data.createCompany.transporterReceipt!.department).toEqual(
      transporterReceipt.department
    );
  });

  it("should fail to link a transporterReceipt if the company is not TRANSPORTER", async () => {
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
      siret: orgId,
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["PRODUCER"],
      transporterReceiptId: transporterReceipt.id
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "createCompany">>(
      CREATE_COMPANY,
      {
        variables: {
          companyInput
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Impossible de renseigner un récépissé transporteur si le profil transporteur n'est pas sélectionné"
      })
    ]);
  });

  it("should link to a trader receipt", async () => {
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
      siret: orgId,
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["TRADER"],
      traderReceiptId: traderReceipt.id
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
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
    expect(data.createCompany.traderReceipt!.receiptNumber).toEqual(
      traderReceipt.receiptNumber
    );
    expect(data.createCompany.traderReceipt!.validityLimit).toEqual(
      traderReceipt.validityLimit.toISOString()
    );
    expect(data.createCompany.traderReceipt!.department).toEqual(
      traderReceipt.department
    );
  });

  it("should fail to link to a trader receipt if company is not TRADER", async () => {
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
      siret: orgId,
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["PRODUCER"],
      traderReceiptId: traderReceipt.id
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "createCompany">>(
      CREATE_COMPANY,
      {
        variables: {
          companyInput
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Impossible de renseigner un récépissé négociant si le profil négociant n'est pas sélectionné"
      })
    ]);
  });

  it("should link to a broker receipt", async () => {
    const user = await userFactory();

    const brokerReceipt = await prisma.brokerReceipt.create({
      data: {
        receiptNumber: "1234",
        validityLimit: "2023-03-31T00:00:00.000Z",
        department: "07"
      }
    });
    const orgId = siretify(7);
    const companyInput = {
      siret: orgId,
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["BROKER"],
      brokerReceiptId: brokerReceipt.id
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
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

    // check the broker Receipt was created in db
    expect(data.createCompany.brokerReceipt!.receiptNumber).toEqual(
      brokerReceipt.receiptNumber
    );
    expect(data.createCompany.brokerReceipt!.validityLimit).toEqual(
      brokerReceipt.validityLimit.toISOString()
    );
    expect(data.createCompany.brokerReceipt!.department).toEqual(
      brokerReceipt.department
    );
  });

  it("should fail to link to a broker receipt if company is not BROKER", async () => {
    const user = await userFactory();

    const brokerReceipt = await prisma.brokerReceipt.create({
      data: {
        receiptNumber: "1234",
        validityLimit: "2023-03-31T00:00:00.000Z",
        department: "07"
      }
    });
    const orgId = siretify(7);
    const companyInput = {
      siret: orgId,
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["PRODUCER"],
      brokerReceiptId: brokerReceipt.id
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "createCompany">>(
      CREATE_COMPANY,
      {
        variables: {
          companyInput
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Impossible de renseigner un récépissé courtier si le profil courtier n'est pas sélectionné"
      })
    ]);
  });

  it("should link to a worker certification", async () => {
    const user = await userFactory();

    const workerCertification = await prisma.workerCertification.create({
      data: {
        hasSubSectionFour: true,
        hasSubSectionThree: false,
        certificationNumber: "certification",
        validityLimit: new Date(),
        organisation: "AFNOR"
      }
    });
    const orgId = siretify(7);
    const companyInput = {
      siret: orgId,
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["WORKER"],
      workerCertificationId: workerCertification.id
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
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

    // check the worker certification was created in db
    expect(data.createCompany.workerCertification!.hasSubSectionFour).toEqual(
      true
    );
    expect(data.createCompany.workerCertification!.certificationNumber).toEqual(
      "certification"
    );
    expect(data.createCompany.workerCertification!.organisation).toEqual(
      "AFNOR"
    );
  });

  it("should should fail to link to a worker certification if company is not WORKER", async () => {
    const user = await userFactory();

    const workerCertification = await prisma.workerCertification.create({
      data: {
        hasSubSectionFour: true,
        hasSubSectionThree: false,
        certificationNumber: "certification",
        validityLimit: new Date(),
        organisation: "AFNOR"
      }
    });
    const orgId = siretify(7);
    const companyInput = {
      siret: orgId,
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["PRODUCER"],
      workerCertificationId: workerCertification.id
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "createCompany">>(
      CREATE_COMPANY,
      {
        variables: {
          companyInput
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Impossible de renseigner une certification d'entreprise de travaux amiante si le profil entreprise de travaux n'est pas sélectionné"
      })
    ]);
  });

  it("should link to VHU démolisseur agrement", async () => {
    const user = await userFactory();

    const vhuAgrementDemolisseur = await prisma.vhuAgrement.create({
      data: {
        agrementNumber: "agrement",
        department: "07"
      }
    });
    const orgId = siretify(7);
    const companyInput = {
      siret: orgId,
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["WASTE_VEHICLES"],
      wasteVehiclesTypes: ["DEMOLISSEUR"],
      vhuAgrementDemolisseurId: vhuAgrementDemolisseur.id
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
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

    // check the vhu agrement was created in db
    expect(data.createCompany.vhuAgrementDemolisseur!.agrementNumber).toEqual(
      "agrement"
    );
    expect(data.createCompany.vhuAgrementDemolisseur!.department).toEqual("07");
  });

  it("should fail to link to VHU démolisseur agrement if company is not DEMOLISSEUR", async () => {
    const user = await userFactory();

    const vhuAgrementDemolisseur = await prisma.vhuAgrement.create({
      data: {
        agrementNumber: "agrement",
        department: "07"
      }
    });
    const orgId = siretify(7);
    const companyInput = {
      siret: orgId,
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["WASTE_VEHICLES"],
      wasteVehiclesTypes: ["BROYEUR"],
      vhuAgrementDemolisseurId: vhuAgrementDemolisseur.id
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "createCompany">>(
      CREATE_COMPANY,
      {
        variables: {
          companyInput
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Impossible de renseigner un agrément démolissuer si le profil démolisseur VHU n'est pas sélectionné"
      })
    ]);
  });

  it("should link to VHU broyeur agrement", async () => {
    const user = await userFactory();

    const vhuAgrementBroyeur = await prisma.vhuAgrement.create({
      data: {
        agrementNumber: "agrement",
        department: "07"
      }
    });
    const orgId = siretify(7);
    const companyInput = {
      siret: orgId,
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["WASTE_VEHICLES"],
      wasteVehiclesTypes: ["BROYEUR"],
      vhuAgrementBroyeurId: vhuAgrementBroyeur.id
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
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

    // check the vhu agrement was created in db
    expect(data.createCompany.vhuAgrementBroyeur!.agrementNumber).toEqual(
      "agrement"
    );
    expect(data.createCompany.vhuAgrementBroyeur!.department).toEqual("07");
  });

  it("should fail to link to VHU broyeur agrement if company is not BROYEUR", async () => {
    const user = await userFactory();

    const vhuAgrementBroyeur = await prisma.vhuAgrement.create({
      data: {
        agrementNumber: "agrement",
        department: "07"
      }
    });
    const orgId = siretify(7);
    const companyInput = {
      siret: orgId,
      companyName: "Acme",
      address: "3 rue des granges",
      companyTypes: ["WASTE_VEHICLES"],
      wasteVehiclesTypes: ["DEMOLISSEUR"],
      vhuAgrementBroyeurId: vhuAgrementBroyeur.id
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "createCompany">>(
      CREATE_COMPANY,
      {
        variables: {
          companyInput
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Impossible de renseigner un agrément broyeur si le profil broyeur VHU n'est pas sélectionné"
      })
    ]);
  });

  it("should throw error if the company already exist", async () => {
    const user = await userFactory();
    const company = await companyFactory();

    // try re-creating the same company
    const companyInput = {
      siret: company.siret,
      gerepId: company.gerepId,
      companyName: company.name,
      address: "3 rue des granges",
      companyTypes: company.companyTypes
    };

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId: company.siret!,
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
    expect(errors[0].extensions?.code).toBe(ErrorCode.BAD_USER_INPUT);
  });

  it("should return an error when creating an unknown eco-organisme", async () => {
    const user = await userFactory();
    const siret = siretify(1);
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId: siret,
      siret,
      etatAdministratif: "A"
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput: {
          siret,
          companyName: "UN BEL ECO ORGANISME",
          address: "3 rue des granges",
          companyTypes: ["ECO_ORGANISME"]
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: [
          "Cette entreprise ne fait pas partie de la liste des éco-organismes reconnus par Trackdéchets. " +
            "Contactez-nous si vous pensez qu'il s'agit d'une erreur : contact@trackdechets.beta.gouv.fr",
          "L'URL de l'agrément de l'éco-organisme est requis."
        ].join("\n")
      })
    ]);
  });

  it("should return an error when creating an eco-organisme without its agreement", async () => {
    const user = await userFactory();
    const siret = siretify(1);
    const companyInput = {
      siret: siret,
      companyName: "UN BEL ECO ORGANISME",
      address: "3 rue des granges",
      companyTypes: ["ECO_ORGANISME"]
    };
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId: siret,
      siret,
      etatAdministratif: "A"
    });

    await prisma.ecoOrganisme.create({
      data: {
        address: "",
        name: "Eco-Organisme",
        siret: companyInput.siret
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
      siret,
      companyName: "UN BEL ECO ORGANISME",
      address: "3 rue des granges",
      companyTypes: ["ECO_ORGANISME"],
      ecoOrganismeAgreements: ["https://legifrance.com/agreement"]
    };
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId: siret,
      siret,
      etatAdministratif: "A"
    });

    await prisma.ecoOrganisme.create({
      data: {
        address: "",
        name: "Eco-Organisme",
        siret: companyInput.siret
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
      siret,
      companyName: "UN BEL ECO ORGANISME",
      address: "3 rue des granges",
      companyTypes: ["PRODUCER"],
      ecoOrganismeAgreements: ["https://legifrance.com/agreement"]
    };
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId: siret,
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
    const { sendMail } = require("../../../../mailer/mailing");
    const { geocode } = require("../../../geo/geocode");
    jest.mock("../../../search", () => ({
      searchCompany: jest.fn().mockResolvedValue({ etatAdministratif: "A" })
    }));
    const searchSireneMock = jest.fn();
    jest.mock("../../../sirene/searchCompany", () => ({
      default: (...args) => searchSireneMock(...args)
    }));
    const siret = siretify(8);
    searchSireneMock.mockResolvedValueOnce({
      siret,
      etatAdministratif: "A"
    });
    // No mails
    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    // Mock calls to API adresse
    jest.mock("../../../geo/geocode");
    const geoInfo = { latitude: 43.302546, longitude: 5.384324 };
    (geocode as jest.Mock).mockResolvedValue(geoInfo);

    const user = await userFactory();
    const companyInput = {
      siret,
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

    const company = await prisma.company.findUniqueOrThrow({
      where: { siret: companyInput.siret }
    });

    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      renderMail(verificationProcessInfo, {
        to: [{ email: user.email, name: user.name }],
        variables: { company: company as any }
      })
    );

    process.env = OLD_ENV;
  }, 30000);

  it("should allow to create a TRANSPORTER company with VAT number", async () => {
    const user = await userFactory();
    const companyInput = {
      vatNumber: "RO17579668",
      companyName: "Acme in EU",
      address: "Transporter street",
      companyTypes: ["TRANSPORTER"]
    };

    // Company Infos are different
    const testValue = {
      orgId: "RO17579668",
      vatNumber: "RO17579668",
      address: "RO Transporter street",
      name: "Acme in RO",
      codePaysEtrangerEtablissement: "RO",
      statutDiffusionEtablissement: "O" as StatutDiffusionEtablissement,
      etatAdministratif: "A"
    };
    (searchCompany as jest.Mock).mockResolvedValue(testValue);

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    expect(data.createCompany).toMatchObject({
      allowBsdasriTakeOverWithoutSignature: false,
      companyTypes: ["TRANSPORTER"],
      ecoOrganismeAgreements: [],
      gerepId: null,
      name: testValue.name,
      address: testValue.address,
      traderReceipt: null,
      transporterReceipt: null,
      vatNumber: "RO17579668"
    });
  });

  it("should return an error when creating any type but a TRANSPORTER company with VAT number", async () => {
    const user = await userFactory();

    for (const type in CompanyType) {
      if (type === "TRANSPORTER" || type === "CREMATORIUM") {
        continue;
      }
      const companyInput = {
        vatNumber: "RO17579668",
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
            "Seul un établissement ayant comme unique profil Transporteur" +
            " peut être identifié par à un numéro de TVA (établissement étranger)"
        })
      ]);
    }
  });

  it("should return an error when creating a company with FRENCH VAT number", async () => {
    const user = await userFactory();

    const companyInput = {
      vatNumber: "FR87850019464",
      companyName: "Acme in FR",
      address: "une adresse",
      companyTypes: [CompanyType.TRANSPORTER]
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
          "Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement"
      })
    ]);
  });

  it("should return an error when creating a closed company ", async () => {
    const user = await userFactory();
    const orgId = siretify(8);
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "F"
    });

    const companyInput = {
      siret: orgId,
      companyName: "Acme in FR",
      address: "une adresse",
      companyTypes: [CompanyType.TRANSPORTER]
    };

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Impossible de créer un établissement fermé selon l'INSEE"
      })
    ]);
  });

  it("non-professional > should not send verification email and send onboarding email", async () => {
    // Given
    process.env.VERIFY_COMPANY = "true";
    const user = await userFactory();
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "Producteur de déchets",
      address: "une adresse",
      companyTypes: [CompanyType.PRODUCER]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data, errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.createCompany).toMatchObject({
      siret: companyInput.siret,
      orgId: companyInput.siret,
      name: companyInput.companyName,
      companyTypes: companyInput.companyTypes
    });

    const newCompany = await prisma.company.findFirst({
      where: {
        orgId: companyInput.siret
      }
    });
    expect(newCompany).not.toBeUndefined();

    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(1);

    // Onboarding email
    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      renderMail(onboardingFirstStep, {
        to: [{ email: user.email, name: user.name }]
      })
    );
  });

  it("professional > should send verification email and not onboarding email", async () => {
    // Given
    process.env.VERIFY_COMPANY = "true";
    const user = await userFactory();
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "Transporteur",
      address: "une adresse",
      companyTypes: [CompanyType.TRANSPORTER]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data, errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.createCompany).toMatchObject({
      siret: companyInput.siret,
      orgId: companyInput.siret,
      name: companyInput.companyName,
      companyTypes: companyInput.companyTypes
    });

    const newCompany = await prisma.company.findFirst({
      where: {
        orgId: companyInput.siret
      }
    });
    expect(newCompany).not.toBeUndefined();

    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(1);

    // Verification e-mail
    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      renderMail(verificationProcessInfo, {
        to: [{ email: user.email, name: user.name }],
        variables: { company: newCompany as any }
      })
    );
  });

  it("foreign transporter > should auto validate and send onboarding email", async () => {
    // Given
    process.env.VERIFY_COMPANY = "true";
    const user = await userFactory();
    const vatNumber = "BE0406750197";
    const orgId = vatNumber;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      vatNumber,
      companyName: "Transporteur étranger",
      address: "une adresse",
      companyTypes: [CompanyType.TRANSPORTER]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data, errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.createCompany).toMatchObject({
      vatNumber: companyInput.vatNumber,
      orgId: companyInput.vatNumber,
      name: companyInput.companyName,
      companyTypes: companyInput.companyTypes,
      verificationStatus: CompanyVerificationStatus.VERIFIED
    });

    const company = await prisma.company.findFirst({
      where: {
        orgId: companyInput.vatNumber
      }
    });

    expect(company?.verificationMode).toEqual("AUTO");

    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(1);

    // Onboarding email
    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      renderMail(verifiedForeignTransporterCompany, {
        to: [{ email: user.email, name: user.name }]
      })
    );
  });

  it("professional with generic email > should auto send verification letter", async () => {
    // Given
    process.env.VERIFY_COMPANY = "true";
    const user = await userFactory({ email: "user@gmail.com" });
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "Transporteur",
      address: "une adresse",
      companyTypes: [CompanyType.TRANSPORTER]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).toBeUndefined();

    jest.mock("../../../../common/post");
    (sendVerificationCodeLetter as jest.Mock).mockImplementation(() =>
      Promise.resolve()
    );

    // Verification letter
    expect(sendVerificationCodeLetter as jest.Mock).toHaveBeenCalledTimes(1);

    const company = await prisma.company.findFirst({
      where: {
        siret
      }
    });

    expect(company?.verificationStatus).toEqual(
      CompanyVerificationStatus.LETTER_SENT
    );
    expect(company?.verificationMode).toEqual(CompanyVerificationMode.LETTER);
  });

  it("professional with pro email > should not send email verification letter", async () => {
    // Given
    process.env.VERIFY_COMPANY = "true";
    const user = await userFactory({ email: "user@dechets.com" });
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "Transporteur",
      address: "une adresse",
      companyTypes: [CompanyType.TRANSPORTER]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data, errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.createCompany).toMatchObject({
      verificationStatus: "TO_BE_VERIFIED"
    });

    jest.mock("../../../../common/post");
    (sendVerificationCodeLetter as jest.Mock).mockImplementation(() =>
      Promise.resolve()
    );

    // Verification letter
    expect(sendVerificationCodeLetter as jest.Mock).toHaveBeenCalledTimes(0);
  });

  it("non-professional > should not send email verification letter", async () => {
    // Given
    process.env.VERIFY_COMPANY = "true";
    const user = await userFactory({ email: "user@gmail.com" });
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "Transporteur",
      address: "une adresse",
      companyTypes: [CompanyType.PRODUCER]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).toBeUndefined();

    jest.mock("../../../../common/post");
    (sendVerificationCodeLetter as jest.Mock).mockImplementation(() =>
      Promise.resolve()
    );

    // Verification letter
    expect(sendVerificationCodeLetter as jest.Mock).toHaveBeenCalledTimes(0);
  });

  it("company types should not be duplicated", async () => {
    // Given
    const user = await userFactory();
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "Collector",
      address: "une adresse",
      companyTypes: [CompanyType.COLLECTOR, CompanyType.COLLECTOR]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data, errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.createCompany).toMatchObject({
      companyTypes: [CompanyType.COLLECTOR]
    });
  });

  it("collector should be able to chose collector types", async () => {
    // Given
    const user = await userFactory();
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "Collector",
      address: "une adresse",
      companyTypes: [CompanyType.PRODUCER, CompanyType.COLLECTOR],
      collectorTypes: [
        CollectorType.DANGEROUS_WASTES,
        CollectorType.DEEE_WASTES
      ]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data, errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.createCompany).toMatchObject({
      companyTypes: [CompanyType.PRODUCER, CompanyType.COLLECTOR],
      collectorTypes: [
        CollectorType.DANGEROUS_WASTES,
        CollectorType.DEEE_WASTES
      ]
    });
  });

  it("collector types must be valid CollectorTypes", async () => {
    // Given
    const user = await userFactory();
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "Collector",
      address: "une adresse",
      companyTypes: [CompanyType.COLLECTOR],
      collectorTypes: [WasteProcessorType.CREMATION]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      `Variable "$companyInput" got invalid value "CREMATION" at "companyInput.collectorTypes[0]"; Value "CREMATION" does not exist in "CollectorType" enum.`
    );
  });

  it("collector types should not be duplicated", async () => {
    // Given
    const user = await userFactory();
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "Collector",
      address: "une adresse",
      companyTypes: [CompanyType.PRODUCER, CompanyType.COLLECTOR],
      collectorTypes: [
        CollectorType.DANGEROUS_WASTES,
        CollectorType.DANGEROUS_WASTES
      ]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data, errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.createCompany).toMatchObject({
      companyTypes: [CompanyType.PRODUCER, CompanyType.COLLECTOR],
      collectorTypes: [CollectorType.DANGEROUS_WASTES]
    });
  });

  it("non-collector should NOT be able to chose collector types", async () => {
    // Given
    const user = await userFactory();
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "Producer",
      address: "une adresse",
      companyTypes: [CompanyType.PRODUCER],
      collectorTypes: [CollectorType.DANGEROUS_WASTES]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Impossible de sélectionner un sous-type d'installation de tri, transit, regroupement" +
        " si le profil Installation de Tri, transit regroupement de déchets n'est pas sélectionné"
    );
  });

  it.each([null, undefined, []])(
    "collector types are optional > empty value '%p'",
    async collectorTypes => {
      // Given
      const user = await userFactory();
      const siret = siretify(8);
      const orgId = siret;
      (searchCompany as jest.Mock).mockResolvedValueOnce({
        orgId,
        siret: orgId,
        etatAdministratif: "A"
      });

      const companyInput = {
        siret,
        companyName: "Collector",
        address: "une adresse",
        companyTypes: [CompanyType.PRODUCER, CompanyType.COLLECTOR],
        collectorTypes
      };

      // When
      const { mutate } = makeClient({ ...user, auth: AuthType.Session });
      const { data, errors } = await mutate(CREATE_COMPANY, {
        variables: {
          companyInput
        }
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.createCompany).toMatchObject({
        companyTypes: [CompanyType.PRODUCER, CompanyType.COLLECTOR],
        collectorTypes: []
      });
    }
  );

  it("waste processor should be able to chose waste processor types", async () => {
    // Given
    const user = await userFactory();
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "Waste processor",
      address: "une adresse",
      companyTypes: [CompanyType.WASTEPROCESSOR, CompanyType.COLLECTOR],
      wasteProcessorTypes: [
        WasteProcessorType.CREMATION,
        WasteProcessorType.INERT_WASTES_STORAGE
      ]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data, errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.createCompany).toMatchObject({
      companyTypes: [CompanyType.WASTEPROCESSOR, CompanyType.COLLECTOR],
      wasteProcessorTypes: [
        WasteProcessorType.CREMATION,
        WasteProcessorType.INERT_WASTES_STORAGE
      ]
    });
  });

  it("waste processor types must be valid WasteProcessorTypes", async () => {
    // Given
    const user = await userFactory();
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "Waste processor",
      address: "une adresse",
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [CollectorType.DEEE_WASTES]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      `Variable "$companyInput" got invalid value "DEEE_WASTES" at "companyInput.wasteProcessorTypes[0]"; Value "DEEE_WASTES" does not exist in "WasteProcessorType" enum.`
    );
  });

  it("waste processor types should not be duplicated", async () => {
    // Given
    const user = await userFactory();
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "Waste processor",
      address: "une adresse",
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [
        WasteProcessorType.CREMATION,
        WasteProcessorType.CREMATION
      ]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data, errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.createCompany).toMatchObject({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.CREMATION]
    });
  });

  it("non-waste-processor should NOT be able to chose waste processor types", async () => {
    // Given
    const user = await userFactory();
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "Waste processor",
      address: "une adresse",
      companyTypes: [CompanyType.PRODUCER],
      wasteProcessorTypes: [WasteProcessorType.CREMATION]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Impossible de sélectionner un sous-type d'installation de traitement" +
        " si le profil Installation de traitement n'est pas sélectionné"
    );
  });

  it.each([null, undefined, []])(
    "waste processor types are optional > empty value '%p'",
    async wasteProcessorTypes => {
      // Given
      const user = await userFactory();
      const siret = siretify(8);
      const orgId = siret;
      (searchCompany as jest.Mock).mockResolvedValueOnce({
        orgId,
        siret: orgId,
        etatAdministratif: "A"
      });

      const companyInput = {
        siret,
        companyName: "Waste processor",
        address: "une adresse",
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes
      };

      // When
      const { mutate } = makeClient({ ...user, auth: AuthType.Session });
      const { data, errors } = await mutate(CREATE_COMPANY, {
        variables: {
          companyInput
        }
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.createCompany).toMatchObject({
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: []
      });
    }
  );

  it("VHU treatment facility should be able to chose waste vehicles types", async () => {
    // Given
    const user = await userFactory();
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "VHU",
      address: "une adresse",
      companyTypes: [CompanyType.PRODUCER, CompanyType.WASTE_VEHICLES],
      wasteVehiclesTypes: [
        WasteVehiclesType.BROYEUR,
        WasteVehiclesType.DEMOLISSEUR
      ]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data, errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.createCompany).toMatchObject({
      companyTypes: [CompanyType.PRODUCER, CompanyType.WASTE_VEHICLES],
      wasteVehiclesTypes: [
        WasteVehiclesType.BROYEUR,
        WasteVehiclesType.DEMOLISSEUR
      ]
    });
  });

  it("waste vehicles types must be valid WasteVehiclesType", async () => {
    // Given
    const user = await userFactory();
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "VHU",
      address: "une adresse",
      companyTypes: [CompanyType.WASTE_VEHICLES],
      wasteVehiclesTypes: [WasteProcessorType.CREMATION]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      `Variable "$companyInput" got invalid value "CREMATION" at "companyInput.wasteVehiclesTypes[0]"; Value "CREMATION" does not exist in "WasteVehiclesType" enum.`
    );
  });

  it("waste vehicles types should not be duplicated", async () => {
    // Given
    const user = await userFactory();
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "VHU",
      address: "une adresse",
      companyTypes: [CompanyType.PRODUCER, CompanyType.WASTE_VEHICLES],
      wasteVehiclesTypes: [WasteVehiclesType.BROYEUR, WasteVehiclesType.BROYEUR]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data, errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.createCompany).toMatchObject({
      companyTypes: [CompanyType.PRODUCER, CompanyType.WASTE_VEHICLES],
      wasteVehiclesTypes: [WasteVehiclesType.BROYEUR]
    });
  });

  test("non VHU should NOT be able to chose waste vehicles types", async () => {
    // Given
    const user = await userFactory();
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "Wanabee VHU",
      address: "une adresse",
      companyTypes: [CompanyType.PRODUCER],
      wasteVehiclesTypes: [WasteVehiclesType.BROYEUR]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Impossible de sélectionner un sous-type d'installation de traitement VHU" +
        " si le profil Installation de traitement VHU n'est pas sélectionné"
    );
  });

  it.each([null, undefined, []])(
    "waste vehicles types are optional > empty value '%p'",
    async wasteVehiclesTypes => {
      // Given
      const user = await userFactory();
      const siret = siretify(8);
      const orgId = siret;
      (searchCompany as jest.Mock).mockResolvedValueOnce({
        orgId,
        siret: orgId,
        etatAdministratif: "A"
      });

      const companyInput = {
        siret,
        companyName: "VHU",
        address: "une adresse",
        companyTypes: [CompanyType.WASTE_VEHICLES],
        wasteVehiclesTypes
      };

      // When
      const { mutate } = makeClient({ ...user, auth: AuthType.Session });
      const { data, errors } = await mutate(CREATE_COMPANY, {
        variables: {
          companyInput
        }
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.createCompany).toMatchObject({
        companyTypes: [CompanyType.WASTE_VEHICLES],
        wasteProcessorTypes: []
      });
    }
  );

  it("company can have a combination of waste processor types & collector types", async () => {
    // Given
    const user = await userFactory();
    const siret = siretify(8);
    const orgId = siret;
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      orgId,
      siret: orgId,
      etatAdministratif: "A"
    });

    const companyInput = {
      siret,
      companyName: "Waste processor & Collector",
      address: "une adresse",
      companyTypes: [
        CompanyType.PRODUCER,
        CompanyType.COLLECTOR,
        CompanyType.WASTEPROCESSOR
      ],
      collectorTypes: [
        CollectorType.DANGEROUS_WASTES,
        CollectorType.DEEE_WASTES
      ],
      wasteProcessorTypes: [
        WasteProcessorType.OTHER_DANGEROUS_WASTES,
        WasteProcessorType.DANGEROUS_WASTES_STORAGE
      ]
    };

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data, errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.createCompany).toMatchObject({
      companyTypes: [
        CompanyType.PRODUCER,
        CompanyType.COLLECTOR,
        CompanyType.WASTEPROCESSOR
      ],
      collectorTypes: [
        CollectorType.DANGEROUS_WASTES,
        CollectorType.DEEE_WASTES
      ],
      wasteProcessorTypes: [
        WasteProcessorType.OTHER_DANGEROUS_WASTES,
        WasteProcessorType.DANGEROUS_WASTES_STORAGE
      ]
    });
  });
});
