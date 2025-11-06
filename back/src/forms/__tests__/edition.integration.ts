import { Status } from "@td/prisma";
import {
  formFactory,
  formWithTempStorageFactory,
  toIntermediaryCompany,
  userWithCompanyFactory
} from "../../__tests__/factories";
import type { UpdateFormInput } from "@td/codegen-back";
import { getFirstTransporterSync, getFullForm } from "../database";
import { checkEditionRules } from "../edition";
import { prisma } from "@td/prisma";

describe("checkEditionRules", () => {
  it.each([Status.DRAFT, Status.SEALED])(
    "should not throw error when form is %p",
    async status => {
      const destination = await userWithCompanyFactory("MEMBER");
      const form = await formFactory({
        ownerId: destination.user.id,
        opt: {
          status,
          recipientCompanySiret: destination.company.siret
        }
      });
      const fullForm = await getFullForm(form);
      const input: UpdateFormInput = {
        id: form.id,
        wasteDetails: { code: "04 01 03*" }
      };
      const checked = await checkEditionRules(
        fullForm,
        input,
        destination.user
      );
      expect(checked).toBe(true);
    }
  );

  it("should not be possible to update fields sealed by emitter signature", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: destination.user.id,
      opt: {
        status: Status.SIGNED_BY_PRODUCER,
        emittedAt: new Date(),
        recipientCompanySiret: destination.company.siret
      }
    });
    const fullForm = await getFullForm(form);
    const newCompany = {
      siret: "new siret",
      vatNumber: "new vat number",
      name: "new name",
      address: "new address",
      contact: "new contact",
      mail: "new mail",
      phone: "new phone",
      country: "new country",
      omiNumber: "new omi"
    };
    const input: UpdateFormInput = {
      id: form.id,
      customId: "custom",
      emitter: {
        type: "OTHER",
        pickupSite: "new pickup site",
        workSite: {
          name: "new name",
          address: "new address",
          city: "new city",
          postalCode: "new postal code"
        },
        company: newCompany,
        isPrivateIndividual: !form.emitterIsPrivateIndividual,
        isForeignShip: !form.emitterIsForeignShip
      },
      recipient: {
        cap: "new cap",
        processingOperation: "new processing operation",
        isTempStorage: !form.recipientIsTempStorage,
        company: newCompany
      },
      wasteDetails: {
        code: "04 01 03*",
        name: "new name",
        onuCode: "new onu",
        packagingInfos: [{ type: "FUT", other: "other", quantity: 10 }],
        packagings: ["FUT"],
        otherPackaging: "new other",
        numberOfPackages: 50,
        quantity: 200,
        quantityType: "ESTIMATED",
        consistences: ["DOUGHY"],
        pop: !form.wasteDetailsPop,
        isDangerous: !form.wasteDetailsIsDangerous,
        parcelNumbers: [
          {
            city: "new city",
            postalCode: "new code",
            prefix: "new prefix",
            section: "new section",
            number: "new number",
            x: 1,
            y: 2
          }
        ],
        analysisReferences: ["new analysis"],
        landIdentifiers: ["new land identifiers"],
        sampleNumber: "new sample"
      },
      trader: {
        receipt: "new receipt",
        department: "new departement",
        validityLimit: new Date(),
        company: newCompany
      },
      broker: {
        receipt: "new receipt",
        department: "new departement",
        validityLimit: new Date(),
        company: newCompany
      },
      ecoOrganisme: { siret: "new siret", name: "new name" }
    };

    expect.assertions(57);
    try {
      await checkEditionRules(fullForm, input, destination.user);
    } catch (error) {
      expect(error.message).toContain(
        "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés"
      );
      [
        "customId, ",
        "emitterType, ",
        "emitterPickupSite, ",
        "emitterWorkSiteName, ",
        "emitterWorkSiteAddress, ",
        "emitterWorkSiteCity, ",
        "emitterWorkSitePostalCode, ",
        "emitterIsPrivateIndividual, ",
        "emitterIsForeignShip, ",
        "emitterCompanyName, ",
        "emitterCompanySiret, ",
        "emitterCompanyAddress, ",
        "emitterCompanyContact, ",
        "emitterCompanyPhone, ",
        "emitterCompanyMail, ",
        "emitterCompanyOmiNumber, ",
        "recipientCap, ",
        "recipientProcessingOperation, ",
        "recipientIsTempStorage, ",
        "recipientCompanyName, ",
        "recipientCompanySiret, ",
        "recipientCompanyAddress, ",
        "recipientCompanyContact, ",
        "recipientCompanyPhone, ",
        "recipientCompanyMail, ",
        "wasteDetailsCode, ",
        "wasteDetailsOnuCode, ",
        "wasteDetailsPackagingInfos, ",
        "wasteDetailsQuantity, ",
        "wasteDetailsName, ",
        "wasteDetailsConsistence, ",
        "wasteDetailsPop, ",
        "wasteDetailsIsDangerous, ",
        "wasteDetailsParcelNumbers, ",
        "wasteDetailsAnalysisReferences, ",
        "wasteDetailsLandIdentifiers, ",
        "traderCompanyName, ",
        "traderCompanySiret, ",
        "traderCompanyAddress, ",
        "traderCompanyContact, ",
        "traderCompanyPhone, ",
        "traderCompanyMail, ",
        "traderReceipt, ",
        "traderDepartment, ",
        "traderValidityLimit, ",
        "brokerCompanyName, ",
        "brokerCompanySiret, ",
        "brokerCompanyAddress, ",
        "brokerCompanyContact, ",
        "brokerCompanyPhone, ",
        "brokerCompanyMail, ",
        "brokerReceipt, ",
        "brokerDepartment, ",
        "brokerValidityLimit, ",
        "ecoOrganismeName, ",
        "ecoOrganismeSiret"
      ].forEach(field => {
        expect(error.message).toContain(field);
      });
    }
  });

  it("should be possible to re-send same data when a field is sealed by emitter signature", async () => {
    const destination = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: destination.user.id,
      opt: {
        status: Status.SIGNED_BY_PRODUCER,
        emittedAt: new Date(),
        recipientCompanySiret: destination.company.siret
      }
    });
    const fullForm = await getFullForm(form);
    const input: UpdateFormInput = {
      id: form.id,
      wasteDetails: {
        // ce champ est verrouillé mais on ne lève pas d'erreur
        // car on renvoie la même information
        code: fullForm.wasteDetailsCode
      }
    };
    const checked = await checkEditionRules(fullForm, input, destination.user);
    expect(checked).toBe(true);
  });

  it("should be possible for the emitter to update fields sealed by emitter signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.SIGNED_BY_PRODUCER,
        emittedAt: new Date(),
        emitterCompanySiret: emitter.company.siret
      }
    });
    const fullForm = await getFullForm(form);
    const input: UpdateFormInput = {
      id: form.id,
      wasteDetails: { code: "04 01 03*" }
    };
    const checked = await checkEditionRules(fullForm, input, emitter.user);
    expect(checked).toBe(true);
  });

  it(
    "should be possible for the eco-organisme to update fields sealed" +
      " by emitter signature when emitted by eco-organisme is true",
    async () => {
      const ecoOrganisme = await userWithCompanyFactory("MEMBER");

      const form = await formFactory({
        ownerId: ecoOrganisme.user.id,
        opt: {
          status: Status.SIGNED_BY_PRODUCER,
          emittedAt: new Date(),
          ecoOrganismeSiret: ecoOrganisme.company.siret,
          ecoOrganismeName: ecoOrganisme.company.name,
          emittedByEcoOrganisme: true
        }
      });
      const fullForm = await getFullForm(form);
      const input: UpdateFormInput = {
        id: form.id,
        wasteDetails: { code: "04 01 03*" }
      };
      const checked = await checkEditionRules(
        fullForm,
        input,
        ecoOrganisme.user
      );
      expect(checked).toBe(true);
    }
  );

  it("should be possible to update transporters while the form is not sent", async () => {
    const destination = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: destination.user.id,
      opt: {
        status: Status.SIGNED_BY_PRODUCER,
        emittedAt: new Date(),
        recipientCompanySiret: destination.company.siret
      }
    });
    const fullForm = await getFullForm(form);
    const input: UpdateFormInput = {
      id: form.id,
      transporters: [] // supprime les transporteurs existants
    };
    const checked = await checkEditionRules(fullForm, input, destination.user);
    expect(checked).toEqual(true);
  });

  it("should be possible to add a transporter when the form is sent but not received yet", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: destination.user.id,
      opt: {
        status: Status.SENT,
        emittedAt: new Date(),
        takenOverAt: new Date(),
        recipientCompanySiret: destination.company.siret,
        transporters: {
          create: {
            transporterCompanySiret: transporter1.company.siret,
            takenOverAt: new Date(),
            takenOverBy: "Quelqu'un",
            number: 1
          }
        }
      }
    });

    const bsddTransporter2 = await prisma.bsddTransporter.create({
      data: {
        transporterCompanySiret: transporter2.company.siret,
        number: 2
      }
    });

    const fullForm = await getFullForm(form);
    const bsddTransporter1 = getFirstTransporterSync(fullForm);

    const input: UpdateFormInput = {
      id: form.id,
      transporters: [bsddTransporter1!.id, bsddTransporter2.id] // ajoute un transporteur
    };
    const checked = await checkEditionRules(fullForm, input, destination.user);
    expect(checked).toEqual(true);
  });

  it("should not be possible to change the order of a transporter who has already signed", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: destination.user.id,
      opt: {
        status: Status.SENT,
        emittedAt: new Date(),
        takenOverAt: new Date(),
        recipientCompanySiret: destination.company.siret,
        transporters: {
          create: {
            transporterCompanySiret: transporter1.company.siret,
            takenOverAt: new Date(),
            takenOverBy: "Quelqu'un",
            number: 1
          }
        }
      }
    });

    const bsddTransporter2 = await prisma.bsddTransporter.create({
      data: {
        transporterCompanySiret: transporter2.company.siret,
        number: 2
      }
    });

    const fullForm = await getFullForm(form);
    const bsddTransporter1 = getFirstTransporterSync(fullForm);

    const input: UpdateFormInput = {
      id: form.id,
      transporters: [bsddTransporter2.id, bsddTransporter1!.id] // try changing the order
    };
    const checkFn = () => checkEditionRules(fullForm, input, destination.user);
    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : transporters"
    );
  });

  it("should not be possible to update transporters when the form has been received", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.RECEIVED,
        emittedAt: new Date(),
        receivedAt: new Date(),
        emitterCompanySiret: emitter.company.siret
      }
    });
    const fullForm = await getFullForm(form);
    const input: UpdateFormInput = {
      id: form.id,
      transporters: [] // tentative de supprimer les transporteurs existants
    };
    const checkFn = () => checkEditionRules(fullForm, input, emitter.user);
    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : transporters"
    );
  });

  it("should be possible to update the info of the first transporter as long as it has not signed", async () => {
    const destination = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: destination.user.id,
      opt: {
        status: Status.SIGNED_BY_PRODUCER,
        emittedAt: new Date(),
        recipientCompanySiret: destination.company.siret
      }
    });
    const fullForm = await getFullForm(form);
    const input: UpdateFormInput = {
      id: form.id,
      transporter: {
        customInfo: "info très spécifique"
      }
    };
    const checked = await checkEditionRules(fullForm, input, destination.user);
    expect(checked).toEqual(true);
  });

  it("should not be possible to update the info if the first transporter when he has signed", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: destination.user.id,
      opt: {
        status: Status.SENT,
        emittedAt: new Date(),
        takenOverAt: new Date(),
        recipientCompanySiret: destination.company.siret,
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            takenOverAt: new Date(),
            takenOverBy: "Quelqu'un",
            number: 1
          }
        }
      }
    });
    const fullForm = await getFullForm(form);
    const input: UpdateFormInput = {
      id: form.id,
      transporter: {
        customInfo: "info très spécifique"
      }
    };
    const checkFn = () => checkEditionRules(fullForm, input, destination.user);
    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : transporter"
    );
  });

  it("should not be possible to add a temporary storage detail when the form is signed by emitter", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const nextDestination = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: destination.user.id,
      opt: {
        status: Status.SIGNED_BY_PRODUCER,
        emittedAt: new Date(),
        recipientCompanySiret: destination.company.siret
      }
    });
    const fullForm = await getFullForm(form);
    const input: UpdateFormInput = {
      id: form.id,
      recipient: { isTempStorage: true },
      temporaryStorageDetail: {
        destination: { company: { siret: nextDestination.company.siret } }
      }
    };
    const checkFn = () => checkEditionRules(fullForm, input, destination.user);
    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : recipientIsTempStorage, forwardedIn"
    );
  });

  it("should not be possible tu update a temporary storage field when the form is signed by emitter", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const nextDestination = await userWithCompanyFactory("MEMBER");
    const form = await formWithTempStorageFactory({
      ownerId: destination.user.id,
      opt: {
        status: Status.SIGNED_BY_PRODUCER,
        emittedAt: new Date(),
        recipientCompanySiret: destination.company.siret
      }
    });
    const fullForm = await getFullForm(form);
    const input: UpdateFormInput = {
      id: form.id,
      temporaryStorageDetail: {
        destination: { company: { siret: nextDestination.company.siret } }
      }
    };
    const checkFn = () => checkEditionRules(fullForm, input, destination.user);
    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : forwardedIn"
    );
  });

  it("should be possible to resend same temporary storage info when the form is signed by emitter", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const form = await formWithTempStorageFactory({
      ownerId: destination.user.id,
      opt: {
        status: Status.SIGNED_BY_PRODUCER,
        emittedAt: new Date(),
        recipientCompanySiret: destination.company.siret
      }
    });
    const fullForm = await getFullForm(form);
    const input: UpdateFormInput = {
      id: form.id,
      temporaryStorageDetail: {
        destination: {
          company: { siret: fullForm.forwardedIn!.recipientCompanySiret } // resend same info
        }
      }
    };
    const checked = await checkEditionRules(fullForm, input, destination.user);
    expect(checked).toEqual(true);
  });

  it("should not be possible to change intermediaries when the form is signed by emitter", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const intermediary1 = await userWithCompanyFactory("MEMBER");
    const intermediary2 = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: destination.user.id,
      opt: {
        status: Status.SIGNED_BY_PRODUCER,
        emittedAt: new Date(),
        intermediaries: { create: toIntermediaryCompany(intermediary1.company) }
      }
    });
    const fullForm = await getFullForm(form);
    const input: UpdateFormInput = {
      id: form.id,
      intermediaries: [toIntermediaryCompany(intermediary2.company)] // try changing the intermediary
    };
    const checkFn = () => checkEditionRules(fullForm, input, destination.user);
    await expect(checkFn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : intermediaries"
    );
  });

  it("should be possible to resend same intermediaries info when the form is is signed by emitter", async () => {
    const destination = await userWithCompanyFactory("MEMBER");
    const intermediary1 = await userWithCompanyFactory("MEMBER");
    const intermediary2 = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: destination.user.id,
      opt: {
        status: Status.SIGNED_BY_PRODUCER,
        emittedAt: new Date(),
        intermediaries: {
          create: [
            toIntermediaryCompany(intermediary1.company),
            toIntermediaryCompany(intermediary2.company)
          ]
        }
      }
    });
    const fullForm = await getFullForm(form);
    const input: UpdateFormInput = {
      id: form.id,
      intermediaries: [
        toIntermediaryCompany(intermediary2.company),
        toIntermediaryCompany(intermediary1.company)
      ] // same data in different order
    };
    const checked = await checkEditionRules(fullForm, input, destination.user);
    expect(checked).toEqual(true);
  });

  it(
    "should not be possible to update groupement info when the form" +
      " is signed by emitter (through appendix2Forms)",
    async () => {
      const ttr = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");
      const initialForm1 = await formFactory({ ownerId: ttr.user.id });

      const form = await formFactory({
        ownerId: ttr.user.id,
        opt: {
          emitterCompanySiret: ttr.company.siret,
          recipientCompanySiret: destination.company.siret,
          status: Status.SIGNED_BY_PRODUCER,
          emittedAt: new Date(),
          grouping: { create: { initialFormId: initialForm1.id, quantity: 1 } }
        }
      });

      const fullForm = await getFullForm(form);
      const input: UpdateFormInput = {
        id: form.id,
        appendix2Forms: [{ id: initialForm1.id }]
      };

      // on renvoie une erreur dès que `appendix2Forms` est envoyé même si les N° de bordereaux initiaux
      // correspondent car on n'est pas capable de savoir la quantité qui va être calculée plus tard dans le
      // code.
      const checkFn = () =>
        checkEditionRules(fullForm, input, destination.user);
      await expect(checkFn).rejects.toThrow(
        "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : grouping"
      );
    }
  );

  it(
    "should not be possible to update groupement info when the form" +
      " is signed by emitter (through grouping)",
    async () => {
      const ttr = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");
      const initialForm1 = await formFactory({ ownerId: ttr.user.id });
      const initialForm2 = await formFactory({ ownerId: ttr.user.id });

      const form = await formFactory({
        ownerId: ttr.user.id,
        opt: {
          emitterCompanySiret: ttr.company.siret,
          recipientCompanySiret: destination.company.siret,
          status: Status.SIGNED_BY_PRODUCER,
          emittedAt: new Date(),
          grouping: { create: { initialFormId: initialForm1.id, quantity: 1 } }
        }
      });

      const fullForm = await getFullForm(form);
      const input1: UpdateFormInput = {
        id: form.id,
        grouping: [
          {
            form: { id: initialForm1.id },
            // essaye de modifier la quantité
            quantity: 2
          }
        ]
      };

      const checkFn1 = () =>
        checkEditionRules(fullForm, input1, destination.user);
      await expect(checkFn1).rejects.toThrow(
        "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : grouping"
      );

      const input2: UpdateFormInput = {
        id: form.id,
        grouping: [
          {
            // essaye de modifier la liste des bordereaux
            form: { id: initialForm2.id },
            quantity: 1
          }
        ]
      };

      const checkFn2 = () =>
        checkEditionRules(fullForm, input2, destination.user);
      await expect(checkFn2).rejects.toThrow(
        "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : grouping"
      );
    }
  );

  it(
    "should be possible to resend same groupement info when the form" +
      " is signed by emitter (through grouping)",
    async () => {
      const ttr = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");
      const initialForm1 = await formFactory({ ownerId: ttr.user.id });
      const initialForm2 = await formFactory({ ownerId: ttr.user.id });

      const form = await formFactory({
        ownerId: ttr.user.id,
        opt: {
          emitterCompanySiret: ttr.company.siret,
          recipientCompanySiret: destination.company.siret,
          status: Status.SIGNED_BY_PRODUCER,
          emittedAt: new Date(),
          grouping: {
            create: [
              { initialFormId: initialForm1.id, quantity: 1 },
              { initialFormId: initialForm2.id, quantity: 1.543 }
            ]
          }
        }
      });

      const fullForm = await getFullForm(form);
      const input: UpdateFormInput = {
        id: form.id,
        grouping: [
          {
            form: { id: initialForm1.id },
            quantity: 1
          },
          { form: { id: initialForm2.id }, quantity: 1.543 }
        ]
      };

      const checked = await checkEditionRules(
        fullForm,
        input,
        destination.user
      );

      expect(checked).toEqual(true);
    }
  );
});
