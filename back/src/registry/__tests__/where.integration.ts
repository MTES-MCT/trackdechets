import { Bsda, Bsdasri, Bsff, Bsvhu, Form } from "@prisma/client";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../integration-tests/helper";
import { indexBsda } from "../../bsda/elastic";
import { bsdaFactory } from "../../bsda/__tests__/factories";
import { indexBsdasri } from "../../bsdasris/elastic";
import { bsdasriFactory } from "../../bsdasris/__tests__/factories";
import { indexBsff } from "../../bsffs/elastic";
import { createBsff } from "../../bsffs/__tests__/factories";
import { indexBsvhu } from "../../bsvhu/elastic";
import { bsvhuFactory } from "../../bsvhu/__tests__/factories.vhu";
import { BsdElastic, client, index } from "../../common/elastic";
import { getFullForm } from "../../forms/database";
import { indexForm } from "../../forms/elastic";
import { BsdType, WasteRegistryWhere } from "../../generated/graphql/types";
import { formFactory, userFactory } from "../../__tests__/factories";
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

  it("should filter bsds by id (equality)", async () => {
    const user = await userFactory();
    const BSDS = {
      BSDD: await getFullForm(await formFactory({ ownerId: user.id })),
      BSDA: await bsdaFactory({}),
      BSDASRI: await bsdasriFactory({}),
      BSVHU: await bsvhuFactory({}),
      BSFF: await createBsff()
    };
    await Promise.all([
      indexForm(BSDS["BSDD"]),
      indexBsda({ ...BSDS["BSDA"], intermediaries: [] }),
      indexBsdasri(BSDS["BSDASRI"]),
      indexBsvhu(BSDS["BSVHU"]),
      indexBsff(BSDS["BSFF"])
    ]);
    await refreshElasticSearch();

    let bsds = await searchBsds({ id: { _eq: BSDS.BSDD.readableId } });
    expect(bsds).toHaveLength(1);
    expect(bsds[0].readableId).toEqual(BSDS.BSDD.readableId);

    bsds = await searchBsds({ id: { _eq: BSDS.BSDA.id } });
    expect(bsds).toHaveLength(1);
    expect(bsds[0].id).toEqual(BSDS.BSDA.id);

    bsds = await searchBsds({ id: { _eq: BSDS.BSDASRI.id } });
    expect(bsds).toHaveLength(1);
    expect(bsds[0].id).toEqual(BSDS.BSDASRI.id);

    bsds = await searchBsds({ id: { _eq: BSDS.BSFF.id } });
    expect(bsds).toHaveLength(1);
    expect(bsds[0].id).toEqual(BSDS.BSFF.id);

    bsds = await searchBsds({ id: { _eq: BSDS.BSVHU.id } });
    expect(bsds).toHaveLength(1);
    expect(bsds[0].id).toEqual(BSDS.BSVHU.id);
  });

  it.each(["BSDD", "BSDA", "BSDASRI", "BSVHU", "BSFF"] as BsdType[])(
    "should filter on %p type (equality)",
    async bsdType => {
      const user = await userFactory();
      const BSDS = {
        BSDD: await getFullForm(await formFactory({ ownerId: user.id })),
        BSDA: await bsdaFactory({}),
        BSDASRI: await bsdasriFactory({}),
        BSVHU: await bsvhuFactory({}),
        BSFF: await createBsff()
      };

      const where: WasteRegistryWhere = {
        bsdType: { _eq: bsdType }
      };

      await Promise.all([
        indexForm(BSDS["BSDD"]),
        indexBsda({ ...BSDS["BSDA"], intermediaries: [] }),
        indexBsdasri(BSDS["BSDASRI"]),
        indexBsvhu(BSDS["BSVHU"]),
        indexBsff(BSDS["BSFF"])
      ]);
      await refreshElasticSearch();

      const bsds = await searchBsds(where);

      expect(bsds.map(bsd => bsd.id)).toEqual([BSDS[bsdType].id]);
    }
  );

  it("should filter on bsdType (present in list)", async () => {
    const user = await userFactory();
    const BSDS = {
      BSDD: await getFullForm(await formFactory({ ownerId: user.id })),
      BSDA: await bsdaFactory({}),
      BSDASRI: await bsdasriFactory({}),
      BSVHU: await bsvhuFactory({}),
      BSFF: await createBsff()
    };

    const where: WasteRegistryWhere = {
      bsdType: { _in: ["BSDD", "BSDASRI"] }
    };

    await Promise.all([
      indexForm(BSDS["BSDD"]),
      indexBsda({ ...BSDS["BSDA"], intermediaries: [] }),
      indexBsdasri(BSDS["BSDASRI"]),
      indexBsvhu(BSDS["BSVHU"]),
      indexBsff(BSDS["BSFF"])
    ]);
    await refreshElasticSearch();

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual(
      where.bsdType._in.map(t => BSDS[t].id)
    );
  });

  it.each([
    "createdAt",
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSDDs between two %p dates (strict)", async date => {
    // convert elastic key to form key
    const toFormKey: {
      [P in keyof BsdElastic]?: keyof Form;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "sentAt",
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
        return indexForm(await getFullForm(f));
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
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSDAs between two %p dates (strict)", async date => {
    // convert elastic key to bsda key
    const toBsdaKey: {
      [P in keyof BsdElastic]?: keyof Bsda;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "transporterTransportTakenOverAt",
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
        return indexBsda({ ...bsda, intermediaries: [] });
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

  it.each([
    "createdAt",
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSDASRIs between two %p dates (strict)", async date => {
    // convert elastic key to bsdasri key
    const toBsdasriKey: {
      [P in keyof BsdElastic]?: keyof Bsdasri;
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
        return indexBsdasri(bsda);
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
      [P in keyof BsdElastic]?: keyof Bsvhu;
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
      [bsvhu1, bsvhu2, bsvhu3, bsvhu4].map(async bsda => {
        return indexBsvhu(bsda);
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

  it.each(["createdAt", "transporterTakenOverAt", "destinationReceptionDate"])(
    "should filter BSFFs between two %p dates (strict)",
    async date => {
      // convert elastic key to bsff key
      const toBsffKey: {
        [P in keyof BsdElastic]?: keyof Bsff;
      } = {
        createdAt: "createdAt",
        transporterTakenOverAt: "transporterTransportTakenOverAt",
        destinationReceptionDate: "destinationReceptionDate"
      };

      const bsff1 = await createBsff(
        {},
        { [toBsffKey[date]]: new Date("2021-01-01") }
      );

      const bsff2 = await createBsff(
        {},
        {
          [toBsffKey[date]]: new Date("2021-01-02")
        }
      );

      const bsff3 = await createBsff(
        {},
        {
          [toBsffKey[date]]: new Date("2021-01-03")
        }
      );

      const bsff4 = await createBsff(
        {},
        {
          [toBsffKey[date]]: new Date("2021-01-04")
        }
      );

      await Promise.all(
        [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
          return indexBsff(bsff);
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

  it("should filter BSFF between two operation dates (strict)", async () => {
    const bsff1 = await createBsff(
      {},
      {},
      {
        operationDate: new Date("2021-01-01"),
        operationSignatureDate: new Date("2021-01-01"),
        operationCode: "R2"
      }
    );

    const bsff2 = await createBsff(
      {},
      {},
      {
        operationDate: new Date("2021-01-02"),
        operationSignatureDate: new Date("2021-01-02"),
        operationCode: "R2"
      }
    );

    const bsff3 = await createBsff(
      {},
      {},
      {
        operationDate: new Date("2021-01-03"),
        operationSignatureDate: new Date("2021-01-03"),
        operationCode: "R2"
      }
    );

    const bsff4 = await createBsff(
      {},
      {},
      {
        operationDate: new Date("2021-01-04"),
        operationSignatureDate: new Date("2021-01-04"),
        operationCode: "R2"
      }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
        return indexBsff(bsff);
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
      [P in keyof BsdElastic]?: keyof Form;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "sentAt",
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
        return indexForm(await getFullForm(f));
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
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSDAs between two %p dates (not strict)", async date => {
    // convert elastic key to bsda key
    const toBsdaKey: {
      [P in keyof BsdElastic]?: keyof Bsda;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "transporterTransportTakenOverAt",
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
        return indexBsda({ ...bsda, intermediaries: [] });
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

  it.each([
    "createdAt",
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSDASRIs between two %p dates (not strict)", async date => {
    // convert elastic key to bsdasri key
    const toBsdasriKey: {
      [P in keyof BsdElastic]?: keyof Bsdasri;
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
        return indexBsdasri(bsda);
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
      [P in keyof BsdElastic]?: keyof Bsvhu;
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
      [bsvhu1, bsvhu2, bsvhu3, bsvhu4].map(async bsda => {
        return indexBsvhu(bsda);
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

  it.each(["createdAt", "transporterTakenOverAt", "destinationReceptionDate"])(
    "should filter BSFFs between two %p dates (not strict)",
    async date => {
      // convert elastic key to bsff key
      const toBsffKey: {
        [P in keyof BsdElastic]?: keyof Bsff;
      } = {
        createdAt: "createdAt",
        transporterTakenOverAt: "transporterTransportTakenOverAt",
        destinationReceptionDate: "destinationReceptionDate"
      };

      const bsff1 = await createBsff(
        {},
        { [toBsffKey[date]]: new Date("2021-01-01") }
      );

      const bsff2 = await createBsff(
        {},
        {
          [toBsffKey[date]]: new Date("2021-01-02")
        }
      );

      const bsff3 = await createBsff(
        {},
        {
          [toBsffKey[date]]: new Date("2021-01-03")
        }
      );

      const bsff4 = await createBsff(
        {},
        {
          [toBsffKey[date]]: new Date("2021-01-04")
        }
      );

      await Promise.all(
        [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
          return indexBsff(bsff);
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

  it("should filter BSFF between two operation dates (not strict)", async () => {
    const bsff1 = await createBsff(
      {},
      {},
      {
        operationDate: new Date("2021-01-01"),
        operationSignatureDate: new Date("2021-01-01"),
        operationCode: "R2"
      }
    );

    const bsff2 = await createBsff(
      {},
      {},
      {
        operationDate: new Date("2021-01-02"),
        operationSignatureDate: new Date("2021-01-02"),
        operationCode: "R2"
      }
    );

    const bsff3 = await createBsff(
      {},
      {},
      {
        operationDate: new Date("2021-01-03"),
        operationSignatureDate: new Date("2021-01-03"),
        operationCode: "R2"
      }
    );

    const bsff4 = await createBsff(
      {},
      {},
      {
        operationDate: new Date("2021-01-04"),
        operationSignatureDate: new Date("2021-01-04"),
        operationCode: "R2"
      }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
        return indexBsff(bsff);
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
      [P in keyof BsdElastic]?: keyof Form;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "sentAt",
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
        return indexForm(await getFullForm(f));
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
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSDAs on %p (exact date)", async date => {
    // convert elastic key to bsda key
    const toBsdaKey: {
      [P in keyof BsdElastic]?: keyof Bsda;
    } = {
      createdAt: "createdAt",
      transporterTakenOverAt: "transporterTransportTakenOverAt",
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
        return indexBsda({ ...bsda, intermediaries: [] });
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

  it.each([
    "createdAt",
    "transporterTakenOverAt",
    "destinationReceptionDate",
    "destinationOperationDate"
  ])("should filter BSDASRIs on %p (exact date)", async date => {
    // convert elastic key to bsdasri key
    const toBsdasriKey: {
      [P in keyof BsdElastic]?: keyof Bsdasri;
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
        return indexBsdasri(bsda);
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
      [P in keyof BsdElastic]?: keyof Bsvhu;
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
      [bsvhu1, bsvhu2, bsvhu3, bsvhu4].map(async bsda => {
        return indexBsvhu(bsda);
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

  it.each(["createdAt", "transporterTakenOverAt", "destinationReceptionDate"])(
    "should filter BSFFs on %p (exact date)",
    async date => {
      // convert elastic key to bsff key
      const toBsffKey: {
        [P in keyof BsdElastic]?: keyof Bsff;
      } = {
        createdAt: "createdAt",
        transporterTakenOverAt: "transporterTransportTakenOverAt",
        destinationReceptionDate: "destinationReceptionDate"
      };

      const bsff1 = await createBsff(
        {},
        { [toBsffKey[date]]: new Date("2021-01-01") }
      );

      const bsff2 = await createBsff(
        {},
        {
          [toBsffKey[date]]: new Date("2021-01-02")
        }
      );

      const bsff3 = await createBsff(
        {},
        {
          [toBsffKey[date]]: new Date("2021-01-03")
        }
      );

      const bsff4 = await createBsff(
        {},
        {
          [toBsffKey[date]]: new Date("2021-01-04")
        }
      );

      await Promise.all(
        [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
          return indexBsff(bsff);
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

  it("should filter BSFF between two operation dates (exact date)", async () => {
    const bsff1 = await createBsff(
      {},
      {},
      {
        operationDate: new Date("2021-01-01"),
        operationSignatureDate: new Date("2021-01-01"),
        operationCode: "R2"
      }
    );

    const bsff2 = await createBsff(
      {},
      {},
      {
        operationDate: new Date("2021-01-02"),
        operationSignatureDate: new Date("2021-01-02"),
        operationCode: "R2"
      }
    );

    const bsff3 = await createBsff(
      {},
      {},
      {
        operationDate: new Date("2021-01-03"),
        operationSignatureDate: new Date("2021-01-03"),
        operationCode: "R2"
      }
    );

    const bsff4 = await createBsff(
      {},
      {},
      {
        operationDate: new Date("2021-01-04"),
        operationSignatureDate: new Date("2021-01-04"),
        operationCode: "R2"
      }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
        return indexBsff(bsff);
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

  it("should filter BSDs between two reception weights (strict)", async () => {
    const user = await userFactory();

    const form1 = await formFactory({
      ownerId: user.id,
      opt: { quantityReceived: 1 }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { quantityReceived: 2 }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { quantityReceived: 3 }
    });

    const form4 = await formFactory({
      ownerId: user.id,
      opt: { quantityReceived: 4 }
    });

    await Promise.all(
      [form1, form2, form3, form4].map(async f => {
        return indexForm(await getFullForm(f));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationReceptionWeight: {
        _gt: 1,
        _lt: 4
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form2.id, form3.id]);
  });

  it("should filter BSDAs between two reception weights (strict)", async () => {
    const bsda1 = await bsdaFactory({
      opt: { destinationReceptionWeight: 1 }
    });

    const bsda2 = await bsdaFactory({
      opt: { destinationReceptionWeight: 2 }
    });

    const bsda3 = await bsdaFactory({
      opt: { destinationReceptionWeight: 3 }
    });

    const bsda4 = await bsdaFactory({
      opt: { destinationReceptionWeight: 4 }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3, bsda4].map(async bsda => {
        return indexBsda({ ...bsda, intermediaries: [] });
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationReceptionWeight: {
        _gt: 1,
        _lt: 4
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda2.id, bsda3.id]);
  });

  it("should filter BSDASRIs between two reception weights (strict)", async () => {
    const bsdasri1 = await bsdasriFactory({
      opt: { destinationReceptionWasteWeightValue: 1 }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { destinationReceptionWasteWeightValue: 2 }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { destinationReceptionWasteWeightValue: 3 }
    });

    const bsdasri4 = await bsdasriFactory({
      opt: { destinationReceptionWasteWeightValue: 4 }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3, bsdasri4].map(async bsda => {
        return indexBsdasri(bsda);
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationReceptionWeight: {
        _gt: 1,
        _lt: 4
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri2.id, bsdasri3.id]);
  });

  it("should filter BSVHUs between two reception weights (strict)", async () => {
    const bsvhu1 = await bsvhuFactory({
      opt: { destinationReceptionWeight: 1 }
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { destinationReceptionWeight: 2 }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { destinationReceptionWeight: 3 }
    });

    const bsvhu4 = await bsvhuFactory({
      opt: { destinationReceptionWeight: 4 }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3, bsvhu4].map(async bsda => {
        return indexBsvhu(bsda);
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationReceptionWeight: {
        _gt: 1,
        _lt: 4
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu2.id, bsvhu3.id]);
  });

  // it("should filter BSFFs between two reception weights (strict)", async () => {
  //   const bsff1 = await createBsff({}, { destinationReceptionWeight: 1 });

  //   const bsff2 = await createBsff({}, { destinationReceptionWeight: 2 });

  //   const bsff3 = await createBsff({}, { destinationReceptionWeight: 3 });

  //   const bsff4 = await createBsff({}, { destinationReceptionWeight: 4 });

  //   await Promise.all(
  //     [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
  //       return indexBsff(bsff);
  //     })
  //   );
  //   await refreshElasticSearch();

  //   const where: WasteRegistryWhere = {
  //     destinationReceptionWeight: {
  //       _gt: 1,
  //       _lt: 4
  //     }
  //   };

  //   const bsds = await searchBsds(where);

  //   expect(bsds.map(bsd => bsd.id)).toEqual([bsff2.id, bsff3.id]);
  // });

  it("should filter BSDs between two reception weights (not strict)", async () => {
    const user = await userFactory();

    const form1 = await formFactory({
      ownerId: user.id,
      opt: { quantityReceived: 1 }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { quantityReceived: 2 }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { quantityReceived: 3 }
    });

    const form4 = await formFactory({
      ownerId: user.id,
      opt: { quantityReceived: 4 }
    });

    await Promise.all(
      [form1, form2, form3, form4].map(async f => {
        return indexForm(await getFullForm(f));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationReceptionWeight: {
        _gte: 2,
        _lte: 3
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form2.id, form3.id]);
  });

  it("should filter BSDAs between two reception weights (not strict)", async () => {
    const bsda1 = await bsdaFactory({
      opt: { destinationReceptionWeight: 1 }
    });

    const bsda2 = await bsdaFactory({
      opt: { destinationReceptionWeight: 2 }
    });

    const bsda3 = await bsdaFactory({
      opt: { destinationReceptionWeight: 3 }
    });

    const bsda4 = await bsdaFactory({
      opt: { destinationReceptionWeight: 4 }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3, bsda4].map(async bsda => {
        return indexBsda({ ...bsda, intermediaries: [] });
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationReceptionWeight: {
        _gte: 2,
        _lte: 3
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda2.id, bsda3.id]);
  });

  it("should filter BSDASRIs between two reception weights (not strict)", async () => {
    const bsdasri1 = await bsdasriFactory({
      opt: { destinationReceptionWasteWeightValue: 1 }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { destinationReceptionWasteWeightValue: 2 }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { destinationReceptionWasteWeightValue: 3 }
    });

    const bsdasri4 = await bsdasriFactory({
      opt: { destinationReceptionWasteWeightValue: 4 }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3, bsdasri4].map(async bsda => {
        return indexBsdasri(bsda);
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationReceptionWeight: {
        _gte: 2,
        _lte: 3
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri2.id, bsdasri3.id]);
  });

  it("should filter BSVHUs between two reception weights (not strict)", async () => {
    const bsvhu1 = await bsvhuFactory({
      opt: { destinationReceptionWeight: 1 }
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { destinationReceptionWeight: 2 }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { destinationReceptionWeight: 3 }
    });

    const bsvhu4 = await bsvhuFactory({
      opt: { destinationReceptionWeight: 4 }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3, bsvhu4].map(async bsda => {
        return indexBsvhu(bsda);
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationReceptionWeight: {
        _gte: 2,
        _lte: 3
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu2.id, bsvhu3.id]);
  });

  // it("should filter BSFFs between two reception weights (not strict)", async () => {
  //   const bsff1 = await createBsff({}, { destinationReceptionWeight: 1 });

  //   const bsff2 = await createBsff({}, { destinationReceptionWeight: 2 });

  //   const bsff3 = await createBsff({}, { destinationReceptionWeight: 3 });

  //   const bsff4 = await createBsff({}, { destinationReceptionWeight: 4 });

  //   await Promise.all(
  //     [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
  //       return indexBsff(bsff);
  //     })
  //   );
  //   await refreshElasticSearch();

  //   const where: WasteRegistryWhere = {
  //     destinationReceptionWeight: {
  //       _gte: 2,
  //       _lte: 3
  //     }
  //   };

  //   const bsds = await searchBsds(where);

  //   expect(bsds.map(bsd => bsd.id)).toEqual([bsff2.id, bsff3.id]);
  // });

  it("should filter BSDs between on reception weight (exact)", async () => {
    const user = await userFactory();

    const form1 = await formFactory({
      ownerId: user.id,
      opt: { quantityReceived: 1 }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { quantityReceived: 2 }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { quantityReceived: 3 }
    });

    const form4 = await formFactory({
      ownerId: user.id,
      opt: { quantityReceived: 4 }
    });

    await Promise.all(
      [form1, form2, form3, form4].map(async f => {
        return indexForm(await getFullForm(f));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationReceptionWeight: {
        _eq: 2
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form2.id]);
  });

  it("should filter BSDAs on reception weight (exact)", async () => {
    const bsda1 = await bsdaFactory({
      opt: { destinationReceptionWeight: 1 }
    });

    const bsda2 = await bsdaFactory({
      opt: { destinationReceptionWeight: 2 }
    });

    const bsda3 = await bsdaFactory({
      opt: { destinationReceptionWeight: 3 }
    });

    const bsda4 = await bsdaFactory({
      opt: { destinationReceptionWeight: 4 }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3, bsda4].map(async bsda => {
        return indexBsda({ ...bsda, intermediaries: [] });
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationReceptionWeight: {
        _eq: 2
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda2.id]);
  });

  it("should filter BSDASRIs on reception weight (exact)", async () => {
    const bsdasri1 = await bsdasriFactory({
      opt: { destinationReceptionWasteWeightValue: 1 }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { destinationReceptionWasteWeightValue: 2 }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { destinationReceptionWasteWeightValue: 3 }
    });

    const bsdasri4 = await bsdasriFactory({
      opt: { destinationReceptionWasteWeightValue: 4 }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3, bsdasri4].map(async bsda => {
        return indexBsdasri(bsda);
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationReceptionWeight: {
        _eq: 2
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri2.id]);
  });

  it("should filter BSVHUs on reception weight (exact)", async () => {
    const bsvhu1 = await bsvhuFactory({
      opt: { destinationReceptionWeight: 1 }
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { destinationReceptionWeight: 2 }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { destinationReceptionWeight: 3 }
    });

    const bsvhu4 = await bsvhuFactory({
      opt: { destinationReceptionWeight: 4 }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3, bsvhu4].map(async bsda => {
        return indexBsvhu(bsda);
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationReceptionWeight: {
        _eq: 2
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu2.id]);
  });

  // it("should filter BSFFs on reception weight (exact)", async () => {
  //   const bsff1 = await createBsff({}, { destinationReceptionWeight: 1 });

  //   const bsff2 = await createBsff({}, { destinationReceptionWeight: 2 });

  //   const bsff3 = await createBsff({}, { destinationReceptionWeight: 3 });

  //   const bsff4 = await createBsff({}, { destinationReceptionWeight: 4 });

  //   await Promise.all(
  //     [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
  //       return indexBsff(bsff);
  //     })
  //   );
  //   await refreshElasticSearch();

  //   const where: WasteRegistryWhere = {
  //     destinationReceptionWeight: {
  //       _eq: 2
  //     }
  //   };

  //   const bsds = await searchBsds(where);

  //   expect(bsds.map(bsd => bsd.id)).toEqual([bsff2.id]);
  // });

  it("should filter BSDDs on emitterCompanySiret (exact)", async () => {
    const user = await userFactory();

    const form1 = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: "11111111111111" }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: "22222222222222" }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFullForm(f));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _eq: "11111111111111"
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id]);
  });
  it("should filter BSDAs on emitterCompanySiret (exact)", async () => {
    const bsda1 = await bsdaFactory({
      opt: { emitterCompanySiret: "11111111111111" }
    });

    const bsda2 = await bsdaFactory({
      opt: { emitterCompanySiret: "22222222222222" }
    });

    const bsda3 = await bsdaFactory({
      opt: { emitterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        return indexBsda({ ...bsda, intermediaries: [] });
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _eq: "11111111111111"
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id]);
  });
  it("should filter BSDASRIs on emitterCompanySiret (exact)", async () => {
    const bsdasri1 = await bsdasriFactory({
      opt: { emitterCompanySiret: "11111111111111" }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { emitterCompanySiret: "22222222222222" }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { emitterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsda => {
        return indexBsdasri(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _eq: "11111111111111"
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id]);
  });
  it("should filter BSVHUs on emitterCompanySiret (exact)", async () => {
    const bsvhu1 = await bsvhuFactory({
      opt: { emitterCompanySiret: "11111111111111" }
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { emitterCompanySiret: "22222222222222" }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { emitterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsda => {
        return indexBsvhu(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _eq: "11111111111111"
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id]);
  });
  it("should filter BSFFs on emitterCompanySiret (exact)", async () => {
    const bsff1 = await createBsff(
      {},
      { emitterCompanySiret: "11111111111111" }
    );

    const bsff2 = await createBsff(
      {},
      { emitterCompanySiret: "22222222222222" }
    );

    const bsff3 = await createBsff(
      {},
      { emitterCompanySiret: "33333333333333" }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(bsff);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _eq: "11111111111111"
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id]);
  });
  it("should filter BSDDs on a list of emitterCompanySiret", async () => {
    const user = await userFactory();

    const form1 = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: "11111111111111" }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: "22222222222222" }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFullForm(f));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _in: ["11111111111111", "22222222222222"]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id, form2.id]);
  });
  it("should filter BSDAs on a list of emitterCompanySiret", async () => {
    const bsda1 = await bsdaFactory({
      opt: { emitterCompanySiret: "11111111111111" }
    });

    const bsda2 = await bsdaFactory({
      opt: { emitterCompanySiret: "22222222222222" }
    });

    const bsda3 = await bsdaFactory({
      opt: { emitterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        return indexBsda({ ...bsda, intermediaries: [] });
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _in: ["11111111111111", "22222222222222"]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id, bsda2.id]);
  });
  it("should filter BSDASRIs on a list of emitterCompanySiret", async () => {
    const bsdasri1 = await bsdasriFactory({
      opt: { emitterCompanySiret: "11111111111111" }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { emitterCompanySiret: "22222222222222" }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { emitterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsda => {
        return indexBsdasri(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _in: ["11111111111111", "22222222222222"]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id, bsdasri2.id]);
  });
  it("should filter BSVHUs on a list of emitterCompanySiret", async () => {
    const bsvhu1 = await bsvhuFactory({
      opt: { emitterCompanySiret: "11111111111111" }
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { emitterCompanySiret: "22222222222222" }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { emitterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsda => {
        return indexBsvhu(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _in: ["11111111111111", "22222222222222"]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id, bsvhu2.id]);
  });
  it("should filter BSFFs on a list of emitterCompanySiret", async () => {
    const bsff1 = await createBsff(
      {},
      { emitterCompanySiret: "11111111111111" }
    );

    const bsff2 = await createBsff(
      {},
      { emitterCompanySiret: "22222222222222" }
    );

    const bsff3 = await createBsff(
      {},
      { emitterCompanySiret: "33333333333333" }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(bsff);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _in: ["11111111111111", "22222222222222"]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id, bsff2.id]);
  });
  it("should filter BSDDs on a list of emitterCompanySiret", async () => {
    const user = await userFactory();

    const form1 = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: "11111111111111" }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: "22222222222222" }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFullForm(f));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _contains: "1111"
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id]);
  });

  it("should filter BSDAs on a substring of emitterCompanySiret", async () => {
    const bsda1 = await bsdaFactory({
      opt: { emitterCompanySiret: "11111111111111" }
    });

    const bsda2 = await bsdaFactory({
      opt: { emitterCompanySiret: "22222222222222" }
    });

    const bsda3 = await bsdaFactory({
      opt: { emitterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        return indexBsda({ ...bsda, intermediaries: [] });
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _contains: "1111"
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id]);
  });
  it("should filter BSDASRIs on a substring of emitterCompanySiret", async () => {
    const bsdasri1 = await bsdasriFactory({
      opt: { emitterCompanySiret: "11111111111111" }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { emitterCompanySiret: "22222222222222" }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { emitterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsda => {
        return indexBsdasri(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _contains: "1111"
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id]);
  });
  it("should filter BSVHUs on a substring of emitterCompanySiret", async () => {
    const bsvhu1 = await bsvhuFactory({
      opt: { emitterCompanySiret: "11111111111111" }
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { emitterCompanySiret: "22222222222222" }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { emitterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsda => {
        return indexBsvhu(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _contains: "1111"
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id]);
  });
  it("should filter BSFFs on a substring of emitterCompanySiret", async () => {
    const bsff1 = await createBsff(
      {},
      { emitterCompanySiret: "11111111111111" }
    );

    const bsff2 = await createBsff(
      {},
      { emitterCompanySiret: "22222222222222" }
    );

    const bsff3 = await createBsff(
      {},
      { emitterCompanySiret: "33333333333333" }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(bsff);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _contains: "1111"
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id]);
  });

  it("should filter BSDDs on transporterCompanySiret (exact)", async () => {
    const user = await userFactory();

    const form1 = await formFactory({
      ownerId: user.id,
      opt: { transporterCompanySiret: "11111111111111" }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { transporterCompanySiret: "22222222222222" }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { transporterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFullForm(f));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _eq: "11111111111111"
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id]);
  });
  it("should filter BSDAs on transporterCompanySiret (exact)", async () => {
    const bsda1 = await bsdaFactory({
      opt: { transporterCompanySiret: "11111111111111" }
    });

    const bsda2 = await bsdaFactory({
      opt: { transporterCompanySiret: "22222222222222" }
    });

    const bsda3 = await bsdaFactory({
      opt: { transporterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        return indexBsda({ ...bsda, intermediaries: [] });
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _eq: "11111111111111"
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id]);
  });
  it("should filter BSDASRIs on transporterCompanySiret (exact)", async () => {
    const bsdasri1 = await bsdasriFactory({
      opt: { transporterCompanySiret: "11111111111111" }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { transporterCompanySiret: "22222222222222" }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { transporterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsda => {
        return indexBsdasri(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _eq: "11111111111111"
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id]);
  });
  it("should filter BSVHUs on transporterCompanySiret (exact)", async () => {
    const bsvhu1 = await bsvhuFactory({
      opt: { transporterCompanySiret: "11111111111111" }
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { transporterCompanySiret: "22222222222222" }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { transporterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsda => {
        return indexBsvhu(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _eq: "11111111111111"
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id]);
  });
  it("should filter BSFFs on transporterCompanySiret (exact)", async () => {
    const bsff1 = await createBsff(
      {},
      { transporterCompanySiret: "11111111111111" }
    );

    const bsff2 = await createBsff(
      {},
      { transporterCompanySiret: "22222222222222" }
    );

    const bsff3 = await createBsff(
      {},
      { transporterCompanySiret: "33333333333333" }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(bsff);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _eq: "11111111111111"
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id]);
  });
  it("should filter BSDDs on a list of transporterCompanySiret", async () => {
    const user = await userFactory();

    const form1 = await formFactory({
      ownerId: user.id,
      opt: { transporterCompanySiret: "11111111111111" }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { transporterCompanySiret: "22222222222222" }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { transporterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFullForm(f));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _in: ["11111111111111", "22222222222222"]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id, form2.id]);
  });
  it("should filter BSDAs on a list of transporterCompanySiret", async () => {
    const bsda1 = await bsdaFactory({
      opt: { transporterCompanySiret: "11111111111111" }
    });

    const bsda2 = await bsdaFactory({
      opt: { transporterCompanySiret: "22222222222222" }
    });

    const bsda3 = await bsdaFactory({
      opt: { transporterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        return indexBsda({ ...bsda, intermediaries: [] });
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _in: ["11111111111111", "22222222222222"]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id, bsda2.id]);
  });
  it("should filter BSDASRIs on a list of transporterCompanySiret", async () => {
    const bsdasri1 = await bsdasriFactory({
      opt: { transporterCompanySiret: "11111111111111" }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { transporterCompanySiret: "22222222222222" }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { transporterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsda => {
        return indexBsdasri(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _in: ["11111111111111", "22222222222222"]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id, bsdasri2.id]);
  });
  it("should filter BSVHUs on a list of transporterCompanySiret", async () => {
    const bsvhu1 = await bsvhuFactory({
      opt: { transporterCompanySiret: "11111111111111" }
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { transporterCompanySiret: "22222222222222" }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { transporterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsda => {
        return indexBsvhu(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _in: ["11111111111111", "22222222222222"]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id, bsvhu2.id]);
  });
  it("should filter BSFFs on a list of transporterCompanySiret", async () => {
    const bsff1 = await createBsff(
      {},
      { transporterCompanySiret: "11111111111111" }
    );

    const bsff2 = await createBsff(
      {},
      { transporterCompanySiret: "22222222222222" }
    );

    const bsff3 = await createBsff(
      {},
      { transporterCompanySiret: "33333333333333" }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(bsff);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _in: ["11111111111111", "22222222222222"]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id, bsff2.id]);
  });
  it("should filter BSDDs on a list of transporterCompanySiret", async () => {
    const user = await userFactory();

    const form1 = await formFactory({
      ownerId: user.id,
      opt: { transporterCompanySiret: "11111111111111" }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { transporterCompanySiret: "22222222222222" }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { transporterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFullForm(f));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _contains: "1111"
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id]);
  });

  it("should filter BSDAs on a substring of transporterCompanySiret", async () => {
    const bsda1 = await bsdaFactory({
      opt: { transporterCompanySiret: "11111111111111" }
    });

    const bsda2 = await bsdaFactory({
      opt: { transporterCompanySiret: "22222222222222" }
    });

    const bsda3 = await bsdaFactory({
      opt: { transporterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        return indexBsda({ ...bsda, intermediaries: [] });
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _contains: "1111"
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id]);
  });
  it("should filter BSDASRIs on a substring of transporterCompanySiret", async () => {
    const bsdasri1 = await bsdasriFactory({
      opt: { transporterCompanySiret: "11111111111111" }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { transporterCompanySiret: "22222222222222" }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { transporterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsda => {
        return indexBsdasri(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _contains: "1111"
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id]);
  });
  it("should filter BSVHUs on a substring of transporterCompanySiret", async () => {
    const bsvhu1 = await bsvhuFactory({
      opt: { transporterCompanySiret: "11111111111111" }
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { transporterCompanySiret: "22222222222222" }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { transporterCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsda => {
        return indexBsvhu(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _contains: "1111"
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id]);
  });
  it("should filter BSFFs on a substring of transporterCompanySiret", async () => {
    const bsff1 = await createBsff(
      {},
      { transporterCompanySiret: "11111111111111" }
    );

    const bsff2 = await createBsff(
      {},
      { transporterCompanySiret: "22222222222222" }
    );

    const bsff3 = await createBsff(
      {},
      { transporterCompanySiret: "33333333333333" }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(bsff);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _contains: "1111"
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id]);
  });

  ///////////////

  it("should filter BSDDs on destinationCompanySiret (exact)", async () => {
    const user = await userFactory();

    const form1 = await formFactory({
      ownerId: user.id,
      opt: { recipientCompanySiret: "11111111111111" }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { recipientCompanySiret: "22222222222222" }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { recipientCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFullForm(f));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _eq: "11111111111111"
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id]);
  });
  it("should filter BSDAs on destinationCompanySiret (exact)", async () => {
    const bsda1 = await bsdaFactory({
      opt: { destinationCompanySiret: "11111111111111" }
    });

    const bsda2 = await bsdaFactory({
      opt: { destinationCompanySiret: "22222222222222" }
    });

    const bsda3 = await bsdaFactory({
      opt: { destinationCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        return indexBsda({ ...bsda, intermediaries: [] });
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _eq: "11111111111111"
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id]);
  });
  it("should filter BSDASRIs on destinationCompanySiret (exact)", async () => {
    const bsdasri1 = await bsdasriFactory({
      opt: { destinationCompanySiret: "11111111111111" }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { destinationCompanySiret: "22222222222222" }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { destinationCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsda => {
        return indexBsdasri(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _eq: "11111111111111"
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id]);
  });
  it("should filter BSVHUs on transporterCompanySiret (exact)", async () => {
    const bsvhu1 = await bsvhuFactory({
      opt: { destinationCompanySiret: "11111111111111" }
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { destinationCompanySiret: "22222222222222" }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { destinationCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsda => {
        return indexBsvhu(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _eq: "11111111111111"
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id]);
  });
  it("should filter BSFFs on destinationCompanySiret (exact)", async () => {
    const bsff1 = await createBsff(
      {},
      { destinationCompanySiret: "11111111111111" }
    );

    const bsff2 = await createBsff(
      {},
      { destinationCompanySiret: "22222222222222" }
    );

    const bsff3 = await createBsff(
      {},
      { destinationCompanySiret: "33333333333333" }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(bsff);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _eq: "11111111111111"
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id]);
  });
  it("should filter BSDDs on a list of destinationCompanySiret", async () => {
    const user = await userFactory();

    const form1 = await formFactory({
      ownerId: user.id,
      opt: { recipientCompanySiret: "11111111111111" }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { recipientCompanySiret: "22222222222222" }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { recipientCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFullForm(f));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _in: ["11111111111111", "22222222222222"]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id, form2.id]);
  });
  it("should filter BSDAs on a list of destinationCompanySiret", async () => {
    const bsda1 = await bsdaFactory({
      opt: { destinationCompanySiret: "11111111111111" }
    });

    const bsda2 = await bsdaFactory({
      opt: { destinationCompanySiret: "22222222222222" }
    });

    const bsda3 = await bsdaFactory({
      opt: { destinationCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        return indexBsda({ ...bsda, intermediaries: [] });
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _in: ["11111111111111", "22222222222222"]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id, bsda2.id]);
  });
  it("should filter BSDASRIs on a list of destinationCompanySiret", async () => {
    const bsdasri1 = await bsdasriFactory({
      opt: { destinationCompanySiret: "11111111111111" }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { destinationCompanySiret: "22222222222222" }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { destinationCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsda => {
        return indexBsdasri(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _in: ["11111111111111", "22222222222222"]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id, bsdasri2.id]);
  });
  it("should filter BSVHUs on a list of destinationCompanySiret", async () => {
    const bsvhu1 = await bsvhuFactory({
      opt: { destinationCompanySiret: "11111111111111" }
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { destinationCompanySiret: "22222222222222" }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { destinationCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsda => {
        return indexBsvhu(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _in: ["11111111111111", "22222222222222"]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id, bsvhu2.id]);
  });
  it("should filter BSFFs on a list of destinationCompanySiret", async () => {
    const bsff1 = await createBsff(
      {},
      { destinationCompanySiret: "11111111111111" }
    );

    const bsff2 = await createBsff(
      {},
      { destinationCompanySiret: "22222222222222" }
    );

    const bsff3 = await createBsff(
      {},
      { destinationCompanySiret: "33333333333333" }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(bsff);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _in: ["11111111111111", "22222222222222"]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id, bsff2.id]);
  });
  it("should filter BSDDs on a list of destinationCompanySiret", async () => {
    const user = await userFactory();

    const form1 = await formFactory({
      ownerId: user.id,
      opt: { recipientCompanySiret: "11111111111111" }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { recipientCompanySiret: "22222222222222" }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { recipientCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFullForm(f));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _contains: "1111"
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id]);
  });

  it("should filter BSDAs on a substring of destinationCompanySiret", async () => {
    const bsda1 = await bsdaFactory({
      opt: { destinationCompanySiret: "11111111111111" }
    });

    const bsda2 = await bsdaFactory({
      opt: { destinationCompanySiret: "22222222222222" }
    });

    const bsda3 = await bsdaFactory({
      opt: { destinationCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        return indexBsda({ ...bsda, intermediaries: [] });
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _contains: "1111"
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id]);
  });
  it("should filter BSDASRIs on a substring of destinationCompanySiret", async () => {
    const bsdasri1 = await bsdasriFactory({
      opt: { destinationCompanySiret: "11111111111111" }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { destinationCompanySiret: "22222222222222" }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { destinationCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsda => {
        return indexBsdasri(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _contains: "1111"
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id]);
  });
  it("should filter BSVHUs on a substring of destinationCompanySiret", async () => {
    const bsvhu1 = await bsvhuFactory({
      opt: { destinationCompanySiret: "11111111111111" }
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { destinationCompanySiret: "22222222222222" }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { destinationCompanySiret: "33333333333333" }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsda => {
        return indexBsvhu(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _contains: "1111"
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id]);
  });
  it("should filter BSFFs on a substring of destinationCompanySiret", async () => {
    const bsff1 = await createBsff(
      {},
      { destinationCompanySiret: "11111111111111" }
    );

    const bsff2 = await createBsff(
      {},
      { destinationCompanySiret: "22222222222222" }
    );

    const bsff3 = await createBsff(
      {},
      { destinationCompanySiret: "33333333333333" }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(bsff);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _contains: "1111"
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id]);
  });
});
