import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { BsdaInput, Mutation } from "../../../../generated/graphql/types";
import {
  siretify,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import prisma from "../../../../prisma";

const CREATE_BSDA = `
mutation CreateDraftBsda($input: BsdaInput!) {
  createDraftBsda(input: $input) {
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
  }
}
`;
describe("Mutation.Bsda.createDraft", () => {
  afterEach(resetDatabase);

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
});
