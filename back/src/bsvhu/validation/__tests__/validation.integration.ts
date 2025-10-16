import {
  Company,
  EcoOrganisme,
  OperationMode,
  TransportMode
} from "@prisma/client";
import { resetDatabase } from "../../../../integration-tests/helper";
import {
  companyFactory,
  ecoOrganismeFactory,
  intermediaryReceiptFactory,
  transporterReceiptFactory
} from "../../../__tests__/factories";
import { CompanySearchResult } from "@td/codegen-back";
import { searchCompany } from "../../../companies/search";
import { BsvhuIdentificationType } from "@prisma/client";
import {
  bsvhuFactory,
  bsvhuTransporterData,
  toIntermediaryCompany
} from "../../__tests__/factories.vhu";
import { ZodBsvhu } from "../schema";
import { BsvhuValidationContext } from "../types";
import { getCurrentSignatureType, prismaToZodBsvhu } from "../helpers";
import { parseBsvhu, parseBsvhuAsync, parseBsvhuTransporterAsync } from "..";
import { ZodError } from "zod";
import { CompanyRole } from "../../../common/validation/zod/schema";

const searchResult = (companyName: string) => {
  return {
    name: companyName,
    address: `Adresse ${companyName}`,
    statutDiffusionEtablissement: "O"
  } as CompanySearchResult;
};

jest.mock("../../../companies/search");

