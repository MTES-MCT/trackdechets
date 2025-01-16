import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  companyFactory,
  formFactory,
  siretify,
  toIntermediaryCompany,
  userFactory,
  userWithCompanyFactory,
  transporterReceiptFactory,
  ecoOrganismeFactory,
  bsddTransporterData
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type {
  CreateFormInput,
  Mutation,
  MutationCreateFormArgs,
  ParcelNumber
} from "@td/codegen-back";
import {
  EmitterType,
  Status,
  UserRole,
  WasteAcceptationStatus,
  CompanyType,
  WasteProcessorType
} from "@prisma/client";
import getReadableId from "../../../readableId";
import { sirenifyFormInput } from "../../../sirenify";
import { updateAppendix2Queue } from "../../../../queue/producers/updateAppendix2";
import { waitForJobsCompletion } from "../../../../queue/helpers";

import {
  forbbidenProfilesForDangerousWaste,
  forbbidenProfilesForNonDangerousWaste
} from "./companyProfiles";

jest.mock("../../../sirenify");
(sirenifyFormInput as jest.Mock).mockImplementation(input =>
  Promise.resolve(input)
);

const CREATE_FORM = `
  mutation CreateForm($createFormInput: CreateFormInput!) {
    createForm(createFormInput: $createFormInput) {
      id
      recipient {
        company {
          siret
        }
        processingOperation
      }
      emitter {
        workSite {
          name
          address
          city
          postalCode
          infos
        }
      }
      ecoOrganisme {
        siret
      }
      temporaryStorageDetail {
        destination {
          company {
            siret
            name
          }
        }
      }
      transporter {
        company {
          siret
          name
          address
          contact
          mail
          phone
        }
        isExemptedOfReceipt
        receipt
        department
        validityLimit
        numberPlate
        customInfo
        mode
      }
      trader {
        company {
          siret
          name
          address
          contact
          mail
          phone
        }
        receipt
        department
        validityLimit
      }
      wasteDetails {
        packagingInfos {
          type
          other
          quantity
        }
        isDangerous
        onuCode
        nonRoadRegulationMention
        parcelNumbers {
          city
          postalCode
          prefix
          section
          number
          x
          y
        }
      }
      appendix2Forms {
        id
      }
      grouping {
        quantity
        form {
          id
        }
      }
      intermediaries {
        name
        siret
        contact
      }
    }
  }
`;

