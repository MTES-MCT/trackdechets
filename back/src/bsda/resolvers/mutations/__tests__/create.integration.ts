import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { BsdaInput, Mutation } from "@td/codegen-back";
import {
  siretify,
  userFactory,
  userWithCompanyFactory,
  companyFactory,
  transporterReceiptFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdaStatus } from "@prisma/client";
import { bsdaFactory } from "../../../__tests__/factories";
import { prisma } from "@td/prisma";
import { gql } from "graphql-tag";

const CREATE_BSDA = gql`
  mutation CreateBsda($input: BsdaInput!) {
    createBsda(input: $input) {
      id
      status
      destination {
        company {
          siret
        }
      }
      emitter {
        company {
          siret
        }
      }
      transporter {
        transport {
          plates
        }
        recepisse {
          number
          department
          validityLimit
        }
      }
      intermediaries {
        siret
      }
    }
  }
`;

describe("Mutation.Bsda.create", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env.VERIFY_COMPANY = "false";
  });

  afterEach(() => {
    process.env = OLD_ENV;
    return resetDatabase();
  });

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: { input: {} }
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

  it("should disallow a user to create a form they are not part of", async () => {
    const user = await userFactory();

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input: {
          emitter: {
            company: {
              siret: siretify(1)
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should allow creating a valid form for the producer signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const transporter = await companyFactory();
    const worker = await companyFactory();

    const input: BsdaInput = {
      type: "OTHER_COLLECTIONS",
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      worker: {
        company: {
          siret: worker.siret,
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      transporter: {
        company: { siret: transporter.siret }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      }
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(data.createBsda.id).toMatch(
      new RegExp(`^BSDA-[0-9]{8}-[A-Z0-9]{9}$`)
    );
    expect(data.createBsda.destination!.company!.siret).toBe(
      input.destination!.company!.siret
    );

    const createdBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: data.createBsda.id }
    });
    // le champ dénormalisé `transportersOrgIds`doit être rempli
    expect(createdBsda.transportersOrgIds).toEqual([transporter.siret]);
  });

  it("should allow creating a valid form with null sealNumbers field", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const worker = await companyFactory();

    const input: BsdaInput = {
      type: "OTHER_COLLECTIONS",
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      worker: {
        company: {
          siret: worker.siret,
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: null
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      }
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });
    expect(data.createBsda.id).toMatch(
      new RegExp(`^BSDA-[0-9]{8}-[A-Z0-9]{9}$`)
    );
    expect(data.createBsda.destination!.company!.siret).toBe(
      input.destination!.company!.siret
    );
  });

  it("should allow creating a valid form without sealNumbers field", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const worker = await companyFactory();

    const input: BsdaInput = {
      type: "OTHER_COLLECTIONS",
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      worker: {
        company: {
          siret: worker.siret,
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material"
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      }
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });
    expect(data.createBsda.id).toMatch(
      new RegExp(`^BSDA-[0-9]{8}-[A-Z0-9]{9}$`)
    );
    expect(data.createBsda.destination!.company!.siret).toBe(
      input.destination!.company!.siret
    );
  });

  it("should allow creating the form if up to 2 plates are submitted", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const worker = await companyFactory();

    const input: BsdaInput = {
      type: "OTHER_COLLECTIONS",
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      worker: {
        company: {
          siret: worker.siret,
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      transporter: {
        company: {
          siret: transporterCompany.siret,
          name: "The Transporter",
          address: "Rue du bsda",
          contact: "Un transporter",
          phone: "0101010101",
          mail: "transporter@mail.com"
        },
        transport: { plates: ["SD-99-TY", "GG-66-AR"] }
      }
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(data.createBsda.transporter!.transport!.plates!.length).toBe(2);
  });

  it("should create a bsda and autocomplete transporter receipt", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    await transporterReceiptFactory({ company: transporterCompany });
    const worker = await companyFactory();

    const input: BsdaInput = {
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      worker: {
        company: {
          siret: worker.siret,
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      transporter: {
        company: {
          siret: transporterCompany.siret,
          name: "The Transporter",
          address: "Rue du bsda",
          contact: "Un transporter",
          phone: "0101010101",
          mail: "transporter@mail.com"
        },
        transport: { plates: ["SD-99-TY"] }
      }
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(data.createBsda.transporter!.recepisse!.number).toEqual(
      "the number"
    );
    expect(data.createBsda.transporter!.recepisse!.department).toEqual("83");
    expect(data.createBsda.transporter!.recepisse!.validityLimit).toEqual(
      "2055-01-01T00:00:00.000Z"
    );
  });

  it("should fail creating the form if more than 2 plates are submitted", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const worker = await companyFactory();

    const input: BsdaInput = {
      type: "OTHER_COLLECTIONS",
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      worker: {
        company: {
          siret: worker.siret,
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      transporter: {
        company: {
          siret: transporterCompany.siret,
          name: "The Transporter",
          address: "Rue du bsda",
          contact: "Un transporter",
          phone: "0101010101",
          mail: "transporter@mail.com"
        },
        transport: { plates: ["SD-99-TY", "GG-66-AR", "DD-44-TT"] }
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Un maximum de 2 plaques d'immatriculation est accepté",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should fail creating the form if a required field like the waste code is missing", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const worker = await companyFactory();

    const input: BsdaInput = {
      type: "OTHER_COLLECTIONS",
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      worker: {
        company: {
          siret: worker.siret,
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        // code: "06 07 01*",
        adr: "ADR",
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"],
        pop: true
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(errors[0].message).toBe("Le code déchet est obligatoire.");
  });

  it("should disallow creating the bsda with type COLLECTION_2710 if destination is not set", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input: BsdaInput = {
      type: "COLLECTION_2710",
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Seules les déchetteries peuvent créer un bordereau de ce type, et elles doivent impérativement être identifiées comme destinataire du déchet.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should disallow creating the bsda with type COLLECTION_2710 if destination is not a waste center", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: { set: ["WASTEPROCESSOR"] }
    });

    const input: BsdaInput = {
      type: "COLLECTION_2710",
      emitter: {
        isPrivateIndividual: true,
        company: {
          name: "Jean DUPONT",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: company.siret,
          name: company.name,
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Seules les déchetteries peuvent créer un bordereau de ce type, et elles doivent impérativement être identifiées comme destinataire du déchet.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should allow creating the bsda with type COLLECTION_2710 if destination is a waste center", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: { set: ["WASTE_CENTER"] }
    });

    const input: BsdaInput = {
      type: "COLLECTION_2710",
      emitter: {
        isPrivateIndividual: true,
        company: {
          name: "Jean DUPONT",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: company.siret,
          name: company.name,
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      }
    };

    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<Pick<Mutation, "createBsda">>(
      CREATE_BSDA,
      {
        variables: {
          input
        }
      }
    );
    expect(errors).toBeUndefined();

    expect(data.createBsda.id).toBeDefined();
  });

  it("should allow creating the bsda with type COLLECTION_2710 even if worker have empty strings as siret", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: { set: ["WASTE_CENTER"] }
    });

    const input: BsdaInput = {
      type: "COLLECTION_2710",
      worker: {
        company: {
          address: "",
          contact: "",
          country: "",
          mail: "",
          name: "",
          omiNumber: "",
          phone: "",
          siret: "",
          vatNumber: ""
        }
      },
      emitter: {
        isPrivateIndividual: true,
        company: {
          name: "Jean DUPONT",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: company.siret,
          name: company.name,
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      }
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(data.createBsda.id).toBeDefined();
  });

  it("should disallow creating a bsda with packaging OTHER and no description", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: { set: ["WASTE_CENTER"] }
    });

    const input: BsdaInput = {
      type: "COLLECTION_2710",
      emitter: {
        isPrivateIndividual: true,
        company: {
          name: "Jean DUPONT",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "OTHER", other: null }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: company.siret,
          name: company.name,
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(errors[0].message).toBe(
      "Vous devez saisir la description du conditionnement quand le type de conditionnement est 'Autre'"
    );
  });

  it("should allow creating a bsda with packaging field other null if packaging type is not OTHER", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: { set: ["WASTE_CENTER"] }
    });

    const input: BsdaInput = {
      type: "COLLECTION_2710",
      emitter: {
        isPrivateIndividual: true,
        company: {
          name: "Jean DUPONT",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME", other: null }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: company.siret,
          name: company.name,
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      }
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(data.createBsda.id).toBeDefined();
  });

  it("should allow creating the bsda with the worker certification infos", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const worker = await companyFactory();

    const input: BsdaInput = {
      type: "OTHER_COLLECTIONS",
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      worker: {
        company: {
          siret: worker.siret,
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        },
        certification: {
          hasSubSectionFour: true,
          hasSubSectionThree: true,
          certificationNumber: "AAA",
          validityLimit: new Date().toISOString() as any,
          organisation: "AFNOR Certification"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      }
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(data.createBsda.id).toBeDefined();
  });

  it("should allow creating the bsda with intermediaries", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: intermediaryCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const worker = await companyFactory();

    const input: BsdaInput = {
      type: "OTHER_COLLECTIONS",
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      worker: {
        company: {
          siret: worker.siret,
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      intermediaries: [
        {
          siret: intermediaryCompany.siret,
          name: intermediaryCompany.name,
          address: intermediaryCompany.address,
          contact: "John Doe"
        }
      ]
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(data.createBsda.id).toBeDefined();
    expect(data.createBsda.intermediaries!.length).toBe(1);
  });

  it("should fail if creating a bsda with the same intermediary several times", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: intermediaryCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const worker = await companyFactory();

    const input: BsdaInput = {
      type: "OTHER_COLLECTIONS",
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      worker: {
        company: {
          siret: worker.siret,
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      intermediaries: [
        {
          siret: intermediaryCompany.siret,
          name: intermediaryCompany.name,
          address: intermediaryCompany.address,
          contact: "John Doe"
        },
        {
          siret: intermediaryCompany.siret,
          name: intermediaryCompany.name,
          address: intermediaryCompany.address,
          contact: "John Doe"
        }
      ]
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(errors[0].message).toBe(
      "Intermédiaires: impossible d'ajouter le même établissement en intermédiaire plusieurs fois"
    );
  });

  it("should fail if creating a bsda with more than 3 intermediaries", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: intermediaryCompany1 } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { company: intermediaryCompany2 } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { company: intermediaryCompany3 } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { company: intermediaryCompany4 } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const worker = await companyFactory();

    const input: BsdaInput = {
      type: "OTHER_COLLECTIONS",
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      worker: {
        company: {
          siret: worker.siret,
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      intermediaries: [
        {
          siret: intermediaryCompany1.siret,
          name: intermediaryCompany1.name,
          address: intermediaryCompany1.address,
          contact: "John Doe"
        },
        {
          siret: intermediaryCompany2.siret,
          name: intermediaryCompany2.name,
          address: intermediaryCompany2.address,
          contact: "John Doe"
        },
        {
          siret: intermediaryCompany3.siret,
          name: intermediaryCompany3.name,
          address: intermediaryCompany3.address,
          contact: "John Doe"
        },
        {
          siret: intermediaryCompany4.siret,
          name: intermediaryCompany4.name,
          address: intermediaryCompany4.address,
          contact: "John Doe"
        }
      ]
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(errors[0].message).toBe(
      "Intermédiaires: impossible d'ajouter plus de 3 intermédiaires"
    );
  });

  it("should fail if the bsda next destination is not registered as a destination", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { company: finalDestinationCompany } = await userWithCompanyFactory(
      "MEMBER",
      {
        companyTypes: { set: ["PRODUCER"] } // NOT a destination
      }
    );
    const worker = await companyFactory();

    const input: BsdaInput = {
      type: "OTHER_COLLECTIONS",
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      worker: {
        company: {
          siret: worker.siret,
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        },
        operation: {
          nextDestination: {
            cap: "CAP",
            company: { siret: finalDestinationCompany.siret }
          }
        }
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain(
      "est pas inscrite sur Trackdéchets en tant qu'installation de traitement"
    );
  });

  it("should create a RESHIPMENT bsda and copy consistence from forwarded bsda if field is not provided", async () => {
    const { company: emitter } = await userWithCompanyFactory("MEMBER");
    const { company: transporter } = await userWithCompanyFactory("MEMBER");
    const { user, company: destination } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { company: ttr } = await userWithCompanyFactory("MEMBER");
    const worker = await companyFactory();

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.siret,
        destinationCompanySiret: ttr.siret,
        status: BsdaStatus.AWAITING_CHILD,
        destinationOperationCode: "D 15",
        wasteConsistence: "PULVERULENT"
      },
      transporterOpt: {
        transporterCompanySiret: transporter.siret
      }
    });

    const input: BsdaInput = {
      type: "RESHIPMENT",
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: ttr.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      worker: {
        company: {
          siret: worker.siret,
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        // consistence not provided
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: destination.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      forwarding: bsda.id
    };

    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<Pick<Mutation, "createBsda">>(
      CREATE_BSDA,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toBeUndefined();
    expect(data.createBsda.id).toBeTruthy();
    const reshipped = await prisma.bsda.findUnique({
      where: { id: data.createBsda.id }
    });
    expect(reshipped?.type).toEqual("RESHIPMENT");
    expect(reshipped?.forwardingId).toEqual(bsda.id);
    expect(reshipped?.wasteConsistence).toEqual("PULVERULENT"); // consistence matches forwarde bsda consistence
  });

  it("should create a RESHIPMENT bsda and use provided cosnsitence field ", async () => {
    const worker = await companyFactory();
    const { company: emitter } = await userWithCompanyFactory("MEMBER");
    const { company: transporter } = await userWithCompanyFactory("MEMBER");
    const { user, company: destination } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { company: ttr } = await userWithCompanyFactory("MEMBER");

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.siret,
        destinationCompanySiret: ttr.siret,
        status: BsdaStatus.AWAITING_CHILD,
        destinationOperationCode: "D 15",
        wasteConsistence: "SOLIDE"
      },
      transporterOpt: {
        transporterCompanySiret: transporter.siret
      }
    });

    const input: BsdaInput = {
      type: "RESHIPMENT",
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: ttr.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      worker: {
        company: {
          siret: worker.siret,
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        code: "06 07 01*",
        adr: "ADR",
        pop: true,
        consistence: "PULVERULENT",
        familyCode: "Code famille",
        materialName: "A material",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: destination.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      forwarding: bsda.id
    };

    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<Pick<Mutation, "createBsda">>(
      CREATE_BSDA,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toBeUndefined();
    expect(data.createBsda.id).toBeTruthy();
    const reshipped = await prisma.bsda.findUnique({
      where: { id: data.createBsda.id }
    });
    expect(reshipped?.type).toEqual("RESHIPMENT");
    expect(reshipped?.forwardingId).toEqual(bsda.id);
    expect(reshipped?.wasteConsistence).toEqual("PULVERULENT"); // consistence matches input
  });

  it("should create a bsda if destination is NOT verified, provided it's a WASTE_CENTER and bsda is COLLECTION_2710", async () => {
    // Given
    process.env.VERIFY_COMPANY = "true";
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");

    const { user: destinationUser, company: destinationCompany } =
      await userWithCompanyFactory("MEMBER", {
        verificationStatus: "TO_BE_VERIFIED",
        companyTypes: ["PRODUCER", "WASTE_CENTER"]
      });

    const input: BsdaInput = {
      destination: {
        cap: "",
        company: {
          address: destinationCompany.address,
          contact: destinationCompany.contact,
          mail: destinationCompany.contactEmail,
          name: destinationCompany.name,
          phone: destinationCompany.contactPhone,
          siret: destinationCompany.siret
        },
        operation: {
          description: ""
        },
        plannedOperationCode: "R 13"
      },
      emitter: {
        company: {
          address: emitterCompany.address,
          contact: emitterCompany.contact,
          country: "FR",
          mail: emitterCompany.contactEmail,
          name: emitterCompany.name,
          phone: emitterCompany.contactPhone,
          siret: emitterCompany.siret
        },
        isPrivateIndividual: false,
        pickupSite: {
          address: "4 Boulevard boues",
          city: "Marseille",
          infos: "",
          name: "4 Boulevard boues",
          postalCode: "13003"
        }
      },
      packagings: [
        {
          other: "",
          quantity: 1,
          type: "DEPOT_BAG"
        }
      ],
      type: "COLLECTION_2710",
      waste: {
        adr: "ADR",
        code: "06 07 01*",
        consistence: "SOLIDE",
        familyCode: "4",
        materialName: "test",
        pop: false,
        sealNumbers: []
      },
      weight: {
        value: 10
      }
    };

    // When
    const { mutate } = makeClient(destinationUser);
    const { data, errors } = await mutate<Pick<Mutation, "createBsda">>(
      CREATE_BSDA,
      {
        variables: {
          input
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
    expect(data.createBsda.status).toBe("INITIAL");
  });

  it("should allow broker to create a bsda", async () => {
    // Given
    const { company: broker, user } = await userWithCompanyFactory("MEMBER");

    const input: BsdaInput = {
      type: "OTHER_COLLECTIONS",
      broker: {
        company: {
          siret: broker.siret
        }
      }
    };

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    // Then
    expect(
      errors.some(
        error =>
          error.message ===
          "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas"
      )
    ).toBeFalsy();
  });

  it("should allow intermediary to create a bsda", async () => {
    // Given
    const { company: intermediary, user } = await userWithCompanyFactory(
      "MEMBER"
    );

    const input: BsdaInput = {
      type: "OTHER_COLLECTIONS",
      intermediaries: [{ siret: intermediary.siret }]
    };

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    // Then
    expect(
      errors.some(
        error =>
          error.message ===
          "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas"
      )
    ).toBeFalsy();
  });
});
