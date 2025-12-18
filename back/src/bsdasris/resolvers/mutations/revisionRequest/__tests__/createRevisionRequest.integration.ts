import { resetDatabase } from "../../../../../../integration-tests/helper";
import type {
  Mutation,
  MutationCreateBsdasriRevisionRequestArgs
} from "@td/codegen-back";
import { userWithCompanyFactory } from "../../../../../__tests__/factories";
import makeClient from "../../../../../__tests__/testClient";
import { bsdasriFactory } from "../../../../__tests__/factories";
import { prisma } from "@td/prisma";
import {
  CANCELLABLE_BSDASRI_STATUSES,
  NON_CANCELLABLE_BSDASRI_STATUSES
} from "../createRevisionRequest";
import { BsdasriStatus } from "@td/prisma";

const CREATE_BSDASRI_REVISION_REQUEST = `
  mutation CreateBsdasriRevisionRequest($input: CreateBsdasriRevisionRequestInput!) {
    createBsdasriRevisionRequest(input: $input) {
      id
      bsdasri {
        id
      }
      content {
        waste { code }
        destination  {
          operation { code, mode }
        }
      }
      authoringCompany {
        siret
      }
      approvals {
        approverSiret
        status
      }
      status
    }
  }
`;

describe("Mutation.createBsdasriRevisionRequest", () => {
  afterEach(() => resetDatabase());

  it("should fail if bsdasri doesnt exist", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdasriId = "123";
    const { errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId,
          content: {},
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe(
      `Le bordereau avec l'identifiant "${bsdasriId}" n'existe pas.`
    );
  });

  it("should fail if revision is empty", async () => {
    const { company: destinationCompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: destinationCompany.siret,
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: {},
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe(
      "Impossible de créer une révision sans modifications."
    );
  });

  it("should fail if current user is neither emitter or recipient of the bsdasri", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: emitterCompany.siret }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: {},
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe(
      `Vous n'êtes pas autorisé à réviser ce bordereau`
    );
  });

  it("should create a revisionRequest and identifying current user as the requester", async () => {
    const { company: destinationCompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: destinationCompany.siret,
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: { waste: { code: "18 02 02*" } },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(data.createBsdasriRevisionRequest.bsdasri.id).toBe(bsdasri.id);
    expect(data.createBsdasriRevisionRequest.authoringCompany.siret).toBe(
      company.siret
    );
  });

  it("should create a revisionRequest and an approval targetting the company not requesting the revisionRequest", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: recipientCompany.siret,
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: { waste: { code: "18 02 02*" } },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(data.createBsdasriRevisionRequest.bsdasri.id).toBe(bsdasri.id);
    expect(data.createBsdasriRevisionRequest.approvals.length).toBe(1);
    expect(data.createBsdasriRevisionRequest.approvals[0].approverSiret).toBe(
      recipientCompany.siret
    );
    expect(data.createBsdasriRevisionRequest.approvals[0].status).toBe(
      "PENDING"
    );
  });

  it("should fail if unknown fields are provided", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: "",
          content: { waste: { name: "I cannot change the name" } },
          comment: "A comment",
          authoringCompanySiret: "a siret"
        }
      }
    });
    const error = errors[0];
    expect(error.extensions!.code).toContain("BAD_USER_INPUT");
    expect(error.message).toContain(
      'Field "name" is not defined by type "BsdasriRevisionRequestWasteInput".'
    );
  });

  it("should fail if fields validation fails", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: company.siret, status: "SENT" }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: { waste: { code: "Made up code" } },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe(
      "La valeur « Made up code » n'existe pas dans les options : '18 01 03*' | '18 02 02*'"
    );
  });

  it("should store flattened input in revision content - waste code", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: recipientCompany.siret,
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: { waste: { code: "18 02 02*" } },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(data.createBsdasriRevisionRequest.content).toMatchObject({
      waste: { code: "18 02 02*" }
    });
  });

  it("should store flattened input in revision content - weight", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: recipientCompany.siret,
        status: "PROCESSED"
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: { destination: { operation: { weight: 1234 } } },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    const revision = await prisma.bsdasriRevisionRequest.findUnique({
      where: {
        id: data.createBsdasriRevisionRequest.id
      }
    });

    expect(revision?.destinationReceptionWasteWeightValue).toEqual(1234);
  });

  it("should create an auto-approved revisionRequest all roles have the same siret", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: company.siret,

        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: { waste: { code: "18 02 02*" } },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(data.createBsdasriRevisionRequest.bsdasri.id).toBe(bsdasri.id);
    expect(data.createBsdasriRevisionRequest.approvals.length).toBe(0);
    expect(data.createBsdasriRevisionRequest.status).toBe("ACCEPTED");
  });

  it("should only create one approval if two approving roles have the same siret", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: recipientCompany.siret,

        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: { waste: { code: "18 02 02*" } },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(data.createBsdasriRevisionRequest.bsdasri.id).toBe(bsdasri.id);
    expect(data.createBsdasriRevisionRequest.approvals.length).toBe(1);
  });

  it("should fail if trying to cancel AND modify the bsdasri", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: recipientCompany.siret,

        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: { isCanceled: true, waste: { code: "18 02 02*" } },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe(
      `Impossible d'annuler et de modifier un bordereau.`
    );
  });

  it("should fail if the bsdasri is canceled", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: recipientCompany.siret,
        status: "CANCELED"
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: { waste: { code: "18 02 02*" } },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe(
      `Impossible de créer une révision sur ce bordereau, il a été annulé.`
    );
  });

  it.each(CANCELLABLE_BSDASRI_STATUSES)(
    "should succeed if status is cancellable",
    async (status: BsdasriStatus) => {
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");

      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanySiret: company.siret,
          destinationCompanySiret: recipientCompany.siret,

          status
        }
      });

      const { mutate } = makeClient(user);
      const { data, errors } = await mutate<
        Pick<Mutation, "createBsdasriRevisionRequest">,
        MutationCreateBsdasriRevisionRequestArgs
      >(CREATE_BSDASRI_REVISION_REQUEST, {
        variables: {
          input: {
            bsdasriId: bsdasri.id,
            content: { isCanceled: true },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      expect(data.createBsdasriRevisionRequest.bsdasri.id).toBe(bsdasri.id);
      expect(errors).toBeUndefined();
    }
  );

  it.each(NON_CANCELLABLE_BSDASRI_STATUSES)(
    "should fail if status is in non-cancellable list",
    async (status: BsdasriStatus) => {
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");

      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanySiret: company.siret,
          destinationCompanySiret: recipientCompany.siret,

          status
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createBsdasriRevisionRequest">,
        MutationCreateBsdasriRevisionRequestArgs
      >(CREATE_BSDASRI_REVISION_REQUEST, {
        variables: {
          input: {
            bsdasriId: bsdasri.id,
            content: { isCanceled: true },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      // Because the error messages vary depending on the status,
      // let's just check that there is an error and not focus on the msg
      expect(errors.length).toBeGreaterThan(0);
    }
  );

  it("should fail if operation mode and code are not compatible", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: recipientCompany.siret,
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: {
            destination: {
              operation: {
                code: "D10",
                mode: "VALORISATION_ENERGETIQUE"
              }
            }
          },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
    );
  });

  it("should fail if operation mode is missing", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: recipientCompany.siret,
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: {
            destination: {
              operation: {
                code: "D10"
              }
            }
          },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe("Vous devez préciser un mode de traitement");
  });

  it("should succeed if operation mode & code are compatible", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: recipientCompany.siret,
        status: "PROCESSED"
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: {
            destination: {
              operation: {
                code: "D10",
                mode: "ELIMINATION"
              }
            }
          },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors).toBeUndefined();
  });

  it("should fail if all fields are empty", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: company.siret, status: "SENT" }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: { waste: { code: "" } },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe("Le code déchet ne peut pas être vide");
  });

  it("should fail if the packaging is other with no description", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: company.siret, status: "SENT" }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: {
            destination: {
              reception: {
                packagings: [
                  { type: "AUTRE", quantity: 1, other: "", volume: 10 }
                ]
              }
            }
          },

          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe(
      "Vous devez saisir la description du conditionnement quand le type de conditionnement est 'Autre'"
    );
  });

  it("DASRI in AWAITING_GROUP should be able to be reviewed", async () => {
    // Given
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationCompanySiret: recipientCompany.siret,
        status: "AWAITING_GROUP"
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: {
            emitter: {
              pickupSite: {
                name: "pickup site name",
                address: "4 boulevard pasteur",
                city: "Nantes",
                postalCode: "44100",
                infos: "site infos"
              }
            },
            waste: {
              code: "18 01 03*"
            },
            destination: {
              operation: {
                code: "R1",
                mode: "VALORISATION_ENERGETIQUE",
                weight: 10
              },
              reception: {
                packagings: [{ type: "BOITE_CARTON", volume: 22, quantity: 3 }]
              }
            }
          },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.createBsdasriRevisionRequest.bsdasri.id).toBe(bsdasri.id);
  });
});

