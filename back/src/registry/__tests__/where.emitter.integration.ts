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
import { bspaohFactory } from "../../bspaoh/__tests__/factories";
import { getBspaohForElastic, indexBspaoh } from "../../bspaoh/elastic";
import { client, index } from "../../common/elastic";
import { getFormForElastic, indexForm } from "../../forms/elastic";
import { WasteRegistryWhere } from "../../generated/graphql/types";
import { formFactory, siretify, userFactory } from "../../__tests__/factories";
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
  it("should filter BSDDs on emitterCompanySiret (exact)", async () => {
    const user = await userFactory();

    const testInput = { emitterCompanySiret: siretify(1) };
    const form1 = await formFactory({
      ownerId: user.id,
      opt: testInput
    });

    const testInput_1 = { emitterCompanySiret: siretify(2) };
    const form2 = await formFactory({
      ownerId: user.id,
      opt: testInput_1
    });

    const testInput_2 = { emitterCompanySiret: siretify(3) };
    const form3 = await formFactory({
      ownerId: user.id,
      opt: testInput_2
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFormForElastic(f));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _eq: testInput.emitterCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id]);
  });
  it("should filter BSDAs on emitterCompanySiret (exact)", async () => {
    const testInput_1 = { emitterCompanySiret: siretify(1) };
    const bsda1 = await bsdaFactory({
      opt: testInput_1
    });

    const testInput = { emitterCompanySiret: siretify(2) };
    const bsda2 = await bsdaFactory({
      opt: testInput
    });

    const testInput_2 = { emitterCompanySiret: siretify(3) };
    const bsda3 = await bsdaFactory({
      opt: testInput_2
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _eq: testInput_1.emitterCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id]);
  });
  it("should filter BSDASRIs on emitterCompanySiret (exact)", async () => {
    const testInput = { emitterCompanySiret: siretify(1) };
    const bsdasri1 = await bsdasriFactory({
      opt: testInput
    });

    const testInput_1 = { emitterCompanySiret: siretify(2) };
    const bsdasri2 = await bsdasriFactory({
      opt: testInput_1
    });

    const testInput_2 = { emitterCompanySiret: siretify(3) };
    const bsdasri3 = await bsdasriFactory({
      opt: testInput_2
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsdasri => {
        return indexBsdasri(await getBsdasriForElastic(bsdasri));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _eq: testInput.emitterCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id]);
  });

  it("should filter BSPAOHs on emitterCompanySiret (exact)", async () => {
    const testInput = { emitterCompanySiret: siretify(1) };
    const bspaoh1 = await bspaohFactory({
      opt: testInput
    });

    const testInput_1 = { emitterCompanySiret: siretify(2) };
    const bspaoh2 = await bspaohFactory({
      opt: testInput_1
    });

    const testInput_2 = { emitterCompanySiret: siretify(3) };
    const bspaoh3 = await bspaohFactory({
      opt: testInput_2
    });

    await Promise.all(
      [bspaoh1, bspaoh2, bspaoh3].map(async bspaoh => {
        return indexBspaoh(await getBspaohForElastic(bspaoh));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _eq: testInput.emitterCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh1.id]);
  });
  it("should filter BSVHUs on emitterCompanySiret (exact)", async () => {
    const testInput_1 = { emitterCompanySiret: siretify(1) };
    const bsvhu1 = await bsvhuFactory({
      opt: testInput_1
    });

    const testInput = { emitterCompanySiret: siretify(2) };
    const bsvhu2 = await bsvhuFactory({
      opt: testInput
    });

    const testInput_2 = { emitterCompanySiret: siretify(3) };
    const bsvhu3 = await bsvhuFactory({
      opt: testInput_2
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsvhu => {
        return indexBsvhu(await getBsvhuForElastic(bsvhu));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _eq: testInput_1.emitterCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id]);
  });
  it("should filter BSFFs on emitterCompanySiret (exact)", async () => {
    const testInput_3 = { emitterCompanySiret: siretify(1) };
    const bsff1 = await createBsff({}, { data: testInput_3 });

    const bsff2 = await createBsff(
      {},
      { data: { emitterCompanySiret: siretify(2) } }
    );

    const bsff3 = await createBsff(
      {},
      { data: { emitterCompanySiret: siretify(3) } }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(await getBsffForElastic(bsff));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _eq: testInput_3.emitterCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id]);
  });
  it("should filter BSDDs on a list of emitterCompanySiret", async () => {
    const user = await userFactory();

    const testInput_4 = { emitterCompanySiret: siretify(1) };
    const form1 = await formFactory({
      ownerId: user.id,
      opt: testInput_4
    });

    const testInput = { emitterCompanySiret: siretify(2) };
    const form2 = await formFactory({
      ownerId: user.id,
      opt: testInput
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFormForElastic(f));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _in: [testInput_4.emitterCompanySiret, testInput.emitterCompanySiret]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id, form2.id]);
  });
  it("should filter BSDAs on a list of emitterCompanySiret", async () => {
    const testInput_1 = { emitterCompanySiret: siretify(1) };
    const bsda1 = await bsdaFactory({
      opt: testInput_1
    });

    const testInput = { emitterCompanySiret: siretify(2) };
    const bsda2 = await bsdaFactory({
      opt: testInput
    });

    const bsda3 = await bsdaFactory({
      opt: { emitterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _in: [testInput_1.emitterCompanySiret, testInput.emitterCompanySiret]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id, bsda2.id]);
  });
  it("should filter BSDASRIs on a list of emitterCompanySiret", async () => {
    const testInput_1 = { emitterCompanySiret: siretify(1) };

    const bsdasri1 = await bsdasriFactory({
      opt: testInput_1
    });

    const testInput = { emitterCompanySiret: siretify(2) };
    const bsdasri2 = await bsdasriFactory({
      opt: testInput
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { emitterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsdasri => {
        return indexBsdasri(await getBsdasriForElastic(bsdasri));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _in: [testInput_1.emitterCompanySiret, testInput.emitterCompanySiret]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id, bsdasri2.id]);
  });

  it("should filter BSPAOHs on a list of emitterCompanySiret)", async () => {
    const testInput = { emitterCompanySiret: siretify(1) };
    const bspaoh1 = await bspaohFactory({
      opt: testInput
    });

    const testInput_1 = { emitterCompanySiret: siretify(2) };
    const bspaoh2 = await bspaohFactory({
      opt: testInput_1
    });

    const testInput_2 = { emitterCompanySiret: siretify(3) };
    const bspaoh3 = await bspaohFactory({
      opt: testInput_2
    });

    await Promise.all(
      [bspaoh1, bspaoh2, bspaoh3].map(async bspaoh => {
        return indexBspaoh(await getBspaohForElastic(bspaoh));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _in: [testInput_1.emitterCompanySiret, testInput.emitterCompanySiret]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh1.id, bspaoh2.id]);
  });
  it("should filter BSVHUs on a list of emitterCompanySiret", async () => {
    const testInput_2 = { emitterCompanySiret: siretify(1) };
    const bsvhu1 = await bsvhuFactory({
      opt: testInput_2
    });

    const testInput_1 = { emitterCompanySiret: siretify(2) };
    const bsvhu2 = await bsvhuFactory({
      opt: testInput_1
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { emitterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsvhu => {
        return indexBsvhu(await getBsvhuForElastic(bsvhu));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _in: [testInput_2.emitterCompanySiret, testInput_1.emitterCompanySiret]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id, bsvhu2.id]);
  });
  it("should filter BSFFs on a list of emitterCompanySiret", async () => {
    const testInput = { emitterCompanySiret: siretify(1) };
    const bsff1 = await createBsff({}, { data: testInput });

    const testInput_1 = { emitterCompanySiret: siretify(2) };
    const bsff2 = await createBsff({}, { data: testInput_1 });

    const bsff3 = await createBsff(
      {},
      { data: { emitterCompanySiret: siretify(3) } }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(await getBsffForElastic(bsff));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _in: [testInput.emitterCompanySiret, testInput_1.emitterCompanySiret]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id, bsff2.id]);
  });
  it("should filter BSDDs on a list of emitterCompanySiret", async () => {
    const user = await userFactory();

    const testInput = { emitterCompanySiret: siretify(1) };
    const form1 = await formFactory({
      ownerId: user.id,
      opt: testInput
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: siretify(2) }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFormForElastic(f));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _contains: testInput.emitterCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id]);
  });

  it("should filter BSDAs on a substring of emitterCompanySiret", async () => {
    const testInput_1 = { emitterCompanySiret: siretify(1) };
    const bsda1 = await bsdaFactory({
      opt: testInput_1
    });

    const bsda2 = await bsdaFactory({
      opt: { emitterCompanySiret: siretify(2) }
    });

    const bsda3 = await bsdaFactory({
      opt: { emitterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _contains: testInput_1.emitterCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id]);
  });
  it("should filter BSDASRIs on a substring of emitterCompanySiret", async () => {
    const testInput = { emitterCompanySiret: siretify(1) };
    const bsdasri1 = await bsdasriFactory({
      opt: testInput
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { emitterCompanySiret: siretify(2) }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { emitterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsdasri => {
        return indexBsdasri(await getBsdasriForElastic(bsdasri));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _contains: testInput.emitterCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id]);
  });
  it("should filter BSPAOHs on a substring of emitterCompanySiret (exact)", async () => {
    const testInput = { emitterCompanySiret: siretify(1) };
    const bspaoh1 = await bspaohFactory({
      opt: testInput
    });

    const testInput_1 = { emitterCompanySiret: siretify(2) };
    const bspaoh2 = await bspaohFactory({
      opt: testInput_1
    });

    const testInput_2 = { emitterCompanySiret: siretify(3) };
    const bspaoh3 = await bspaohFactory({
      opt: testInput_2
    });

    await Promise.all(
      [bspaoh1, bspaoh2, bspaoh3].map(async bspaoh => {
        return indexBspaoh(await getBspaohForElastic(bspaoh));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _contains: testInput.emitterCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh1.id]);
  });
  it("should filter BSVHUs on a substring of emitterCompanySiret", async () => {
    const testInput_1 = { emitterCompanySiret: siretify(1) };
    const bsvhu1 = await bsvhuFactory({
      opt: testInput_1
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { emitterCompanySiret: siretify(2) }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { emitterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsvhu => {
        return indexBsvhu(await getBsvhuForElastic(bsvhu));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _contains: testInput_1.emitterCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id]);
  });
  it("should filter BSFFs on a substring of emitterCompanySiret", async () => {
    const testInput = { emitterCompanySiret: siretify(1) };
    const bsff1 = await createBsff({}, { data: testInput });

    const bsff2 = await createBsff(
      {},
      { data: { emitterCompanySiret: siretify(2) } }
    );

    const bsff3 = await createBsff(
      {},
      { data: { emitterCompanySiret: siretify(3) } }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(await getBsffForElastic(bsff));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      emitterCompanySiret: {
        _contains: testInput.emitterCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id]);
  });
});
