import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { BsdaInput, Mutation } from "../../../../generated/graphql/types";
import {
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const CREATE_BSDA = `
mutation CreateBsda($input: BsdaInput!) {
  createBsda(input: $input) {
    id
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
    }
  }
}
`;

describe("Mutation.Bsda.create", () => {
  afterEach(resetDatabase);

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
              siret: "siret"
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
          siret: "22222222222222",
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        code: "16 01 06",
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
          siret: "3".repeat(14),
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
    expect(data.createBsda.destination.company.siret).toBe(
      input.destination.company.siret
    );
  });
  it("should allow creating the form if up to 2 plates are submitted", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

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
          siret: "22222222222222",
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        code: "16 01 06",
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
          siret: "3".repeat(14),
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      transporter: {
        company: {
          siret: "21111111111112",
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

    expect(data.createBsda.transporter.transport.plates.length).toBe(2);
  });

  it("should fail creating the form if more than 2 plates are submitted", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

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
          siret: "22222222222222",
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        code: "16 01 06",
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
          siret: "3".repeat(14),
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      transporter: {
        company: {
          siret: "21111111111112",
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
          siret: "22222222222222",
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        // code: "16 01 06",
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
          siret: "3".repeat(14),
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

    expect(errors[0].message).toBe("Le code déchet est obligatoire");
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
        code: "16 01 06",
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
        code: "16 01 06",
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
        code: "16 01 06",
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
});
