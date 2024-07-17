import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { BspaohInput, Mutation } from "../../../../generated/graphql/types";
import {
  siretify,
  userFactory,
  userWithCompanyFactory,
  companyFactory,
  transporterReceiptFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { fullBspaoh } from "../../../fragments";
import { gql } from "graphql-tag";
import { sirenify as sirenifyBspaohInput } from "../../../validation/sirenify";
import { crematoriumFactory } from "../../../__tests__/factories";

jest.mock("../../../validation/sirenify");
(sirenifyBspaohInput as jest.Mock).mockImplementation(input =>
  Promise.resolve(input)
);

const CREATE_BSPAOH = gql`
  mutation CreateBspaoh($input: BspaohInput!) {
    createBspaoh(input: $input) {
      ...FullBspaoh
    }
  }
  ${fullBspaoh}
`;

describe("Mutation.Bspaoh.create", () => {
  afterEach(async () => {
    await resetDatabase();
    (sirenifyBspaohInput as jest.Mock).mockClear();
  });

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "createBspaoh">>(
      CREATE_BSPAOH,
      {
        variables: { input: {} }
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

  it("should disallow a user to create a form they are not part of", async () => {
    const user = await userFactory();

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBspaoh">>(
      CREATE_BSPAOH,
      {
        variables: {
          input: {
            emitter: {
              company: {
                siret: siretify(1)
              }
            }
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparaît pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it.each(["FOETUS", "PAOH"])(
    "should allow bspaoh creation",
    async bspaohType => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const destinationCompany = await crematoriumFactory();

      const input: BspaohInput = {
        waste: {
          type: bspaohType,
          adr: "plop",
          code: "18 01 02",
          packagings: [
            {
              type: "RELIQUAIRE",
              containerNumber: "abc123",
              quantity: 1,
              volume: 11,
              identificationCodes: ["abc", "def"],
              consistence: "SOLIDE"
            }
          ]
        },
        emitter: {
          company: {
            name: "emitter",
            siret: company.siret,
            contact: "jean valjean",
            phone: "123",
            mail: "emitter@test.fr",
            address: "rue jean jaures toulon"
          },
          emission: {
            detail: { weight: { value: 10, isEstimate: false }, quantity: 3 }
          }
        },
        transporter: {
          company: {
            siret: company.siret,
            name: "transporter",
            contact: "jean valjean",
            phone: "123",
            mail: "emitter@test.fr",
            address: "rue jean jaures toulon"
          }
        },
        destination: {
          company: {
            name: "dest",
            siret: destinationCompany.siret,
            mail: "erci@dest.fr",
            phone: "9999",
            contact: "eric",
            address: "rue jean jaures toulon"
          },
          cap: "cap number"
        }
      };

      const { mutate } = makeClient(user);
      const { data } = await mutate<Pick<Mutation, "createBspaoh">>(
        CREATE_BSPAOH,
        {
          variables: {
            input
          }
        }
      );

      // check input is sirenified
      expect(sirenifyBspaohInput as jest.Mock).toHaveBeenCalledTimes(1);

      const created = data.createBspaoh;
      expect(created.id).toMatch(/^PAOH-\d{8}-[A-Z0-9]{9}$/);
      expect(created.destination!.company!.siret).toBe(
        input.destination!.company!.siret
      );
      expect(created.destination!.company!.siret).toBe(
        input.destination!.company!.siret
      );
      expect(created.status).toBe("INITIAL");
      expect(created.isDraft).toBe(false);
      // check transporter is populated
      expect(created.transporter?.company?.siret).toEqual(company.siret);
    }
  );

  it("should allow bspaoh creation for CREMATION companies", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const destinationCompany = await crematoriumFactory();

    const input: BspaohInput = {
      waste: {
        type: "PAOH",
        adr: "plop",
        code: "18 01 02",
        packagings: [
          {
            type: "RELIQUAIRE",
            containerNumber: "abc123",
            quantity: 1,
            volume: 11,
            identificationCodes: ["abc", "def"],
            consistence: "SOLIDE"
          }
        ]
      },
      emitter: {
        company: {
          name: "emitter",
          siret: company.siret,
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        },
        emission: {
          detail: { weight: { value: 10, isEstimate: false }, quantity: 3 }
        }
      },
      transporter: {
        company: {
          siret: company.siret,
          name: "transporter",
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        }
      },
      destination: {
        company: {
          name: "dest",
          siret: destinationCompany.siret,
          mail: "erci@dest.fr",
          phone: "9999",
          contact: "eric",
          address: "rue jean jaures toulon"
        },
        cap: "cap number"
      }
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBspaoh">>(
      CREATE_BSPAOH,
      {
        variables: {
          input
        }
      }
    );

    // check input is sirenified
    expect(sirenifyBspaohInput as jest.Mock).toHaveBeenCalledTimes(1);

    const created = data.createBspaoh;
    expect(created.id).toMatch(/^PAOH-\d{8}-[A-Z0-9]{9}$/);
    expect(created.destination!.company!.siret).toBe(
      input.destination!.company!.siret
    );
    expect(created.destination!.company!.siret).toBe(
      input.destination!.company!.siret
    );
    expect(created.status).toBe("INITIAL");
    expect(created.isDraft).toBe(false);
    // check transporter is populated
    expect(created.transporter?.company?.siret).toEqual(company.siret);
  });

  it("should allow bspaoh creation for transporters", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destinationCompany = await crematoriumFactory();
    const emitterCompany = await companyFactory();

    const input: BspaohInput = {
      waste: {
        type: "PAOH",
        adr: "plop",
        code: "18 01 02",
        packagings: [
          {
            type: "RELIQUAIRE",
            containerNumber: "abc123",
            quantity: 1,
            volume: 11,
            identificationCodes: ["abc", "def"],
            consistence: "SOLIDE"
          }
        ]
      },
      emitter: {
        company: {
          name: "emitter",
          siret: emitterCompany.siret,
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        },
        emission: {
          detail: { weight: { value: 10, isEstimate: false }, quantity: 3 }
        }
      },
      transporter: {
        company: {
          siret: company.siret,
          name: "transporter",
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        }
      },
      destination: {
        company: {
          name: "dest",
          siret: destinationCompany.siret,
          mail: "erci@dest.fr",
          phone: "9999",
          contact: "eric",
          address: "rue jean jaures toulon"
        },
        cap: "cap number"
      }
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBspaoh">>(
      CREATE_BSPAOH,
      {
        variables: {
          input
        }
      }
    );

    const created = data.createBspaoh;
    expect(created.id).toMatch(/^PAOH-\d{8}-[A-Z0-9]{9}$/);
    expect(created.destination!.company!.siret).toBe(
      input.destination!.company!.siret
    );
    expect(created.destination!.company!.siret).toBe(
      input.destination!.company!.siret
    );
    expect(created.status).toBe("INITIAL");
    expect(created.isDraft).toBe(false);
  });

  it("should create a bspaoh and autocomplete transporter receipt", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER",
      { wasteProcessorTypes: { set: ["CREMATION"] } }
    );

    const transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    await transporterReceiptFactory({ company: transporterCompany });
    const input: BspaohInput = {
      waste: {
        type: "PAOH",
        adr: "plop",
        code: "18 01 02",
        packagings: [
          {
            type: "RELIQUAIRE",
            containerNumber: "abc123",
            quantity: 1,
            volume: 11,
            identificationCodes: ["abc", "def"],
            consistence: "SOLIDE"
          }
        ]
      },
      emitter: {
        company: {
          name: "emitter",
          siret: company.siret,
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        },
        emission: {
          detail: { weight: { value: 10, isEstimate: false }, quantity: 3 }
        }
      },
      transporter: {
        company: {
          siret: transporterCompany.siret,
          name: "transporter",
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        }
      },
      destination: {
        company: {
          name: "dest",
          siret: destinationCompany.siret,
          mail: "erci@dest.fr",
          phone: "9999",
          contact: "eric",
          address: "rue jean jaures toulon"
        },
        cap: "cap number"
      }
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBspaoh">>(
      CREATE_BSPAOH,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createBspaoh.transporter!.recepisse!.number).toEqual(
      "the number"
    );
    expect(data.createBspaoh.transporter!.recepisse!.department).toEqual("83");
    expect(data.createBspaoh.transporter!.recepisse!.validityLimit).toEqual(
      "2055-01-01T00:00:00.000Z"
    );
  });

  it("should forbid waste codes other than 18 01 02", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destinationCompany = await crematoriumFactory();

    const input: BspaohInput = {
      waste: {
        type: "PAOH",
        adr: "plop",
        code: "18 01 06*",
        packagings: [
          {
            type: "RELIQUAIRE",
            containerNumber: "abc123",
            quantity: 1,
            volume: 11,
            identificationCodes: ["abc", "def"],
            consistence: "SOLIDE"
          }
        ]
      },
      emitter: {
        company: {
          name: "emitter",
          siret: company.siret,
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        },
        emission: {
          detail: { weight: { value: 10, isEstimate: false }, quantity: 3 }
        }
      },
      transporter: {
        company: {
          siret: company.siret,
          name: "transporter",
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        }
      },
      destination: {
        company: {
          name: "dest",
          siret: destinationCompany.siret,
          mail: "erci@dest.fr",
          phone: "9999",
          contact: "eric",
          address: "rue jean jaures toulon"
        },
        cap: "cap number"
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBspaoh">>(
      CREATE_BSPAOH,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Invalid enum value. Expected '18 01 02', received '18 01 06*'",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should forbid liquid consitence for FOETUS bspaoh", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destinationCompany = await crematoriumFactory();

    const input: BspaohInput = {
      waste: {
        type: "FOETUS",
        adr: "plop",
        code: "18 01 02",
        packagings: [
          {
            type: "RELIQUAIRE",
            containerNumber: "abc123",
            quantity: 1,
            volume: 11,
            identificationCodes: ["abc", "def"],
            consistence: "LIQUIDE"
          }
        ]
      },
      emitter: {
        company: {
          name: "emitter",
          siret: company.siret,
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        },
        emission: {
          detail: { weight: { value: 10, isEstimate: false }, quantity: 3 }
        }
      },
      transporter: {
        company: {
          siret: company.siret,
          name: "transporter",
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        }
      },
      destination: {
        company: {
          name: "dest",
          siret: destinationCompany.siret,
          mail: "erci@dest.fr",
          phone: "9999",
          contact: "eric",
          address: "rue jean jaures toulon"
        },
        cap: "cap number"
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBspaoh">>(
      CREATE_BSPAOH,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "La consistance ne peut être liquide pour ce type de déchet",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should require transporter siret for creation", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destinationCompany = await crematoriumFactory();

    const input: BspaohInput = {
      waste: {
        type: "PAOH",
        adr: "plop",
        code: "18 01 02",
        packagings: [
          {
            type: "RELIQUAIRE",
            containerNumber: "abc123",
            quantity: 1,
            volume: 11,
            identificationCodes: ["abc", "def"],
            consistence: "SOLIDE"
          }
        ]
      },
      emitter: {
        company: {
          name: "emitter",
          siret: company.siret,
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        },
        emission: {
          detail: { weight: { value: 10, isEstimate: false }, quantity: 3 }
        }
      },

      destination: {
        company: {
          name: "dest",
          siret: destinationCompany.siret,
          mail: "erci@dest.fr",
          phone: "9999",
          contact: "eric",
          address: "rue jean jaures toulon"
        },
        cap: "cap number"
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBspaoh">>(
      CREATE_BSPAOH,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le SIRET du transporteur est obligatoire.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should forbid companies which don't have wasteprocessorType.CREMATION for destination company", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTEPROCESSOR"],
      wasteProcessorTypes: []
    });

    const input: BspaohInput = {
      waste: {
        type: "PAOH",
        adr: "plop",
        code: "18 01 02",
        packagings: [
          {
            type: "RELIQUAIRE",
            containerNumber: "abc123",
            quantity: 1,
            volume: 11,
            identificationCodes: ["abc", "def"],
            consistence: "SOLIDE"
          }
        ]
      },
      emitter: {
        company: {
          name: "emitter",
          siret: company.siret,
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        },
        emission: {
          detail: { weight: { value: 10, isEstimate: false }, quantity: 3 }
        }
      },
      transporter: {
        company: {
          siret: company.siret,
          name: "transporter",
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        }
      },
      destination: {
        company: {
          name: "dest",
          siret: destinationCompany.siret,
          mail: "erci@dest.fr",
          phone: "9999",
          contact: "eric",
          address: "rue jean jaures toulon"
        },
        cap: "cap number"
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBspaoh">>(
      CREATE_BSPAOH,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          `L'entreprise avec le SIRET "${destinationCompany.siret}" n'est pas inscrite sur ` +
          `Trackdéchets en tant que crématorium. Cette installation ne peut donc pas être visée sur le bordereau. ` +
          `Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should forbid destination companies not registered on our amazing application", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destinationSiret = siretify(1);

    const input: BspaohInput = {
      waste: {
        type: "PAOH",
        adr: "plop",
        code: "18 01 02",
        packagings: [
          {
            type: "RELIQUAIRE",
            containerNumber: "abc123",
            quantity: 1,
            volume: 11,
            identificationCodes: ["abc", "def"],
            consistence: "SOLIDE"
          }
        ]
      },
      emitter: {
        company: {
          name: "emitter",
          siret: company.siret,
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        },
        emission: {
          detail: { weight: { value: 10, isEstimate: false }, quantity: 3 }
        }
      },
      transporter: {
        company: {
          siret: company.siret,
          name: "transporter",
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        }
      },
      destination: {
        company: {
          name: "dest",
          siret: destinationSiret,
          mail: "erci@dest.fr",
          phone: "9999",
          contact: "eric",
          address: "rue jean jaures toulon"
        },
        cap: "cap number"
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBspaoh">>(
      CREATE_BSPAOH,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: `L'établissement avec le SIRET ${destinationSiret} n'est pas inscrit sur Trackdéchets`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should forbid incomplete packagings", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destinationCompany = await companyFactory({
      wasteProcessorTypes: { set: ["CREMATION"] }
    });

    const input: BspaohInput = {
      waste: {
        type: "PAOH",
        adr: "plop",
        code: "18 01 02",
        packagings: [
          {
            type: "RELIQUAIRE",
            containerNumber: "abc123",
            quantity: 1,
            volume: 11,
            identificationCodes: [],
            consistence: "SOLIDE"
          }
        ]
      },
      emitter: {
        company: {
          name: "emitter",
          siret: company.siret,
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        },
        emission: {
          detail: { weight: { value: 10, isEstimate: false }, quantity: 3 }
        }
      },
      transporter: {
        company: {
          siret: company.siret,
          name: "transporter",
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        }
      },
      destination: {
        company: {
          name: "dest",
          siret: destinationCompany.siret,
          mail: "erci@dest.fr",
          phone: "9999",
          contact: "eric",
          address: "rue jean jaures toulon"
        },
        cap: "cap number"
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBspaoh">>(
      CREATE_BSPAOH,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Au moins un code est requis",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
});
