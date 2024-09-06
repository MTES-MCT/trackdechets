import { Bsda, Bsdasri, Bsff, Bsvhu, Form, Bspaoh } from "@prisma/client";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../integration-tests/helper";
import { getBsdaForElastic, indexBsda } from "../../bsda/elastic";
import { bsdaFactory } from "../../bsda/__tests__/factories";
import { getBsdasriForElastic, indexBsdasri } from "../../bsdasris/elastic";
import { bsdasriFactory } from "../../bsdasris/__tests__/factories";
import { getBsffForElastic, indexBsff } from "../../bsffs/elastic";
import { createBsff } from "../../bsffs/__tests__/factories";
import { getBsvhuForElastic, indexBsvhu } from "../../bsvhu/elastic";
import { bsvhuFactory } from "../../bsvhu/__tests__/factories.vhu";
import { client, index } from "../../common/elastic";
import { getFormForElastic, indexForm } from "../../forms/elastic";
import { WasteRegistryWhere } from "../../generated/graphql/types";
import { formFactory, userFactory } from "../../__tests__/factories";
import { bspaohFactory } from "../../bspaoh/__tests__/factories";
import { getBspaohForElastic, indexBspaoh } from "../../bspaoh/elastic";
import { toElasticFilter } from "../where";

describe("toElasticFilter", () => {
  afterEach(resetDatabase);
  async function searchBsds(where: WasteRegistryWhere) {
    const { body } = await client.search({
      index: index.alias,
      body: {
        sort: { createdAt: "ASC" },
        query: { bool: { filter: toElasticFilter(where) } }
      }
    });
    return body.hits.hits.map(hit => hit._source);
  }
  it.each([
    "createdAt",
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSDDs between two %p dates (strict)", async date => {
    // convert elastic key to form key
    const toFormKey: {
      [P in keyof WasteRegistryWhere]?: keyof Form;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "takenOverAt",
      destinationReceptionDate: "receivedAt",
      destinationOperationDate: "processedAt"
    };

    const user = await userFactory();

    const form1 = await formFactory({
      ownerId: user.id,
      opt: { [toFormKey[date]]: new Date("2021-01-01") }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { [toFormKey[date]]: new Date("2021-01-02") }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { [toFormKey[date]]: new Date("2021-01-03") }
    });

    const form4 = await formFactory({
      ownerId: user.id,
      opt: { [toFormKey[date]]: new Date("2021-01-04") }
    });

    await Promise.all(
      [form1, form2, form3, form4].map(async f => {
        return indexForm(await getFormForElastic(f));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      [date]: {
        _gt: new Date("2021-01-01"),
        _lt: new Date("2021-01-04")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form2.id, form3.id]);
  });

  it.each([
    "createdAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSDAs between two %p dates (strict)", async date => {
    // convert elastic key to bsda key
    const toBsdaKey: {
      [P in keyof WasteRegistryWhere]?: keyof Bsda;
    } = {
      createdAt: "createdAt",
      destinationReceptionDate: "destinationReceptionDate",
      destinationOperationDate: "destinationOperationDate"
    };

    const bsda1 = await bsdaFactory({
      opt: { [toBsdaKey[date]]: new Date("2021-01-01") }
    });

    const bsda2 = await bsdaFactory({
      opt: { [toBsdaKey[date]]: new Date("2021-01-02") }
    });

    const bsda3 = await bsdaFactory({
      opt: { [toBsdaKey[date]]: new Date("2021-01-03") }
    });

    const bsda4 = await bsdaFactory({
      opt: { [toBsdaKey[date]]: new Date("2021-01-04") }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3, bsda4].map(async bsda => {
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      [date]: {
        _gt: new Date("2021-01-01"),
        _lt: new Date("2021-01-04")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda2.id, bsda3.id]);
  });

  it("should filter BSDAs between two transporterTakenOverAt dates (strict)", async () => {
    const bsda1 = await bsdaFactory({
      transporterOpt: {
        transporterTransportTakenOverAt: new Date("2021-01-01")
      }
    });

    const bsda2 = await bsdaFactory({
      transporterOpt: {
        transporterTransportTakenOverAt: new Date("2021-01-02")
      }
    });

    const bsda3 = await bsdaFactory({
      transporterOpt: {
        transporterTransportTakenOverAt: new Date("2021-01-03")
      }
    });

    const bsda4 = await bsdaFactory({
      transporterOpt: {
        transporterTransportTakenOverAt: new Date("2021-01-04")
      }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3, bsda4].map(async bsda => {
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      transporterTakenOverAt: {
        _gt: new Date("2021-01-01"),
        _lt: new Date("2021-01-04")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda2.id, bsda3.id]);
  });

  it.each([
    "createdAt",
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSDASRIs between two %p dates (strict)", async date => {
    // convert elastic key to bsdasri key
    const toBsdasriKey: {
      [P in keyof WasteRegistryWhere]?: keyof Bsdasri;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "transporterTakenOverAt",
      destinationReceptionDate: "destinationReceptionDate",
      destinationOperationDate: "destinationOperationDate"
    };

    const bsdasri1 = await bsdasriFactory({
      opt: { [toBsdasriKey[date]]: new Date("2021-01-01") }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { [toBsdasriKey[date]]: new Date("2021-01-02") }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { [toBsdasriKey[date]]: new Date("2021-01-03") }
    });

    const bsdasri4 = await bsdasriFactory({
      opt: { [toBsdasriKey[date]]: new Date("2021-01-04") }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3, bsdasri4].map(async bsda => {
        return indexBsdasri(await getBsdasriForElastic(bsda));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      [date]: {
        _gt: new Date("2021-01-01"),
        _lt: new Date("2021-01-04")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri2.id, bsdasri3.id]);
  });

  it.each([
    "createdAt",
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSVHUs between two %p dates (strict)", async date => {
    // convert elastic key to bsvhu key
    const toBsvhuKey: {
      [P in keyof WasteRegistryWhere]?: keyof Bsvhu;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "transporterTransportTakenOverAt",
      destinationReceptionDate: "destinationReceptionDate",
      destinationOperationDate: "destinationOperationDate"
    };

    const bsvhu1 = await bsvhuFactory({
      opt: { [toBsvhuKey[date]]: new Date("2021-01-01") }
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { [toBsvhuKey[date]]: new Date("2021-01-02") }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { [toBsvhuKey[date]]: new Date("2021-01-03") }
    });

    const bsvhu4 = await bsvhuFactory({
      opt: { [toBsvhuKey[date]]: new Date("2021-01-04") }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3, bsvhu4].map(async bsvhu => {
        return indexBsvhu(await getBsvhuForElastic(bsvhu));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      [date]: {
        _gt: new Date("2021-01-01"),
        _lt: new Date("2021-01-04")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu2.id, bsvhu3.id]);
  });

  it.each(["createdAt", "destinationReceptionDate"])(
    "should filter BSFFs between two %p dates (strict)",
    async date => {
      // convert elastic key to bsff key
      const toBsffKey: {
        [P in keyof WasteRegistryWhere]?: keyof Bsff;
      } = {
        createdAt: "createdAt",
        destinationReceptionDate: "destinationReceptionDate"
      };

      const bsff1 = await createBsff(
        {},
        { data: { [toBsffKey[date]]: new Date("2021-01-01") } }
      );

      const bsff2 = await createBsff(
        {},
        {
          data: { [toBsffKey[date]]: new Date("2021-01-02") }
        }
      );

      const bsff3 = await createBsff(
        {},
        {
          data: { [toBsffKey[date]]: new Date("2021-01-03") }
        }
      );

      const bsff4 = await createBsff(
        {},
        {
          data: { [toBsffKey[date]]: new Date("2021-01-04") }
        }
      );

      await Promise.all(
        [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
          return indexBsff(await getBsffForElastic(bsff));
        })
      );
      await refreshElasticSearch();

      const where: WasteRegistryWhere = {
        [date]: {
          _gt: new Date("2021-01-01"),
          _lt: new Date("2021-01-04")
        }
      };

      const bsds = await searchBsds(where);

      expect(bsds.map(bsd => bsd.id)).toEqual([bsff2.id, bsff3.id]);
    }
  );

  it("should filter BSFFs between two transporterTakenOverAt dates (strict)", async () => {
    const bsff1 = await createBsff(
      {},
      {
        transporterData: {
          transporterTransportTakenOverAt: new Date("2021-01-01")
        }
      }
    );

    const bsff2 = await createBsff(
      {},
      {
        transporterData: {
          transporterTransportTakenOverAt: new Date("2021-01-02")
        }
      }
    );

    const bsff3 = await createBsff(
      {},
      {
        transporterData: {
          transporterTransportTakenOverAt: new Date("2021-01-03")
        }
      }
    );

    const bsff4 = await createBsff(
      {},
      {
        transporterData: {
          transporterTransportTakenOverAt: new Date("2021-01-04")
        }
      }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
        const bsffForElastic = await getBsffForElastic(bsff);
        return indexBsff(bsffForElastic);
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      transporterTakenOverAt: {
        _gt: new Date("2021-01-01"),
        _lt: new Date("2021-01-04")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff2.id, bsff3.id]);
  });

  it("should filter BSFF between two operation dates (strict)", async () => {
    const bsff1 = await createBsff(
      {},
      {
        packagingData: {
          operationDate: new Date("2021-01-01"),
          operationSignatureDate: new Date("2021-01-01"),
          operationCode: "R2"
        }
      }
    );

    const bsff2 = await createBsff(
      {},
      {
        packagingData: {
          operationDate: new Date("2021-01-02"),
          operationSignatureDate: new Date("2021-01-02"),
          operationCode: "R2"
        }
      }
    );

    const bsff3 = await createBsff(
      {},
      {
        packagingData: {
          operationDate: new Date("2021-01-03"),
          operationSignatureDate: new Date("2021-01-03"),
          operationCode: "R2"
        }
      }
    );

    const bsff4 = await createBsff(
      {},
      {
        packagingData: {
          operationDate: new Date("2021-01-04"),
          operationSignatureDate: new Date("2021-01-04"),
          operationCode: "R2"
        }
      }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
        return indexBsff(await getBsffForElastic(bsff));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationOperationDate: {
        _gt: new Date("2021-01-01"),
        _lt: new Date("2021-01-04")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff2.id, bsff3.id]);
  });

  it.each([
    "createdAt",
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSDDs between two %p dates (not strict)", async date => {
    // convert elastic key to form key
    const toFormKey: {
      [P in keyof WasteRegistryWhere]?: keyof Form;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "takenOverAt",
      destinationReceptionDate: "receivedAt",
      destinationOperationDate: "processedAt"
    };

    const user = await userFactory();

    const form1 = await formFactory({
      ownerId: user.id,
      opt: { [toFormKey[date]]: new Date("2021-01-01") }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { [toFormKey[date]]: new Date("2021-01-02") }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { [toFormKey[date]]: new Date("2021-01-03") }
    });

    const form4 = await formFactory({
      ownerId: user.id,
      opt: { [toFormKey[date]]: new Date("2021-01-04") }
    });

    await Promise.all(
      [form1, form2, form3, form4].map(async f => {
        return indexForm(await getFormForElastic(f));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      [date]: {
        _gte: new Date("2021-01-02"),
        _lte: new Date("2021-01-04")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form2.id, form3.id, form4.id]);
  });

  it.each([
    "createdAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSDAs between two %p dates (not strict)", async date => {
    // convert elastic key to bsda key
    const toBsdaKey: {
      [P in keyof WasteRegistryWhere]?: keyof Bsda;
    } = {
      createdAt: "createdAt",
      destinationReceptionDate: "destinationReceptionDate",
      destinationOperationDate: "destinationOperationDate"
    };

    const bsda1 = await bsdaFactory({
      opt: { [toBsdaKey[date]]: new Date("2021-01-01") }
    });

    const bsda2 = await bsdaFactory({
      opt: { [toBsdaKey[date]]: new Date("2021-01-02") }
    });

    const bsda3 = await bsdaFactory({
      opt: { [toBsdaKey[date]]: new Date("2021-01-03") }
    });

    const bsda4 = await bsdaFactory({
      opt: { [toBsdaKey[date]]: new Date("2021-01-04") }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3, bsda4].map(async bsda => {
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      [date]: {
        _gte: new Date("2021-01-02"),
        _lte: new Date("2021-01-04")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda2.id, bsda3.id, bsda4.id]);
  });

  it("should filter BSDAs between two transporterTakenOverAt dates (not strict)", async () => {
    const bsda1 = await bsdaFactory({
      transporterOpt: {
        transporterTransportTakenOverAt: new Date("2021-01-01")
      }
    });

    const bsda2 = await bsdaFactory({
      transporterOpt: {
        transporterTransportTakenOverAt: new Date("2021-01-02")
      }
    });

    const bsda3 = await bsdaFactory({
      transporterOpt: {
        transporterTransportTakenOverAt: new Date("2021-01-03")
      }
    });

    const bsda4 = await bsdaFactory({
      transporterOpt: {
        transporterTransportTakenOverAt: new Date("2021-01-04")
      }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3, bsda4].map(async bsda => {
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      transporterTakenOverAt: {
        _gte: new Date("2021-01-02"),
        _lte: new Date("2021-01-04")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda2.id, bsda3.id, bsda4.id]);
  });

  it.each([
    "createdAt",
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSDASRIs between two %p dates (not strict)", async date => {
    // convert elastic key to bsdasri key
    const toBsdasriKey: {
      [P in keyof WasteRegistryWhere]?: keyof Bsdasri;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "transporterTakenOverAt",
      destinationReceptionDate: "destinationReceptionDate",
      destinationOperationDate: "destinationOperationDate"
    };

    const bsdasri1 = await bsdasriFactory({
      opt: { [toBsdasriKey[date]]: new Date("2021-01-01") }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { [toBsdasriKey[date]]: new Date("2021-01-02") }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { [toBsdasriKey[date]]: new Date("2021-01-03") }
    });

    const bsdasri4 = await bsdasriFactory({
      opt: { [toBsdasriKey[date]]: new Date("2021-01-04") }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3, bsdasri4].map(async bsdasri => {
        return indexBsdasri(await getBsdasriForElastic(bsdasri));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      [date]: {
        _gte: new Date("2021-01-02"),
        _lte: new Date("2021-01-04")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([
      bsdasri2.id,
      bsdasri3.id,
      bsdasri4.id
    ]);
  });

  it.each([
    "createdAt",
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSVHUs between two %p dates (not strict)", async date => {
    // convert elastic key to bsvhu key
    const toBsvhuKey: {
      [P in keyof WasteRegistryWhere]?: keyof Bsvhu;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "transporterTransportTakenOverAt",
      destinationReceptionDate: "destinationReceptionDate",
      destinationOperationDate: "destinationOperationDate"
    };

    const bsvhu1 = await bsvhuFactory({
      opt: { [toBsvhuKey[date]]: new Date("2021-01-01") }
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { [toBsvhuKey[date]]: new Date("2021-01-02") }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { [toBsvhuKey[date]]: new Date("2021-01-03") }
    });

    const bsvhu4 = await bsvhuFactory({
      opt: { [toBsvhuKey[date]]: new Date("2021-01-04") }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3, bsvhu4].map(async bsvhu => {
        return indexBsvhu(await getBsvhuForElastic(bsvhu));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      [date]: {
        _gte: new Date("2021-01-02"),
        _lte: new Date("2021-01-04")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu2.id, bsvhu3.id, bsvhu4.id]);
  });

  it.each([
    "createdAt",
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSPAOH between two %p dates (not strict)", async date => {
    // convert elastic key to bsdasri key
    const toBspaohKey: {
      [P in keyof WasteRegistryWhere]?: keyof Bspaoh;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "transporterTransportTakenOverAt",
      destinationReceptionDate: "destinationReceptionDate",
      destinationOperationDate: "destinationOperationDate"
    };

    const bspaoh1 = await bspaohFactory({
      opt: { [toBspaohKey[date]]: new Date("2021-01-01") }
    });

    const bspaoh2 = await bspaohFactory({
      opt: { [toBspaohKey[date]]: new Date("2021-01-02") }
    });

    const bspaoh3 = await bspaohFactory({
      opt: { [toBspaohKey[date]]: new Date("2021-01-03") }
    });

    const bspaoh4 = await bspaohFactory({
      opt: { [toBspaohKey[date]]: new Date("2021-01-04") }
    });

    await Promise.all(
      [bspaoh1, bspaoh2, bspaoh3, bspaoh4].map(async bspaoh => {
        return indexBspaoh(await getBspaohForElastic(bspaoh));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      [date]: {
        _gte: new Date("2021-01-02"),
        _lte: new Date("2021-01-04")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([
      bspaoh2.id,
      bspaoh3.id,
      bspaoh4.id
    ]);
  });

  it.each(["createdAt", "destinationReceptionDate"])(
    "should filter BSFFs between two %p dates (not strict)",
    async date => {
      // convert elastic key to bsff key
      const toBsffKey: {
        [P in keyof WasteRegistryWhere]?: keyof Bsff;
      } = {
        createdAt: "createdAt",
        destinationReceptionDate: "destinationReceptionDate"
      };

      const bsff1 = await createBsff(
        {},
        { data: { [toBsffKey[date]]: new Date("2021-01-01") } }
      );

      const bsff2 = await createBsff(
        {},
        {
          data: { [toBsffKey[date]]: new Date("2021-01-02") }
        }
      );

      const bsff3 = await createBsff(
        {},
        {
          data: { [toBsffKey[date]]: new Date("2021-01-03") }
        }
      );

      const bsff4 = await createBsff(
        {},
        {
          data: { [toBsffKey[date]]: new Date("2021-01-04") }
        }
      );

      await Promise.all(
        [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
          return indexBsff(await getBsffForElastic(bsff));
        })
      );
      await refreshElasticSearch();

      const where: WasteRegistryWhere = {
        [date]: {
          _gte: new Date("2021-01-02"),
          _lte: new Date("2021-01-04")
        }
      };

      const bsds = await searchBsds(where);

      expect(bsds.map(bsd => bsd.id)).toEqual([bsff2.id, bsff3.id, bsff4.id]);
    }
  );

  it("should filter BSFFs between two transporterTakenOverAt dates (not strict)", async () => {
    const bsff1 = await createBsff(
      {},
      {
        transporterData: {
          transporterTransportTakenOverAt: new Date("2021-01-01")
        }
      }
    );

    const bsff2 = await createBsff(
      {},
      {
        transporterData: {
          transporterTransportTakenOverAt: new Date("2021-01-02")
        }
      }
    );

    const bsff3 = await createBsff(
      {},
      {
        transporterData: {
          transporterTransportTakenOverAt: new Date("2021-01-03")
        }
      }
    );

    const bsff4 = await createBsff(
      {},
      {
        transporterData: {
          transporterTransportTakenOverAt: new Date("2021-01-04")
        }
      }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
        const bsffForElastic = await getBsffForElastic(bsff);
        return indexBsff(bsffForElastic);
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      transporterTakenOverAt: {
        _gte: new Date("2021-01-02"),
        _lte: new Date("2021-01-04")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff2.id, bsff3.id, bsff4.id]);
  });

  it("should filter BSFF between two operation dates (not strict)", async () => {
    const bsff1 = await createBsff(
      {},
      {
        packagingData: {
          operationDate: new Date("2021-01-01"),
          operationSignatureDate: new Date("2021-01-01"),
          operationCode: "R2"
        }
      }
    );

    const bsff2 = await createBsff(
      {},
      {
        packagingData: {
          operationDate: new Date("2021-01-02"),
          operationSignatureDate: new Date("2021-01-02"),
          operationCode: "R2"
        }
      }
    );

    const bsff3 = await createBsff(
      {},
      {
        packagingData: {
          operationDate: new Date("2021-01-03"),
          operationSignatureDate: new Date("2021-01-03"),
          operationCode: "R2"
        }
      }
    );

    const bsff4 = await createBsff(
      {},
      {
        packagingData: {
          operationDate: new Date("2021-01-04"),
          operationSignatureDate: new Date("2021-01-04"),
          operationCode: "R2"
        }
      }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
        return indexBsff(await getBsffForElastic(bsff));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationOperationDate: {
        _gte: new Date("2021-01-02"),
        _lte: new Date("2021-01-04")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff2.id, bsff3.id, bsff4.id]);
  });

  it.each([
    "createdAt",
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSDDs on %p (exact date)", async date => {
    // convert elastic key to form key
    const toFormKey: {
      [P in keyof WasteRegistryWhere]?: keyof Form;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "takenOverAt",
      destinationReceptionDate: "receivedAt",
      destinationOperationDate: "processedAt"
    };

    const user = await userFactory();

    const form1 = await formFactory({
      ownerId: user.id,
      opt: { [toFormKey[date]]: new Date("2021-01-01") }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { [toFormKey[date]]: new Date("2021-01-02") }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { [toFormKey[date]]: new Date("2021-01-03") }
    });

    const form4 = await formFactory({
      ownerId: user.id,
      opt: { [toFormKey[date]]: new Date("2021-01-04") }
    });

    await Promise.all(
      [form1, form2, form3, form4].map(async f => {
        return indexForm(await getFormForElastic(f));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      [date]: {
        _eq: new Date("2021-01-02")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form2.id]);
  });

  it.each([
    "createdAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSDAs on %p (exact date)", async date => {
    // convert elastic key to bsda key
    const toBsdaKey: {
      [P in keyof WasteRegistryWhere]?: keyof Bsda;
    } = {
      createdAt: "createdAt",
      destinationReceptionDate: "destinationReceptionDate",
      destinationOperationDate: "destinationOperationDate"
    };

    const bsda1 = await bsdaFactory({
      opt: { [toBsdaKey[date]]: new Date("2021-01-01") }
    });

    const bsda2 = await bsdaFactory({
      opt: { [toBsdaKey[date]]: new Date("2021-01-02") }
    });

    const bsda3 = await bsdaFactory({
      opt: { [toBsdaKey[date]]: new Date("2021-01-03") }
    });

    const bsda4 = await bsdaFactory({
      opt: { [toBsdaKey[date]]: new Date("2021-01-04") }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3, bsda4].map(async bsda => {
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      [date]: {
        _eq: new Date("2021-01-02")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda2.id]);
  });

  it("should filter BSDAs on transporterTakenOverAt (exact date)", async () => {
    const bsda1 = await bsdaFactory({
      transporterOpt: {
        transporterTransportTakenOverAt: new Date("2021-01-01")
      }
    });

    const bsda2 = await bsdaFactory({
      transporterOpt: {
        transporterTransportTakenOverAt: new Date("2021-01-02")
      }
    });

    const bsda3 = await bsdaFactory({
      transporterOpt: {
        transporterTransportTakenOverAt: new Date("2021-01-03")
      }
    });

    const bsda4 = await bsdaFactory({
      transporterOpt: {
        transporterTransportTakenOverAt: new Date("2021-01-04")
      }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3, bsda4].map(async bsda => {
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      transporterTakenOverAt: {
        _eq: new Date("2021-01-02")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda2.id]);
  });

  it.each([
    "createdAt",
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSDASRIs on %p (exact date)", async date => {
    // convert elastic key to bsdasri key
    const toBsdasriKey: {
      [P in keyof WasteRegistryWhere]?: keyof Bsdasri;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "transporterTakenOverAt",
      destinationReceptionDate: "destinationReceptionDate",
      destinationOperationDate: "destinationOperationDate"
    };

    const bsdasri1 = await bsdasriFactory({
      opt: { [toBsdasriKey[date]]: new Date("2021-01-01") }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { [toBsdasriKey[date]]: new Date("2021-01-02") }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { [toBsdasriKey[date]]: new Date("2021-01-03") }
    });

    const bsdasri4 = await bsdasriFactory({
      opt: { [toBsdasriKey[date]]: new Date("2021-01-04") }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3, bsdasri4].map(async bsdasri => {
        return indexBsdasri(await getBsdasriForElastic(bsdasri));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      [date]: {
        _eq: new Date("2021-01-02")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri2.id]);
  });

  it.each([
    "createdAt",
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSVHUs on %p (exact date)", async date => {
    // convert elastic key to bsvhu key
    const toBsvhuKey: {
      [P in keyof WasteRegistryWhere]?: keyof Bsvhu;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "transporterTransportTakenOverAt",
      destinationReceptionDate: "destinationReceptionDate",
      destinationOperationDate: "destinationOperationDate"
    };

    const bsvhu1 = await bsvhuFactory({
      opt: { [toBsvhuKey[date]]: new Date("2021-01-01") }
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { [toBsvhuKey[date]]: new Date("2021-01-02") }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { [toBsvhuKey[date]]: new Date("2021-01-03") }
    });

    const bsvhu4 = await bsvhuFactory({
      opt: { [toBsvhuKey[date]]: new Date("2021-01-04") }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3, bsvhu4].map(async bsvhu => {
        return indexBsvhu(await getBsvhuForElastic(bsvhu));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      [date]: {
        _eq: new Date("2021-01-02")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu2.id]);
  });

  it.each([
    "createdAt",
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSPAOHs on %p (exact date)", async date => {
    // convert elastic key to bspaoh key
    const toBspaohKey: {
      [P in keyof WasteRegistryWhere]?: keyof Bspaoh;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "transporterTransportTakenOverAt",
      destinationReceptionDate: "destinationReceptionDate",
      destinationOperationDate: "destinationOperationDate"
    };

    const bspaoh1 = await bspaohFactory({
      opt: { [toBspaohKey[date]]: new Date("2021-01-01") }
    });

    const bspaoh2 = await bspaohFactory({
      opt: { [toBspaohKey[date]]: new Date("2021-01-02") }
    });

    const bspaoh3 = await bspaohFactory({
      opt: { [toBspaohKey[date]]: new Date("2021-01-03") }
    });

    const bspaoh4 = await bspaohFactory({
      opt: { [toBspaohKey[date]]: new Date("2021-01-04") }
    });

    await Promise.all(
      [bspaoh1, bspaoh2, bspaoh3, bspaoh4].map(async bspaoh => {
        return indexBspaoh(await getBspaohForElastic(bspaoh));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      [date]: {
        _eq: new Date("2021-01-02")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh2.id]);
  });

  it.each(["createdAt", "destinationReceptionDate"])(
    "should filter BSFFs on %p (exact date)",
    async date => {
      // convert elastic key to bsff key
      const toBsffKey: {
        [P in keyof WasteRegistryWhere]?: keyof Bsff;
      } = {
        createdAt: "createdAt",
        destinationReceptionDate: "destinationReceptionDate"
      };

      const bsff1 = await createBsff(
        {},
        { data: { [toBsffKey[date]]: new Date("2021-01-01") } }
      );

      const bsff2 = await createBsff(
        {},
        {
          data: { [toBsffKey[date]]: new Date("2021-01-02") }
        }
      );

      const bsff3 = await createBsff(
        {},
        {
          data: { [toBsffKey[date]]: new Date("2021-01-03") }
        }
      );

      const bsff4 = await createBsff(
        {},
        {
          data: { [toBsffKey[date]]: new Date("2021-01-04") }
        }
      );

      await Promise.all(
        [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
          return indexBsff(await getBsffForElastic(bsff));
        })
      );
      await refreshElasticSearch();

      const where: WasteRegistryWhere = {
        [date]: {
          _eq: new Date("2021-01-02")
        }
      };

      const bsds = await searchBsds(where);

      expect(bsds.map(bsd => bsd.id)).toEqual([bsff2.id]);
    }
  );

  it("should filter BSFFs between two transporterTakenOverAt dates (exact dates)", async () => {
    const bsff1 = await createBsff(
      {},
      {
        transporterData: {
          transporterTransportTakenOverAt: new Date("2021-01-01")
        }
      }
    );

    const bsff2 = await createBsff(
      {},
      {
        transporterData: {
          transporterTransportTakenOverAt: new Date("2021-01-02")
        }
      }
    );

    const bsff3 = await createBsff(
      {},
      {
        transporterData: {
          transporterTransportTakenOverAt: new Date("2021-01-03")
        }
      }
    );

    const bsff4 = await createBsff(
      {},
      {
        transporterData: {
          transporterTransportTakenOverAt: new Date("2021-01-04")
        }
      }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
        const bsffForElastic = await getBsffForElastic(bsff);
        return indexBsff(bsffForElastic);
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      transporterTakenOverAt: {
        _eq: new Date("2021-01-02")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff2.id]);
  });

  it("should filter BSFF between two operation dates (exact date)", async () => {
    const bsff1 = await createBsff(
      {},
      {
        packagingData: {
          operationDate: new Date("2021-01-01"),
          operationSignatureDate: new Date("2021-01-01"),
          operationCode: "R2"
        }
      }
    );

    const bsff2 = await createBsff(
      {},
      {
        packagingData: {
          operationDate: new Date("2021-01-02"),
          operationSignatureDate: new Date("2021-01-02"),
          operationCode: "R2"
        }
      }
    );

    const bsff3 = await createBsff(
      {},
      {
        packagingData: {
          operationDate: new Date("2021-01-03"),
          operationSignatureDate: new Date("2021-01-03"),
          operationCode: "R2"
        }
      }
    );

    const bsff4 = await createBsff(
      {},
      {
        packagingData: {
          operationDate: new Date("2021-01-04"),
          operationSignatureDate: new Date("2021-01-04"),
          operationCode: "R2"
        }
      }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
        return indexBsff(await getBsffForElastic(bsff));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationOperationDate: {
        _eq: new Date("2021-01-02")
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff2.id]);
  });
});