describe("Mutation.createForm", () => {
  afterEach(async () => {
    await resetDatabase();
    (sirenifyFormInput as jest.Mock).mockClear();
  });

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput: {} }
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
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: {
              siret: siretify(7)
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

  it.each(["emitter", "trader", "transporter"])(
    // recipient: see below
    "should allow %p to create a form",
    async role => {
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const { mutate } = makeClient(user);
      const { data } = await mutate<
        Pick<Mutation, "createForm">,
        MutationCreateFormArgs
      >(CREATE_FORM, {
        variables: {
          createFormInput: {
            [role]: {
              company: { siret: company.siret }
            }
          }
        }
      });
      expect(data.createForm.id).toBeTruthy();
      // check input is sirenified
      expect(sirenifyFormInput as jest.Mock).toHaveBeenCalledTimes(1);
    }
  );

  it("should allow recipient to create a form", async () => {
    // recipient needs appropriate profiles and subprofiles
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          recipient: {
            company: { siret: company.siret }
          }
        }
      }
    });

    expect(data.createForm.id).toBeTruthy();
    // check input is sirenified
    expect(sirenifyFormInput as jest.Mock).toHaveBeenCalledTimes(1);
  });

  it.each(forbbidenProfilesForDangerousWaste)(
    "should forbid recipient with inappropriate profile %o on a bsdd with dangerous waste code (*)",
    async opt => {
      // recipient needs appropriate profiles and subprofiles
      const { user, company } = await userWithCompanyFactory("MEMBER", opt);

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createForm">,
        MutationCreateFormArgs
      >(CREATE_FORM, {
        variables: {
          createFormInput: {
            wasteDetails: { code: "10 05 10*" },
            recipient: {
              company: { siret: company.siret }
            }
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
            " Il lui appartient de mettre à jour son profil.",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
    }
  );

  it.each(forbbidenProfilesForDangerousWaste)(
    "should forbid recipient with inappropriate profile %o on a bsdd with non dangerous waste code and wasteDetailsIsDangerous",
    async opt => {
      // recipient needs appropriate profiles and subprofiles
      const { user, company } = await userWithCompanyFactory("MEMBER", opt);

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createForm">,
        MutationCreateFormArgs
      >(CREATE_FORM, {
        variables: {
          createFormInput: {
            wasteDetails: { code: "10 05 09", isDangerous: true },
            recipient: {
              company: { siret: company.siret }
            }
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
            " Il lui appartient de mettre à jour son profil.",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
    }
  );

  it.each(forbbidenProfilesForDangerousWaste)(
    "should forbid recipient with inappropriate profile %o on a bsdd with non dangerous waste code and pop",
    async opt => {
      // recipient needs appropriate profiles and subprofiles
      const { user, company } = await userWithCompanyFactory("MEMBER", opt);

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createForm">,
        MutationCreateFormArgs
      >(CREATE_FORM, {
        variables: {
          createFormInput: {
            wasteDetails: { code: "10 05 09", pop: true },
            recipient: {
              company: { siret: company.siret }
            }
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
            " Il lui appartient de mettre à jour son profil.",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
    }
  );

  it.each(forbbidenProfilesForNonDangerousWaste)(
    "should forbid recipient with inappropriate profile %o on a non dangerous bsdd ",
    async opt => {
      // recipient needs appropriate profiles and subprofiles
      const { user, company } = await userWithCompanyFactory("MEMBER", opt);

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createForm">,
        MutationCreateFormArgs
      >(CREATE_FORM, {
        variables: {
          createFormInput: {
            wasteDetails: { code: "10 05 09" }, // non dnagerous
            recipient: {
              company: { siret: company.siret }
            }
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
            " Il lui appartient de mettre à jour son profil.",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
    }
  );

  test("broker should be registered to Trackdechets", async () => {
    const { user, company: emitter } = await userWithCompanyFactory("MEMBER");

    const brokerSiret = "88792840600032";

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: { siret: emitter.siret }
          },
          broker: { company: { siret: brokerSiret } }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Courtier : l'établissement avec le SIRET ${brokerSiret} n'est pas inscrit sur Trackdéchets`
      })
    ]);
  });

  test("broker should have BROKER profile", async () => {
    const { user, company: emitter } = await userWithCompanyFactory("MEMBER");
    const broker = await companyFactory({ companyTypes: [] });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: { siret: emitter.siret }
          },
          broker: { company: { siret: broker.siret } }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          `Le courtier saisi sur le bordereau (SIRET: ${broker.siret}) n'est pas inscrit sur Trackdéchets` +
          " en tant qu'établissement de courtage et ne peut donc pas être visé sur le bordereau." +
          " Veuillez vous rapprocher de l'administrateur de cet établissement pour qu'elle ou il" +
          " modifie le profil de l'établissement depuis l'interface Trackdéchets"
      })
    ]);
  });

  test("broker recepisse should be auto-completed from company table", async () => {
    const { user, company: emitter } = await userWithCompanyFactory("MEMBER");
    const trader = await companyFactory({
      companyTypes: ["BROKER"],
      brokerReceipt: {
        create: {
          receiptNumber: "AAA",
          department: "07",
          validityLimit: new Date("2026-01-01")
        }
      }
    });

    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: { siret: emitter.siret }
          },
          broker: {
            company: { siret: trader.siret },
            receipt: "BBB",
            department: "13",
            validityLimit: "2027-01-01" as any as Date
          }
        }
      }
    });

    expect(errors).toBeUndefined();

    const createdForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.createForm.id }
    });

    expect(createdForm.brokerReceipt).toEqual("AAA");
    expect(createdForm.brokerDepartment).toEqual("07");
    expect(createdForm.brokerValidityLimit).toEqual(new Date("2026-01-01"));
  });

  test("trader should be registered to Trackdechets", async () => {
    const { user, company: emitter } = await userWithCompanyFactory("MEMBER");

    const traderSiret = "88792840600032";

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: { siret: emitter.siret }
          },
          trader: { company: { siret: traderSiret } }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Négociant : l'établissement avec le SIRET ${traderSiret} n'est pas inscrit sur Trackdéchets`
      })
    ]);
  });

  test("trader should have TRADER profile", async () => {
    const { user, company: emitter } = await userWithCompanyFactory("MEMBER");
    const trader = await companyFactory({ companyTypes: [] });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: { siret: emitter.siret }
          },
          trader: { company: { siret: trader.siret } }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          `Le négociant saisi sur le bordereau (SIRET: ${trader.siret}) n'est pas inscrit sur Trackdéchets` +
          " en tant qu'établissement de négoce et ne peut donc pas être visé sur le bordereau." +
          " Veuillez vous rapprocher de l'administrateur de cet établissement pour qu'elle ou il" +
          " modifie le profil de l'établissement depuis l'interface Trackdéchets"
      })
    ]);
  });

  test("trader recepisse should be auto-completed from company table", async () => {
    const { user, company: emitter } = await userWithCompanyFactory("MEMBER");
    const trader = await companyFactory({
      companyTypes: ["TRADER"],
      traderReceipt: {
        create: {
          receiptNumber: "AAA",
          department: "07",
          validityLimit: new Date("2026-01-01")
        }
      }
    });

    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: { siret: emitter.siret }
          },
          trader: {
            company: { siret: trader.siret },
            receipt: "BBB",
            department: "13",
            validityLimit: "2027-01-01" as any as Date
          }
        }
      }
    });

    expect(errors).toBeUndefined();

    const createdForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.createForm.id }
    });

    expect(createdForm.traderReceipt).toEqual("AAA");
    expect(createdForm.traderDepartment).toEqual("07");
    expect(createdForm.traderValidityLimit).toEqual(new Date("2026-01-01"));
  });

  it("should allow a transporter listed in the transporters list to create a form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);

    const bsddTransporter = await prisma.bsddTransporter.create({
      data: {
        ...bsddTransporterData,
        number: 1,
        transporterCompanySiret: company.siret
      }
    });

    const { data, errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          transporters: [bsddTransporter.id]
        }
      }
    });
    expect(errors).toBeUndefined();
    expect(data.createForm.id).toBeTruthy();
    // check input is sirenified
    expect(sirenifyFormInput as jest.Mock).toHaveBeenCalledTimes(1);
  });

  it("should allow to create a form with a regular company as emitter", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: company2 } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: {
              siret: company2.siret
            }
          },
          transporter: {
            company: {
              siret: company.siret
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data).not.toBeUndefined();
  });

  it("should not allow to create a form with an eco-organisme as emitter", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const ecoOrganisme = await ecoOrganismeFactory({ siret: siretify() });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: {
              siret: ecoOrganisme.siret
            }
          },
          transporter: {
            company: {
              siret: company.siret
            }
          }
        }
      }
    });

    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toContain(
      "L'émetteur ne peut pas être un éco-organisme."
    );
  });

  it("should be possible to create a form and connect existing bsddTransporters", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporter1 = await prisma.bsddTransporter.create({
      data: { number: 0 }
    });
    const transporter2 = await prisma.bsddTransporter.create({
      data: { number: 0 }
    });

    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: { siret: company.siret }
          },
          transporters: [transporter1.id, transporter2.id]
        }
      }
    });
    expect(errors).toBeUndefined();
    const form = await prisma.form.findUniqueOrThrow({
      where: { id: data.createForm.id },
      include: { transporters: true }
    });
    expect(form.transporters.length).toEqual(2);
    expect(form.transporters.map(t => t.id)).toContain(transporter1.id);
    expect(form.transporters.map(t => t.id)).toContain(transporter2.id);
    const updatedTransporter1 = form.transporters.find(
      t => t.id === transporter1.id
    )!;
    expect(updatedTransporter1.number).toEqual(1);
    const updatedTransporter2 = form.transporters.find(
      t => t.id === transporter2.id
    )!;
    expect(updatedTransporter2.number).toEqual(2);
  });

  it("should throw an error when trying to connect a non existant bsddTransporter", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
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

  it("should not be possible to add more than 5 transporters", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const transporters = await Promise.all(
      [...Array(6).keys()].map(() =>
        prisma.bsddTransporter.create({
          data: { number: 0 }
        })
      )
    );

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
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

  it("should allow to create a form without space in recipientProcessingOperation", async () => {
    const { user, company: emitter } = await userWithCompanyFactory("MEMBER");
    const transporter = await companyFactory();

    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            type: "PRODUCER",
            company: {
              siret: emitter.siret
            }
          },
          recipient: {
            processingOperation: "R1",
            company: {
              siret: destination.siret
            }
          },
          transporter: {
            company: {
              siret: transporter.siret
            }
          }
        }
      }
    });
    expect(errors).toBeUndefined();
    expect(data.createForm.recipient!.processingOperation).toEqual("R1");
  });

  it("should allow an intermediary company to create a form", async () => {
    const intermediary = await userWithCompanyFactory(UserRole.MEMBER, {
      companyTypes: {
        set: ["TRANSPORTER"]
      }
    });
    const { searchCompany } = require("../../../../companies/search");
    jest.mock("../../../../companies/search");
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      siret: intermediary.company.siret,
      name: intermediary.company.name,
      statutDiffusionEtablissement: "O",
      address: intermediary.company.address
    });
    const intermediaryCreation = toIntermediaryCompany(intermediary.company);
    const { mutate } = makeClient(intermediary.user);
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: {
        createFormInput: {
          intermediaries: [intermediaryCreation]
        }
      }
    });

    expect(data.createForm.intermediaries).toEqual([
      expect.objectContaining({
        name: intermediary.company.name,
        siret: intermediary.company.siret,
        contact: intermediaryCreation.contact
      })
    ]);
  });

  it("should allow a destination after temp storage to create a form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          recipient: { isTempStorage: true },
          temporaryStorageDetail: {
            destination: { company: { siret: company.siret } }
          }
        }
      }
    });
    expect(data.createForm.id).toBeTruthy();
  });

  it("should not allow to create a form with a foreign intermediary", async () => {
    const intermediary = await userWithCompanyFactory(UserRole.MEMBER, {
      companyTypes: {
        set: ["TRANSPORTER"]
      },
      vatNumber: "BE0541696005"
    });
    const { mutate } = makeClient(intermediary.user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: {
        createFormInput: {
          intermediaries: [
            {
              vatNumber: "BE0541696005",
              name: "Belgian Co",
              contact: "Benoit",
              address: "Quelque part en Belgique"
            }
          ]
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Intermédiaires : le N° SIRET est obligatoire\n" +
          "Intermédiaires : seul les numéros de TVA en France sont valides",
        extensions: {
          code: "BAD_USER_INPUT"
        }
      })
    ]);
  });

  it("should not allow to create a form with an intermediary with only a FR VAT number but no SIRET", async () => {
    const intermediary = await userWithCompanyFactory(UserRole.MEMBER, {
      companyTypes: {
        set: ["TRANSPORTER"]
      },
      vatNumber: "FR87850019464"
    });
    const { mutate } = makeClient(intermediary.user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: {
        createFormInput: {
          intermediaries: [
            {
              vatNumber: "FR87850019464",
              name: "Belgian Co",
              contact: "Benoit",
              address: "Quelque part en Belgique"
            }
          ]
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Intermédiaires : le N° SIRET est obligatoire",
        extensions: {
          code: "BAD_USER_INPUT"
        }
      })
    ]);
  });

  it("should allow an eco-organisme to create a form", async () => {
    const { user, company: eo } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["ECO_ORGANISME"]
      }
    });
    await prisma.ecoOrganisme.create({
      data: {
        address: "",
        siret: eo.siret!,
        name: eo.name
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: {
        createFormInput: {
          ecoOrganisme: {
            name: eo.name,
            siret: eo.siret
          }
        }
      }
    });

    expect(data.createForm.ecoOrganisme!.siret).toBe(eo.siret);
  });

  it("should return an error when trying to create a form with a non-existing eco-organisme", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      ecoOrganisme: {
        name: "",
        siret: siretify(6)
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: {
        createFormInput
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `L'éco-organisme avec le siret "${createFormInput.ecoOrganisme.siret}" n'est pas reconnu.`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should create a form with a pickup site", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const createFormInput = {
      emitter: {
        workSite: {
          name: "The name",
          address: "The address",
          city: "The city",
          postalCode: "The postalCode",
          infos: "The infos"
        },
        company: {
          siret: company.siret,
          name: company.name
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });

    expect(data.createForm.emitter!.workSite).toMatchObject(
      createFormInput.emitter.workSite
    );
  });

  it("should create a form with a temporary storage", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const temporaryStorerCompany = await companyFactory();

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret,
          name: company.name
        }
      },
      recipient: {
        isTempStorage: true
      },
      temporaryStorageDetail: {
        destination: {
          company: {
            siret: temporaryStorerCompany.siret,
            name: temporaryStorerCompany.name
          }
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });

    expect(data.createForm.temporaryStorageDetail!.destination).toMatchObject(
      createFormInput.temporaryStorageDetail.destination
    );
  });

  it("should create a form with an empty temporary storage detail", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: {
              siret: company.siret,
              name: company.name
            }
          },
          recipient: { isTempStorage: true }
        }
      }
    });

    expect(data.createForm.temporaryStorageDetail).toBeTruthy();
  });

  it("should create a form with parcel numbers", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const parcelNumbers: ParcelNumber[] = [
      {
        city: "Paris",
        postalCode: "75001",
        x: 50.45612,
        y: 168.12546
      },
      {
        city: "Paris",
        postalCode: "75001",
        number: "0039",
        prefix: "000",
        section: "OS"
      }
    ];

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      wasteDetails: {
        parcelNumbers
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });

    expect(data.createForm.wasteDetails!.parcelNumbers![0]).toMatchObject(
      parcelNumbers[0]
    );
    expect(data.createForm.wasteDetails!.parcelNumbers![1]).toMatchObject(
      parcelNumbers[1]
    );
  });

  it("should return an error when creating a form with a temporary storage detail but no temp storage flag", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: {
              siret: company.siret,
              name: company.name
            }
          },
          temporaryStorageDetail: {}
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le champ recipient.isTempStorage doit être "true" lorsqu'un entreprosage provisoire est précisé.`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("create a form with a recipient", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: recipientCompany } = await userWithCompanyFactory(
      "MEMBER",
      {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    );

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      recipient: {
        company: {
          siret: recipientCompany.siret
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: {
        createFormInput
      }
    });

    expect(data.createForm.recipient!.company).toMatchObject(
      createFormInput.recipient.company
    );
  });

  it("should fail creating a form with a recipient if the recipient is not registered", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const siret = siretify(9); // an unregistered siret
    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      recipient: {
        company: {
          siret // an unregistered siret
        }
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: {
        createFormInput
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Destinataire : l'établissement avec le SIRET ${siret} n'est pas inscrit sur Trackdéchets`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should fail creating a form with a transporter if the transporter is not registered", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const siret = siretify(9); // an unregistered siret

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      transporter: {
        company: {
          siret
        }
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: {
        createFormInput
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Transporteur : l'établissement avec le SIRET ${siret} n'est pas inscrit sur Trackdéchets`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it.each([
    "abc",
    // Code of a category, not a waste
    "01",
    // Code of a sub-category, not a waste
    "01 01"
  ])(
    "should return an error when creating a form with the invalid waste code %p",
    async wasteCode => {
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "createForm">>(
        CREATE_FORM,
        {
          variables: {
            createFormInput: {
              emitter: {
                company: {
                  siret: company.siret
                }
              },
              wasteDetails: {
                code: wasteCode
              }
            }
          }
        }
      );

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le code déchet n'est pas reconnu comme faisant partie de la liste officielle du code de l'environnement.",
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ]);
    }
  );

  it("should create a form with a transporter", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      transporter: {
        company: {
          siret: transporterCompany.siret,
          name: transporterCompany.name,
          address: transporterCompany.address,
          contact: "Jane Doe",
          mail: "janedoe@transporter.com",
          phone: "06"
        },
        isExemptedOfReceipt: false,
        numberPlate: "AX-123-69",
        customInfo: "T-456"
      }
    };
    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<Pick<Mutation, "createForm">>(
      CREATE_FORM,
      {
        variables: {
          createFormInput
        }
      }
    );

    expect(errors).toEqual(undefined);
    expect(data.createForm.transporter).toMatchObject(
      createFormInput.transporter
    );
  });

  it("should create autocomplete transporter recepisse", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    await transporterReceiptFactory({
      company: transporterCompany
    });
    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      transporter: {
        company: {
          siret: transporterCompany.siret,
          name: transporterCompany.name,
          address: transporterCompany.address,
          contact: "Jane Doe",
          mail: "janedoe@transporter.com",
          phone: "06"
        },
        isExemptedOfReceipt: false,

        numberPlate: "AX-123-69",
        customInfo: "T-456"
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: {
        createFormInput
      }
    });

    // receipt data is pulled from db
    expect(data.createForm.transporter!.receipt).toEqual("the number");
    expect(data.createForm.transporter!.department).toEqual("83");
    expect(data.createForm.transporter!.validityLimit).toEqual(
      "2055-01-01T00:00:00.000Z"
    );
  });

  it("should create autocomplete transporter recepisse and ignore input", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });

    await transporterReceiptFactory({
      company: transporterCompany
    });
    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      transporter: {
        company: {
          siret: transporterCompany.siret,
          name: transporterCompany.name,
          address: transporterCompany.address,
          contact: "Jane Doe",
          mail: "janedoe@transporter.com",
          phone: "06"
        },
        isExemptedOfReceipt: false,
        numberPlate: "AX-123-69",
        customInfo: "T-456"
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: {
        createFormInput
      }
    });
    // receipt data is pulled from db, input is ignored
    expect(data.createForm.transporter!.receipt).toEqual("the number");
    expect(data.createForm.transporter!.department).toEqual("83");
    expect(data.createForm.transporter!.validityLimit).toEqual(
      "2055-01-01T00:00:00.000Z"
    );
  });

  it("should create a form from deprecated packagings fields", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      wasteDetails: {
        packagings: ["FUT", "AUTRE"],
        otherPackaging: "Contenant",
        numberOfPackages: 2
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });

    const expectedPackagingInfos = [
      { type: "FUT", other: null, quantity: 1 },
      { type: "AUTRE", other: "Contenant", quantity: 1 }
    ];
    expect(data.createForm.wasteDetails!.packagingInfos).toMatchObject(
      expectedPackagingInfos
    );
  });

  it(`should disallow a form with more than two "citernes"`, async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      wasteDetails: {
        packagingInfos: [{ type: "CITERNE", quantity: 3 }]
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le nombre de benne ou de citerne ne peut être supérieur à 2.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should erase transporter infos in a form with PIPELINE packaging", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      wasteDetails: {
        packagingInfos: [{ type: "PIPELINE", quantity: 1 }]
      },
      transporter: {
        company: { siret: siretify(1) }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });

    expect(data.createForm.transporter).toMatchObject({
      company: null,
      mode: "OTHER"
    });
  });

  it("should force transporter mode to OTHER with PIPELINE packaging", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      wasteDetails: {
        packagingInfos: [{ type: "PIPELINE", quantity: 1 }]
      },
      transporter: {
        mode: "ROAD"
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });
    expect(data.createForm).toMatchObject({
      transporter: {
        mode: "OTHER"
      },
      wasteDetails: {
        packagingInfos: [
          {
            type: "PIPELINE",
            quantity: 1,
            other: null
          }
        ]
      }
    });
  });

  it("should error if any other packaging type is sent with the PIPELINE type", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      wasteDetails: {
        packagingInfos: [
          { type: "PIPELINE", quantity: 1 },
          { type: "CITERNE", quantity: 1 }
        ]
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "wasteDetailsPackagingInfos ne peut pas à la fois contenir 1 citerne, 1 pipeline ou 1 benne et un autre conditionnement.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it(`should disallow a form with more than two "bennes"`, async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      wasteDetails: {
        packagingInfos: [{ type: "BENNE", quantity: 3 }]
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le nombre de benne ou de citerne ne peut être supérieur à 2.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should allow creating a form with an appendix 2 (using CreateFormInput.appendix2Forms)", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("ADMIN");

    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "AWAITING_GROUP",
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const createFormInput = {
      emitter: {
        type: EmitterType.APPENDIX2,
        company: {
          siret: ttr.siret
        }
      },
      appendix2Forms: [{ id: appendix2.id }]
    };
    const { mutate } = makeClient(user);
    const mutateFn = () =>
      mutate<Pick<Mutation, "createForm">, MutationCreateFormArgs>(
        CREATE_FORM,
        {
          variables: { createFormInput }
        }
      );

    const { data, errors } = await waitForJobsCompletion({
      fn: mutateFn,
      queue: updateAppendix2Queue,
      expectedJobCount: 1
    });

    expect(errors).toEqual(undefined);
    expect(data.createForm.appendix2Forms![0].id).toBe(appendix2.id);

    const updatedAppendix2 = await prisma.form.findUniqueOrThrow({
      where: { id: appendix2.id }
    });

    expect(updatedAppendix2.quantityGrouped).toEqual(
      updatedAppendix2.quantityReceived?.toNumber()
    );
  });

  it("should allow creating a form with an appendix 2 (using CreateFormInput.grouping)", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("ADMIN");

    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "AWAITING_GROUP",
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const createFormInput = {
      emitter: {
        type: EmitterType.APPENDIX2,
        company: {
          siret: ttr.siret
        }
      },
      grouping: [{ form: { id: appendix2.id }, quantity: 0.5 }]
    };
    const { mutate } = makeClient(user);
    const mutateFn = () =>
      mutate<Pick<Mutation, "createForm">, MutationCreateFormArgs>(
        CREATE_FORM,
        {
          variables: { createFormInput }
        }
      );

    const { data, errors } = await waitForJobsCompletion({
      fn: mutateFn,
      queue: updateAppendix2Queue,
      expectedJobCount: 1
    });

    expect(errors).toEqual(undefined);
    expect(data.createForm.grouping).toEqual([
      { form: { id: appendix2.id }, quantity: 0.5 }
    ]);

    const updatedAppendix2 = await prisma.form.findUniqueOrThrow({
      where: { id: appendix2.id }
    });

    expect(updatedAppendix2.quantityGrouped).toEqual(0.5);
  });

  it("should allow consuming a BSDD in several appendix2", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("ADMIN");

    const initialForm = await formFactory({
      ownerId: user.id,
      opt: {
        status: "AWAITING_GROUP",
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const createFormInput = {
      emitter: {
        type: EmitterType.APPENDIX2,
        company: {
          siret: ttr.siret
        }
      },
      grouping: [{ form: { id: initialForm.id }, quantity: 0.5 }]
    };
    const { mutate } = makeClient(user);
    const {
      data: { createForm: groupementForm1 }
    } = await mutate<Pick<Mutation, "createForm">, MutationCreateFormArgs>(
      CREATE_FORM,
      {
        variables: { createFormInput }
      }
    );

    expect(groupementForm1.grouping).toEqual([
      { form: { id: initialForm.id }, quantity: 0.5 }
    ]);

    const {
      data: { createForm: groupementForm2 }
    } = await mutate<Pick<Mutation, "createForm">, MutationCreateFormArgs>(
      CREATE_FORM,
      {
        variables: { createFormInput }
      }
    );

    expect(groupementForm2.grouping).toEqual([
      { form: { id: initialForm.id }, quantity: 0.5 }
    ]);
  });

  it("should fail when adding the same form twice to the same groupement form", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("ADMIN");

    const initialForm = await formFactory({
      ownerId: user.id,
      opt: {
        status: "AWAITING_GROUP",
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const createFormInput = {
      emitter: {
        type: EmitterType.APPENDIX2,
        company: {
          siret: ttr.siret
        }
      },
      grouping: [
        { form: { id: initialForm.id }, quantity: 0.5 },
        { form: { id: initialForm.id }, quantity: 0.5 }
      ]
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: { createFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          `Impossible d'associer plusieurs fractions du même bordereau initial sur un même bordereau` +
          ` de regroupement. Identifiant du ou des bordereaux initiaux concernés : ${initialForm.id}`
      })
    ]);
  });

  it(
    "should disallow creating a form with an appendix 2 if the appendix2" +
      " form is already part of another appendix (using CreateFormInput.appendix2Forms)",
    async () => {
      const { user, company: ttr } = await userWithCompanyFactory("ADMIN");

      const appendix2 = await formFactory({
        ownerId: user.id,
        opt: {
          status: "AWAITING_GROUP",
          recipientCompanySiret: ttr.siret,
          quantityReceived: 1
        }
      });
      await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          recipientCompanyName: ttr.name,
          recipientCompanySiret: ttr.siret,
          grouping: {
            create: {
              initialFormId: appendix2.id,
              quantity: appendix2.quantityReceived!.toNumber()
            }
          }
        }
      });

      const createFormInput = {
        emitter: {
          type: EmitterType.APPENDIX2,
          company: {
            siret: ttr.siret
          }
        },
        appendix2Forms: [{ id: appendix2.id }]
      };
      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "createForm">>(
        CREATE_FORM,
        {
          variables: { createFormInput }
        }
      );

      expect(errors).toEqual([
        expect.objectContaining({
          message: `Le bordereau ${appendix2.readableId} a déjà été regroupé en totalité`,
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ]);
    }
  );

  it(
    "should allow creating a form with an appendix 2 when the appendix2 quantity" +
      "is equal to the forwarded received quantity and higher thant the initial form received quantity",
    async () => {
      const { user, company: ttr } = await userWithCompanyFactory("ADMIN");

      const appendix2 = await formFactory({
        ownerId: user.id,
        opt: {
          status: "AWAITING_GROUP",
          recipientCompanySiret: ttr.siret,
          quantityReceived: 1,
          forwardedIn: {
            create: {
              readableId: getReadableId(),
              ownerId: user.id,
              quantityReceived: 2,
              recipientCompanySiret: ttr.siret
            }
          }
        }
      });

      const createFormInput = {
        emitter: {
          type: EmitterType.APPENDIX2,
          company: {
            siret: ttr.siret
          }
        },
        grouping: [{ form: { id: appendix2.id }, quantity: 2 }]
      };
      const { mutate } = makeClient(user);
      const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
        variables: { createFormInput }
      });

      expect(data.createForm.id).toBeTruthy();
    }
  );

  it(
    "should disallow creating a form with an appendix 2 if the quantity we try to group" +
      " is greater than the quantity available (using CreateFormInput.grouping)",
    async () => {
      const { user, company: ttr } = await userWithCompanyFactory("ADMIN");

      const appendix2 = await formFactory({
        ownerId: user.id,
        opt: {
          status: "AWAITING_GROUP",
          recipientCompanySiret: ttr.siret,
          quantityReceived: 1
        }
      });
      await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          recipientCompanyName: ttr.name,
          recipientCompanySiret: ttr.siret,
          grouping: {
            create: {
              initialFormId: appendix2.id,
              quantity: 0.8
            }
          }
        }
      });

      const createFormInput = {
        emitter: {
          type: EmitterType.APPENDIX2,
          company: {
            siret: ttr.siret
          }
        },
        // trying to group 0.5 of this form but the quantity left
        // to group is equal to 0.2 = 1 - 0.8
        grouping: [{ form: { id: appendix2.id }, quantity: 0.5 }]
      };
      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "createForm">>(
        CREATE_FORM,
        {
          variables: { createFormInput }
        }
      );

      expect(errors).toEqual([
        expect.objectContaining({
          message: `La quantité restante à regrouper sur le BSDD ${appendix2.readableId} est de 0.2 T. Vous tentez de regrouper 0.5 T.`,
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ]);
    }
  );

  it(
    "should disallow linking an appendix 2 form if the emitter of the regroupement" +
      " form is not the recipient of the initial form (using CreateFormInput.appendix2Forms)",
    async () => {
      const { user, company: ttr } = await userWithCompanyFactory("MEMBER");

      const appendix2 = await formFactory({
        ownerId: (await userFactory()).id,
        opt: {
          status: Status.AWAITING_GROUP,
          quantityReceived: 1
        }
      });

      const createFormInput = {
        emitter: {
          type: EmitterType.APPENDIX2,
          company: {
            siret: ttr.siret
          }
        },
        appendix2Forms: [{ id: appendix2.id }]
      };
      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "createForm">>(
        CREATE_FORM,
        {
          variables: { createFormInput }
        }
      );
      expect(errors).toEqual([
        expect.objectContaining({
          message: `Le bordereau ${appendix2.id} n'est pas en possession du nouvel émetteur`
        })
      ]);
    }
  );

  it(
    "should disallow linking an appendix 2 form if the emitter of the regroupement" +
      " form is not the recipient of the initial form (using CreateFormInput.grouping)",
    async () => {
      const appendix2 = await formFactory({
        ownerId: (await userFactory()).id,
        opt: { status: Status.AWAITING_GROUP, quantityReceived: 1 }
      });
      const { user, company: ttr } = await userWithCompanyFactory("MEMBER");

      const createFormInput: CreateFormInput = {
        emitter: {
          type: EmitterType.APPENDIX2,
          company: {
            siret: ttr.siret
          }
        },
        grouping: [
          {
            form: { id: appendix2.id },
            quantity: appendix2.quantityReceived?.toNumber()
          }
        ]
      };
      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "createForm">>(
        CREATE_FORM,
        {
          variables: { createFormInput }
        }
      );
      expect(errors).toEqual([
        expect.objectContaining({
          message: `Le bordereau ${appendix2.id} n'est pas en possession du nouvel émetteur`
        })
      ]);
    }
  );

  it("should disallow linking an appendix2 form that is not awaiting groupement (using CreateFormInput.appendix2Forms)", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");
    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: { status: Status.SENT, recipientCompanySiret: ttr.siret }
    });

    const createFormInput = {
      emitter: {
        type: EmitterType.APPENDIX2,
        company: {
          siret: ttr.siret
        }
      },
      appendix2Forms: [{ id: appendix2.id }]
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Les BSDD initiaux ${appendix2.id} n'existent pas ou ne sont pas en attente de regroupement`
      })
    ]);
  });

  it("should disallow linking an appendix2 form that is not awaiting groupement (using CreateFormInput.grouping)", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");
    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SENT,
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const createFormInput: CreateFormInput = {
      emitter: {
        type: EmitterType.APPENDIX2,
        company: {
          siret: ttr.siret
        }
      },
      grouping: [
        {
          form: { id: appendix2.id },
          quantity: appendix2.quantityReceived?.toNumber()
        }
      ]
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Les BSDD initiaux ${appendix2.id} n'existent pas ou ne sont pas en attente de regroupement`
      })
    ]);
  });

  it("should disallow linking an appendix2 form to a BSDD which emitter type is not APPENDIX2 (using CreateFormInput.appendix2Forms)", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");
    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: { status: Status.SENT, recipientCompanySiret: ttr.siret }
    });

    const createFormInput = {
      emitter: {
        type: "PRODUCER",
        company: {
          siret: ttr.siret
        }
      },
      appendix2Forms: [{ id: appendix2.id }]
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "emitter.type doit être égal à APPENDIX2 ou APPENDIX1 lorsque `appendix2Forms` ou `grouping` n'est pas vide"
      })
    ]);
  });

  it("should disallow linking an appendix2 form to a BSDD which emitter type is not APPENDIX2 (using CreateFormInput.grouping)", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");
    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.AWAITING_GROUP,
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const createFormInput: CreateFormInput = {
      emitter: {
        type: "PRODUCER",
        company: {
          siret: ttr.siret
        }
      },
      grouping: [
        {
          form: { id: appendix2.id },
          quantity: appendix2.quantityReceived?.toNumber()
        }
      ]
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "emitter.type doit être égal à APPENDIX2 ou APPENDIX1 lorsque `appendix2Forms` ou `grouping` n'est pas vide"
      })
    ]);
  });

  it("should throw error when trying to set both appendix2Forms and grouping", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");
    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.AWAITING_GROUP,
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const createFormInput: CreateFormInput = {
      emitter: {
        type: "APPENDIX2",
        company: {
          siret: ttr.siret
        }
      },
      grouping: [
        {
          form: { id: appendix2.id },
          quantity: appendix2.quantityReceived?.toNumber()
        }
      ],
      appendix2Forms: [{ id: appendix2.id }]
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous pouvez renseigner soit `appendix2Forms` soit `grouping` mais pas les deux"
      })
    ]);
  });

  it("should default to quantity left when no quantity is specified in grouping", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");
    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.AWAITING_GROUP,
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SEALED,
        recipientCompanySiret: ttr.siret,
        grouping: {
          create: {
            quantity: 0.2,
            initialFormId: appendix2.id
          }
        }
      }
    });

    const createFormInput: CreateFormInput = {
      emitter: {
        type: "APPENDIX2",
        company: {
          siret: ttr.siret
        }
      },
      grouping: [{ form: { id: appendix2.id } }]
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });

    expect(data.createForm.grouping).toEqual([
      expect.objectContaining({
        quantity: 0.8,
        form: expect.objectContaining({ id: appendix2.id })
      })
    ]);
  });

  it("should not be possible to add more than 250 BSDDs on appendix2", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");
    const createFormInput: CreateFormInput = {
      emitter: {
        type: "APPENDIX2",
        company: {
          siret: ttr.siret
        }
      },
      grouping: Array.from(Array(300).keys()).map(n => ({
        form: { id: `id_${n}` }
      }))
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Vous ne pouvez pas regrouper plus de 250 BSDDs initiaux`
      })
    ]);
  });

  it("should set isDangerous to `true` when specifying a waste code ending with *", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: { siret: company.siret }
          },
          wasteDetails: { code: "20 01 27*" }
        }
      }
    });
    expect(data.createForm.wasteDetails!.isDangerous).toEqual(true);
  });

  it("should set isDangerous to `false` when specifying a waste code without *", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: { siret: company.siret }
          },
          wasteDetails: { code: "20 03 01" }
        }
      }
    });
    expect(data.createForm.wasteDetails!.isDangerous).toEqual(false);
  });

  it("should throw an exception if trying to set `isDangerous=false` with a code containing *", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: { siret: company.siret }
          },
          wasteDetails: { code: "20 01 27*", isDangerous: false }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Un déchet avec un code comportant un astérisque est forcément dangereux"
      })
    ]);
  });

  it("should be possible to set `isDangerous=true` with a code not containing *", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: { siret: company.siret }
          },
          wasteDetails: { code: "20 03 01", isDangerous: true }
        }
      }
    });
    expect(data.createForm.wasteDetails!.isDangerous).toBe(true);
  });

  it("should not be possible to fill both a SIRET number and a FR TVA number for transporter", async () => {
    const { user, company: emitter } = await userWithCompanyFactory("MEMBER");
    const transporter = await companyFactory({ vatNumber: "FR87850019464" });
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: { siret: emitter.siret }
          },
          transporter: {
            company: {
              siret: transporter.siret,
              vatNumber: transporter.vatNumber
            }
          }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Transporteur : Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement",
        extensions: {
          code: "BAD_USER_INPUT"
        }
      })
    ]);
  });

  it("should be possible to fill TVA number only for a foreign transporter", async () => {
    const { user, company: emitter } = await userWithCompanyFactory("MEMBER");
    const { company: transporterCompany } = await userWithCompanyFactory(
      UserRole.MEMBER,
      {
        companyTypes: {
          set: ["TRANSPORTER"]
        },
        vatNumber: "BE0541696005"
      }
    );

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: { siret: emitter.siret }
          },
          transporter: {
            company: { vatNumber: transporterCompany.vatNumber }
          }
        }
      }
    });
    expect(data?.createForm?.id).toBeDefined();
  });

  it("should perform form creation in transaction", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);

    const formCountBeforeCreation = await prisma.form.count();
    expect(formCountBeforeCreation).toEqual(0);

    const { errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            type: "APPENDIX2",
            company: { siret: company.siret }
          },
          // let's throw an error in appendix2 association that happens
          // after form creation in the mutation. Form creation should
          // be rolled back
          grouping: [{ form: { id: "does-not-exist" }, quantity: 1 }]
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Les BSDD initiaux does-not-exist n'existent pas ou ne sont pas en attente de regroupement"
      })
    ]);

    // check form has not been created
    const formCountAfterCreationAttempt = await prisma.form.count();
    expect(formCountAfterCreationAttempt).toEqual(0);
  });

  it("should fill denormalized fields upon creation", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    // recipient needs appropriate profiles and subprofiles
    const recipient = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const { mutate } = makeClient(user);

    const intermediaryCreation = toIntermediaryCompany(company);

    const { data } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            type: "APPENDIX2",
            company: { siret: company.siret }
          },
          transporter: { company: { siret: company.siret } },
          recipient: { company: { siret: recipient.siret } },
          intermediaries: [intermediaryCreation]
        }
      }
    });

    const form = await prisma.form.findUniqueOrThrow({
      where: { id: data.createForm.id }
    });

    expect(form.recipientsSirets).toContain(recipient.siret);
    expect(form.transportersSirets).toContain(company.siret);
    expect(form.intermediariesSirets).toContain(company.siret);
  });

  it("should not be possible de set a weight > 40 T when transport mode is ROAD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporter = await companyFactory();
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          wasteDetails: { quantity: 50 },
          emitter: {
            company: { siret: company.siret }
          },
          transporter: { mode: "ROAD", company: { siret: transporter.siret } }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Déchet : le poids doit être inférieur à 40 tonnes lorsque le transport se fait par la route"
      })
    ]);
  });

  it("should not be possible to use `transporter` and `transporters` in the same input", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporter = await companyFactory();
    const bsddTransporter = await prisma.bsddTransporter.create({
      data: { number: 0 }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: { siret: company.siret }
          },
          transporter: { company: { siret: transporter.siret } },
          transporters: [bsddTransporter.id]
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

  it.each(["", "     "])(
    "should convert empty onuCode to null",
    async onuCode => {
      // Given
      const { user, company } = await userWithCompanyFactory("MEMBER");

      // When
      const { mutate } = makeClient(user);
      const { errors, data } = await mutate<
        Pick<Mutation, "createForm">,
        MutationCreateFormArgs
      >(CREATE_FORM, {
        variables: {
          createFormInput: {
            emitter: {
              company: { siret: company.siret }
            },
            wasteDetails: {
              onuCode
            }
          }
        }
      });

      // Then
      expect(errors).toBeUndefined();

      const form = await prisma.form.findFirstOrThrow({
        where: { id: data.createForm.id }
      });

      expect(form.wasteDetailsOnuCode).toBeNull();
    }
  );
  it("should allow to create a form with a nonRoadRegulationMention", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporter = await companyFactory();

    // When
    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: { siret: company.siret }
          },
          wasteDetails: {
            nonRoadRegulationMention: "Non road regulation mention"
          },
          transporter: { company: { siret: transporter.siret } }
        }
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.createForm.wasteDetails?.nonRoadRegulationMention).toEqual(
      "Non road regulation mention"
    );
  });

  it("nonRoadRegulationMention is not required", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporter = await companyFactory();

    // When
    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createForm">,
      MutationCreateFormArgs
    >(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: { siret: company.siret }
          },
          transporter: { company: { siret: transporter.siret } }
        }
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.createForm.wasteDetails?.nonRoadRegulationMention).toBeNull();
  });

  describe("Annexe 1", () => {
    it("should create an APPENDIX1_PRODUCER form", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const { mutate } = makeClient(user);

      const { data } = await mutate<
        Pick<Mutation, "createForm">,
        MutationCreateFormArgs
      >(CREATE_FORM, {
        variables: {
          createFormInput: {
            emitter: {
              type: "APPENDIX1_PRODUCER",
              company: { siret: company.siret }
            }
          }
        }
      });

      const form = await prisma.form.findUniqueOrThrow({
        where: { id: data.createForm.id }
      });

      expect(form.emitterCompanySiret).toContain(company.siret);
    });

    it("should ignore unrelated fields when creating an APPENDIX1_PRODUCER", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const { mutate } = makeClient(user);

      const { data } = await mutate<
        Pick<Mutation, "createForm">,
        MutationCreateFormArgs
      >(CREATE_FORM, {
        variables: {
          createFormInput: {
            emitter: {
              type: "APPENDIX1_PRODUCER",
              company: { siret: company.siret }
            },
            transporter: { company: { siret: company.siret } }
          }
        }
      });

      expect(data.createForm.transporter).toBeNull();
    });

    it("should create an appendix 1 container and group appendix 1 items", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const { company: producerCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { mutate } = makeClient(user);

      const appendix1_1 = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.SEALED,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          owner: { connect: { id: user.id } }
        }
      });
      const appendix1_2 = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.SEALED,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          owner: { connect: { id: user.id } }
        }
      });

      const { data } = await mutate<
        Pick<Mutation, "createForm">,
        MutationCreateFormArgs
      >(CREATE_FORM, {
        variables: {
          createFormInput: {
            emitter: {
              type: "APPENDIX1",
              company: { siret: company.siret }
            },
            transporter: { company: { siret: company.siret } },
            grouping: [
              { form: { id: appendix1_1.id } },
              { form: { id: appendix1_2.id } }
            ]
          }
        }
      });

      expect(data.createForm.id).toBeDefined();
      expect(data.createForm.grouping!.length).toBe(2);
    });

    it("should seal grouped appendix 1 items when necessary", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const { company: producerCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { mutate } = makeClient(user);

      const appendix1_1 = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.DRAFT,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          emitterCompanyName: producerCompany.name,
          emitterCompanyAddress: producerCompany.address,
          emitterCompanyContact: "Contact",
          emitterCompanyPhone: "0101010101",
          emitterCompanyMail: "contact@mail.com",
          wasteDetailsCode: "16 06 01*",
          owner: { connect: { id: user.id } }
        }
      });
      const appendix1_2 = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.DRAFT,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          emitterCompanyName: producerCompany.name,
          emitterCompanyAddress: producerCompany.address,
          emitterCompanyContact: "Contact",
          emitterCompanyPhone: "0101010101",
          emitterCompanyMail: "contact@mail.com",
          wasteDetailsCode: "16 06 01*",
          owner: { connect: { id: user.id } }
        }
      });

      const { data } = await mutate<
        Pick<Mutation, "createForm">,
        MutationCreateFormArgs
      >(CREATE_FORM, {
        variables: {
          createFormInput: {
            emitter: {
              type: "APPENDIX1",
              company: { siret: company.siret }
            },
            transporter: { company: { siret: company.siret } },
            grouping: [
              { form: { id: appendix1_1.id } },
              { form: { id: appendix1_2.id } }
            ]
          }
        }
      });

      expect(data.createForm.grouping!.length).toBe(2);

      const newAppendix1_1 = await prisma.form.findUniqueOrThrow({
        where: { id: appendix1_1.id }
      });
      expect(newAppendix1_1.status).toBe(Status.SEALED);

      const newAppendix1_2 = await prisma.form.findUniqueOrThrow({
        where: { id: appendix1_2.id }
      });
      expect(newAppendix1_2.status).toBe(Status.SEALED);
    });

    it("should not allow to create a APPENDIX1_PRODUCER form with an intermediary", async () => {
      const emitter = await userWithCompanyFactory(UserRole.MEMBER);
      const intermediary = await userWithCompanyFactory(UserRole.MEMBER);
      const { mutate } = makeClient(emitter.user);
      const intermediaryCreation = toIntermediaryCompany(intermediary.company);
      const { errors } = await mutate<Pick<Mutation, "createForm">>(
        CREATE_FORM,
        {
          variables: {
            createFormInput: {
              emitter: {
                type: "APPENDIX1_PRODUCER",
                company: {
                  siret: emitter.company.siret
                }
              },
              intermediaries: [intermediaryCreation]
            }
          }
        }
      );
      expect(errors).toEqual([
        expect.objectContaining({
          message: "Impossible d'ajouter des intermédiaires sur une annexe 1",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
    });

    it("should create an appendix 1 child and copy parent's ADR info in it", async () => {
      // Given
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const { company: producerCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { mutate } = makeClient(user);

      const appendix1Child = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.SEALED,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          owner: { connect: { id: user.id } }
        }
      });

      // When
      const { errors } = await mutate<
        Pick<Mutation, "createForm">,
        MutationCreateFormArgs
      >(CREATE_FORM, {
        variables: {
          createFormInput: {
            emitter: {
              type: "APPENDIX1",
              company: { siret: company.siret }
            },
            transporter: { company: { siret: company.siret } },
            wasteDetails: {
              isSubjectToADR: true,
              onuCode: "Mention ADR",
              nonRoadRegulationMention: "Mention RID"
            },
            grouping: [{ form: { id: appendix1Child.id } }]
          }
        }
      });

      // Then
      expect(errors).toBeUndefined();

      const updatedAppendix1Child = await prisma.form.findFirstOrThrow({
        where: { id: appendix1Child.id }
      });

      expect(updatedAppendix1Child.wasteDetailsIsSubjectToADR).toBeTruthy();
      expect(updatedAppendix1Child.wasteDetailsOnuCode).toBe("Mention ADR");
      expect(updatedAppendix1Child.wasteDetailsNonRoadRegulationMention).toBe(
        "Mention RID"
      );
    });
  });

  describe("annexe2 + quantityRefused", () => {
    const createAppendix2 = async (
      userId,
      recipientCompanySiret,
      {
        wasteAcceptationStatus,
        quantityReceived,
        quantityRefused
      }: {
        wasteAcceptationStatus: WasteAcceptationStatus;
        quantityReceived: number;
        quantityRefused?: number;
      }
    ) => {
      return formFactory({
        ownerId: userId,
        opt: {
          status: "AWAITING_GROUP",
          recipientCompanySiret,
          wasteAcceptationStatus,
          quantityReceived,
          quantityRefused: quantityRefused ?? null
        }
      });
    };

    it("can create annexe2 because quantityAccepted is equal to quantity", async () => {
      // Given
      const { user, company: ttr } = await userWithCompanyFactory("ADMIN");

      const appendix2 = await createAppendix2(user.id, ttr.siret, {
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 10,
        quantityRefused: 7
      });

      // When
      const { mutate } = makeClient(user);
      const mutateFn = () =>
        mutate<Pick<Mutation, "createForm">, MutationCreateFormArgs>(
          CREATE_FORM,
          {
            variables: {
              createFormInput: {
                emitter: {
                  type: EmitterType.APPENDIX2,
                  company: {
                    siret: ttr.siret
                  }
                },
                grouping: [{ form: { id: appendix2.id }, quantity: 3 }]
              }
            }
          }
        );

      const { errors } = await waitForJobsCompletion({
        queue: updateAppendix2Queue,
        fn: mutateFn,
        expectedJobCount: 1
      });

      // Then
      expect(errors).toBeUndefined();

      const updatedAppendix2 = await prisma.form.findFirstOrThrow({
        where: { id: appendix2.id }
      });
      expect(updatedAppendix2.quantityGrouped).toEqual(3);
    });

    it("cannot create annexe2 because quantityAccepted is lower than quantity", async () => {
      // Given
      const { user, company: ttr } = await userWithCompanyFactory("ADMIN");

      const appendix2 = await createAppendix2(user.id, ttr.siret, {
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 10,
        quantityRefused: 7
      });

      // When
      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createForm">,
        MutationCreateFormArgs
      >(CREATE_FORM, {
        variables: {
          createFormInput: {
            emitter: {
              type: EmitterType.APPENDIX2,
              company: {
                siret: ttr.siret
              }
            },
            grouping: [{ form: { id: appendix2.id }, quantity: 6 }]
          }
        }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toEqual(
        `La quantité restante à regrouper sur le BSDD ${appendix2.readableId} est de 3 T. Vous tentez de regrouper 6 T.`
      );
    });

    it("grouping multiple BSDs with too high quantities", async () => {
      // Given
      const { user, company: ttr } = await userWithCompanyFactory("ADMIN");

      const appendix2_1 = await createAppendix2(user.id, ttr.siret, {
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 10,
        quantityRefused: 7
      });

      const appendix2_2 = await createAppendix2(user.id, ttr.siret, {
        wasteAcceptationStatus: "ACCEPTED",
        quantityReceived: 10,
        quantityRefused: 0
      });

      const appendix2_3 = await createAppendix2(user.id, ttr.siret, {
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 15,
        quantityRefused: 2
      });

      // When
      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "createForm">,
        MutationCreateFormArgs
      >(CREATE_FORM, {
        variables: {
          createFormInput: {
            emitter: {
              type: EmitterType.APPENDIX2,
              company: {
                siret: ttr.siret
              }
            },
            grouping: [
              { form: { id: appendix2_1.id }, quantity: 3.5 },
              { form: { id: appendix2_2.id }, quantity: 11 },
              { form: { id: appendix2_3.id }, quantity: 13.7 }
            ]
          }
        }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toContain(
        `La quantité restante à regrouper sur le BSDD ${appendix2_3.readableId} est de 13 T. Vous tentez de regrouper 13.7 T.`
      );
      expect(errors[0].message).toContain(
        `La quantité restante à regrouper sur le BSDD ${appendix2_1.readableId} est de 3 T. Vous tentez de regrouper 3.5 T.`
      );
      expect(errors[0].message).toContain(
        `La quantité restante à regrouper sur le BSDD ${appendix2_2.readableId} est de 10 T. Vous tentez de regrouper 11 T.`
      );
    });

    it("grouping multiple BSDs with legit quantities", async () => {
      // Given
      const { user, company: ttr } = await userWithCompanyFactory("ADMIN");

      const appendix2_1 = await createAppendix2(user.id, ttr.siret, {
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 10,
        quantityRefused: 7
      });

      const appendix2_2 = await createAppendix2(user.id, ttr.siret, {
        wasteAcceptationStatus: "ACCEPTED",
        quantityReceived: 10,
        quantityRefused: 0
      });

      const appendix2_3 = await createAppendix2(user.id, ttr.siret, {
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 15,
        quantityRefused: 2
      });

      // When
      const { mutate } = makeClient(user);

      const mutateFn = () =>
        mutate<Pick<Mutation, "createForm">, MutationCreateFormArgs>(
          CREATE_FORM,
          {
            variables: {
              createFormInput: {
                emitter: {
                  type: EmitterType.APPENDIX2,
                  company: {
                    siret: ttr.siret
                  }
                },
                grouping: [
                  { form: { id: appendix2_1.id }, quantity: 3 },
                  { form: { id: appendix2_2.id }, quantity: 10 },
                  { form: { id: appendix2_3.id }, quantity: 10 }
                ]
              }
            }
          }
        );

      const { errors } = await waitForJobsCompletion({
        queue: updateAppendix2Queue,
        fn: mutateFn,
        expectedJobCount: 3
      });

      // Then
      expect(errors).toBeUndefined();

      const updatedAppendix2_1 = await prisma.form.findFirstOrThrow({
        where: { id: appendix2_1.id }
      });
      expect(updatedAppendix2_1.quantityGrouped).toEqual(3);

      const updatedAppendix2_2 = await prisma.form.findFirstOrThrow({
        where: { id: appendix2_2.id }
      });
      expect(updatedAppendix2_2.quantityGrouped).toEqual(10);

      const updatedAppendix2_3 = await prisma.form.findFirstOrThrow({
        where: { id: appendix2_3.id }
      });
      expect(updatedAppendix2_3.quantityGrouped).toEqual(10);
    });

    it("grouping annexe2 multiple times until quantity is too high", async () => {
      // Given
      const { user, company: ttr } = await userWithCompanyFactory("ADMIN");

      const appendix2 = await createAppendix2(user.id, ttr.siret, {
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 10,
        quantityRefused: 7
      });

      // When
      const { mutate } = makeClient(user);
      const mutateFn1 = () =>
        mutate<Pick<Mutation, "createForm">, MutationCreateFormArgs>(
          CREATE_FORM,
          {
            variables: {
              createFormInput: {
                emitter: {
                  type: EmitterType.APPENDIX2,
                  company: {
                    siret: ttr.siret
                  }
                },
                grouping: [{ form: { id: appendix2.id }, quantity: 1.5 }]
              }
            }
          }
        );
      const { errors: errors1 } = await waitForJobsCompletion({
        queue: updateAppendix2Queue,
        fn: mutateFn1,
        expectedJobCount: 1
      });

      // Then
      expect(errors1).toBeUndefined();

      const updatedAppendix2_1 = await prisma.form.findFirstOrThrow({
        where: { id: appendix2.id }
      });
      expect(updatedAppendix2_1.quantityGrouped).toEqual(1.5);

      // When
      const mutateFn2 = () =>
        mutate<Pick<Mutation, "createForm">, MutationCreateFormArgs>(
          CREATE_FORM,
          {
            variables: {
              createFormInput: {
                emitter: {
                  type: EmitterType.APPENDIX2,
                  company: {
                    siret: ttr.siret
                  }
                },
                grouping: [{ form: { id: appendix2.id }, quantity: 1 }]
              }
            }
          }
        );

      const { errors: errors2 } = await waitForJobsCompletion({
        queue: updateAppendix2Queue,
        fn: mutateFn2,
        expectedJobCount: 1
      });

      // Then
      expect(errors2).toBeUndefined();

      const updatedAppendix2_2 = await prisma.form.findFirstOrThrow({
        where: { id: appendix2.id }
      });
      expect(updatedAppendix2_2.quantityGrouped).toEqual(2.5);

      // When
      const { errors: errors3 } = await mutate<
        Pick<Mutation, "createForm">,
        MutationCreateFormArgs
      >(CREATE_FORM, {
        variables: {
          createFormInput: {
            emitter: {
              type: EmitterType.APPENDIX2,
              company: {
                siret: ttr.siret
              }
            },
            grouping: [{ form: { id: appendix2.id }, quantity: 1 }]
          }
        }
      });

      // Then
      expect(errors3).not.toBeUndefined();
      expect(errors3[0].message).toEqual(
        `La quantité restante à regrouper sur le BSDD ${appendix2.readableId} est de 0.5 T. Vous tentez de regrouper 1 T.`
      );
    });

    it("grouping multiple BSDs including legacy", async () => {
      // Given
      const { user, company: ttr } = await userWithCompanyFactory("ADMIN");

      const appendix2_1 = await createAppendix2(user.id, ttr.siret, {
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 10,
        quantityRefused: 7
      });

      const appendix2_2 = await createAppendix2(user.id, ttr.siret, {
        wasteAcceptationStatus: "ACCEPTED",
        quantityReceived: 10,
        quantityRefused: 0
      });

      // Legacy
      const appendix2_3 = await createAppendix2(user.id, ttr.siret, {
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 15
      });

      // When
      const { mutate } = makeClient(user);
      const mutateFn = () =>
        mutate<Pick<Mutation, "createForm">, MutationCreateFormArgs>(
          CREATE_FORM,
          {
            variables: {
              createFormInput: {
                emitter: {
                  type: EmitterType.APPENDIX2,
                  company: {
                    siret: ttr.siret
                  }
                },
                grouping: [
                  { form: { id: appendix2_1.id }, quantity: 3 },
                  { form: { id: appendix2_2.id }, quantity: 10 },
                  { form: { id: appendix2_3.id }, quantity: 10 }
                ]
              }
            }
          }
        );

      const { errors } = await waitForJobsCompletion({
        queue: updateAppendix2Queue,
        fn: mutateFn,
        expectedJobCount: 3
      });

      // Then
      expect(errors).toBeUndefined();

      const updatedAppendix2_1 = await prisma.form.findFirstOrThrow({
        where: { id: appendix2_1.id }
      });
      expect(updatedAppendix2_1.quantityGrouped).toEqual(3);

      const updatedAppendix2_2 = await prisma.form.findFirstOrThrow({
        where: { id: appendix2_2.id }
      });
      expect(updatedAppendix2_2.quantityGrouped).toEqual(10);

      const updatedAppendix2_3 = await prisma.form.findFirstOrThrow({
        where: { id: appendix2_3.id }
      });
      expect(updatedAppendix2_3.quantityGrouped).toEqual(10);
    });
  });
});
