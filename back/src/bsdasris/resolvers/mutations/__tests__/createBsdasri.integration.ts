import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  userFactory,
  userWithCompanyFactory,
  companyFactory,
  siretify,
  getDestinationCompanyInfo,
  transporterReceiptFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";
import { fullGroupingBsdasriFragment } from "../../../fragments";
import { gql } from "graphql-tag";
import { prisma } from "@td/prisma";
import { sirenify } from "../../../sirenify";

jest.mock("../../../sirenify");
(sirenify as jest.Mock).mockImplementation(input => Promise.resolve(input));

const CREATE_DASRI = gql`
  ${fullGroupingBsdasriFragment}
  mutation DasriCreate($input: BsdasriInput!) {
    createBsdasri(input: $input) {
      ...FullGroupingBsdasriFragment
    }
  }
`;

describe("Mutation.createDasri", () => {
  afterEach(async () => {
    await resetDatabase();
    (sirenify as jest.Mock).mockClear();
  });

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
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

  it("should disallow a user to create a dasri they are not part of", async () => {
    const user = await userFactory();

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input: {
            emitter: {
              company: {
                siret: siretify(6)
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

  it("denies dasri creation if data does not validate", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const input = {
      waste: {
        adr: "xyz 33" //missing waste code
      },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          //missing contact
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          extensions: expect.objectContaining({
            code: "BAD_USER_INPUT",
            issues: expect.arrayContaining([
              expect.objectContaining({
                code: "custom",
                message:
                  "La personne à contacter chez l'émetteur est un champ requis.",
                path: expect.arrayContaining(["emitter", "company", "contact"])
              }),
              expect.objectContaining({
                code: "custom",
                message: "Le code déchet est un champ requis.",
                path: expect.arrayContaining(["waste", "code"])
              })
            ])
          })
        })
      ])
    );
  });

  it("create a dasri with an emitter and a recipient", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          // email not required
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createBsdasri.isDraft).toEqual(false);
    expect(data.createBsdasri.status).toEqual("INITIAL");
    expect(data.createBsdasri.type).toEqual("SIMPLE");

    expect(data.createBsdasri.emitter!.company!.siret).toEqual(company.siret);
    const created = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: data.createBsdasri.id }
    });
    expect(created.synthesisEmitterSirets).toEqual([]);
    expect(created.groupingEmitterSirets).toEqual([]);
    expect(created.emitterCompanyName).toEqual(company.name);
    expect(created.emitterCompanyAddress).toEqual(company.address);
  });

  it("packagings needs a positive quantity", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          // email not required
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 0
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "La quantité doit être un nombre positif",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("packagings needs a positive volume", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          // email not required
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 0,
              quantity: 1
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le volume doit être un nombre positif",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("create a dasri with a default transport mode", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      transporter: {
        company: {
          address: "5, route du dasri",
          contact: "-",
          mail: "_@email.indisponible",
          name: "Transporteur de dasris",
          phone: "-",
          siret: company.siret
        },
        customInfo: null,
        transport: {
          acceptation: null,
          handedOverAt: null,
          mode: null,
          packagings: [],
          plates: [],
          takenOverAt: null,
          weight: {}
        }
      },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          // email not required
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createBsdasri.isDraft).toEqual(false);
    expect(data.createBsdasri.status).toEqual("INITIAL");
    expect(data.createBsdasri.type).toEqual("SIMPLE");

    expect(data.createBsdasri.emitter!.company!.siret).toEqual(company.siret);
  });

  it("should create a dasri and autocomplete transporter recepisse", async () => {
    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    await transporterReceiptFactory({
      number: "my recepisse",
      department: "31",
      company: transporter
    });
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      transporter: {
        company: {
          address: "5, route du dasri",
          contact: "-",
          mail: "_@email.indisponible",
          name: "Transporteur de dasris",
          phone: "-",
          siret: transporter.siret
        },
        customInfo: null,
        transport: {
          acceptation: null,
          handedOverAt: null,
          mode: null,
          packagings: [],
          plates: [],
          takenOverAt: null,
          weight: {}
        }
      },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          // email not required
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(data.createBsdasri.transporter!.recepisse!.number).toEqual(
      "my recepisse"
    );
    expect(data.createBsdasri.transporter!.recepisse!.department).toEqual("31");
    expect(data.createBsdasri.transporter!.recepisse!.validityLimit).toEqual(
      "2055-01-01T00:00:00.000Z"
    );
  });

  it("create a dasri and ignore recepisse input", async () => {
    // transporter has no recepisse
    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      transporter: {
        company: {
          address: "5, route du dasri",
          contact: "-",
          mail: "_@email.indisponible",
          name: "Transporteur de dasris",
          phone: "-",
          siret: transporter.siret
        },
        customInfo: null,
        recepisse: {
          department: "83",
          number: "N°99999",
          validityLimit: "2022-06-06T22:00:00"
        },
        transport: {
          acceptation: null,
          handedOverAt: null,
          mode: null,
          packagings: [],
          plates: [],
          takenOverAt: null,
          weight: {}
        }
      },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          // email not required
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    // recepissé input was ignored
    expect(data.createBsdasri.transporter!.recepisse).toEqual(null);
  });
});

