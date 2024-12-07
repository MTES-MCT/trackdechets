import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  BsdaInput,
  Mutation,
  MutationCreateDraftBsdaArgs
} from "@td/codegen-back";
import {
  companyFactory,
  siretify,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "@td/prisma";
import { gql } from "graphql-tag";
import { bsdaFactory } from "../../../__tests__/factories";
import { getFirstTransporterSync } from "../../../database";

const CREATE_BSDA = gql`
  mutation CreateDraftBsda($input: BsdaInput!) {
    createDraftBsda(input: $input) {
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
    }
  }
`;
describe("Mutation.Bsda.createDraft", () => {
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
    const { errors } = await mutate<Pick<Mutation, "createDraftBsda">>(
      CREATE_BSDA,
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
    const { errors } = await mutate<Pick<Mutation, "createDraftBsda">>(
      CREATE_BSDA,
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
          "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it.each(["emitter", "transporter", "destination", "broker"])(
    "should allow %p to create a BSDA",
    async role => {
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "createDraftBsda">>(
        CREATE_BSDA,
        {
          variables: {
            input: {
              [role]: {
                company: {
                  siret: company.siret
                }
              }
            }
          }
        }
      );
      expect(errors).toBeUndefined();
    }
  );

  it("create a form with an emitter and a destination", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const input = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      destination: {
        company: {
          siret: destinationCompany.siret
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createDraftBsda">>(
      CREATE_BSDA,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createDraftBsda.destination!.company).toMatchObject(
      input.destination.company
    );
  });

  it("should cast workerIsDisabled to false when null is provided", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: workerCompany } = await userWithCompanyFactory("MEMBER");

    const input: BsdaInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      worker: {
        isDisabled: null,
        company: { siret: workerCompany.siret }
      }
    };
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "createDraftBsda">>(
      CREATE_BSDA,
      {
        variables: {
          input
        }
      }
    );
    expect(errors).toBeUndefined();
    const bsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: data.createDraftBsda.id }
    });
    expect(bsda.workerIsDisabled).toEqual(false);
  });

  it("should not be possible to set workerIsDisabled to true and to provide a worker siret", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: workerCompany } = await userWithCompanyFactory("MEMBER");

    const input: BsdaInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      worker: {
        isDisabled: true,
        company: { siret: workerCompany.siret }
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createDraftBsda">>(
      CREATE_BSDA,
      {
        variables: {
          input
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Il n'y a pas d'entreprise de travaux, impossible de saisir le SIRET ou le nom de l'entreprise de travaux."
      })
    ]);
  });

  it("should be possible to set workerIsDisabled to true when no worker siret is provided", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input: BsdaInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      worker: {
        isDisabled: true
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createDraftBsda">>(
      CREATE_BSDA,
      {
        variables: {
          input
        }
      }
    );
    expect(errors).toBeUndefined();
  });

  it("should be possible to create a bsda and connect existing bsdaTransporters", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporter1 = await prisma.bsdaTransporter.create({
      data: { number: 0 }
    });
    const transporter2 = await prisma.bsdaTransporter.create({
      data: { number: 0 }
    });

    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createDraftBsda">,
      MutationCreateDraftBsdaArgs
    >(CREATE_BSDA, {
      variables: {
        input: {
          emitter: {
            company: { siret: company.siret }
          },
          transporters: [transporter1.id, transporter2.id]
        }
      }
    });
    expect(errors).toBeUndefined();
    const bsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: data.createDraftBsda.id },
      include: { transporters: true }
    });
    expect(bsda.transporters.length).toEqual(2);
    expect(bsda.transporters.map(t => t.id)).toContain(transporter1.id);
    expect(bsda.transporters.map(t => t.id)).toContain(transporter2.id);
    const updatedTransporter1 = bsda.transporters.find(
      t => t.id === transporter1.id
    )!;
    expect(updatedTransporter1.number).toEqual(1);
    const updatedTransporter2 = bsda.transporters.find(
      t => t.id === transporter2.id
    )!;
    expect(updatedTransporter2.number).toEqual(2);
  });

  it("should be possible to create a bsda as a transporter with existing bsdaTransporters", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const { user: userTransporter, company: transporter } =
      await userWithCompanyFactory("MEMBER");
    const transporter1 = await prisma.bsdaTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter.siret
      }
    });

    const { mutate } = makeClient(userTransporter);
    const { data, errors } = await mutate<
      Pick<Mutation, "createDraftBsda">,
      MutationCreateDraftBsdaArgs
    >(CREATE_BSDA, {
      variables: {
        input: {
          emitter: {
            company: { siret: company.siret }
          },
          transporters: [transporter1.id]
        }
      }
    });
    expect(errors).toBeUndefined();
    const bsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: data.createDraftBsda.id },
      include: { transporters: true }
    });
    expect(bsda.transporters.length).toEqual(1);
    expect(bsda.transporters.map(t => t.id)).toContain(transporter1.id);
    const updatedTransporter1 = bsda.transporters.find(
      t => t.id === transporter1.id
    )!;
    expect(updatedTransporter1.number).toEqual(1);
  });

  it("should throw an error when trying to connect a non existant bsdaTransporter", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createDraftBsda">,
      MutationCreateDraftBsdaArgs
    >(CREATE_BSDA, {
      variables: {
        input: {
          emitter: {
            company: { siret: company.siret }
          },
          transporters: ["ID1", "ID2"]
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Aucun transporteur ne possède le ou les identifiants suivants : ID1, ID2"
      })
    ]);
  });

  it("should throw an error when trying to connect a transporter already associated to a BSDA", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const anotherBsda = await bsdaFactory({});

    const transporter1 = getFirstTransporterSync(anotherBsda)!;
    const transporter2 = await prisma.bsdaTransporter.create({
      data: { number: 0 }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createDraftBsda">,
      MutationCreateDraftBsdaArgs
    >(CREATE_BSDA, {
      variables: {
        input: {
          emitter: {
            company: { siret: company.siret }
          },
          transporters: [transporter1.id, transporter2.id]
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le transporteur BSDA ${transporter1.id} est déjà associé à un autre BSDA`
      })
    ]);
  });

  it("should not be possible to add more than 5 transporters", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const transporters = await Promise.all(
      [...Array(6).keys()].map(() =>
        prisma.bsdaTransporter.create({
          data: { number: 0 }
        })
      )
    );

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateDraftBsdaArgs
    >(CREATE_BSDA, {
      variables: {
        input: {
          emitter: {
            company: { siret: company.siret }
          },
          transporters: transporters.map(t => t.id)
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas ajouter plus de 5 transporteurs"
      })
    ]);
  });

  it("should not be possible to use `transporter` and `transporters` in the same input", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporter = await companyFactory();
    const bsdaTransporter = await prisma.bsdaTransporter.create({
      data: { number: 0 }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createDraftBsda">,
      MutationCreateDraftBsdaArgs
    >(CREATE_BSDA, {
      variables: {
        input: {
          emitter: {
            company: { siret: company.siret }
          },
          transporter: { company: { siret: transporter.siret } },
          transporters: [bsdaTransporter.id]
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas utiliser les champs `transporter` et `transporters` en même temps"
      })
    ]);
  });

  it("should create a draft bsda if destination is NOT verified, provided it's a WASTE_CENTER and bsda is COLLECTION_2710", async () => {
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
    const { data, errors } = await mutate<Pick<Mutation, "createDraftBsda">>(
      CREATE_BSDA,
      {
        variables: {
          input
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
    expect(data.createDraftBsda.status).toBe("INITIAL");
  });
});
