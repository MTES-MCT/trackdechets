import { UserRole, BspaohStatus } from "@prisma/client";
import { resetDatabase } from "../../../../integration-tests/helper";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import { bspaohFactory } from "../../__tests__/factories";
import { fullBspaohSchema } from "../schema";
import { parseBspaohInContext } from "../index";

import { prepareBspaohForParsing } from "../../resolvers/mutations/utils";

describe("BSPAOH validation", () => {
  afterEach(resetDatabase);

  describe("BSPAOH should be valid", () => {
    test("when all data is present", async () => {
      const bspaoh = await bspaohFactory({});
      const { success } = await fullBspaohSchema.safeParseAsync(bspaoh);
      expect(success).toBe(true);
    });

    test("when there is a foreign transporter and recepisse fields are null", async () => {
      const foreignTransporter = await companyFactory({
        orgId: "BE0541696005",
        vatNumber: "BE0541696005"
      });
      const bspaoh = await bspaohFactory({});
      const { success } = await fullBspaohSchema.safeParseAsync({
        ...bspaoh,
        transporterCompanyVatNumber: foreignTransporter.vatNumber,
        transporterCompanyName: "transporteur BE",
        transporterRecepisseDepartment: null,
        transporterRecepisseNumber: null,
        transporterRecepisseIsExempted: null
      });
      expect(success).toBe(true);
    });

    test("when a foreign transporter vat number is specified and transporter siret is null", async () => {
      const foreignTransporter = await companyFactory({
        orgId: "BE0541696005",
        vatNumber: "BE0541696005"
      });

      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SIGNED_BY_PRODUCER,

          transporters: {
            create: {
              transporterCompanySiret: null,
              transporterCompanyVatNumber: foreignTransporter.vatNumber,

              number: 1
            }
          }
        }
      });
      const data = {
        ...bspaoh,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: foreignTransporter.vatNumber
      };

      const { success } = await fullBspaohSchema.safeParseAsync(data);
      expect(success).toBe(true);
    });

    it("transporter recepisse is not required if transport mode is not ROAD", async () => {
      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SIGNED_BY_PRODUCER
        }
      });

      const data = {
        ...bspaoh,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseValidityLimit: null,
        transporterTransportMode: "AIR",
        transporterTakenOverAt: new Date()
      };

      const { success } = await fullBspaohSchema.safeParseAsync(data);
      expect(success).toBe(true);
    });

    it("transporter plates is not required if transport mode is not ROAD", async () => {
      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SIGNED_BY_PRODUCER,

          transporters: {
            create: {
              transporterTransportPlates: [],
              transporterTransportMode: "AIR",
              transporterTakenOverAt: new Date(),

              number: 1
            }
          }
        }
      });

      const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
      await parseBspaohInContext(
        { persisted: preparedExistingBspaoh },
        {
          currentSignatureType: "TRANSPORT"
        }
      );
    });

    it("transporter plates is required if transport mode is ROAD", async () => {
      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SENT,
          transporters: {
            create: {
              transporterTransportPlates: [],
              transporterTransportMode: "ROAD",
              transporterTakenOverAt: new Date(),

              number: 1
            }
          }
        }
      });

      expect.assertions(1);
      try {
        const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
        await parseBspaohInContext(
          { persisted: preparedExistingBspaoh },
          { currentSignatureType: "TRANSPORT" }
        );
      } catch (error) {
        expect(error.issues).toEqual([
          expect.objectContaining({
            message: "La plaque d'immatriculation est requise"
          })
        ]);
      }
    });

    it("should work if transport mode is ROAD & plates are defined", async () => {
      const bspaoh = await bspaohFactory({
        opt: {}
      });
      const data = {
        ...bspaoh,
        transporterTransportPlates: ["xyz"],
        transporterTransportMode: "ROAD",
        transporterTakenOverAt: new Date()
      };
      const { success } = await fullBspaohSchema.safeParseAsync(data);
      expect(success).toBe(true);
    });
  });

  describe("BSPAOH should not be valid", () => {
    afterEach(resetDatabase);

    test("when emitter siret is not valid", async () => {
      const bspaoh = await bspaohFactory({});
      const data = {
        ...bspaoh,
        emitterCompanySiret: "1"
      };

      const result = await fullBspaohSchema.safeParseAsync(data);

      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        "1 n'est pas un numéro de SIRET valide"
      );
    });

    test("when transporter siret is not valid", async () => {
      const bspaoh = await bspaohFactory({});
      const data = {
        ...bspaoh,
        transporterCompanySiret: "1"
      };
      const result = await fullBspaohSchema.safeParseAsync(data);

      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        "1 n'est pas un numéro de SIRET valide"
      );
    });

    test("when transporter VAT number is FR", async () => {
      const bspaoh = await bspaohFactory({});
      const data = {
        ...bspaoh,
        transporterCompanyVatNumber: "FR35552049447"
      };
      const result = await fullBspaohSchema.safeParseAsync(data);

      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        "Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement"
      );
    });

    test("when transporter is not registered in Trackdéchets", async () => {
      const bspaoh = await bspaohFactory({
        opt: {
          transporters: {
            create: {
              transporterCompanySiret: "85001946400021",

              number: 1
            }
          }
        }
      });

      expect.assertions(1);
      try {
        const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
        await parseBspaohInContext({ persisted: preparedExistingBspaoh }, {});
      } catch (error) {
        expect(error.issues).toEqual([
          expect.objectContaining({
            message:
              "L'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
          })
        ]);
      }
    });

    test("when transporter is registered with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });

      const bspaoh = await bspaohFactory({
        opt: {
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });
      expect.assertions(1);
      try {
        const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
        await parseBspaohInContext({ persisted: preparedExistingBspaoh }, {});
      } catch (error) {
        expect(error.issues).toEqual([
          expect.objectContaining({
            message:
              `Le transporteur saisi sur le bordereau (SIRET: ${company.siret}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
              " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
              " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
          })
        ]);
      }
    });

    test("when foreign transporter is not registered in Trackdéchets", async () => {
      const bspaoh = await bspaohFactory({});
      const data = {
        ...bspaoh,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: "IT13029381004"
      };
      const result = await fullBspaohSchema.safeParseAsync(data);

      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        "Le transporteur avec le n°de TVA IT13029381004 n'est pas inscrit sur Trackdéchets"
      );
    });

    test("when foreign transporter is registered with wrong profile", async () => {
      const company = await companyFactory({
        companyTypes: ["PRODUCER"],
        orgId: "IT13029381004",
        vatNumber: "IT13029381004"
      });
      const bspaoh = await bspaohFactory({});
      const data = {
        ...bspaoh,
        transporterCompanyVatNumber: company.vatNumber
      };
      const result = await fullBspaohSchema.safeParseAsync(data);

      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        `Le transporteur saisi sur le bordereau (numéro de TVA: ${company.vatNumber}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
          " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
          " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
      );
    });

    test("when destination siret is not valid", async () => {
      const bspaoh = await bspaohFactory({});
      const data = {
        ...bspaoh,
        destinationCompanySiret: "1"
      };
      const result = await fullBspaohSchema.safeParseAsync(data);

      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        "1 n'est pas un numéro de SIRET valide"
      );
    });

    test("when destination is not registered in Trackdéchets", async () => {
      const bspaoh = await bspaohFactory({});
      const data = {
        ...bspaoh,
        destinationCompanySiret: "85001946400021"
      };
      const result = await fullBspaohSchema.safeParseAsync(data);
      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        "L'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
      );
    });

    test("when destination is registered with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const bspaoh = await bspaohFactory({});
      const data = {
        ...bspaoh,
        destinationCompanySiret: company.siret
      };
      const result = await fullBspaohSchema.safeParseAsync(data);
      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        `L'entreprise avec le SIRET "${company.siret}" n'est pas inscrite` +
          ` sur Trackdéchets en tant que crématorium et ne dispose pas d'une capacité de crémation. Cette installation ne peut` +
          ` donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il` +
          ` modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
      );
    });

    test("when there is a french transporter and recepisse fields are null", async () => {
      expect.assertions(1);
      const transporterCompany = await companyFactory({
        companyTypes: ["TRANSPORTER"]
      });
      const bspaoh = await bspaohFactory({
        opt: {
          transporters: {
            create: {
              transporterCompanySiret: transporterCompany.siret,
              transporterTakenOverAt: new Date(),
              transporterCompanyVatNumber: null,
              transporterRecepisseIsExempted: false,
              transporterRecepisseNumber: null,
              transporterRecepisseDepartment: null,
              number: 1
            }
          }
        }
      });

      try {
        const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
        await parseBspaohInContext(
          { persisted: preparedExistingBspaoh },
          {
            currentSignatureType: "TRANSPORT"
          }
        );
      } catch (error) {
        expect(error.issues).toEqual([
          expect.objectContaining({
            message:
              "Le numéro de récépissé du transporteur est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets"
          }),
          expect.objectContaining({
            message:
              "Le département de récépissé du transporteur est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets"
          })
        ]);
      }
    });

    it("transporter plate is required if transporter mode is ROAD", async () => {
      const bspaoh = await bspaohFactory({
        opt: {
          transporters: {
            create: {
              transporterTransportMode: "ROAD",
              transporterTransportPlates: undefined,
              transporterTakenOverAt: new Date(),

              number: 1
            }
          }
        }
      });

      expect.assertions(1);

      try {
        const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
        await parseBspaohInContext(
          { persisted: preparedExistingBspaoh },
          { currentSignatureType: "TRANSPORT" }
        );
      } catch (error) {
        expect(error.issues).toEqual([
          expect.objectContaining({
            message: "La plaque d'immatriculation est requise"
          })
        ]);
      }
    });

    describe("BSPAOH Sealed rules checks", () => {
      afterAll(resetDatabase);

      it("should be possible to update any fields when bspaoh status is INITIAL", async () => {
        const bspaoh = await bspaohFactory({
          opt: {
            status: "INITIAL"
          }
        });
        const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
        await parseBspaohInContext(
          {
            input: {
              emitter: { company: { name: "ACME" } }
            },
            persisted: preparedExistingBspaoh
          },
          {}
        );
      });
    });
  });

  it("should be possible to update any fields when bspaoh status is SIGNED_BY_PRODUCER", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);

    const { company: destinationCompany } = await userWithCompanyFactory();
    const bspaoh = await bspaohFactory({
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: company.siret,

            transporterTakenOverAt: new Date(),

            number: 1
          }
        },
        status: "SIGNED_BY_PRODUCER"
      }
    });
    const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
    await parseBspaohInContext(
      {
        input: {
          destination: {
            company: { name: "ACME 2", siret: destinationCompany.siret }
          }
        },
        persisted: preparedExistingBspaoh
      },
      { user }
    );
  });

  it("should not be possible to update a field sealed by emission signature", async () => {
    const bspaoh = await bspaohFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });

    expect.assertions(1);
    try {
      const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
      await parseBspaohInContext(
        {
          input: {
            emitter: { company: { name: "ACME" } }
          },
          persisted: preparedExistingBspaoh
        },
        { currentSignatureType: "TRANSPORT" }
      );
    } catch (error) {
      expect(error.issues[0].message).toBe(
        "Le nom de l'entreprise émettrice a été verrouillé via signature et ne peut pas être modifié."
      );
    }
  });

  it("should be possible to set a sealed field to null if it was empty", async () => {
    const bspaoh = await bspaohFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        emitterPickupSiteAddress: ""
      }
    });
    const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
    await parseBspaohInContext(
      {
        input: {
          emitter: { pickupSite: { address: null } }
        },
        persisted: preparedExistingBspaoh
      },
      {}
    );
  });

  it("should be possible to set a sealed field to an empty string if it was null", async () => {
    const bspaoh = await bspaohFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        emitterPickupSiteAddress: null
      }
    });
    const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
    await parseBspaohInContext(
      {
        input: {
          emitter: { pickupSite: { address: "" } }
        },
        persisted: preparedExistingBspaoh
      },
      {}
    );
  });

  it("should be possible for the emitter to update a field sealed by emission signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bspaoh = await bspaohFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });

    const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
    await parseBspaohInContext(
      {
        input: {
          emitter: { company: { name: "ACME" } }
        },
        persisted: preparedExistingBspaoh
      },
      { user }
    );
  });

  it("should be possible to update a field not yet sealed by emission signature", async () => {
    const bspaoh = await bspaohFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });
    const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
    await parseBspaohInContext(
      {
        input: {
          transporter: { transport: { plates: ["AD-008-TS"] } }
        },
        persisted: preparedExistingBspaoh
      },
      {}
    );
  });

  it("should not be possible to update a field sealed by transporter signature", async () => {
    const bspaoh = await bspaohFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),

        transporters: {
          create: {
            transporterTransportSignatureDate: new Date(),
            transporterTakenOverAt: new Date(),
            number: 1
          }
        }
      }
    });

    expect.assertions(1);

    const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
    try {
      await parseBspaohInContext(
        {
          input: {
            transporter: {
              transport: {
                mode: "AIR"
              }
            }
          },
          persisted: preparedExistingBspaoh
        },
        { currentSignatureType: "TRANSPORT" }
      );
    } catch (error) {
      expect(error.issues[0].message).toBe(
        "Le mode de transport a été verrouillé via signature et ne peut pas être modifié."
      );
    }
  });

  it("should be possible to update a field not yet sealed by transport signature", async () => {
    const bspaoh = await bspaohFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),

        transporters: {
          create: {
            transporterTransportSignatureDate: new Date(),
            transporterTakenOverAt: new Date(),

            number: 1
          }
        }
      }
    });

    const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
    await parseBspaohInContext(
      {
        input: {
          destination: {
            reception: { detail: { receivedWeight: { value: 10 } } }
          }
        },
        persisted: preparedExistingBspaoh
      },
      { currentSignatureType: "TRANSPORT" }
    );
  });

  it("should not be possible to update a field sealed by reception signature", async () => {
    const bspaoh = await bspaohFactory({
      opt: {
        status: "RECEIVED",
        emitterEmissionSignatureDate: new Date(),
        destinationReceptionSignatureDate: new Date(),
        destinationReceptionAcceptationStatus: "ACCEPTED",
        destinationReceptionDate: new Date(),
        destinationReceptionWastePackagingsAcceptation: [
          { id: "packaging_1", acceptation: "ACCEPTED" },
          { id: "packaging_2", acceptation: "ACCEPTED" }
        ],
        transporters: {
          create: {
            transporterTransportSignatureDate: new Date(),
            transporterTakenOverAt: new Date(),
            number: 1
          }
        }
      }
    });

    expect.assertions(1);

    const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
    try {
      await parseBspaohInContext(
        {
          input: {
            destination: {
              reception: {
                detail: { receivedWeight: { value: 10 } }
              }
            }
          },
          persisted: preparedExistingBspaoh
        },
        { currentSignatureType: "RECEPTION" }
      );
    } catch (error) {
      expect(error.issues[0].message).toBe(
        "Le poids du déchet reçu a été verrouillé via signature et ne peut pas être modifié."
      );
    }
  });

  it("should be possible to update a field not yet sealed by operation signature", async () => {
    const bspaoh = await bspaohFactory({
      opt: {
        status: "RECEIVED",
        emitterEmissionSignatureDate: new Date(),
        destinationReceptionSignatureDate: new Date(),
        destinationReceptionWasteReceivedWeightValue: 1,

        destinationReceptionAcceptationStatus: "ACCEPTED",
        destinationReceptionDate: new Date(),
        destinationReceptionWastePackagingsAcceptation: [
          {
            id: "packaging_1",
            acceptation: "ACCEPTED"
          },
          {
            id: "packaging_2",
            acceptation: "ACCEPTED"
          }
        ],

        transporters: {
          create: {
            transporterTransportSignatureDate: new Date(),
            transporterTakenOverAt: new Date(),
            number: 1
          }
        }
      }
    });

    const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);

    await parseBspaohInContext(
      {
        input: {
          destination: {
            operation: { code: "R 1" }
          }
        },
        persisted: preparedExistingBspaoh
      },
      { currentSignatureType: "RECEPTION" }
    );
  });
});
