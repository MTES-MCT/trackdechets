import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationCreateFormRevisionRequestArgs
} from "../../../../generated/graphql/types";
import {
  formFactory,
  siretify,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import getReadableId from "../../../readableId";
import { EmitterType, Status } from "@prisma/client";
import {
  CANCELLABLE_BSDD_STATUSES,
  NON_CANCELLABLE_BSDD_STATUSES
} from "../createFormRevisionRequest";

const CREATE_FORM_REVISION_REQUEST = `
  mutation CreateFormRevisionRequest($input: CreateFormRevisionRequestInput!) {
    createFormRevisionRequest(input: $input) {
      id
      form {
        id
      }
      content {
        wasteDetails { code }
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

describe("Mutation.createFormRevisionRequest", () => {
  afterEach(() => resetDatabase());

  it("should fail if bsdd doesnt exist", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const formId = "123";
    const { errors } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId,
          content: {},
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe(
      `Le bordereau avec l'identifiant "${formId}" n'existe pas.`
    );
  });

  it("should fail if current user is neither emitter, eco-organisme or  recipient of the bsdd", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: emitterCompany.siret }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
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

  it("should fail if trying to cancel AND modify the bsdd", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
          content: { isCanceled: true, quantityReceived: 10 },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe(
      `Impossible d'annuler et de modifier un bordereau.`
    );
  });

  it("should fail if revision has no modifications", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
          content: { isCanceled: false },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe(
      `Impossible de créer une révision sans modifications.`
    );
  });

  it("should fail if the bsdd is canceled", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.CANCELED,
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
          content: { quantityReceived: 10 },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe(
      `Impossible de créer une révision sur ce bordereau, il a été annulé.`
    );
  });

  it("should create a revisionRequest and identifying current user as the requester (emitter)", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
          content: { wasteDetails: { code: "01 03 08" } },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(data.createFormRevisionRequest.form.id).toBe(bsdd.id);
    expect(data.createFormRevisionRequest.authoringCompany.siret).toBe(
      company.siret
    );
    // one approval is created
    expect(data.createFormRevisionRequest.approvals).toStrictEqual([
      { approverSiret: recipientCompany.siret, status: "PENDING" }
    ]);
  });
  it("should create a revisionRequest and identifying current user as the requester (eco-organisme)", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("ADMIN");
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");

    const { user, company: ecoOrganismeCompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        ecoOrganismeSiret: ecoOrganismeCompany.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
          content: { wasteDetails: { code: "01 03 08" } },
          comment: "A comment",
          authoringCompanySiret: ecoOrganismeCompany.siret!
        }
      }
    });

    expect(data.createFormRevisionRequest.form.id).toBe(bsdd.id);
    expect(data.createFormRevisionRequest.authoringCompany.siret).toBe(
      ecoOrganismeCompany.siret
    );

    expect(data.createFormRevisionRequest.approvals.length).toBe(1);
    expect(data.createFormRevisionRequest.approvals[0].approverSiret).toBe(
      recipientCompany.siret
    );
    expect(data.createFormRevisionRequest.approvals[0].status).toBe("PENDING");
    // one approval is created
    expect(data.createFormRevisionRequest.approvals).toStrictEqual([
      { approverSiret: recipientCompany.siret, status: "PENDING" }
    ]);
  });
  it("should create a revisionRequest and identifying current user as the requester (recipient) when an eco-organisme is on the bsdd", async () => {
    // when an eco-org is on the bsdd, revision requested by the recipient should trigger approvals creation for emitter and ecoorg
    const { company: emitterCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN"
    );

    const { company: ecoOrganismeCompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        ecoOrganismeSiret: ecoOrganismeCompany.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
          content: { wasteDetails: { code: "01 03 08" } },
          comment: "A comment",
          authoringCompanySiret: recipientCompany.siret!
        }
      }
    });

    expect(data.createFormRevisionRequest.form.id).toBe(bsdd.id);
    expect(data.createFormRevisionRequest.authoringCompany.siret).toBe(
      recipientCompany.siret
    );

    expect(data.createFormRevisionRequest.approvals.length).toBe(2);
    const approvalsSirets = data.createFormRevisionRequest.approvals.map(
      approval => approval.approverSiret
    );
    expect(approvalsSirets.includes(emitterCompany.siret!)).toBe(true);
    expect(approvalsSirets.includes(ecoOrganismeCompany.siret!)).toBe(true);
    expect(data.createFormRevisionRequest.approvals[0].status).toBe("PENDING");
    expect(data.createFormRevisionRequest.approvals[1].status).toBe("PENDING");
  });
  it("should create a revisionRequest and identifying current user as the requester (temporary storage) ", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: siretify(2),
        recipientCompanySiret: siretify(3),
        forwardedIn: {
          create: {
            readableId: getReadableId(),
            ownerId: user.id,
            quantityReceived: 2.4,
            wasteAcceptationStatus: "ACCEPTED",
            receivedAt: "2022-03-20T00:00:00.000Z",
            receivedBy: "John Doe",
            signedAt: "2022-03-20T00:00:00.000Z",
            recipientCompanyName: company.name,
            recipientCompanySiret: company.siret,
            recipientCap: "",
            recipientProcessingOperation: "R 6",
            transporters: {
              create: {
                transporterCompanyName: "Transporter",
                transporterCompanySiret: siretify(4),
                transporterIsExemptedOfReceipt: false,
                transporterReceipt: "Dabcd",
                transporterDepartment: "10",
                transporterValidityLimit: "2054-11-20T00:00:00.000Z",
                transporterNumberPlate: "",
                number: 1
              }
            }
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
          content: { wasteDetails: { code: "01 03 08" } },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(data.createFormRevisionRequest.form.id).toBe(bsdd.id);
    expect(data.createFormRevisionRequest.authoringCompany.siret).toBe(
      company.siret
    );
  });

  it("should create a revisionRequest and an approval targetting the company not requesting the revisionRequest", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
          content: { wasteDetails: { code: "01 03 08" } },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(data.createFormRevisionRequest.form.id).toBe(bsdd.id);
    expect(data.createFormRevisionRequest.approvals.length).toBe(1);
    expect(data.createFormRevisionRequest.approvals[0].approverSiret).toBe(
      recipientCompany.siret
    );
    expect(data.createFormRevisionRequest.approvals[0].status).toBe("PENDING");
  });

  it("should fail if unknown fields are provided", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient(user);
    const { errors } = await mutate(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: "",
          content: {
            wasteDetails: { onuCode: "I cannot change the onuCode" }
          },
          comment: "A comment",
          authoringCompanySiret: "a siret"
        }
      }
    });

    const error = errors[0];
    expect(error.extensions!.code).toContain("BAD_USER_INPUT");
    expect(error.message).toContain(
      'Field "onuCode" is not defined by type "FormRevisionRequestWasteDetailsInput".'
    );
  });

  it("should fail if fields validation fails", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
          content: { wasteDetails: { code: "Made up code" } },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors[0].message).toBe(
      "Le code déchet n'est pas reconnu comme faisant partie de la liste officielle du code de l'environnement."
    );
  });

  it("should store flattened input in revision content", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
          content: { wasteDetails: { code: "01 03 08" } },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(data.createFormRevisionRequest.content).toEqual({
      wasteDetails: { code: "01 03 08" }
    });
  });
  it("should fail if emitter is a foreign ship", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: null,
        emitterIsForeignShip: true,
        emitterCompanyOmiNumber: "OMI1234567"
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
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
  it("should fail if emitter is a private individual", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: null,
        emitterIsPrivateIndividual: true,
        emitterCompanyName: "Madame Déchets Dangeureux"
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
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

  it.each(CANCELLABLE_BSDD_STATUSES)(
    "should succeed if status is in cancellable list",
    async (status: Status) => {
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");

      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          status,
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret
        }
      });

      const { mutate } = makeClient(user);
      const { data, errors } = await mutate<
        Pick<Mutation, "createFormRevisionRequest">,
        MutationCreateFormRevisionRequestArgs
      >(CREATE_FORM_REVISION_REQUEST, {
        variables: {
          input: {
            formId: bsdd.id,
            content: { isCanceled: true },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      expect(data.createFormRevisionRequest.form.id).toBe(bsdd.id);
      expect(errors).toBeUndefined();
    }
  );

  it.each(NON_CANCELLABLE_BSDD_STATUSES)(
    "should fail if status is in non-cancellable list",
    async (status: Status) => {
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");

      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          status,
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createFormRevisionRequest">,
        MutationCreateFormRevisionRequestArgs
      >(CREATE_FORM_REVISION_REQUEST, {
        variables: {
          input: {
            formId: bsdd.id,
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

  it("should fail if trying to use a forbidden waste code on EmitterType.APPENDIX1 bsdd", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterType: EmitterType.APPENDIX1,
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: bsdd.id,
          content: { wasteDetails: { code: "06 01 01*" } },
          comment: "I want to use a forbidden waste code",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe(
      "Impossible d'utiliser ce code déchet sur un bordereau de tournée d'annexe 1."
    );
  });
});