describe("Mutation.createDasri validation scenarii", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("Emitter weight isEstimate is required when value is provided", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          name: "hopital blanc",
          mail: "emitter@test.fr",
          contact: "-",
          siret: company.siret,
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 15 }, // isEstimate not provided

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le type de pesée (réelle ou estimée) doit être précisé si vous renseignez un poids de déchets émis.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("Emitter weight value is required when isEstimate is provided", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          mail: "emitter@test.fr",
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        emission: {
          weight: { isEstimate: true }, // value not provided

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          extensions: expect.objectContaining({
            code: "BAD_USER_INPUT",
            issues: expect.arrayContaining([
              expect.objectContaining({
                code: "custom",
                message:
                  "Le poids de déchets émis en kg est obligatoire si vous renseignez le type de pesée.",
                path: expect.arrayContaining([
                  "emitter",
                  "emission",
                  "weight",
                  "isEstimate"
                ])
              })
            ])
          })
        })
      ])
    );
  });

  it("create a dasri without emission weight", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          mail: "emitter@test.fr",
          address: "avenue de la mer"
        },
        emission: {
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(data.createBsdasri.isDraft).toEqual(false);
    expect(data.createBsdasri.status).toEqual("INITIAL");

    expect(data.createBsdasri.emitter!.company!.siret).toEqual(company.siret);
  });

  it("Transport weight isEstimate is required when value is provided", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory();
    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          mail: "emitter@test.fr",
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        emission: {
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },

      transporter: {
        company: {
          mail: "trans@test.fr",
          name: "El transporter",
          siret: transporterCompany.siret,
          contact: "Jason Statham",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        transport: {
          weight: { value: 22 }, // isEstimate not provided
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le type de pesée (réelle ou estimée) doit être précisé si vous renseignez un poids de déchets transportés",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("Transport quantity is required when quantity type is provided", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory();
    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          mail: "emitter@test.fr",
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        emission: {
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },

      transporter: {
        company: {
          mail: "trans@test.fr",
          name: "El transporter",
          siret: transporterCompany.siret,
          contact: "Jason Statham",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        transport: {
          weight: { isEstimate: true }, // value not provided
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le poids de déchets transportés en kg est obligatoire si vous renseignez le type de pesée.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it("should allow containers numbers", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory();

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      identification: {
        numbers: ["GRV-XY12345", "GRV-VB45678"]
      },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",

          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },

      transporter: {
        company: {
          mail: "trans@test.fr",
          name: "El transporter",
          siret: transporterCompany.siret,
          contact: "Jason Statham",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        transport: {
          weight: { value: 22, isEstimate: false },
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(data.createBsdasri.identification!.numbers).toEqual([
      "GRV-XY12345",
      "GRV-VB45678"
    ]);
  });

  it("should allow up to 2 transporter plates", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory();

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",

          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },

      transporter: {
        company: {
          mail: "trans@test.fr",
          name: "El transporter",
          siret: transporterCompany.siret,
          contact: "Jason Statham",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        transport: {
          plates: ["AB-44-YU", "CF-43-TT"],
          weight: { value: 22, isEstimate: false },
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(data.createBsdasri.transporter!.transport!.plates!.length).toEqual(
      2
    );
  });

  it("should fail creating the form if more than 2 plates are submitted", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory();

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",

          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },

      transporter: {
        company: {
          mail: "trans@test.fr",
          name: "El transporter",
          siret: transporterCompany.siret,
          contact: "Jason Statham",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        transport: {
          plates: ["AB-44-YU", "CF-43-TT", "BG-32-UU"], // 3 plates, only 2 allowed
          weight: { value: 22, isEstimate: false },
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Un maximum de 2 plaques d'immatriculation est accepté",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should fail creating the form if plate numbers are invalid", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory();

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",

          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },

      transporter: {
        company: {
          mail: "trans@test.fr",
          name: "El transporter",
          siret: transporterCompany.siret,
          contact: "Jason Statham",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        transport: {
          plates: ["AB"], // invalid plate number
          weight: { value: 22, isEstimate: false },
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le numéro d'immatriculation doit faire entre 4 et 12 caractères",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("create a dasri without transport quantity and type", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory();
    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          mail: "emitter@test.fr",
          address: "avenue de la mer"
        },
        emission: {
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },

      transporter: {
        company: {
          mail: "trans@test.fr",
          name: "El transporter",
          siret: transporterCompany.siret,
          contact: "Jason Statham",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        transport: {
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createBsdasri.isDraft).toEqual(false);
    expect(data.createBsdasri.status).toEqual("INITIAL");

    expect(data.createBsdasri.emitter!.company!.siret).toEqual(company.siret);
  });

  it("should convert 18 01 02* to 18 02 02*", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input = {
      waste: { adr: "xyz 33", code: "18 01 02*" },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createBsdasri.waste!.code).toEqual("18 02 02*");
  });

  it("should allow decimal volume", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          // email not required
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 0.5,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createBsdasri.status).toEqual("INITIAL");
  });
});
