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
import {
  EmitterType,
  Status,
  WasteAcceptationStatus,
  CompanyType,
  WasteProcessorType
} from "@prisma/client";
import {
  CANCELLABLE_BSDD_STATUSES,
  NON_CANCELLABLE_BSDD_STATUSES
} from "../createFormRevisionRequest";
import { prisma } from "@td/prisma";
import {
  forbbidenProfilesForDangerousWaste,
  forbbidenProfilesForNonDangerousWaste
} from "./companyProfiles";

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
        orgId
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
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
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
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
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
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
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
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",

      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
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

  it.each(forbbidenProfilesForDangerousWaste)(
    "should fail to create a revisionRequest for non dangerous waste to dangerous waste if recipient has not relevant subprofiles (%o)",
    async opt => {
      // create a revision from  `10 05 09` to `10 05 10*`
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        opt
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      // non dangerous waste
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret,
          wasteDetailsCode: "10 05 09",
          wasteDetailsIsDangerous: false,
          wasteDetailsPop: false
        }
      });

      const { mutate } = makeClient(user);
      // make revision to mark the waste as dangerous
      const { errors } = await mutate<
        Pick<Mutation, "createFormRevisionRequest">,
        MutationCreateFormRevisionRequestArgs
      >(CREATE_FORM_REVISION_REQUEST, {
        variables: {
          input: {
            formId: bsdd.id,
            content: { wasteDetails: { code: "10 05 10*" } },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });
      expect(errors[0].message).toBe(
        "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
          " Il lui appartient de mettre à jour son profil."
      );
      expect(errors[0].extensions?.code).toBe("BAD_USER_INPUT");
    }
  );

  it.each(forbbidenProfilesForDangerousWaste)(
    "should fail to create a revisionRequest for dangerous waste if recipient has not relevant subprofiles (%o)",
    async opt => {
      // create a revision from  `20 01 27*` to `10 05 10*`
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        opt
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      // non dangerous waste
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret,
          wasteDetailsCode: "20 01 27*",
          wasteDetailsIsDangerous: false,
          wasteDetailsPop: false
        }
      });

      const { mutate } = makeClient(user);
      // make revision to mark the waste as dangerous
      const { errors } = await mutate<
        Pick<Mutation, "createFormRevisionRequest">,
        MutationCreateFormRevisionRequestArgs
      >(CREATE_FORM_REVISION_REQUEST, {
        variables: {
          input: {
            formId: bsdd.id,
            content: { wasteDetails: { code: "10 05 10*" } },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      expect(errors[0].message).toBe(
        "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
          " Il lui appartient de mettre à jour son profil."
      );
      expect(errors[0].extensions?.code).toBe("BAD_USER_INPUT");
    }
  );

  it.each(forbbidenProfilesForNonDangerousWaste)(
    "should fail to create a revisionRequest for dangerous watses to non dangerous waste if recipient has not relevant subprofiles (%o)",
    async opt => {
      // create a revision from `20 01 27*` to `20 03 01`
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        opt
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret,

          wasteDetailsCode: "20 01 27*",
          wasteDetailsIsDangerous: false,
          wasteDetailsPop: false
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

            content: { wasteDetails: { code: "20 03 01" } },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });
      expect(errors[0].message).toBe(
        "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
          " Il lui appartient de mettre à jour son profil."
      );
      expect(errors[0].extensions?.code).toBe("BAD_USER_INPUT");
    }
  );

  it.each(forbbidenProfilesForNonDangerousWaste)(
    "should fail to create a revisionRequest for non dangerous waste if recipient has not relevant subprofiles (%o)",
    async opt => {
      // create a revision from `16 02 16` to `20 03 01`
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        opt
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret,

          wasteDetailsCode: "16 02 16",
          wasteDetailsIsDangerous: false,
          wasteDetailsPop: false
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

            content: { wasteDetails: { code: "20 03 01" } },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });
      expect(errors[0].message).toBe(
        "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
          " Il lui appartient de mettre à jour son profil."
      );
      expect(errors[0].extensions?.code).toBe("BAD_USER_INPUT");
    }
  );

  it("should create a revisionRequest and identifying current user as the requester (eco-organisme)", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("ADMIN");
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );

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
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
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
            quantityRefused: 0,
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

  it(
    "should create a revisionRequest and identifying current user" +
      " as the requester (transporter when emitterType=APPENDIX_PRODUCER) ",
    async () => {
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        }
      );
      const { company: emitterCompany } = await userWithCompanyFactory("ADMIN");
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: emitterCompany.siret,
          recipientCompanySiret: recipientCompany.siret,
          transportersSirets: [company.siret!],
          wasteDetailsQuantity: 1,
          status: "SENT",
          takenOverAt: new Date(),
          transporters: {
            create: { number: 1, transporterCompanySiret: company.siret }
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
            content: { wasteDetails: { quantity: 10 } },
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
        { approverSiret: emitterCompany.siret, status: "PENDING" }
      ]);
    }
  );

  it(
    "should create a revisionRequest and identifying current user" +
      " as the requester (foreign transporter when emitterType=APPENDIX_PRODUCER) ",
    async () => {
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        }
      );
      const { company: emitterCompany } = await userWithCompanyFactory("ADMIN");
      const vatNumber = "IT13029381004";
      const { user, company: foreignTransporter } =
        await userWithCompanyFactory("ADMIN", {
          vatNumber,
          orgId: vatNumber,
          siret: null
        });
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: emitterCompany.siret,
          recipientCompanySiret: recipientCompany.siret,
          transportersSirets: [foreignTransporter.vatNumber!],
          wasteDetailsQuantity: 1,
          status: "SENT",
          takenOverAt: new Date(),
          transporters: {
            create: {
              number: 1,
              transporterCompanySiret: null,
              transporterCompanyVatNumber: foreignTransporter.vatNumber
            }
          }
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
            content: { wasteDetails: { quantity: 10 } },
            comment: "A comment",
            authoringCompanySiret: foreignTransporter.vatNumber!
          }
        }
      });

      expect(errors).toBeUndefined();

      expect(data.createFormRevisionRequest.form.id).toBe(bsdd.id);
      expect(data.createFormRevisionRequest.authoringCompany.orgId).toBe(
        foreignTransporter.vatNumber
      );
      // one approval is created
      expect(data.createFormRevisionRequest.approvals).toStrictEqual([
        { approverSiret: emitterCompany.siret, status: "PENDING" }
      ]);
    }
  );

  it("should create a revisionRequest and an approval targetting the company not requesting the revisionRequest", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
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
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
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
        "ADMIN",
        {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        }
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
        "ADMIN",
        {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        }
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

  it("should fail to cancel if the emitter type is APPENDIX1", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
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
          content: { isCanceled: true },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    // Because the error messages vary depending on the status,
    // let's just check that there is an error and not focus on the msg
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toBe(
      "Impossible d'annuler un bordereau de tournée dédiée."
    );
  });

  it("should fail if trying to use a forbidden waste code on EmitterType.APPENDIX1 bsdd", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
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

  it("should fail if quantityReceived is modified and the bsd hasn't been received yet", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
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
          content: { quantityReceived: 10 },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe(
      "Impossible de réviser la quantité reçue si le bordereau n'a pas encore été réceptionné."
    );
  });

  it("should work if quantityReceived is modified and the bsd has been received", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret,
        status: "RECEIVED",
        receivedAt: new Date()
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
          content: { quantityReceived: 10 },
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

  it("should fail if quantityReceived > 40 tons and transportMode = ROAD", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret,
        status: "RECEIVED",
        receivedAt: new Date(),
        transporters: {
          create: {
            transporterTransportMode: "ROAD",
            number: 1
          }
        }
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
          content: { quantityReceived: 41 },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe(
      "La quantité reçue ne peut dépasser 40 tonnes pour le transporter routier."
    );
  });

  it("should work if quantityReceived <= 40 tons and transportMode = ROAD", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret,
        status: "RECEIVED",
        receivedAt: new Date(),
        transporters: {
          create: {
            transporterTransportMode: "ROAD",
            number: 1
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
          content: { quantityReceived: 40 },
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

  it("should work if quantityReceived > 40 tons and transportMode != ROAD", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret,
        status: "RECEIVED",
        receivedAt: new Date(),
        transporters: {
          create: {
            transporterTransportMode: "AIR",
            number: 1
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
          content: { quantityReceived: 40 },
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

  it("should fail if operation code has corresponding modes but none is specified", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
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
          content: { processingOperationDone: "R 1" },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe("Vous devez préciser un mode de traitement");
  });

  it("should work if operation code has corresponding modes and one is specified", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
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
          content: {
            processingOperationDone: "R 1",
            destinationOperationMode: "VALORISATION_ENERGETIQUE"
          },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors).toBeUndefined();
  });

  it("should work if operation code has no corresponding mode", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
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
          content: { processingOperationDone: "D 13" },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors).toBeUndefined();
  });

  describe("wasteAcceptationStatus & quantityRefused", () => {
    it.each([Status.ACCEPTED, Status.TEMP_STORER_ACCEPTED])(
      "can review BSD wasteAcceptationStatus if status is %p",
      async status => {
        // Given
        const { company: recipientCompany } = await userWithCompanyFactory(
          "ADMIN",
          {
            companyTypes: [CompanyType.WASTEPROCESSOR],
            wasteProcessorTypes: [
              WasteProcessorType.DANGEROUS_WASTES_INCINERATION
            ]
          }
        );
        const { user, company } = await userWithCompanyFactory("ADMIN");
        const bsdd = await formFactory({
          ownerId: user.id,
          opt: {
            status,
            emitterCompanySiret: company.siret,
            recipientCompanySiret: recipientCompany.siret,
            wasteAcceptationStatus: Status.ACCEPTED,
            quantityReceived: 10,
            receivedAt: new Date()
          }
        });

        // When
        const { mutate } = makeClient(user);
        const { errors } = await mutate<
          Pick<Mutation, "createFormRevisionRequest">,
          MutationCreateFormRevisionRequestArgs
        >(CREATE_FORM_REVISION_REQUEST, {
          variables: {
            input: {
              formId: bsdd.id,
              content: {
                wasteAcceptationStatus: WasteAcceptationStatus.REFUSED,
                wasteRefusalReason: "Raison",
                quantityReceived: 0
              },
              comment: "A comment",
              authoringCompanySiret: company.siret!
            }
          }
        });

        // Then
        expect(errors).toBeUndefined();

        const revisionRequest =
          await prisma.bsddRevisionRequest.findFirstOrThrow({
            where: { bsddId: bsdd.id }
          });

        expect(revisionRequest.wasteAcceptationStatus).toEqual(
          WasteAcceptationStatus.REFUSED
        );
        expect(revisionRequest.wasteRefusalReason).toEqual("Raison");
        expect(revisionRequest.quantityReceived).toEqual(0);
        expect(revisionRequest.quantityRefused).toEqual(null);
      }
    );

    it("can NOT review BSD wasteAcceptationStatus if status is NOT ACCEPTED or TEMP_STORED_ACCEPTED", async () => {
      // Given
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        }
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.PROCESSED,
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret,
          wasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
          quantityReceived: 10
        }
      });

      // When
      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createFormRevisionRequest">,
        MutationCreateFormRevisionRequestArgs
      >(CREATE_FORM_REVISION_REQUEST, {
        variables: {
          input: {
            formId: bsdd.id,
            content: {
              wasteAcceptationStatus: WasteAcceptationStatus.REFUSED,
              wasteRefusalReason: "Raison",
              quantityReceived: 0
            },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Le statut d'acceptation des déchets n'est modifiable que si le bordereau est au stade de la réception."
      );
    });

    it.each([Status.ACCEPTED, Status.TEMP_STORER_ACCEPTED])(
      "can review BSD wasteAcceptationStatus if status is %p with quantityRefused",
      async status => {
        // Given
        const { company: recipientCompany } = await userWithCompanyFactory(
          "ADMIN",
          {
            companyTypes: [CompanyType.WASTEPROCESSOR],
            wasteProcessorTypes: [
              WasteProcessorType.DANGEROUS_WASTES_INCINERATION
            ]
          }
        );
        const { user, company } = await userWithCompanyFactory("ADMIN");
        const bsdd = await formFactory({
          ownerId: user.id,
          opt: {
            status,
            emitterCompanySiret: company.siret,
            recipientCompanySiret: recipientCompany.siret,
            wasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
            quantityReceived: 10,
            receivedAt: new Date()
          }
        });

        // When
        const { mutate } = makeClient(user);
        const { errors } = await mutate<
          Pick<Mutation, "createFormRevisionRequest">,
          MutationCreateFormRevisionRequestArgs
        >(CREATE_FORM_REVISION_REQUEST, {
          variables: {
            input: {
              formId: bsdd.id,
              content: {
                wasteAcceptationStatus:
                  WasteAcceptationStatus.PARTIALLY_REFUSED,
                wasteRefusalReason: "Raison",
                quantityReceived: 10,
                quantityRefused: 7
              },
              comment: "A comment",
              authoringCompanySiret: company.siret!
            }
          }
        });

        // Then
        expect(errors).toBeUndefined();

        const revisionRequest =
          await prisma.bsddRevisionRequest.findFirstOrThrow({
            where: { bsddId: bsdd.id }
          });

        expect(revisionRequest.wasteAcceptationStatus).toEqual(
          WasteAcceptationStatus.PARTIALLY_REFUSED
        );
        expect(revisionRequest.wasteRefusalReason).toEqual("Raison");
        expect(revisionRequest.quantityReceived).toEqual(10);
        expect(revisionRequest.quantityRefused).toEqual(7);
      }
    );

    it("can NOT review BSD wasteAcceptationStatus if not defined", async () => {
      // Given
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        }
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.ACCEPTED,
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret,
          receivedAt: new Date()
        }
      });

      // When
      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createFormRevisionRequest">,
        MutationCreateFormRevisionRequestArgs
      >(CREATE_FORM_REVISION_REQUEST, {
        variables: {
          input: {
            formId: bsdd.id,
            content: {
              wasteAcceptationStatus: WasteAcceptationStatus.REFUSED,
              wasteRefusalReason: "Raison",
              quantityReceived: 0
            },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Le statut d'acceptation des déchets n'est modifiable que s'il a déjà une valeur."
      );
    });

    it("cannot specify quantityRefused < quantityReceived if wasteAcceptationStatus = REFUSED", async () => {
      // Given
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        }
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.ACCEPTED,
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret,
          wasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
          quantityReceived: 10,
          receivedAt: new Date()
        }
      });

      // When
      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createFormRevisionRequest">,
        MutationCreateFormRevisionRequestArgs
      >(CREATE_FORM_REVISION_REQUEST, {
        variables: {
          input: {
            formId: bsdd.id,
            content: {
              wasteAcceptationStatus: WasteAcceptationStatus.REFUSED,
              wasteRefusalReason: "Raison",
              quantityReceived: 10,
              quantityRefused: 5
            },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "La quantité refusée (quantityRefused) doit être égale à la quantité reçue (quantityReceived) si le déchet est refusé (REFUSED)"
      );
    });

    it("cannot specify quantityRefused > 0 if wasteAcceptationStatus = ACCEPTED", async () => {
      // Given
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        }
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.ACCEPTED,
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret,
          wasteAcceptationStatus: WasteAcceptationStatus.REFUSED,
          wasteRefusalReason: "Reason",
          quantityReceived: 0,
          receivedAt: new Date()
        }
      });

      // When
      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createFormRevisionRequest">,
        MutationCreateFormRevisionRequestArgs
      >(CREATE_FORM_REVISION_REQUEST, {
        variables: {
          input: {
            formId: bsdd.id,
            content: {
              wasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
              quantityReceived: 10,
              quantityRefused: 1
            },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "La quantité refusée (quantityRefused) ne peut être supérieure à zéro si le déchet est accepté (ACCEPTED)"
      );
    });

    it("cannot specify quantityRefused = quantityReceived if wasteAcceptationStatus = PARTIALLY_ACCEPTED", async () => {
      // Given
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        }
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.ACCEPTED,
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret,
          wasteAcceptationStatus: WasteAcceptationStatus.REFUSED,
          wasteRefusalReason: "Reason",
          quantityReceived: 0,
          receivedAt: new Date()
        }
      });

      // When
      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createFormRevisionRequest">,
        MutationCreateFormRevisionRequestArgs
      >(CREATE_FORM_REVISION_REQUEST, {
        variables: {
          input: {
            formId: bsdd.id,
            content: {
              wasteAcceptationStatus: WasteAcceptationStatus.PARTIALLY_REFUSED,
              wasteRefusalReason: "Reason",
              quantityReceived: 10,
              quantityRefused: 10
            },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "La quantité refusée (quantityRefused) doit être inférieure à la quantité reçue (quantityReceived) et supérieure à zéro si le déchet est partiellement refusé (PARTIALLY_REFUSED)"
      );
    });

    it("bsdd waste is refused > should not be able to update quantityRefused to 0", async () => {
      // Given
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        }
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.ACCEPTED,
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret,
          wasteAcceptationStatus: WasteAcceptationStatus.REFUSED,
          wasteRefusalReason: "Reason",
          quantityReceived: 0,
          receivedAt: new Date()
        }
      });

      // When
      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createFormRevisionRequest">,
        MutationCreateFormRevisionRequestArgs
      >(CREATE_FORM_REVISION_REQUEST, {
        variables: {
          input: {
            formId: bsdd.id,
            content: {
              quantityReceived: 10,
              quantityRefused: 0
            },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "La quantité refusée (quantityRefused) doit être égale à la quantité reçue (quantityReceived) si le déchet est refusé (REFUSED)"
      );
    });

    it("bsdd waste is accepted > should not be able to update quantityRefused to > 0", async () => {
      // Given
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        }
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.ACCEPTED,
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret,
          wasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
          wasteRefusalReason: "Reason",
          quantityReceived: 0,
          receivedAt: new Date()
        }
      });

      // When
      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createFormRevisionRequest">,
        MutationCreateFormRevisionRequestArgs
      >(CREATE_FORM_REVISION_REQUEST, {
        variables: {
          input: {
            formId: bsdd.id,
            content: {
              quantityReceived: 10,
              quantityRefused: 10
            },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "La quantité refusée (quantityRefused) ne peut être supérieure à zéro si le déchet est accepté (ACCEPTED)"
      );
    });

    it("bsdd waste is partially refused > should not be able to update quantityRefused to >= quantityReceived", async () => {
      // Given
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        }
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.ACCEPTED,
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret,
          wasteAcceptationStatus: WasteAcceptationStatus.PARTIALLY_REFUSED,
          wasteRefusalReason: "Reason",
          quantityReceived: 0,
          receivedAt: new Date()
        }
      });

      // When
      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createFormRevisionRequest">,
        MutationCreateFormRevisionRequestArgs
      >(CREATE_FORM_REVISION_REQUEST, {
        variables: {
          input: {
            formId: bsdd.id,
            content: {
              quantityReceived: 10,
              quantityRefused: 10
            },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "La quantité refusée (quantityRefused) doit être inférieure à la quantité reçue (quantityReceived) et supérieure à zéro si le déchet est partiellement refusé (PARTIALLY_REFUSED)"
      );
    });

    it("one can update quantityRefused even if not undefined in original bsdd, without specifying the waste acceptation status", async () => {
      // Given
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        }
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.ACCEPTED,
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret,
          wasteAcceptationStatus: WasteAcceptationStatus.PARTIALLY_REFUSED,
          wasteRefusalReason: "Reason",
          quantityReceived: 0,
          receivedAt: new Date()
        }
      });

      // When
      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createFormRevisionRequest">,
        MutationCreateFormRevisionRequestArgs
      >(CREATE_FORM_REVISION_REQUEST, {
        variables: {
          input: {
            formId: bsdd.id,
            content: {
              quantityReceived: 10,
              quantityRefused: 5
            },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      // Then
      expect(errors).toBeUndefined();
    });

    it("cannot specify quantityReceived < quantityRefused", async () => {
      // Given
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        }
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.ACCEPTED,
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret,
          wasteAcceptationStatus: WasteAcceptationStatus.PARTIALLY_REFUSED,
          wasteRefusalReason: "Reason",
          quantityReceived: 15,
          quantityRefused: 13,
          receivedAt: new Date()
        }
      });

      // When
      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createFormRevisionRequest">,
        MutationCreateFormRevisionRequestArgs
      >(CREATE_FORM_REVISION_REQUEST, {
        variables: {
          input: {
            formId: bsdd.id,
            content: {
              quantityReceived: 10
            },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "La quantité refusée (quantityRefused) doit être inférieure à la quantité reçue (quantityReceived) et supérieure à zéro si le déchet est partiellement refusé (PARTIALLY_REFUSED)"
      );
    });

    it("should work for APPENDIX1_PRODUCER", async () => {
      const { company: recipientCompany } = await userWithCompanyFactory(
        "ADMIN",
        {
          companyTypes: [CompanyType.WASTEPROCESSOR],
          wasteProcessorTypes: [
            WasteProcessorType.DANGEROUS_WASTES_INCINERATION
          ]
        }
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");

      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: company.siret,
          recipientCompanySiret: recipientCompany.siret,
          wasteDetailsCode: "13 01 12*"
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
            content: { wasteDetails: { sampleNumber: "Num échantillon" } },
            comment: "A comment",
            authoringCompanySiret: company.siret!
          }
        }
      });

      expect(errors).toBeUndefined();
    });
  });

  it("should not allow to revise sample number on a non APPENDIX1_PRODUCER BSDD", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterType: EmitterType.OTHER,
        emitterCompanySiret: company.siret,
        recipientCompanySiret: recipientCompany.siret,
        wasteDetailsCode: "13 01 12*"
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
          content: { wasteDetails: { sampleNumber: "Num échantillon" } },
          comment: "A comment",
          authoringCompanySiret: company.siret!
        }
      }
    });

    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Révision impossible, certains champs saisis ne sont pas modifiables"
    );
  });
});
