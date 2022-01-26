import { Company, Status, User, UserRole } from "@prisma/client";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../integration-tests/helper";
import { indexBsda } from "../../bsda/elastic";
import { bsdaFactory } from "../../bsda/__tests__/factories";
import { indexBsdasri } from "../../bsdasris/elastic";
import { bsdasriFactory } from "../../bsdasris/__tests__/factories";
import { indexBsff } from "../../bsffs/elastic";
import {
  createBsff,
  createBsffAfterEmission,
  createBsffAfterReception,
  createBsffAfterTransport,
  createBsffBeforeEmission
} from "../../bsffs/__tests__/factories";
import { indexBsvhu } from "../../bsvhu/elastic";
import { vhuFormFactory } from "../../bsvhu/__tests__/factories.vhu";
import { client, index } from "../../common/elastic";
import { getFullForm } from "../../forms/database";
import { indexForm } from "../../forms/elastic";
import { WasteRegistryType } from "../../generated/graphql/types";
import {
  formFactory,
  formWithTempStorageFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { buildQuery } from "../elastic";

describe("Retrieval of bsds in ES based on waste registry type", () => {
  let emitter: { user: User; company: Company };
  let transporter: { user: User; company: Company };
  let transporter2: { user: User; company: Company };
  let ttr: { user: User; company: Company };
  let destination: { user: User; company: Company };
  let trader: { user: User; company: Company };
  let broker: { user: User; company: Company };
  let worker: { user: User; company: Company };

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

  it("should list a BSDD in destination's incoming wastes once it has been received", async () => {
    // BSDD after reception
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: transporter.company.siret,
        recipientCompanySiret: destination.company.siret,
        status: Status.ACCEPTED,
        receivedAt: new Date()
      }
    });

    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("INCOMING", [destination.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
  });

  it("it should list a BSDD in ttr's incoming wastes once it has been temp stored", async () => {
    // BSDD after temp storage
    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: transporter.company.siret,
        recipientCompanySiret: ttr.company.siret,
        status: Status.TEMP_STORER_ACCEPTED,
        receivedAt: null
      },
      tempStorageOpts: {
        destinationCompanySiret: destination.company.siret,
        tempStorerReceivedAt: new Date()
      }
    });

    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("INCOMING", [ttr.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
  });

  it("it should list a BSDD in final destination's incoming wastes once it has been received", async () => {
    // BSDD after final reception
    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: transporter.company.siret,
        recipientCompanySiret: ttr.company.siret,
        status: Status.ACCEPTED,
        receivedAt: new Date()
      },
      tempStorageOpts: {
        destinationCompanySiret: destination.company.siret,
        tempStorerReceivedAt: new Date()
      }
    });

    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("INCOMING", [destination.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
  });

  it("it should not list a BSDD in destination's incoming wastes before it has been received", async () => {
    // BSDD before reception
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: transporter.company.siret,
        recipientCompanySiret: destination.company.siret,
        status: Status.SENT,
        receivedAt: null
      }
    });

    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("INCOMING", [destination.company.siret]);
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
    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("INCOMING", [destination.company.siret]);
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
    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("INCOMING", [destination.company.siret]);
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
    await indexBsda(bsda);
    await refreshElasticSearch();
    const bsds = await searchBsds("INCOMING", [destination.company.siret]);
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
    await indexBsda(bsda);
    await refreshElasticSearch();
    const bsds = await searchBsds("INCOMING", [destination.company.siret]);
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
    await indexBsdasri(bsdasri);
    await refreshElasticSearch();
    const bsds = await searchBsds("INCOMING", [destination.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri.id]);
  });
  it("should not list a BSDASRI in destination's incoming wastes before it has been received", async () => {
    const bsdasri = await bsdasriFactory({
      opt: {
        destinationCompanySiret: destination.company.siret,
        destinationReceptionSignatureDate: null
      }
    });
    await indexBsdasri(bsdasri);
    await refreshElasticSearch();
    const bsds = await searchBsds("INCOMING", [destination.company.siret]);
    expect(bsds).toEqual([]);
  });
  it("should list a BSVHU in destination's incoming wastes once it has been received", async () => {
    const bsvhu = await vhuFormFactory({
      opt: {
        destinationCompanySiret: destination.company.siret,
        destinationReceptionDate: new Date(),
        destinationOperationSignatureDate: new Date()
      }
    });
    await indexBsvhu(bsvhu);
    await refreshElasticSearch();
    const bsds = await searchBsds("INCOMING", [destination.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu.id]);
  });
  it("should not list a BSVHU in destination's incoming wastes before it has been received", async () => {
    const bsvhu = await vhuFormFactory({
      opt: {
        destinationCompanySiret: destination.company.siret,
        destinationOperationSignatureDate: null
      }
    });
    await indexBsvhu(bsvhu);
    await refreshElasticSearch();
    const bsds = await searchBsds("INCOMING", [destination.company.siret]);
    expect(bsds).toEqual([]);
  });
  it("should list a BSFF in destination's incoming wastes once it has been received", async () => {
    const bsff = await createBsffAfterReception({
      emitter,
      transporter,
      destination
    });
    await indexBsff(bsff);
    await refreshElasticSearch();
    const bsds = await searchBsds("INCOMING", [destination.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsff.id]);
  });
  it("should not list a BSFF in destination's incoming wastes before it has been received", async () => {
    const bsff = await createBsffAfterEmission({
      emitter,
      transporter,
      destination
    });
    await indexBsff(bsff);
    await refreshElasticSearch();
    const bsds = await searchBsds("INCOMING", [destination.company.siret]);
    expect(bsds).toEqual([]);
  });

  // REGISTRE DÉCHETS SORTANTS

  it("should list a BSDD in emitter's outgoing wastes once it has been sent", async () => {
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        sentAt: new Date()
      }
    });
    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("OUTGOING", [emitter.company.siret]);
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
    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("OUTGOING", [emitter.company.siret]);
    expect(bsds).toEqual([]);
  });
  it("should list a BSDD in ttr's outgoing wastes once it has been sent after temporary storage ", async () => {
    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: transporter.company.siret,
        recipientCompanySiret: ttr.company.siret,
        status: Status.RESENT,
        receivedAt: null
      },
      tempStorageOpts: {
        destinationCompanySiret: destination.company.siret,
        tempStorerSignedAt: new Date()
      }
    });

    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("OUTGOING", [ttr.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
  });
  it("should list a BSDA in emitter's outgoing wastes once it has been sent", async () => {
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });
    await indexBsda(bsda);
    await refreshElasticSearch();
    const bsds = await searchBsds("OUTGOING", [emitter.company.siret]);
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
    await indexBsda(bsda);
    await refreshElasticSearch();
    const bsds = await searchBsds("OUTGOING", [emitter.company.siret]);
    expect(bsds).toEqual([]);
  });
  it("should list a BSDA in worker's outgoing wastes once it has been sent", async () => {
    const bsda = await bsdaFactory({
      opt: {
        workerCompanySiret: worker.company.siret,
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });
    await indexBsda(bsda);
    await refreshElasticSearch();
    const bsds = await searchBsds("OUTGOING", [worker.company.siret]);
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
    await indexBsda(bsda);
    await refreshElasticSearch();
    const bsds = await searchBsds("OUTGOING", [worker.company.siret]);
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
    await indexBsdasri(bsdasri);
    await refreshElasticSearch();
    const bsds = await searchBsds("OUTGOING", [emitter.company.siret]);
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
    await indexBsdasri(bsdasri);
    await refreshElasticSearch();
    const bsds = await searchBsds("OUTGOING", [emitter.company.siret]);
    expect(bsds).toEqual([]);
  });
  it("should list a BSVHU in emitter's outgoing wastes once it has been sent", async () => {
    const bsvhu = await vhuFormFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });
    await indexBsvhu(bsvhu);
    await refreshElasticSearch();
    const bsds = await searchBsds("OUTGOING", [emitter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu.id]);
  });
  it("should not list a BSVHU in emitter's outgoing wastes before it has been sent", async () => {
    const bsvhu = await vhuFormFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        emitterEmissionSignatureDate: null,
        transporterTransportSignatureDate: null
      }
    });
    await indexBsvhu(bsvhu);
    await refreshElasticSearch();
    const bsds = await searchBsds("OUTGOING", [emitter.company.siret]);
    expect(bsds).toEqual([]);
  });
  it("should list a BSFF in emitter's outgoing wastes once it has been sent", async () => {
    const bsff = await createBsffAfterTransport({
      emitter,
      transporter,
      destination
    });
    await indexBsff(bsff);
    await refreshElasticSearch();
    const bsds = await searchBsds("OUTGOING", [emitter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsff.id]);
  });
  it("should not list a BSFF in emitter's outgoing wastes before it has been sent", async () => {
    const bsff = await createBsffBeforeEmission({
      emitter,
      transporter,
      destination
    });
    await indexBsff(bsff);
    await refreshElasticSearch();
    const bsds = await searchBsds("OUTGOING", [emitter.company.siret]);
    expect(bsds).toEqual([]);
  });

  // REGISTRE DÉCHETS TRANSPORTÉS

  it("should list a BSDD in transporter's transported wastes once it has been taken over", async () => {
    const form = await formFactory({
      ownerId: transporter.user.id,
      opt: {
        transporterCompanySiret: transporter.company.siret,
        sentAt: new Date()
      }
    });
    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("TRANSPORTED", [transporter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
  });
  it("should not list a BSDD in transporter' transported wastes before it has been taken over", async () => {
    const form = await formFactory({
      ownerId: transporter.user.id,
      opt: {
        transporterCompanySiret: transporter.company.siret,
        sentAt: null
      }
    });
    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("TRANSPORTED", [transporter.company.siret]);
    expect(bsds).toEqual([]);
  });
  it("should list a BSDD in transporter's transported wastes once it has been resent after temp storage", async () => {
    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: transporter.company.siret,
        recipientCompanySiret: ttr.company.siret,
        status: Status.RESENT
      },
      tempStorageOpts: {
        destinationCompanySiret: destination.company.siret,
        transporterCompanySiret: transporter2.company.siret,
        signedAt: new Date()
      }
    });

    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("TRANSPORTED", [transporter2.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
  });
  it("should list a BSDA in transporter's transported wastes once it has been taken over", async () => {
    const bsda = await bsdaFactory({
      opt: {
        transporterCompanySiret: transporter.company.siret,
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });
    await indexBsda(bsda);
    await refreshElasticSearch();
    const bsds = await searchBsds("TRANSPORTED", [transporter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
  });
  it("should not list a BSDA in transporter'transported wastes before it has been taken over", async () => {
    const bsda = await bsdaFactory({
      opt: {
        transporterCompanySiret: transporter.company.siret,
        emitterEmissionSignatureDate: null,
        transporterTransportSignatureDate: null
      }
    });
    await indexBsda(bsda);
    await refreshElasticSearch();
    const bsds = await searchBsds("TRANSPORTED", [transporter.company.siret]);
    expect(bsds).toEqual([]);
  });
  it("should list a BSDASRI in transporter's transported wastes once it has been taken over", async () => {
    const bsdasri = await bsdasriFactory({
      opt: {
        transporterCompanySiret: transporter.company.siret,
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });
    await indexBsdasri(bsdasri);
    await refreshElasticSearch();
    const bsds = await searchBsds("TRANSPORTED", [transporter.company.siret]);
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
    await indexBsdasri(bsdasri);
    await refreshElasticSearch();
    const bsds = await searchBsds("TRANSPORTED", [transporter.company.siret]);
    expect(bsds).toEqual([]);
  });
  it("should list a BSVHU in transporter's transported wastes once it has been taken over", async () => {
    const bsvhu = await vhuFormFactory({
      opt: {
        transporterCompanySiret: transporter.company.siret,
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });
    await indexBsvhu(bsvhu);
    await refreshElasticSearch();
    const bsds = await searchBsds("TRANSPORTED", [transporter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu.id]);
  });
  it("should not list a BSVHU in transporter'transported wastes before it has been delivered", async () => {
    const bsvhu = await vhuFormFactory({
      opt: {
        transporterCompanySiret: transporter.company.siret,
        emitterEmissionSignatureDate: null,
        transporterTransportSignatureDate: null
      }
    });
    await indexBsvhu(bsvhu);
    await refreshElasticSearch();
    const bsds = await searchBsds("TRANSPORTED", [transporter.company.siret]);
    expect(bsds).toEqual([]);
  });
  it("should list a BSFF in transporter's transported wastes once it has been taken over", async () => {
    const bsff = await createBsffAfterTransport({
      emitter,
      transporter,
      destination
    });
    await indexBsff(bsff);
    await refreshElasticSearch();
    const bsds = await searchBsds("TRANSPORTED", [transporter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsff.id]);
  });
  it("should not list a BSFF in transporter'transported wastes before it has been taken over", async () => {
    const bsff = await createBsffBeforeEmission({
      emitter,
      transporter,
      destination
    });
    await indexBsff(bsff);
    await refreshElasticSearch();
    const bsds = await searchBsds("TRANSPORTED", [transporter.company.siret]);
    expect(bsds).toEqual([]);
  });

  // REGISTRE DÉCHETS GÉRÉS
  it("should list a BSDD in trader's managed wastes after it has been sent", async () => {
    const form = await formFactory({
      ownerId: trader.user.id,
      opt: {
        traderCompanySiret: trader.company.siret,
        sentAt: new Date()
      }
    });
    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("MANAGED", [trader.company.siret]);
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
    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("MANAGED", [broker.company.siret]);
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
    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("MANAGED", [trader.company.siret]);
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
    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("MANAGED", [broker.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([]);
  });
  it("should list a BSDA in broker's managed wastes after it has been sent", async () => {
    const bsda = await bsdaFactory({
      opt: {
        brokerCompanySiret: broker.company.siret,
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });
    await indexBsda(bsda);
    await refreshElasticSearch();
    const bsds = await searchBsds("MANAGED", [broker.company.siret]);
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
    await indexBsda(bsda);
    await refreshElasticSearch();
    const bsds = await searchBsds("MANAGED", [broker.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([]);
  });
  // REGISTRE EXHAUSTIF
  it("should list a BSDD in emitter's all wastes", async () => {
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });
    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [emitter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
  });
  it("should list a BSDD in transporter's all wastes", async () => {
    const form = await formFactory({
      ownerId: transporter.user.id,
      opt: {
        transporterCompanySiret: transporter.company.siret
      }
    });
    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [transporter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
  });
  it("should list a BSDD in destination's all wastes", async () => {
    const form = await formFactory({
      ownerId: destination.user.id,
      opt: {
        recipientCompanySiret: destination.company.siret
      }
    });
    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [destination.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
  });
  it("should list a BSDD in trader's all wastes", async () => {
    const form = await formFactory({
      ownerId: trader.user.id,
      opt: {
        traderCompanySiret: trader.company.siret
      }
    });
    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [trader.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
  });
  it("should list a BSDD in broker's all wastes", async () => {
    const form = await formFactory({
      ownerId: broker.user.id,
      opt: {
        brokerCompanySiret: broker.company.siret
      }
    });
    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [broker.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
  });
  it("should list a BSDD in ttr's all wastes", async () => {
    const form = await formWithTempStorageFactory({
      ownerId: ttr.user.id,
      opt: {
        recipientCompanySiret: ttr.company.siret
      }
    });

    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [ttr.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
  });
  it("should list a BSDD in transporter after temp storage 's all wastes", async () => {
    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      tempStorageOpts: { transporterCompanySiret: transporter.company.siret }
    });

    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [transporter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
  });
  it("should list a BSDD in final destination's all wastes", async () => {
    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      tempStorageOpts: { destinationCompanySiret: destination.company.siret }
    });

    await indexForm(await getFullForm(form));
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [destination.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([form.id]);
  });
  it("should list a BSDA in emitter's all wastes", async () => {
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });
    await indexBsda(bsda);
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [emitter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
  });
  it("should list a BSDA in transporter's all wastes", async () => {
    const bsda = await bsdaFactory({
      opt: {
        transporterCompanySiret: transporter.company.siret
      }
    });
    await indexBsda(bsda);
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [transporter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
  });
  it("should list a BSDA in destination's all wastes", async () => {
    const bsda = await bsdaFactory({
      opt: {
        destinationCompanySiret: destination.company.siret
      }
    });
    await indexBsda(bsda);
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [destination.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
  });
  it("should list a BSDA in broker's all wastes", async () => {
    const bsda = await bsdaFactory({
      opt: {
        brokerCompanySiret: broker.company.siret
      }
    });
    await indexBsda(bsda);
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [broker.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsda.id]);
  });
  it("should list a BSDASRI in emitter's all wastes", async () => {
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });
    await indexBsdasri(bsdasri);
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [emitter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri.id]);
  });
  it("should list a BSDASRI in transporter's all wastes", async () => {
    const bsdasri = await bsdasriFactory({
      opt: {
        transporterCompanySiret: transporter.company.siret
      }
    });
    await indexBsdasri(bsdasri);
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [transporter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri.id]);
  });
  it("should list a BSDASRI in destination's all wastes", async () => {
    const bsdasri = await bsdasriFactory({
      opt: {
        destinationCompanySiret: destination.company.siret
      }
    });
    await indexBsdasri(bsdasri);
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [destination.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri.id]);
  });
  it("should list a BSVHU in emitter's all wastes", async () => {
    const bsvhu = await vhuFormFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });
    await indexBsvhu(bsvhu);
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [emitter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu.id]);
  });
  it("should list a BSVHU in transporter's all wastes", async () => {
    const bsvhu = await vhuFormFactory({
      opt: {
        transporterCompanySiret: transporter.company.siret
      }
    });
    await indexBsvhu(bsvhu);
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [transporter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu.id]);
  });
  it("should list a BSVHU in destination's all wastes", async () => {
    const bsvhu = await vhuFormFactory({
      opt: {
        destinationCompanySiret: destination.company.siret
      }
    });
    await indexBsvhu(bsvhu);
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [destination.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu.id]);
  });
  it("should list a BSFF in emitter's all wastes", async () => {
    const bsff = await createBsff({
      emitter,
      transporter,
      destination
    });
    await indexBsff(bsff);
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [emitter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsff.id]);
  });
  it("should list a BSFF in transporter's all wastes", async () => {
    const bsff = await createBsff({
      emitter,
      transporter,
      destination
    });
    await indexBsff(bsff);
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [transporter.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsff.id]);
  });
  it("should list a BSFF in destination's all wastes", async () => {
    const bsff = await createBsff({
      emitter,
      transporter,
      destination
    });
    await indexBsff(bsff);
    await refreshElasticSearch();
    const bsds = await searchBsds("ALL", [destination.company.siret]);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsff.id]);
  });
});
