import {
  BsdasriStatus,
  BsdaStatus,
  BsffStatus,
  BspaohStatus,
  BsvhuStatus,
  Company,
  Status,
  User,
  UserRole
} from "@prisma/client";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../integration-tests/helper";
import { getBsdaForElastic, indexBsda } from "../../bsda/elastic";
import {
  bsdaFactory,
  bsdaTransporterFactory
} from "../../bsda/__tests__/factories";
import { getBsdasriForElastic, indexBsdasri } from "../../bsdasris/elastic";
import { bsdasriFactory } from "../../bsdasris/__tests__/factories";
import { getBsffForElastic, indexBsff } from "../../bsffs/elastic";
import {
  createBsff,
  createBsffAfterEmission,
  createBsffAfterReception,
  createBsffAfterTransport,
  createBsffBeforeEmission,
  createFicheIntervention
} from "../../bsffs/__tests__/factories";
import { indexBsvhu } from "../../bsvhu/elastic";
import { bsvhuFactory } from "../../bsvhu/__tests__/factories.vhu";
import { client, index } from "../../common/elastic";
import { getFormForElastic, indexForm } from "../../forms/elastic";
import { WasteRegistryType } from "../../generated/graphql/types";
import {
  bsddTransporterFactory,
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import {
  buildQuery,
  searchBsds as originalSearchBsds,
  toPrismaBsds
} from "../elastic";
import { bspaohFactory } from "../../bspaoh/__tests__/factories";
import { getBspaohForElastic, indexBspaoh } from "../../bspaoh/elastic";

describe("Retrieval of bsds in ES based on waste registry type", () => {
  let emitter: { user: User; company: Company };
  let transporter: { user: User; company: Company };
  let transporter2: { user: User; company: Company };
  let ttr: { user: User; company: Company };
  let destination: { user: User; company: Company };
  let trader: { user: User; company: Company };
  let broker: { user: User; company: Company };
  let worker: { user: User; company: Company };
  let ecoOrganisme: { user: User; company: Company };
  let intermediary: { user: User; company: Company };

  beforeEach(async () => {
    emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["TRANSPORTER"]
      }
    });
    transporter2 = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["TRANSPORTER"]
      }
    });
    ttr = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });
    destination = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["WASTEPROCESSOR"]
      }
    });
    trader = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["WASTEPROCESSOR"]
      }
    });
    broker = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["WASTEPROCESSOR"]
      }
    });
    worker = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    ecoOrganisme = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["ECO_ORGANISME"]
      }
    });
    intermediary = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["TRADER"]
      }
    });
  });
  afterEach(resetDatabase);

  async function searchBsds(registryType: WasteRegistryType, sirets: string[]) {
    const { body } = await client.search({
      index: index.alias,
      body: {
        sort: { createdAt: "ASC" },
        query: buildQuery(registryType, sirets, {})
      }
    });
    return body.hits.hits.map(hit => hit._source);
  }

  // REGISTRE DÉCHETS ENTRANTS
  describe("Incoming", () => {
    it("should list a BSDD in destination's incoming wastes once it has been received", async () => {
      // BSDD after reception
      const form = await formFactory({
        ownerId: emitter.user.id,
        opt: {
          emitterCompanySiret: emitter.company.siret,
          recipientCompanySiret: destination.company.siret,
          status: Status.ACCEPTED,
          receivedAt: new Date(),
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              number: 1
            }
          }
        }
      });

      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("INCOMING", [destination.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
    });

    it("should list a BSDD in ttr's incoming wastes once it has been temp stored", async () => {
      // BSDD after temp storage
      const form = await formWithTempStorageFactory({
        ownerId: emitter.user.id,
        opt: {
          emitterCompanySiret: emitter.company.siret,
          recipientCompanySiret: ttr.company.siret,
          status: Status.TEMP_STORER_ACCEPTED,
          receivedAt: new Date(),
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              number: 1
            }
          }
        },
        forwardedInOpts: {
          recipientCompanySiret: destination.company.siret
        }
      });

      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("INCOMING", [ttr.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
    });

    it("should list a BSDD in final destination's incoming wastes once it has been received", async () => {
      // BSDD after final reception
      const form = await formWithTempStorageFactory({
        ownerId: emitter.user.id,
        opt: {
          emitterCompanySiret: emitter.company.siret,
          recipientCompanySiret: ttr.company.siret,
          status: Status.ACCEPTED,
          receivedAt: new Date(),
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              number: 1
            }
          }
        },
        forwardedInOpts: {
          recipientCompanySiret: destination.company.siret,
          receivedAt: new Date()
        }
      });

      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("INCOMING", [destination.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.forwardedIn!.id]);
    });

    it("should not list a BSDD in destination's incoming wastes before it has been received", async () => {
      // BSDD before reception
      const form = await formFactory({
        ownerId: emitter.user.id,
        opt: {
          emitterCompanySiret: emitter.company.siret,
          recipientCompanySiret: destination.company.siret,
          status: Status.SENT,
          receivedAt: null,
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              number: 1
            }
          }
        }
      });

      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("INCOMING", [destination.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([]);
    });

    it("should list a BSDD in destination's incoming wastes once it has been received", async () => {
      const form = await formFactory({
        ownerId: destination.user.id,
        opt: {
          recipientCompanySiret: destination.company.siret,
          receivedAt: new Date()
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("INCOMING", [destination.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
    });
    it("should not list a BSDD in destination's incoming wastes before it has been received", async () => {
      const form = await formFactory({
        ownerId: destination.user.id,
        opt: {
          recipientCompanySiret: destination.company.siret,
          receivedAt: null
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("INCOMING", [destination.company.siret!]);
      expect(bsds).toEqual([]);
    });
    it("should list a BSDA in destination's incoming wastes once it has been received", async () => {
      const bsda = await bsdaFactory({
        opt: {
          destinationCompanySiret: destination.company.siret,
          destinationReceptionDate: new Date(),
          destinationOperationSignatureDate: new Date()
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("INCOMING", [destination.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
    });
    it("should not list a BSDA in destination's incoming wastes before it has been received", async () => {
      const bsda = await bsdaFactory({
        opt: {
          destinationCompanySiret: destination.company.siret,
          destinationReceptionDate: null,
          destinationOperationSignatureDate: null
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("INCOMING", [destination.company.siret!]);
      expect(bsds).toEqual([]);
    });
    it("should list a BSDASRI in destination's incoming wastes once it has been received", async () => {
      const bsdasri = await bsdasriFactory({
        opt: {
          destinationCompanySiret: destination.company.siret,
          destinationReceptionDate: new Date(),
          destinationReceptionSignatureDate: new Date()
        }
      });
      await indexBsdasri(await getBsdasriForElastic(bsdasri));
      await refreshElasticSearch();
      const bsds = await searchBsds("INCOMING", [destination.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri.id]);
    });
    it("should not list a BSDASRI in destination's incoming wastes before it has been received", async () => {
      const bsdasri = await bsdasriFactory({
        opt: {
          destinationCompanySiret: destination.company.siret,
          destinationReceptionSignatureDate: null
        }
      });
      await indexBsdasri(await getBsdasriForElastic(bsdasri));
      await refreshElasticSearch();
      const bsds = await searchBsds("INCOMING", [destination.company.siret!]);
      expect(bsds).toEqual([]);
    });
    it("should list a BSVHU in destination's incoming wastes once it has been received", async () => {
      const bsvhu = await bsvhuFactory({
        opt: {
          destinationCompanySiret: destination.company.siret,
          destinationReceptionDate: new Date(),
          destinationOperationSignatureDate: new Date()
        }
      });
      await indexBsvhu(bsvhu);
      await refreshElasticSearch();
      const bsds = await searchBsds("INCOMING", [destination.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu.id]);
    });
    it("should not list a BSVHU in destination's incoming wastes before it has been received", async () => {
      const bsvhu = await bsvhuFactory({
        opt: {
          destinationCompanySiret: destination.company.siret,
          destinationOperationSignatureDate: null
        }
      });
      await indexBsvhu(bsvhu);
      await refreshElasticSearch();
      const bsds = await searchBsds("INCOMING", [destination.company.siret!]);
      expect(bsds).toEqual([]);
    });
    it("should list a BSFF in destination's incoming wastes once it has been received", async () => {
      const bsff = await createBsffAfterReception({
        emitter,
        transporter,
        destination
      });
      await indexBsff(await getBsffForElastic(bsff));
      await refreshElasticSearch();
      const bsds = await searchBsds("INCOMING", [destination.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsff.id]);
    });
    it("should not list a BSFF in destination's incoming wastes before it has been received", async () => {
      const bsff = await createBsffAfterEmission({
        emitter,
        transporter,
        destination
      });
      await indexBsff(await getBsffForElastic(bsff));
      await refreshElasticSearch();
      const bsds = await searchBsds("INCOMING", [destination.company.siret!]);
      expect(bsds).toEqual([]);
    });

    it("should list a BSPAOH in destination's incoming wastes once it has been received", async () => {
      // Given
      const bspaoh = await bspaohFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          destinationCompanySiret: destination.company.siret,
          status: BspaohStatus.RECEIVED,
          destinationReceptionSignatureDate: new Date()
        }
      });
      await indexBspaoh(await getBspaohForElastic(bspaoh));
      await refreshElasticSearch();

      // When
      const bsds = await searchBsds("INCOMING", [destination.company.siret!]);

      // Then
      expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh.id]);
    });
    it("should not list a BSPAOH in destination's incoming wastes before it has been received", async () => {
      // Given
      const bspaoh = await bspaohFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          destinationCompanySiret: destination.company.siret,
          status: BspaohStatus.SENT,
          transporterTransportTakenOverAt: new Date(),
          destinationReceptionSignatureDate: null
        }
      });
      await indexBspaoh(await getBspaohForElastic(bspaoh));
      await refreshElasticSearch();

      // When
      const bsds = await searchBsds("INCOMING", [destination.company.siret!]);

      // Then
      expect(bsds).toEqual([]);
    });
  });

  // REGISTRE DÉCHETS SORTANTS
  describe("Outgoing", () => {
    it("should list a BSDD in emitter's outgoing wastes once it has been sent", async () => {
      const form = await formFactory({
        ownerId: emitter.user.id,
        opt: {
          emitterCompanySiret: emitter.company.siret,
          sentAt: new Date()
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [emitter.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
    });

    it("should list a BSDD in eco-organisme's outgoing wastes once it has been sent", async () => {
      const form = await formFactory({
        ownerId: emitter.user.id,
        opt: {
          ecoOrganismeSiret: ecoOrganisme.company.siret,
          sentAt: new Date()
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [ecoOrganisme.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
    });

    it("should not list a BSDD in emitter's outgoing wastes before it has been sent", async () => {
      const form = await formFactory({
        ownerId: emitter.user.id,
        opt: {
          emitterCompanySiret: emitter.company.siret,
          sentAt: null
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [emitter.company.siret!]);
      expect(bsds).toEqual([]);
    });
    it("should list a BSDD in ttr's outgoing wastes once it has been sent after temporary storage", async () => {
      const form = await formWithTempStorageFactory({
        ownerId: emitter.user.id,
        opt: {
          emitterCompanySiret: emitter.company.siret,
          recipientCompanySiret: ttr.company.siret,
          status: Status.RESENT,
          receivedAt: new Date(),
          signedAt: new Date(),
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              number: 1
            }
          }
        },
        forwardedInOpts: {
          emitterCompanySiret: ttr.company.siret,
          recipientCompanySiret: destination.company.siret,
          sentAt: new Date(),
          status: Status.SENT
        }
      });

      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [ttr.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.forwardedIn!.id]);
    });
    it("should list a BSDA in emitter's outgoing wastes once it has been sent", async () => {
      const bsda = await bsdaFactory({
        opt: {
          status: "SENT",
          emitterCompanySiret: emitter.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        },
        transporterOpt: {
          transporterTransportTakenOverAt: new Date(),
          transporterTransportSignatureDate: new Date()
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [emitter.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
    });

    it("should list a BSDA in ecoOrganisme's outgoing wastes once it has been sent", async () => {
      const bsda = await bsdaFactory({
        opt: {
          status: "SENT",
          ecoOrganismeSiret: ecoOrganisme.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        },
        transporterOpt: {
          transporterTransportTakenOverAt: new Date(),
          transporterTransportSignatureDate: new Date()
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [ecoOrganisme.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
    });

    it("should not list a BSDA in emitter's outgoing wastes before it has been sent", async () => {
      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          emitterEmissionSignatureDate: null,
          transporterTransportSignatureDate: null
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [emitter.company.siret!]);
      expect(bsds).toEqual([]);
    });
    it("should list a BSDA in worker's outgoing wastes once it has been sent", async () => {
      const bsda = await bsdaFactory({
        opt: {
          status: "SENT",
          workerCompanySiret: worker.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        },
        transporterOpt: {
          transporterTransportTakenOverAt: new Date(),
          transporterTransportSignatureDate: new Date()
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [worker.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
    });
    it("should not list a BSDA in worker's outgoing wastes before it has been sent", async () => {
      const bsda = await bsdaFactory({
        opt: {
          workerCompanySiret: worker.company.siret,
          emitterEmissionSignatureDate: null,
          transporterTransportSignatureDate: null
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [worker.company.siret!]);
      expect(bsds).toEqual([]);
    });
    it("should list a BSDASRI in emitter's outgoing wastes once it has been sent", async () => {
      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        }
      });
      await indexBsdasri(await getBsdasriForElastic(bsdasri));
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [emitter.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri.id]);
    });

    it("should list a BSDASRI in ecoOrganisme's outgoing wastes once it has been sent", async () => {
      const bsdasri = await bsdasriFactory({
        opt: {
          ecoOrganismeSiret: ecoOrganisme.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        }
      });
      await indexBsdasri(await getBsdasriForElastic(bsdasri));
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [ecoOrganisme.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri.id]);
    });

    it("should not list a BSDASRI in emitter's outgoing wastes before it has been sent", async () => {
      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          emitterEmissionSignatureDate: null,
          transporterTransportSignatureDate: null
        }
      });
      await indexBsdasri(await getBsdasriForElastic(bsdasri));
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [emitter.company.siret!]);
      expect(bsds).toEqual([]);
    });
    it("should list a BSVHU in emitter's outgoing wastes once it has been sent", async () => {
      const bsvhu = await bsvhuFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        }
      });
      await indexBsvhu(bsvhu);
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [emitter.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu.id]);
    });
    it("should not list a BSVHU in emitter's outgoing wastes before it has been sent", async () => {
      const bsvhu = await bsvhuFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          emitterEmissionSignatureDate: null,
          transporterTransportSignatureDate: null
        }
      });
      await indexBsvhu(bsvhu);
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [emitter.company.siret!]);
      expect(bsds).toEqual([]);
    });
    it("should list a BSFF in emitter's outgoing wastes once it has been sent", async () => {
      const bsff = await createBsffAfterTransport({
        emitter,
        transporter,
        destination
      });
      await indexBsff(await getBsffForElastic(bsff));
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [emitter.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsff.id]);
    });

    it("should list a BSFF in detenteur's outgoing wastes once it has been sent", async () => {
      const detenteur = await userWithCompanyFactory("MEMBER");
      const ficheIntervention = await createFicheIntervention({
        detenteur,
        operateur: emitter
      });
      const bsff = await createBsffAfterTransport(
        {
          emitter,
          transporter,
          destination
        },
        {
          data: {
            detenteurCompanySirets: [detenteur.company.siret!],
            ficheInterventions: { connect: { id: ficheIntervention.id } },
            transporterTransportSignatureDate: new Date()
          },
          transporterData: {
            transporterTransportSignatureDate: new Date()
          }
        }
      );

      await indexBsff(await getBsffForElastic(bsff));
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [detenteur.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsff.id]);
    });

    it("should not list a BSFF in emitter's outgoing wastes before it has been sent", async () => {
      const bsff = await createBsffBeforeEmission({
        emitter,
        transporter,
        destination
      });
      await indexBsff(await getBsffForElastic(bsff));
      await refreshElasticSearch();
      const bsds = await searchBsds("OUTGOING", [emitter.company.siret!]);
      expect(bsds).toEqual([]);
    });
  });

  // REGISTRE DÉCHETS TRANSPORTÉS
  describe("Transported", () => {
    it("should list a BSDD in transporter's transported wastes once it has been taken over", async () => {
      const form = await formFactory({
        ownerId: transporter.user.id,
        opt: {
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              number: 1,
              takenOverAt: new Date()
            }
          }
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("TRANSPORTED", [
        transporter.company.siret!
      ]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
    });
    it("should list a BSDD in 2nd transporter transported wastes once it has been taken over", async () => {
      const form = await formFactory({
        ownerId: transporter.user.id
      });
      await bsddTransporterFactory({
        formId: form.id,
        opts: {
          transporterCompanySiret: transporter2.company.siret,
          takenOverAt: new Date()
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("TRANSPORTED", [
        transporter2.company.siret!
      ]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
    });
    it("should not list a BSDD in transporter' transported wastes before it has been taken over", async () => {
      const form = await formFactory({
        ownerId: transporter.user.id,
        opt: {
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              number: 1,
              takenOverAt: null
            }
          }
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("TRANSPORTED", [
        transporter.company.siret!
      ]);
      expect(bsds).toEqual([]);
    });
    it("should not list a BSDD in 2nd transporter transported before it has been taken over", async () => {
      const form = await formFactory({
        ownerId: transporter.user.id
      });
      await bsddTransporterFactory({
        formId: form.id,
        opts: {
          transporterCompanySiret: transporter2.company.siret,
          takenOverAt: null
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("TRANSPORTED", [
        transporter2.company.siret!
      ]);
      expect(bsds.map(bsd => bsd.id)).toEqual([]);
    });
    it("should list a BSDD in transporter's transported wastes once it has been resent after temp storage", async () => {
      const form = await formWithTempStorageFactory({
        ownerId: emitter.user.id,
        opt: {
          emitterCompanySiret: emitter.company.siret,
          recipientCompanySiret: ttr.company.siret,
          status: Status.RESENT,
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              number: 1,
              takenOverAt: new Date()
            }
          }
        },
        forwardedInOpts: {
          recipientCompanySiret: destination.company.siret,
          status: Status.SENT,
          transporters: {
            create: {
              transporterCompanySiret: transporter2.company.siret,
              number: 1,
              takenOverAt: new Date()
            }
          }
        }
      });

      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("TRANSPORTED", [
        transporter2.company.siret!
      ]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.forwardedIn!.id]);
    });
    it("should list a BSDA in transporter's transported wastes once it has been taken over", async () => {
      const bsda = await bsdaFactory({
        opt: {
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        },
        transporterOpt: {
          transporterCompanySiret: transporter.company.siret,
          transporterTransportSignatureDate: new Date()
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("TRANSPORTED", [
        transporter.company.siret!
      ]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
    });
    it("should list a BSDA in 2nd transporter's transported wastes once it has been taken over", async () => {
      const bsda = await bsdaFactory({
        opt: {
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        },
        transporterOpt: {
          transporterCompanySiret: transporter.company.siret,
          transporterTransportSignatureDate: new Date()
        }
      });
      await bsdaTransporterFactory({
        bsdaId: bsda.id,
        opts: {
          transporterCompanySiret: transporter2.company.siret,
          transporterTransportSignatureDate: new Date()
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("TRANSPORTED", [
        transporter2.company.siret!
      ]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
    });

    it("should not list a BSDA in transporter'transported wastes before it has been taken over", async () => {
      const bsda = await bsdaFactory({
        opt: {
          emitterEmissionSignatureDate: null,
          transporterTransportSignatureDate: null
        },
        transporterOpt: {
          transporterCompanySiret: transporter.company.siret,
          transporterTransportSignatureDate: null
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("TRANSPORTED", [
        transporter.company.siret!
      ]);
      expect(bsds).toEqual([]);
    });

    it("should not list a BSDA in 2nd transporter's transported wastes before it has been taken over", async () => {
      const bsda = await bsdaFactory({
        opt: {
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        },
        transporterOpt: {
          transporterCompanySiret: transporter.company.siret,
          transporterTransportSignatureDate: new Date()
        }
      });
      await bsdaTransporterFactory({
        bsdaId: bsda.id,
        opts: {
          transporterCompanySiret: transporter2.company.siret,
          transporterTransportSignatureDate: null
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("TRANSPORTED", [
        transporter2.company.siret!
      ]);
      expect(bsds.map(bsd => bsd.id)).toEqual([]);
    });

    it("should list a BSDASRI in transporter's transported wastes once it has been taken over", async () => {
      const bsdasri = await bsdasriFactory({
        opt: {
          transporterCompanySiret: transporter.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        }
      });
      await indexBsdasri(await getBsdasriForElastic(bsdasri));
      await refreshElasticSearch();
      const bsds = await searchBsds("TRANSPORTED", [
        transporter.company.siret!
      ]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri.id]);
    });
    it("should not list a BSDASRI in transporter'transported wastes before it has been taken over", async () => {
      const bsdasri = await bsdasriFactory({
        opt: {
          transporterCompanySiret: transporter.company.siret,
          emitterEmissionSignatureDate: null,
          transporterTransportSignatureDate: null
        }
      });
      await indexBsdasri(await getBsdasriForElastic(bsdasri));
      await refreshElasticSearch();
      const bsds = await searchBsds("TRANSPORTED", [
        transporter.company.siret!
      ]);
      expect(bsds).toEqual([]);
    });
    it("should list a BSVHU in transporter's transported wastes once it has been taken over", async () => {
      const bsvhu = await bsvhuFactory({
        opt: {
          transporterCompanySiret: transporter.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        }
      });
      await indexBsvhu(bsvhu);
      await refreshElasticSearch();
      const bsds = await searchBsds("TRANSPORTED", [
        transporter.company.siret!
      ]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu.id]);
    });
    it("should not list a BSVHU in transporter'transported wastes before it has been delivered", async () => {
      const bsvhu = await bsvhuFactory({
        opt: {
          transporterCompanySiret: transporter.company.siret,
          emitterEmissionSignatureDate: null,
          transporterTransportSignatureDate: null
        }
      });
      await indexBsvhu(bsvhu);
      await refreshElasticSearch();
      const bsds = await searchBsds("TRANSPORTED", [
        transporter.company.siret!
      ]);
      expect(bsds).toEqual([]);
    });
    it("should list a BSFF in transporter's transported wastes once it has been taken over", async () => {
      const bsff = await createBsffAfterTransport({
        emitter,
        transporter,
        destination
      });
      await indexBsff(await getBsffForElastic(bsff));
      await refreshElasticSearch();
      const bsds = await searchBsds("TRANSPORTED", [
        transporter.company.siret!
      ]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsff.id]);
    });
    it("should not list a BSFF in transporter'transported wastes before it has been taken over", async () => {
      const bsff = await createBsffBeforeEmission({
        emitter,
        transporter,
        destination
      });
      await indexBsff(await getBsffForElastic(bsff));
      await refreshElasticSearch();
      const bsds = await searchBsds("TRANSPORTED", [
        transporter.company.siret!
      ]);
      expect(bsds).toEqual([]);
    });
  });

  // REGISTRE DÉCHETS GÉRÉS
  describe("Managed", () => {
    it("should list a BSDD in trader's managed wastes after it has been sent", async () => {
      const form = await formFactory({
        ownerId: trader.user.id,
        opt: {
          traderCompanySiret: trader.company.siret,
          sentAt: new Date()
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("MANAGED", [trader.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
    });
    it("should list a BSDD in broker's managed wastes after it has been sent", async () => {
      const form = await formFactory({
        ownerId: broker.user.id,
        opt: {
          brokerCompanySiret: broker.company.siret,
          sentAt: new Date()
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("MANAGED", [broker.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
    });

    it("should list a BSDD in intermediary's managed wastes before it has been sent", async () => {
      const form = await formFactory({
        ownerId: broker.user.id,
        opt: {
          intermediaries: {
            create: {
              siret: intermediary!.company!.siret!,
              name: "Intermédiaire",
              contact: "M Intermédiaire"
            }
          },
          sentAt: new Date()
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("MANAGED", [intermediary.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
    });

    it("should not list a BSDD in trader's managed wastes before it has been sent", async () => {
      const form = await formFactory({
        ownerId: trader.user.id,
        opt: {
          traderCompanySiret: trader.company.siret,
          sentAt: null
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("MANAGED", [trader.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([]);
    });
    it("should not list a BSDD in broker's managed wastes before it has been sent", async () => {
      const form = await formFactory({
        ownerId: broker.user.id,
        opt: {
          brokerCompanySiret: broker.company.siret,
          sentAt: null
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("MANAGED", [broker.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([]);
    });
    it("should list a BSDA in broker's managed wastes after it has been sent", async () => {
      const bsda = await bsdaFactory({
        opt: {
          status: "SENT",
          brokerCompanySiret: broker.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        },
        transporterOpt: {
          transporterTransportTakenOverAt: new Date(),
          transporterTransportSignatureDate: new Date()
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("MANAGED", [broker.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
    });

    it("should list a BSDA in intermediary's managed wastes after it has been sent", async () => {
      const bsda = await bsdaFactory({
        opt: {
          status: "SENT",
          intermediaries: {
            create: {
              siret: intermediary!.company!.siret!,
              name: "Intermédiaire",
              contact: "M Intermédiaire"
            }
          },
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        },
        transporterOpt: {
          transporterTransportTakenOverAt: new Date(),
          transporterTransportSignatureDate: new Date()
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("MANAGED", [intermediary.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
    });

    it("should not list a BSDA in broker's managed wastes before it has been sent", async () => {
      const bsda = await bsdaFactory({
        opt: {
          brokerCompanySiret: broker.company.siret,
          emitterEmissionSignatureDate: null,
          transporterTransportSignatureDate: null
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("MANAGED", [broker.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([]);
    });
  });

  // REGISTRE EXHAUSTIF
  describe("All", () => {
    it("should list a BSDD in emitter's all wastes as soon as transporter has signed", async () => {
      const form = await formFactory({
        ownerId: emitter.user.id,
        opt: {
          emitterCompanySiret: emitter.company.siret,
          sentAt: new Date()
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [emitter.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
    });
    it("should list a BSDD in transporter's all wastes", async () => {
      const form = await formFactory({
        ownerId: transporter.user.id,
        opt: {
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              number: 1,
              takenOverAt: new Date()
            }
          }
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [transporter.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
    });
    it("should list a BSDD in destination's all wastes as soon as transporter has signed", async () => {
      // Given
      const form = await formFactory({
        ownerId: destination.user.id,
        opt: {
          recipientCompanySiret: destination.company.siret,
          status: Status.SENT,
          sentAt: new Date()
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();

      // When
      const bsds = await searchBsds("ALL", [destination.company.siret!]);

      // Then
      expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
    });
    it("should NOT list a BSDD in destination's all wastes if transporter hasn't signed", async () => {
      // Given
      const form = await formFactory({
        ownerId: destination.user.id,
        opt: {
          recipientCompanySiret: destination.company.siret,
          status: Status.DRAFT,
          sentAt: null,
          sentBy: null
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();

      // When
      const bsds = await searchBsds("ALL", [destination.company.siret!]);

      // Then
      expect(bsds).toEqual([]);
    });
    it("should list a BSDD in trader's all wastes", async () => {
      const form = await formFactory({
        ownerId: trader.user.id,
        opt: {
          traderCompanySiret: trader.company.siret,
          sentAt: new Date()
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [trader.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
    });
    it("should list a BSDD in broker's all wastes", async () => {
      const form = await formFactory({
        ownerId: broker.user.id,
        opt: {
          brokerCompanySiret: broker.company.siret
        }
      });
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [broker.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
    });
    it("should list a BSDD in ttr's all wastes", async () => {
      const form = await formWithTempStorageFactory({
        ownerId: ttr.user.id,
        opt: {
          recipientCompanySiret: ttr.company.siret,
          sentAt: new Date(),
          receivedAt: new Date()
        }
      });

      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [ttr.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
    });
    it("should list a BSDD in transporter after temp storage 's all wastes", async () => {
      const form = await formWithTempStorageFactory({
        ownerId: emitter.user.id,
        forwardedInOpts: {
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              number: 1,
              takenOverAt: new Date()
            }
          }
        }
      });

      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [transporter.company.siret!]);
      const ids = bsds.map(bsd => bsd.id);
      expect(ids).toContain(form.forwardedIn!.id);
    });
    it("should list a BSDD in final destination's all wastes", async () => {
      const form = await formWithTempStorageFactory({
        ownerId: emitter.user.id,
        forwardedInOpts: {
          recipientCompanySiret: destination.company.siret,
          sentAt: new Date()
        }
      });

      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [destination.company.siret!]);
      const ids = bsds.map(bsd => bsd.id);
      expect(ids).toContain(form.forwardedIn!.id);
    });
    it("should list a BSDA in destination's all wastes as soon as transporter has signed", async () => {
      // Given
      const bsda = await bsdaFactory({
        opt: {
          status: BsdaStatus.SENT,
          emitterCompanySiret: emitter.company.siret,
          destinationCompanySiret: destination.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        },
        transporterOpt: {
          transporterTransportSignatureDate: new Date(),
          transporterTransportTakenOverAt: new Date()
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();

      // When
      const bsds = await searchBsds("ALL", [destination.company.siret!]);

      // Then
      expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
    });
    it("should NOT list a BSDA in destination's all wastes if transporter hasn't signed", async () => {
      // Given
      const bsda = await bsdaFactory({
        opt: {
          status: BsdaStatus.INITIAL,
          emitterCompanySiret: emitter.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: null
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();

      // When
      const bsds = await searchBsds("ALL", [destination.company.siret!]);

      // Then
      expect(bsds).toEqual([]);
    });
    it("should list a BSDA in emitter's all wastes", async () => {
      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        },
        transporterOpt: {
          transporterTransportSignatureDate: new Date(),
          transporterTransportTakenOverAt: new Date()
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [emitter.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
    });
    it("should list a BSDA in transporter's all wastes", async () => {
      const bsda = await bsdaFactory({
        opt: {
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        },
        transporterOpt: {
          transporterCompanySiret: transporter.company.siret,
          transporterTransportSignatureDate: new Date()
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [transporter.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
    });
    it("should list a BSDA in broker's all wastes", async () => {
      const bsda = await bsdaFactory({
        opt: {
          brokerCompanySiret: broker.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        },
        transporterOpt: {
          transporterTransportSignatureDate: new Date(),
          transporterTransportTakenOverAt: new Date()
        }
      });
      const bsdaForElastic = await getBsdaForElastic(bsda);
      await indexBsda(bsdaForElastic);
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [broker.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
    });
    it("should list a BSDASRI in destination's all wastes as soon as transporter has signed", async () => {
      // Given
      const bsdasri = await bsdasriFactory({
        opt: {
          status: BsdasriStatus.SENT,
          emitterCompanySiret: emitter.company.siret,
          destinationCompanySiret: destination.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        }
      });
      await indexBsdasri(await getBsdasriForElastic(bsdasri));
      await refreshElasticSearch();

      // When
      const bsds = await searchBsds("ALL", [destination.company.siret!]);

      // Then
      expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri.id]);
    });
    it("should NOT list a BSDASRI in destination's all wastes if transporter hasn't signed", async () => {
      // Given
      const bsdasri = await bsdasriFactory({
        opt: {
          status: BsdasriStatus.INITIAL,
          emitterCompanySiret: emitter.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: null
        }
      });
      await indexBsdasri(await getBsdasriForElastic(bsdasri));
      await refreshElasticSearch();

      // When
      const bsds = await searchBsds("ALL", [destination.company.siret!]);

      // Then
      expect(bsds).toEqual([]);
    });
    it("should list a BSDASRI in emitter's all wastes", async () => {
      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        }
      });
      await indexBsdasri(await getBsdasriForElastic(bsdasri));
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [emitter.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri.id]);
    });
    it("should list a BSDASRI in transporter's all wastes", async () => {
      const bsdasri = await bsdasriFactory({
        opt: {
          transporterCompanySiret: transporter.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        }
      });
      await indexBsdasri(await getBsdasriForElastic(bsdasri));
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [transporter.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri.id]);
    });
    it("should list a BSDASRI in destination's all wastes", async () => {
      const bsdasri = await bsdasriFactory({
        opt: {
          destinationCompanySiret: destination.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date(),
          destinationReceptionSignatureDate: new Date()
        }
      });
      await indexBsdasri(await getBsdasriForElastic(bsdasri));
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [destination.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri.id]);
    });
    it("should list a BSVHU in destination's all wastes as soon as transporter has signed", async () => {
      // Given
      const bsvhu = await bsvhuFactory({
        opt: {
          status: BsvhuStatus.SENT,
          emitterCompanySiret: emitter.company.siret,
          destinationCompanySiret: destination.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        }
      });
      await indexBsvhu(bsvhu);
      await refreshElasticSearch();

      // When
      const bsds = await searchBsds("ALL", [destination.company.siret!]);

      // Then
      expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu.id]);
    });
    it("should NOT list a BSVHU in destination's all wastes if transporter hasn't signed", async () => {
      // Given
      const bsvhu = await bsvhuFactory({
        opt: {
          status: BsvhuStatus.INITIAL,
          emitterCompanySiret: emitter.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: null
        }
      });
      await indexBsvhu(bsvhu);
      await refreshElasticSearch();

      // When
      const bsds = await searchBsds("ALL", [destination.company.siret!]);

      // Then
      expect(bsds).toEqual([]);
    });
    it("should list a BSVHU in emitter's all wastes", async () => {
      const bsvhu = await bsvhuFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        }
      });
      await indexBsvhu(bsvhu);
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [emitter.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu.id]);
    });
    it("should list a BSVHU in transporter's all wastes", async () => {
      const bsvhu = await bsvhuFactory({
        opt: {
          transporterCompanySiret: transporter.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date()
        }
      });
      await indexBsvhu(bsvhu);
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [transporter.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu.id]);
    });
    it("should list a BSVHU in destination's all wastes", async () => {
      const bsvhu = await bsvhuFactory({
        opt: {
          destinationCompanySiret: destination.company.siret,
          emitterEmissionSignatureDate: new Date(),
          transporterTransportSignatureDate: new Date(),
          destinationOperationSignatureDate: new Date()
        }
      });
      await indexBsvhu(bsvhu);
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [destination.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu.id]);
    });
    it("should list a BSFF in destination's all wastes as soon as transporter has signed", async () => {
      // Given
      const bsff = await createBsff(
        {
          emitter,
          transporter,
          destination
        },
        {
          data: {
            status: BsffStatus.SENT,
            emitterEmissionSignatureDate: new Date(),
            transporterTransportSignatureDate: new Date()
          },
          transporterData: {
            transporterTransportSignatureDate: new Date()
          }
        }
      );
      await indexBsff(await getBsffForElastic(bsff));
      await refreshElasticSearch();

      // When
      const bsds = await searchBsds("ALL", [destination.company.siret!]);

      // Then
      expect(bsds.map(bsd => bsd.id)).toEqual([bsff.id]);
    });
    it("should NOT list a BSFF in destination's all wastes if transporter hasn't signed", async () => {
      // Given
      const bsff = await createBsff(
        {
          emitter,
          transporter,
          destination
        },
        {
          data: {
            status: BsffStatus.INITIAL,
            emitterEmissionSignatureDate: new Date(),
            transporterTransportSignatureDate: null
          },
          transporterData: {
            transporterTransportSignatureDate: null
          }
        }
      );
      await indexBsff(await getBsffForElastic(bsff));
      await refreshElasticSearch();

      // When
      const bsds = await searchBsds("ALL", [destination.company.siret!]);

      // Then
      expect(bsds).toEqual([]);
    });
    it("should list a BSFF in emitter's all wastes", async () => {
      const bsff = await createBsff(
        {
          emitter,
          transporter,
          destination
        },
        {
          data: {
            emitterEmissionSignatureDate: new Date(),
            transporterTransportSignatureDate: new Date()
          },
          transporterData: {
            transporterTransportSignatureDate: new Date()
          }
        }
      );
      await indexBsff(await getBsffForElastic(bsff));
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [emitter.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsff.id]);
    });
    it("should list a BSFF in transporter's all wastes", async () => {
      const bsff = await createBsff(
        {
          emitter,
          transporter,
          destination
        },
        {
          data: {
            emitterEmissionSignatureDate: new Date(),
            transporterTransportSignatureDate: new Date()
          },
          transporterData: {
            transporterTransportSignatureDate: new Date()
          }
        }
      );
      await indexBsff(await getBsffForElastic(bsff));
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [transporter.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsff.id]);
    });
    it("should list a BSFF in destination's all wastes", async () => {
      const bsff = await createBsff(
        {
          emitter,
          transporter,
          destination
        },
        {
          data: {
            emitterEmissionSignatureDate: new Date(),
            transporterTransportSignatureDate: new Date(),
            destinationReceptionSignatureDate: new Date()
          },
          transporterData: {
            transporterTransportSignatureDate: new Date()
          }
        }
      );
      await indexBsff(await getBsffForElastic(bsff));
      await refreshElasticSearch();
      const bsds = await searchBsds("ALL", [destination.company.siret!]);
      expect(bsds.map(bsd => bsd.id)).toEqual([bsff.id]);
    });

    it("should list a BSPAOH in destination's all wastes as soon as transporter has signed", async () => {
      // Given
      const bspaoh = await bspaohFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          destinationCompanySiret: destination.company.siret,
          status: BspaohStatus.SENT,
          emitterEmissionSignatureDate: new Date(),
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              transporterTransportPlates: ["AA-00-XX"],
              transporterTransportSignatureDate: new Date(),
              number: 1
            }
          }
        }
      });
      await indexBspaoh(await getBspaohForElastic(bspaoh));
      await refreshElasticSearch();

      // When
      const bsds = await searchBsds("ALL", [destination.company.siret!]);

      // Then
      expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh.id]);
    });
    it("should NOT list a BSPAOH in destination's all wastes if transporter hasn't signed", async () => {
      // Given
      const bspaoh = await bspaohFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          destinationCompanySiret: destination.company.siret,
          status: BspaohStatus.INITIAL,
          transporterTransportTakenOverAt: null
        }
      });
      await indexBspaoh(await getBspaohForElastic(bspaoh));
      await refreshElasticSearch();

      // When
      const bsds = await searchBsds("ALL", [destination.company.siret!]);

      // Then
      expect(bsds).toEqual([]);
    });
    it("should list a BSPAOH in emitter's all wastes", async () => {
      // Given
      const bspaoh = await bspaohFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          destinationCompanySiret: destination.company.siret,
          status: BspaohStatus.SENT,
          emitterEmissionSignatureDate: new Date(),
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              transporterTransportPlates: ["AA-00-XX"],
              transporterTransportSignatureDate: new Date(),
              number: 1
            }
          }
        }
      });
      await indexBspaoh(await getBspaohForElastic(bspaoh));
      await refreshElasticSearch();

      // When
      const bsds = await searchBsds("ALL", [emitter.company.siret!]);

      // Then
      expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh.id]);
    });
    it("should list a BSPAOH in transporter's all wastes", async () => {
      // Given
      const bspaoh = await bspaohFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          destinationCompanySiret: destination.company.siret,
          status: BspaohStatus.SENT,
          emitterEmissionSignatureDate: new Date(),
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              transporterTransportPlates: ["AA-00-XX"],
              transporterTransportSignatureDate: new Date(),
              number: 1
            }
          }
        }
      });
      await indexBspaoh(await getBspaohForElastic(bspaoh));
      await refreshElasticSearch();

      // When
      const bsds = await searchBsds("ALL", [transporter.company.siret!]);

      // Then
      expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh.id]);
    });
  });

  it.only("BSDA should contain forwardedIn", async () => {
    // Given
    const forwardedInNextDestination = await companyFactory({
      name: "ForwardedIn next destination",
      address: "25 rue Voltaire 37100 TOURS"
    });
    const bsda = await bsdaFactory({
      opt: {
        brokerCompanySiret: broker.company.siret,
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      },
      transporterOpt: {
        transporterTransportSignatureDate: new Date(),
        transporterTransportTakenOverAt: new Date()
      }
    });
    await bsdaFactory({
      opt: {
        forwarding: { connect: { id: bsda.id } },
        destinationCompanySiret: forwardedInNextDestination.siret
      }
    });

    // When
    const bsdaForElastic = await getBsdaForElastic(bsda);
    await indexBsda(bsdaForElastic);
    await refreshElasticSearch();
    const bsds = await originalSearchBsds(
      "ALL",
      [broker.company.siret!],
      null,
      {
        size: 10,
        sort: [{ readableId: "ASC" }]
      }
    );
    const prismaBsds = await toPrismaBsds(
      bsds.hits.map(hit => hit._source).filter(Boolean)
    );

    // Then
    expect(prismaBsds.bsdas.length).toEqual(1);
    const bsd = prismaBsds.bsdas[0];
    expect(bsd?.id).toEqual(bsda.id);
    expect(bsd?.forwardedIn).not.toBeNull();
    expect(bsd?.forwardedIn).not.toBeUndefined();
    expect(bsd?.forwardedIn?.destinationCompanySiret).toEqual(
      forwardedInNextDestination.siret
    );
  });
});
