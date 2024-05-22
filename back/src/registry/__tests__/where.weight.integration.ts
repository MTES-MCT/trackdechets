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
import { indexBsvhu } from "../../bsvhu/elastic";
import { bsvhuFactory } from "../../bsvhu/__tests__/factories.vhu";
import { bspaohFactory } from "../../bspaoh/__tests__/factories";
import { getBspaohForElastic, indexBspaoh } from "../../bspaoh/elastic";
import { client, index } from "../../common/elastic";
import { getFormForElastic, indexForm } from "../../forms/elastic";
import { WasteRegistryWhere } from "../../generated/graphql/types";
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
        return indexForm(await getFormForElastic(f));
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
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
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
      [bsdasri1, bsdasri2, bsdasri3, bsdasri4].map(async bsdasri => {
        return indexBsdasri(await getBsdasriForElastic(bsdasri));
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
  it("should filter BSPAOHs between two reception weights (strict)", async () => {
    const bspaoh1 = await bspaohFactory({
      opt: { destinationReceptionWasteAcceptedWeightValue: 1 }
    });

    const bspaoh2 = await bspaohFactory({
      opt: { destinationReceptionWasteAcceptedWeightValue: 2 }
    });

    const bspaoh3 = await bspaohFactory({
      opt: { destinationReceptionWasteAcceptedWeightValue: 3 }
    });

    const bspaoh4 = await bspaohFactory({
      opt: { destinationReceptionWasteAcceptedWeightValue: 4 }
    });

    await Promise.all(
      [bspaoh1, bspaoh2, bspaoh3, bspaoh4].map(async bspaoh => {
        return indexBspaoh(await getBspaohForElastic(bspaoh));
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

    expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh2.id, bspaoh3.id]);
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

  it("should filter BSFFs between two reception weights (strict)", async () => {
    const bsff1 = await createBsff(
      {},
      {},
      {},
      { acceptationWeight: 1, acceptationSignatureDate: new Date() }
    );

    const bsff2 = await createBsff(
      {},
      {},
      {},
      { acceptationWeight: 2, acceptationSignatureDate: new Date() }
    );

    const bsff3 = await createBsff(
      {},
      {},
      {},
      { acceptationWeight: 3, acceptationSignatureDate: new Date() }
    );

    const bsff4 = await createBsff(
      {},
      {},
      {},
      { acceptationWeight: 4, acceptationSignatureDate: new Date() }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
        return indexBsff(await getBsffForElastic(bsff));
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

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff2.id, bsff3.id]);
  });

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
        return indexForm(await getFormForElastic(f));
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
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
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
      [bsdasri1, bsdasri2, bsdasri3, bsdasri4].map(async bsdasri => {
        return indexBsdasri(await getBsdasriForElastic(bsdasri));
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

  it("should filter BSPAOHs between two reception weights (not strict)", async () => {
    const bspaoh1 = await bspaohFactory({
      opt: { destinationReceptionWasteAcceptedWeightValue: 1 }
    });

    const bspaoh2 = await bspaohFactory({
      opt: { destinationReceptionWasteAcceptedWeightValue: 2 }
    });

    const bspaoh3 = await bspaohFactory({
      opt: { destinationReceptionWasteAcceptedWeightValue: 3 }
    });

    const bspaoh4 = await bspaohFactory({
      opt: { destinationReceptionWasteAcceptedWeightValue: 4 }
    });

    await Promise.all(
      [bspaoh1, bspaoh2, bspaoh3, bspaoh4].map(async bspaoh => {
        return indexBspaoh(await getBspaohForElastic(bspaoh));
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

    expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh2.id, bspaoh3.id]);
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

  it("should filter BSFFs between two reception weights (not strict)", async () => {
    const bsff1 = await createBsff(
      {},
      {},
      {},
      { acceptationWeight: 1, acceptationSignatureDate: new Date() }
    );

    const bsff2 = await createBsff(
      {},
      {},
      {},
      { acceptationWeight: 2, acceptationSignatureDate: new Date() }
    );

    const bsff3 = await createBsff(
      {},
      {},
      {},
      { acceptationWeight: 3, acceptationSignatureDate: new Date() }
    );

    const bsff4 = await createBsff(
      {},
      {},
      {},
      { acceptationWeight: 4, acceptationSignatureDate: new Date() }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
        return indexBsff(await getBsffForElastic(bsff));
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

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff2.id, bsff3.id]);
  });

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
        return indexForm(await getFormForElastic(f));
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
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
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
      [bsdasri1, bsdasri2, bsdasri3, bsdasri4].map(async bsdasri => {
        return indexBsdasri(await getBsdasriForElastic(bsdasri));
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
  it("should filter BSPAOHs on reception weight (exact)", async () => {
    const bspaoh1 = await bspaohFactory({
      opt: { destinationReceptionWasteAcceptedWeightValue: 1 }
    });

    const bspaoh2 = await bspaohFactory({
      opt: { destinationReceptionWasteAcceptedWeightValue: 2 }
    });

    const bspaoh3 = await bspaohFactory({
      opt: { destinationReceptionWasteAcceptedWeightValue: 3 }
    });

    const bspaoh4 = await bspaohFactory({
      opt: { destinationReceptionWasteAcceptedWeightValue: 4 }
    });

    await Promise.all(
      [bspaoh1, bspaoh2, bspaoh3, bspaoh4].map(async bspaoh => {
        return indexBspaoh(await getBspaohForElastic(bspaoh));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationReceptionWeight: {
        _eq: 2
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh2.id]);
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

  it("should filter BSFFs on reception weight (exact)", async () => {
    const bsff1 = await createBsff(
      {},
      {},
      {},
      { acceptationWeight: 1, acceptationSignatureDate: new Date() }
    );

    const bsff2 = await createBsff(
      {},
      {},
      {},
      { acceptationWeight: 2, acceptationSignatureDate: new Date() }
    );

    const bsff3 = await createBsff(
      {},
      {},
      {},
      { acceptationWeight: 3, acceptationSignatureDate: new Date() }
    );

    const bsff4 = await createBsff(
      {},
      {},
      {},
      { acceptationWeight: 4, acceptationSignatureDate: new Date() }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3, bsff4].map(async bsff => {
        return indexBsff(await getBsffForElastic(bsff));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationReceptionWeight: {
        _eq: 2
      }
    };

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff2.id]);
  });
});