describe("Mutation.createBsdasriRevisionRequest grouping", () => {
  afterEach(() => resetDatabase());

  it("should fail on pickup site (grouping)", async () => {
    // pickup site is not revisable on grouping dasris
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdasri = await bsdasriFactory({
      opt: {
        status: "SENT",
        emitterCompanySiret: company.siret,
        type: "GROUPING",
        destinationCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: {
            emitter: { pickupSite: { address: "rue bidule" } }
          },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe(
      "Les champs suivants ne sont pas révisables : l'adresse du site d'enlèvement"
    );
  });

  it.each(NON_CANCELLABLE_BSDASRI_STATUSES)(
    "should fail if status is in non-cancellable list (grouping) %p",
    async (status: BsdasriStatus) => {
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");

      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanySiret: company.siret,
          destinationCompanySiret: recipientCompany.siret,
          type: "GROUPING",
          status
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createBsdasriRevisionRequest">,
        MutationCreateBsdasriRevisionRequestArgs
      >(CREATE_BSDASRI_REVISION_REQUEST, {
        variables: {
          input: {
            bsdasriId: bsdasri.id,
            content: { isCanceled: true },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      expect(errors.length).toBeGreaterThan(0);
    }
  );

  it.each(CANCELLABLE_BSDASRI_STATUSES)(
    "should succeed if status is cancellable (grouping) %p",
    async (status: BsdasriStatus) => {
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");

      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanySiret: company.siret,
          destinationCompanySiret: recipientCompany.siret,
          type: "GROUPING",

          status
        }
      });

      const { mutate } = makeClient(user);
      const { data, errors } = await mutate<
        Pick<Mutation, "createBsdasriRevisionRequest">,
        MutationCreateBsdasriRevisionRequestArgs
      >(CREATE_BSDASRI_REVISION_REQUEST, {
        variables: {
          input: {
            bsdasriId: bsdasri.id,
            content: { isCanceled: true },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      expect(data.createBsdasriRevisionRequest.bsdasri.id).toBe(bsdasri.id);
      expect(errors).toBeUndefined();
    }
  );
});

describe("Mutation.createBsdasriRevisionRequest synthesis", () => {
  afterEach(() => resetDatabase());

  it("should fail on pickup site (synthesis)", async () => {
    // pickup site is not revisable on synthesis dasris
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdasri = await bsdasriFactory({
      opt: {
        status: "SENT",
        emitterCompanySiret: company.siret,
        type: "SYNTHESIS",
        destinationCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: {
            emitter: { pickupSite: { address: "rue bidule" } }
          },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe(
      "Les champs suivants ne sont pas révisables : l'adresse du site d'enlèvement"
    );
  });

  it("should fail on waste code (synthesis)", async () => {
    // waste code is not revisable on synthesis dasris
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdasri = await bsdasriFactory({
      opt: {
        status: "PROCESSED",
        emitterCompanySiret: company.siret,
        type: "SYNTHESIS",
        destinationCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: {
            waste: { code: "18 02 02*" }
          },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe(
      "Les champs suivants ne sont pas révisables : le code déchet"
    );
  });

  it("should fail on packagings", async () => {
    // packagings are not revisable on synthesis dasris
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdasri = await bsdasriFactory({
      opt: {
        status: "PROCESSED",
        emitterCompanySiret: company.siret,
        type: "SYNTHESIS",
        destinationCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsdasriRevisionRequest">,
      MutationCreateBsdasriRevisionRequestArgs
    >(CREATE_BSDASRI_REVISION_REQUEST, {
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: {
            destination: {
              reception: {
                packagings: [
                  { type: "FUT", quantity: 1, other: "", volume: 10 }
                ]
              }
            }
          },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe(
      "Les champs suivants ne sont pas révisables : le conditionnement"
    );
  });

  it.each(NON_CANCELLABLE_BSDASRI_STATUSES)(
    "should fail if status is in non-cancellable list (synthesis) %p",
    async (status: BsdasriStatus) => {
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");

      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanySiret: company.siret,
          destinationCompanySiret: recipientCompany.siret,
          type: "SYNTHESIS",
          status
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createBsdasriRevisionRequest">,
        MutationCreateBsdasriRevisionRequestArgs
      >(CREATE_BSDASRI_REVISION_REQUEST, {
        variables: {
          input: {
            bsdasriId: bsdasri.id,
            content: { isCanceled: true },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      expect(errors.length).toBeGreaterThan(0);
    }
  );

  it.each(CANCELLABLE_BSDASRI_STATUSES)(
    "should succeed if status is cancellable (synthesis) %p",
    async (status: BsdasriStatus) => {
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");

      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanySiret: company.siret,
          destinationCompanySiret: recipientCompany.siret,
          type: "SYNTHESIS",

          status
        }
      });

      const { mutate } = makeClient(user);
      const { data, errors } = await mutate<
        Pick<Mutation, "createBsdasriRevisionRequest">,
        MutationCreateBsdasriRevisionRequestArgs
      >(CREATE_BSDASRI_REVISION_REQUEST, {
        variables: {
          input: {
            bsdasriId: bsdasri.id,
            content: { isCanceled: true },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      expect(data.createBsdasriRevisionRequest.bsdasri.id).toBe(bsdasri.id);
      expect(errors).toBeUndefined();
    }
  );

  describe("TRA-16750 - Code D9 becomes D9F", () => {
    it("should allow code D9 and cast it to D9F (tolerance)", async () => {
      // Given
      const { company: destinationCompany } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanySiret: company.siret,
          destinationCompanySiret: destinationCompany.siret,
          status: "PROCESSED",
          destinationOperationCode: "R1",
          destinationOperationMode: "VALORISATION_ENERGETIQUE"
        }
      });

      // When
      const { mutate } = makeClient(user);
      const { errors, data } = await mutate<
        Pick<Mutation, "createBsdasriRevisionRequest">,
        MutationCreateBsdasriRevisionRequestArgs
      >(CREATE_BSDASRI_REVISION_REQUEST, {
        variables: {
          input: {
            bsdasriId: bsdasri.id,
            content: {
              destination: { operation: { code: "D9", mode: "ELIMINATION" } }
            },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      // When
      expect(errors).toBeUndefined();
      expect(
        data.createBsdasriRevisionRequest.content.destination?.operation?.code
      ).toBe("D9F");
    });

    it("should allow code D9F", async () => {
      // Given
      const { company: destinationCompany } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanySiret: company.siret,
          destinationCompanySiret: destinationCompany.siret,
          status: "PROCESSED",
          destinationOperationCode: "R1",
          destinationOperationMode: "VALORISATION_ENERGETIQUE"
        }
      });

      // When
      const { mutate } = makeClient(user);
      const { data, errors } = await mutate<
        Pick<Mutation, "createBsdasriRevisionRequest">,
        MutationCreateBsdasriRevisionRequestArgs
      >(CREATE_BSDASRI_REVISION_REQUEST, {
        variables: {
          input: {
            bsdasriId: bsdasri.id,
            content: {
              destination: { operation: { code: "D9F", mode: "ELIMINATION" } }
            },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      // When
      expect(errors).toBeUndefined();
      expect(
        data.createBsdasriRevisionRequest.content.destination?.operation?.code
      ).toBe("D9F");
      expect(
        data.createBsdasriRevisionRequest.content.destination?.operation?.mode
      ).toBe("ELIMINATION");
    });

    it("if using code D9F, should NOT auto-set mode to ELIMINATION", async () => {
      // Given
      const { company: destinationCompany } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanySiret: company.siret,
          destinationCompanySiret: destinationCompany.siret,
          status: "PROCESSED",
          destinationOperationCode: "R1",
          destinationOperationMode: "VALORISATION_ENERGETIQUE"
        }
      });

      // When
      const { mutate } = makeClient(user);
      const { data, errors } = await mutate<
        Pick<Mutation, "createBsdasriRevisionRequest">,
        MutationCreateBsdasriRevisionRequestArgs
      >(CREATE_BSDASRI_REVISION_REQUEST, {
        variables: {
          input: {
            bsdasriId: bsdasri.id,
            content: {
              destination: { operation: { code: "D9F" } }
            },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      // When
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous devez préciser un mode de traitement"
      );
    });
  });
});