describe("BSVHU validation", () => {
  afterAll(resetDatabase);

  let bsvhu: ZodBsvhu;
  let context: BsvhuValidationContext;
  let foreignTransporter: Company;
  let transporterCompany: Company;
  let intermediaryCompany: Company;
  let ecoOrganisme: EcoOrganisme;
  let brokerCompany: Company;
  let traderCompany: Company;
  beforeAll(async () => {
    const emitterCompany = await companyFactory({ companyTypes: ["PRODUCER"] });
    transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"],
      wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"]
    });
    const nextDestinationCompany = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"],
      wasteVehiclesTypes: ["BROYEUR"]
    });
    foreignTransporter = await companyFactory({
      companyTypes: ["TRANSPORTER"],
      orgId: "IT13029381004",
      vatNumber: "IT13029381004"
    });
    intermediaryCompany = await companyFactory({
      companyTypes: ["INTERMEDIARY"]
    });
    ecoOrganisme = await ecoOrganismeFactory({
      handle: { handleBsvhu: true },
      createAssociatedCompany: true
    });
    brokerCompany = await companyFactory({
      companyTypes: ["BROKER"]
    });
    traderCompany = await companyFactory({
      companyTypes: ["TRADER"]
    });
    const prismaBsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: transporterCompany.siret,
            transporterCompanyVatNumber: transporterCompany.vatNumber
          }
        },
        destinationCompanySiret: destinationCompany.siret,
        destinationOperationNextDestinationCompanySiret:
          nextDestinationCompany.siret,
        ecoOrganismeSiret: ecoOrganisme.siret,
        brokerCompanySiret: brokerCompany.siret,
        traderCompanySiret: traderCompany.siret,
        intermediaries: {
          create: [toIntermediaryCompany(intermediaryCompany)]
        }
      }
    });
    bsvhu = prismaToZodBsvhu(prismaBsvhu);
    context = {
      currentSignatureType: undefined
    };
  });

  describe("BSVHU should be valid", () => {
    test("when there is a foreign transporter vatNumber and transporter siret is null", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterCompanyVatNumber: foreignTransporter.vatNumber,
            transporterCompanySiret: null
          }
        ]
      };
      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test("when there is a foreign transporter and recepisse fields are null", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterCompanyVatNumber: foreignTransporter.vatNumber,
            transporterCompanySiret: null,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null
          }
        ]
      };
      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test("when transporter is french and exemption of recepisse is true", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null
          }
        ]
      };
      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test("when up to 2 plates are provided", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportPlates: ["XY-23-TR", "DF-23-TR"]
          }
        ]
      };
      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test("when transport mode is ROAD and weight is up to 40T", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportMode: "ROAD"
          }
        ],
        weightValue: 40_000 //  40T
      };
      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test.each([
      TransportMode.RAIL,
      TransportMode.AIR,
      TransportMode.RIVER,
      TransportMode.SEA,
      TransportMode.OTHER
    ])("when transport mode is %p and weight is more than 40T", async mode => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportMode: mode
          }
        ],
        weightValue: 50_000
      };
      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test.each([
      TransportMode.RAIL,
      TransportMode.AIR,
      TransportMode.RIVER,
      TransportMode.SEA,
      TransportMode.OTHER
    ])(
      "when transport mode is %p and reception weight is more than 40T",
      async mode => {
        const data: ZodBsvhu = {
          ...bsvhu,
          transporters: [
            {
              ...bsvhu.transporters![0],
              transporterRecepisseIsExempted: true,
              transporterRecepisseDepartment: null,
              transporterRecepisseNumber: null,
              transporterRecepisseValidityLimit: null,
              transporterTransportMode: mode
            }
          ],
          destinationReceptionWeight: 50_000 // more than 40T
        };
        const parsed = parseBsvhu(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
        expect(parsed).toBeDefined();
      }
    );

    test("when transport mode is ROAD and reception weight is up to 40T", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportMode: "ROAD"
          }
        ],
        destinationReceptionWeight: 40_000 // 40 T
      };
      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test("when transport mode is ROAD and reception weight is more than 40T on a bsvhu created before v20250101", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        createdAt: new Date("2024-12-26:00:00.000Z"), // before v20250101
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportMode: "ROAD"
          }
        ],
        destinationReceptionWeight: 50_000 // more than 40T
      };
      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test("when transport mode is ROAD and weight is heavier than 40T on a bsvhu created before v20250101", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        createdAt: new Date("2024-12-26:00:00.000Z"), // before v20250101
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportMode: "ROAD"
          }
        ],
        weightValue: 41_000 // more than 40T
      };

      const parsed = await parseBsvhuAsync(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });

      expect(parsed).toBeDefined();
    });

    test("when identification numbers are not provided on a bsvhu created before v20241001", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        createdAt: new Date("2024-10-21T00:00:00.000"), // before v20241001
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportMode: "ROAD"
          }
        ],
        identificationNumbers: []
      };

      const parsed = await parseBsvhuAsync(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });

      expect(parsed).toBeDefined();
    });

    test.each([
      TransportMode.RAIL,
      TransportMode.AIR,
      TransportMode.RIVER,
      TransportMode.SEA,
      TransportMode.OTHER
    ])("when transport mode is %p and no plate is provided", async mode => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportMode: mode,
            transporterTransportPlates: []
          }
        ]
      };
      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "TRANSPORT"
      });
      expect(parsed).toBeDefined();
    });

    test("when destination agrement number is missing", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationAgrementNumber: null
      };

      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "EMISSION"
      });

      expect(parsed).toBeDefined();
    });
  });

  describe("BSVHU should not be valid", () => {
    test("when emitter siret is not valid", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        emitterCompanySiret: "1"
      };
      expect.assertions(1);

      try {
        parseBsvhu(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Émetteur : 1 n'est pas un SIRET valide"
          })
        ]);
      }
    });

    test("when transporter siret is not valid", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterCompanySiret: "1"
          }
        ]
      };
      expect.assertions(1);

      try {
        parseBsvhu(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Transporteur : 1 n'est pas un SIRET valide"
          })
        ]);
      }
    });

    test("when transporter is not registered in Trackdéchets", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterCompanySiret: "85001946400021"
          }
        ]
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Transporteur : L'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
          })
        ]);
      }
    });

    test("when foreign transporter is not registered in Trackdéchets", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterCompanySiret: null,
            transporterCompanyVatNumber: "ESA15022510"
          }
        ]
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Le transporteur avec le n°de TVA ESA15022510 n'est pas inscrit sur Trackdéchets"
          })
        ]);
      }
    });

    test("when transporter is registered with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterCompanySiret: company.siret
          }
        ]
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              `Le transporteur saisi sur le bordereau (SIRET: ${company.siret}) n'est pas inscrit sur Trackdéchets` +
              " en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau." +
              " Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil de" +
              " l'établissement depuis l'interface Trackdéchets dans Mes établissements"
          })
        ]);
      }
    });

    test("when foreign transporter is registered with wrong profile", async () => {
      const company = await companyFactory({
        companyTypes: ["PRODUCER"],
        orgId: "ESA15022510",
        vatNumber: "ESA15022510"
      });
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterCompanySiret: null,
            transporterCompanyVatNumber: company.vatNumber
          }
        ]
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              `Le transporteur saisi sur le bordereau (numéro de TVA: ${company.vatNumber}) n'est pas inscrit sur Trackdéchets` +
              " en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau." +
              " Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil de" +
              " l'établissement depuis l'interface Trackdéchets dans Mes établissements"
          })
        ]);
      }
    });

    test("when transporter vatNumber is FR", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterCompanyVatNumber: "FR35552049447"
          }
        ]
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Transporteur : Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement"
          })
        ]);
      }
    });

    test("when destination siret is not valid", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationCompanySiret: "1"
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Destination : 1 n'est pas un SIRET valide"
          })
        ]);
      }
    });

    test("when destination is not registered in Trackdéchets", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationCompanySiret: "85001946400021"
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Destination : L'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
          })
        ]);
      }
    });

    test("when destination is registered with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationCompanySiret: company.siret
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Cet établissement n'a pas le profil Installation de traitement de VHU."
          })
        ]);
      }
    });

    test("when next destination is registered with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationOperationNextDestinationCompanySiret: company.siret
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Cet établissement n'a pas le profil Installation de traitement de VHU."
          })
        ]);
      }
    });

    test("when transporter is french but recepisse fields are missing", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: false,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportPlates: ["XY-23-TR"]
          }
        ]
      };
      expect.assertions(1);

      try {
        parseBsvhu(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Le numéro de récépissé du transporteur n° 1 est un champ requis. L'établissement doit renseigner son récépissé dans Trackdéchets"
          }),
          expect.objectContaining({
            message:
              "Le département de récépissé du transporteur n° 1 est un champ requis. L'établissement doit renseigner son récépissé dans Trackdéchets"
          }),
          expect.objectContaining({
            message:
              "La date de validité du récépissé du transporteur n° 1 est un champ requis. L'établissement doit renseigner son récépissé dans Trackdéchets"
          })
        ]);
      }
    });

    test("when ecoOrganisme isn't authorized for BSVHU", async () => {
      const ecoOrg = await ecoOrganismeFactory({
        handle: { handleBsda: true }
      });
      const data: ZodBsvhu = {
        ...bsvhu,
        ecoOrganismeSiret: ecoOrg.siret
      };
      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: `L'éco-organisme avec le SIRET ${ecoOrg.siret} n'est pas autorisé à apparaitre sur un BSVHU`
          })
        ]);
      }
    });

    test("when transport mode is ROAD and weight is heavier than 40T", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportMode: "ROAD"
          }
        ],
        weightValue: 41_000 // more than 40T
      };
      expect.assertions(1);
      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Le poids doit être inférieur à 40 tonnes lorsque le transport se fait par la route"
          })
        ]);
      }
    });

    test("when transport mode is ROAD and no plate is provided", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportMode: "ROAD",
            transporterTransportPlates: []
          }
        ]
      };
      expect.assertions(1);
      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "L'immatriculation du transporteur n° 1 est un champ requis."
          })
        ]);
      }
    });

    test("when provided plate is too short", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportMode: "ROAD",
            transporterTransportPlates: ["abc"]
          }
        ]
      };
      expect.assertions(1);
      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
          })
        ]);
      }
    });

    test("when provided plate is too long", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportMode: "ROAD",
            transporterTransportPlates: ["ABCDEFGHIJKLMNOPQ"]
          }
        ]
      };
      expect.assertions(1);
      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
          })
        ]);
      }
    });

    test("when an astute and lazy user provides a plate number made of whitespace", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportMode: "ROAD",
            transporterTransportPlates: ["     "] // 5 blank spaces
          }
        ]
      };
      expect.assertions(1);
      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Le numéro de plaque fourni est incorrect"
          })
        ]);
      }
    });

    test("when more than 2 plates are provided", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportPlates: ["XY-23-TR", "DF-23-TR", "VG-23-TR"]
          }
        ]
      };
      expect.assertions(1);
      try {
        parseBsvhu(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Un maximum de 2 plaques d'immatriculation est accepté"
          })
        ]);
      }
    });

    test("when transport mode is ROAD and reception weight is heavier than 40T", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportMode: "ROAD"
          }
        ],
        destinationReceptionWeight: 41_000 // more than 40T
      };
      expect.assertions(1);
      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Le poids doit être inférieur à 40 tonnes lorsque le transport se fait par la route"
          })
        ]);
      }
    });

    test.each([
      TransportMode.RAIL,
      TransportMode.AIR,
      TransportMode.RIVER,
      TransportMode.SEA,
      TransportMode.OTHER
    ])(
      "when transport mode is %p and reception weight is more than 50 000 T",
      async mode => {
        const data: ZodBsvhu = {
          ...bsvhu,
          transporters: [
            {
              ...bsvhu.transporters![0],
              transporterRecepisseIsExempted: true,
              transporterRecepisseDepartment: null,
              transporterRecepisseNumber: null,
              transporterRecepisseValidityLimit: null,
              transporterTransportMode: mode
            }
          ],
          weightValue: 1,
          destinationReceptionWeight: 50_000_001 // more than 50 000
        };
        expect.assertions(1);
        try {
          await parseBsvhuAsync(data, {
            ...context,
            currentSignatureType: "TRANSPORT"
          });
        } catch (err) {
          expect((err as ZodError).issues).toEqual([
            expect.objectContaining({
              message: "le poids doit être inférieur à 50000 tonnes"
            })
          ]);
        }
      }
    );

    test("when identification numbers are not provided on a bsvhu created after v20241001", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        transporters: [
          {
            ...bsvhu.transporters![0],
            transporterRecepisseIsExempted: true,
            transporterRecepisseDepartment: null,
            transporterRecepisseNumber: null,
            transporterRecepisseValidityLimit: null,
            transporterTransportMode: "ROAD"
          }
        ],
        identificationNumbers: []
      };

      expect.assertions(1);

      try {
        await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Le détail des identifications est un champ requis."
          })
        ]);
      }
    });
    describe("Emitter transports own waste", () => {
      it("allowed if exemption", async () => {
        const data: ZodBsvhu = {
          ...bsvhu,
          transporters: [
            {
              ...bsvhu.transporters![0],
              transporterCompanySiret: bsvhu.emitterCompanySiret,
              transporterRecepisseIsExempted: true
            }
          ]
        };

        expect.assertions(1);

        const parsed = await parseBsvhuAsync(data, {
          ...context,
          currentSignatureType: "TRANSPORT"
        });
        expect(parsed).toBeDefined();
      });

      it("NOT allowed if no exemption", async () => {
        const data: ZodBsvhu = {
          ...bsvhu,
          transporters: [
            {
              ...bsvhu.transporters![0],
              transporterCompanySiret: bsvhu.emitterCompanySiret,
              transporterRecepisseIsExempted: false
            }
          ]
        };

        expect.assertions(1);

        try {
          await parseBsvhuAsync(data, {
            ...context,
            currentSignatureType: "TRANSPORT"
          });
        } catch (err) {
          expect((err as ZodError).issues).toEqual([
            expect.objectContaining({
              message: `Le transporteur saisi sur le bordereau (SIRET: ${bsvhu.emitterCompanySiret}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements`
            })
          ]);
        }
      });
    });
  });

  describe("Packaging and identificationType", () => {
    test("when deprecated identificationType is used", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        identificationType: "NUMERO_ORDRE_LOTS_SORTANTS"
      };
      expect.assertions(1);

      try {
        parseBsvhu(data, {
          ...context
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "identificationType : La valeur du type d'identification est dépréciée"
          })
        ]);
      }
    });

    test("when packaging is LOT and identificationType is not null", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        packaging: "LOT",
        identificationType: "NUMERO_ORDRE_REGISTRE_POLICE"
      };
      expect.assertions(1);

      try {
        parseBsvhu(data, {
          ...context
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "identificationType : Le type d'identification doit être null quand le conditionnement est en lot"
          })
        ]);
      }
    });

    test("when packaging is LOT and identificationType is null", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        packaging: "LOT",
        identificationType: null
      };

      const parsed = parseBsvhu(data, {
        ...context
      });
      expect(parsed).toBeDefined();
    });

    test("when packaging is UNITE and identificationType is null", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        packaging: "UNITE",
        identificationType: null
      };
      expect.assertions(1);

      try {
        parseBsvhu(data, { ...context });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "identificationType : Le type d'identification est obligatoire quand le conditionnement est en unité"
          })
        ]);
      }
    });

    test.each([
      BsvhuIdentificationType.NUMERO_ORDRE_REGISTRE_POLICE,
      BsvhuIdentificationType.NUMERO_IMMATRICULATION,
      BsvhuIdentificationType.NUMERO_FICHE_DROMCOM
    ])(
      "when packaging is UNITE and identificationType is %p",
      async identificationType => {
        const data: ZodBsvhu = {
          ...bsvhu,
          packaging: "UNITE",
          identificationType
        };

        const parsed = parseBsvhu(data, {
          ...context,
          currentSignatureType: "EMISSION"
        });

        expect(parsed).toBeDefined();
      }
    );
  });

  describe("Operation modes", () => {
    test("should work if operation code & mode are compatible", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationOperationCode: "R 4",
        destinationOperationMode: "RECYCLAGE",
        destinationReceptionWeight: 10,
        destinationReceptionAcceptationStatus: "ACCEPTED",
        destinationOperationDate: new Date()
      };

      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "OPERATION"
      });
      expect(parsed).toBeDefined();
    });

    test("should work if operation code & mode are compatible", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationOperationCode: "D 1",
        destinationOperationMode: "ELIMINATION",
        destinationReceptionWeight: 10,
        destinationReceptionAcceptationStatus: "ACCEPTED",
        destinationOperationDate: new Date()
      };

      const parsed = parseBsvhu(data, {
        ...context,
        currentSignatureType: "OPERATION"
      });
      expect(parsed).not.toBeUndefined();
    });

    test("should not work if operation code & mode are missing", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationOperationCode: undefined,
        destinationOperationMode: undefined,
        destinationReceptionWeight: 10,
        destinationReceptionAcceptationStatus: "ACCEPTED",
        destinationOperationDate: new Date()
      };
      expect.assertions(2);
      try {
        parseBsvhu(data, {
          ...context,
          currentSignatureType: "OPERATION"
        });
      } catch (err) {
        expect((err as ZodError).issues.length).toBeTruthy();
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "L'opération réalisée par le destinataire est un champ requis."
          })
        ]);
      }
    });

    test.each([
      ["R 4", OperationMode.ELIMINATION], // Correct mode is  REUTILISATION | RECYCLAGE
      ["R 12", OperationMode.REUTILISATION] // R12 has no associated mode
    ])(
      "should not be valid if operation mode is not compatible with operation code (mode: %p, code: %p)",
      async (code, mode) => {
        const data: ZodBsvhu = {
          ...bsvhu,
          destinationOperationCode: code,
          destinationOperationMode: mode,
          destinationReceptionWeight: 10,
          destinationReceptionAcceptationStatus: "ACCEPTED",
          destinationOperationDate: new Date()
        };
        expect.assertions(2);

        try {
          parseBsvhu(data, {
            ...context,
            currentSignatureType: "OPERATION"
          });
        } catch (err) {
          expect((err as ZodError).issues.length).toBeTruthy();
          expect((err as ZodError).issues).toEqual([
            expect.objectContaining({
              message:
                "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
            })
          ]);
        }
      }
    );

    test("should fail when operation code has associated operation modes but none is specified", async () => {
      const data: ZodBsvhu = {
        ...bsvhu,
        destinationOperationCode: "R 1",
        destinationOperationMode: undefined,
        destinationReceptionWeight: 10,
        destinationReceptionAcceptationStatus: "ACCEPTED",
        destinationOperationDate: new Date()
      };
      expect.assertions(2);

      try {
        parseBsvhu(data, {
          ...context,
          currentSignatureType: "OPERATION"
        });
      } catch (err) {
        expect((err as ZodError).issues.length).toBeTruthy();
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Vous devez préciser un mode de traitement"
          })
        ]);
      }
    });
  });

  describe("sirenify", () => {
    it("should overwrite `name` and `address` based on SIRENE data if `name` and `address` are provided", async () => {
      const searchResults = {
        [bsvhu.emitterCompanySiret!]: searchResult("émetteur"),
        [bsvhu.transporters![0].transporterCompanySiret!]:
          searchResult("transporteur"),
        [bsvhu.destinationCompanySiret!]: searchResult("destinataire"),
        [intermediaryCompany.siret!]: searchResult("intermédiaire"),
        [ecoOrganisme.siret!]: searchResult("ecoOrganisme"),
        [brokerCompany.siret!]: searchResult("broker"),
        [traderCompany.siret!]: searchResult("trader")
      };
      (searchCompany as jest.Mock).mockImplementation((clue: string) => {
        return Promise.resolve(searchResults[clue]);
      });

      const sirenified = await parseBsvhuAsync(bsvhu, {
        ...context
      });

      expect(sirenified.emitterCompanyName).toEqual(
        searchResults[bsvhu.emitterCompanySiret!].name
      );
      expect(sirenified.emitterCompanyAddress).toEqual(
        searchResults[bsvhu.emitterCompanySiret!].address
      );
      expect(sirenified.transporters![0].transporterCompanyName).toEqual(
        searchResults[bsvhu.transporters![0].transporterCompanySiret!].name
      );
      expect(sirenified.transporters![0].transporterCompanyAddress).toEqual(
        searchResults[bsvhu.transporters![0].transporterCompanySiret!].address
      );
      expect(sirenified.destinationCompanyName).toEqual(
        searchResults[bsvhu.destinationCompanySiret!].name
      );
      expect(sirenified.destinationCompanyAddress).toEqual(
        searchResults[bsvhu.destinationCompanySiret!].address
      );
      expect(sirenified.intermediaries![0].name).toEqual(
        searchResults[intermediaryCompany.siret!].name
      );
      expect(sirenified.intermediaries![0].address).toEqual(
        searchResults[intermediaryCompany.siret!].address
      );
      expect(sirenified.ecoOrganismeName).toEqual(
        searchResults[ecoOrganisme.siret!].name
      );
      expect(sirenified.brokerCompanyName).toEqual(
        searchResults[brokerCompany.siret!].name
      );
      expect(sirenified.traderCompanyName).toEqual(
        searchResults[traderCompany.siret!].name
      );
    });
    it("should not overwrite `name` and `address` based on SIRENE data for sealed fields", async () => {
      const searchResults = {
        [bsvhu.emitterCompanySiret!]: searchResult("émetteur"),
        [bsvhu.transporters![0].transporterCompanySiret!]:
          searchResult("transporteur"),
        [bsvhu.destinationCompanySiret!]: searchResult("destinataire"),
        [intermediaryCompany.siret!]: searchResult("intermédiaire")
      };
      (searchCompany as jest.Mock).mockImplementation((clue: string) => {
        return Promise.resolve(searchResults[clue]);
      });

      const sirenified = await parseBsvhuAsync(
        {
          ...bsvhu,
          emitterEmissionSignatureDate: new Date(),
          transporters: [
            {
              ...bsvhu.transporters![0],
              transporterTransportSignatureDate: new Date()
            }
          ],
          destinationOperationSignatureDate: new Date()
        },
        {
          ...context
        }
      );

      expect(sirenified.emitterCompanyName).toEqual(bsvhu.emitterCompanyName);
      expect(sirenified.emitterCompanyAddress).toEqual(
        bsvhu.emitterCompanyAddress
      );
      expect(sirenified.transporters![0].transporterCompanyName).toEqual(
        bsvhu.transporters![0].transporterCompanyName
      );
      expect(sirenified.transporters![0].transporterCompanyAddress).toEqual(
        bsvhu.transporters![0].transporterCompanyAddress
      );
      expect(sirenified.destinationCompanyName).toEqual(
        bsvhu.destinationCompanyName
      );
      expect(sirenified.destinationCompanyAddress).toEqual(
        bsvhu.destinationCompanyAddress
      );
      expect(sirenified.intermediaries![0].name).toEqual(
        bsvhu.intermediaries![0].name
      );
      expect(sirenified.intermediaries![0].address).toEqual(
        bsvhu.intermediaries![0].address
      );
    });
  });

  describe("BSVHU Recipify Module", () => {
    it("recipify should correctly process transporter and return completedInput with transporter receipt", async () => {
      const receipt = await transporterReceiptFactory({
        company: transporterCompany
      });
      const recipified = await parseBsvhuAsync(bsvhu, {
        ...context
      });
      expect(recipified).toEqual(
        expect.objectContaining({
          transporters: [
            expect.objectContaining({
              transporterRecepisseNumber: receipt.receiptNumber,
              transporterRecepisseDepartment: receipt.department,
              transporterRecepisseValidityLimit: receipt.validityLimit
            })
          ]
        })
      );
    });

    it("recipify should correctly process input with isExempted true and return completedInput without transporter recepisse", async () => {
      const recipified = await parseBsvhuAsync(
        {
          ...bsvhu,
          transporters: [
            {
              ...bsvhu.transporters![0],
              transporterRecepisseIsExempted: true
            }
          ]
        },
        {
          ...context
        }
      );
      expect(recipified).toEqual(
        expect.objectContaining({
          transporters: [
            expect.objectContaining({
              transporterRecepisseNumber: null,
              transporterRecepisseDepartment: null,
              transporterRecepisseValidityLimit: null
            })
          ]
        })
      );
    });

    it("recipify should correctly process broker and trader", async () => {
      const brokerReceipt = await intermediaryReceiptFactory({
        role: CompanyRole.Broker,
        company: brokerCompany
      });
      const traderReceipt = await intermediaryReceiptFactory({
        role: CompanyRole.Trader,
        company: traderCompany
      });
      const recipified = await parseBsvhuAsync(
        {
          ...bsvhu,
          brokerRecepisseNumber: null,
          brokerRecepisseDepartment: null,
          brokerRecepisseValidityLimit: null,
          traderRecepisseNumber: null,
          traderRecepisseDepartment: null,
          traderRecepisseValidityLimit: null
        },
        {
          ...context
        }
      );
      expect(recipified).toEqual(
        expect.objectContaining({
          brokerRecepisseNumber: brokerReceipt.receiptNumber,
          brokerRecepisseDepartment: brokerReceipt.department,
          brokerRecepisseValidityLimit: brokerReceipt.validityLimit,
          traderRecepisseNumber: traderReceipt.receiptNumber,
          traderRecepisseDepartment: traderReceipt.department,
          traderRecepisseValidityLimit: traderReceipt.validityLimit
        })
      );
    });
  });

  describe("getCurrentSignatureType", () => {
    it("getCurrentSignatureType should recursively checks the signature hierarchy", async () => {
      const transporterCompany1 = await companyFactory({
        companyTypes: ["TRANSPORTER"]
      });
      const transporterCompany2 = await companyFactory({
        companyTypes: ["TRANSPORTER"]
      });
      const transporterCompany3 = await companyFactory({
        companyTypes: ["TRANSPORTER"]
      });
      const transporterCompany4 = await companyFactory({
        companyTypes: ["TRANSPORTER"]
      });
      const transporterCompany5 = await companyFactory({
        companyTypes: ["TRANSPORTER"]
      });
      const prismaBsvhu = await bsvhuFactory({
        opt: {
          status: "INITIAL",
          transporters: {
            createMany: {
              data: [
                bsvhuTransporterData(transporterCompany1.siret!, 1),
                bsvhuTransporterData(transporterCompany2.siret!, 2),
                bsvhuTransporterData(transporterCompany3.siret!, 3),
                bsvhuTransporterData(transporterCompany4.siret!, 4),
                bsvhuTransporterData(transporterCompany5.siret!, 5)
              ]
            }
          }
        }
      });
      const bsvhu = prismaToZodBsvhu(prismaBsvhu);
      const currentSignature = getCurrentSignatureType(bsvhu);
      expect(currentSignature).toEqual(undefined);
      const afterEmission = {
        ...bsvhu,
        emitterEmissionSignatureDate: new Date()
      };
      const currentSignature2 = getCurrentSignatureType(afterEmission);
      expect(currentSignature2).toEqual("EMISSION");
      let afterTransport = afterEmission;
      for (let i = 0; i < bsvhu.transporters!.length; i++) {
        afterTransport = {
          ...afterEmission,
          transporters: bsvhu.transporters!.map((t, index) => {
            if (index <= i) {
              return {
                ...t,
                transporterTransportSignatureDate: new Date()
              };
            }
            return t;
          })
        };
        const currentSignature3 = getCurrentSignatureType(afterTransport);
        expect(currentSignature3).toEqual(
          i === 0 ? "TRANSPORT" : `TRANSPORT_${i + 1}`
        );
      }
      const afterOperation = {
        ...afterTransport,
        destinationOperationSignatureDate: new Date()
      };
      const currentSignature4 = getCurrentSignatureType(afterOperation);
      expect(currentSignature4).toEqual("OPERATION");
    });
  });

  describe("BSVHU transporter validation", () => {
    it("should validate transporter plates", async () => {
      const transporterCompany = await companyFactory({
        companyTypes: ["TRANSPORTER"]
      });
      const {
        createdAt,
        transporterTransportSignatureDate,
        transporterTransportTakenOverAt,
        ...transporter
      } = bsvhuTransporterData(transporterCompany.siret!, 1);
      transporter.transporterTransportPlates = [];
      try {
        await parseBsvhuTransporterAsync({
          createdAt: new Date(),
          ...transporter
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message:
              "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
          })
        ]);
      }
      transporter.transporterTransportPlates = ["     "];
      try {
        await parseBsvhuTransporterAsync({
          createdAt: new Date(),
          ...transporter
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Le numéro de plaque fourni est incorrect"
          })
        ]);
      }
      transporter.transporterTransportPlates = [
        "XY-23-TR",
        "DF-23-TR",
        "VG-23-TR"
      ];
      try {
        await parseBsvhuTransporterAsync({
          createdAt: new Date(),
          ...transporter
        });
      } catch (err) {
        expect((err as ZodError).issues).toEqual([
          expect.objectContaining({
            message: "Un maximum de 2 plaques d'immatriculation est accepté"
          })
        ]);
      }
      transporter.transporterTransportPlates = ["XY-23-TR"];
      const parsed = await parseBsvhuTransporterAsync({
        createdAt: new Date(),
        ...transporter
      });
      expect(parsed).toBeDefined();
    });
    it("should recipify transporter plates", async () => {
      const transporterCompany = await companyFactory({
        companyTypes: ["TRANSPORTER"]
      });
      const receipt = await transporterReceiptFactory({
        company: transporterCompany
      });
      const {
        createdAt,
        transporterTransportSignatureDate,
        transporterTransportTakenOverAt,
        ...transporter
      } = bsvhuTransporterData(transporterCompany.siret!, 1);
      const recipified = await parseBsvhuTransporterAsync({
        createdAt: new Date(),
        ...transporter
      });
      expect(recipified).toEqual(
        expect.objectContaining({
          transporterRecepisseNumber: receipt.receiptNumber,
          transporterRecepisseDepartment: receipt.department,
          transporterRecepisseValidityLimit: receipt.validityLimit
        })
      );
    });
    it("should sirenify transporter", async () => {
      const transporterCompany = await companyFactory({
        companyTypes: ["TRANSPORTER"]
      });
      const searchResults = {
        [transporterCompany.siret!]: searchResult("transporteur")
      };
      (searchCompany as jest.Mock).mockImplementation((clue: string) => {
        return Promise.resolve(searchResults[clue]);
      });
      const {
        createdAt,
        transporterTransportSignatureDate,
        transporterTransportTakenOverAt,
        ...transporter
      } = bsvhuTransporterData(transporterCompany.siret!, 1);
      const sirenified = await parseBsvhuTransporterAsync({
        createdAt: new Date(),
        ...transporter
      });
      expect(sirenified).toEqual(
        expect.objectContaining({
          transporterCompanyName: searchResults[transporterCompany.siret!].name,
          transporterCompanyAddress:
            searchResults[transporterCompany.siret!].address
        })
      );
    });
  });
});
