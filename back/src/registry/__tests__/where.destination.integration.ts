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

  it("should filter BSDDs on destinationCompanySiret (exact)", async () => {
    const user = await userFactory();

    const testInput = { recipientCompanySiret: siretify(1) };
    const form1 = await formFactory({
      ownerId: user.id,
      opt: testInput
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { recipientCompanySiret: siretify(2) }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { recipientCompanySiret: siretify(3) }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFormForElastic(f));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _eq: testInput.recipientCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id]);
  });
  it("should filter BSDAs on destinationCompanySiret (exact)", async () => {
    const testInput_1 = { destinationCompanySiret: siretify(1) };
    const bsda1 = await bsdaFactory({
      opt: testInput_1
    });

    const bsda2 = await bsdaFactory({
      opt: { destinationCompanySiret: siretify(2) }
    });

    const bsda3 = await bsdaFactory({
      opt: { destinationCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _eq: testInput_1.destinationCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id]);
  });
  it("should filter BSDASRIs on destinationCompanySiret (exact)", async () => {
    const testInput = { destinationCompanySiret: siretify(1) };
    const bsdasri1 = await bsdasriFactory({
      opt: testInput
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { destinationCompanySiret: siretify(2) }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { destinationCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsdasri => {
        return indexBsdasri(await getBsdasriForElastic(bsdasri));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _eq: testInput.destinationCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id]);
  });
  it("should filter BSVHUs on transporterCompanySiret (exact)", async () => {
    const testInput_1 = { destinationCompanySiret: siretify(1) };
    const bsvhu1 = await bsvhuFactory({
      opt: testInput_1
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { destinationCompanySiret: siretify(2) }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { destinationCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsvhu => {
        return indexBsvhu(await getBsvhuForElastic(bsvhu));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _eq: testInput_1.destinationCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id]);
  });
  it("should filter BSFFs on destinationCompanySiret (exact)", async () => {
    const testInput = { destinationCompanySiret: siretify(1) };
    const bsff1 = await createBsff({}, { data: testInput });

    const bsff2 = await createBsff(
      {},
      { data: { destinationCompanySiret: siretify(2) } }
    );

    const bsff3 = await createBsff(
      {},
      { data: { destinationCompanySiret: siretify(3) } }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(await getBsffForElastic(bsff));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _eq: testInput.destinationCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id]);
  });
  it("should filter BSPAOHs on destinationCompanySiret (exact)", async () => {
    const testInput = { destinationCompanySiret: siretify(1) };
    const bspaoh1 = await bspaohFactory({
      opt: testInput
    });

    const bspaoh2 = await bspaohFactory({
      opt: { destinationCompanySiret: siretify(2) }
    });

    const bspaoh3 = await bspaohFactory({
      opt: { destinationCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bspaoh1, bspaoh2, bspaoh3].map(async bspaoh => {
        return indexBspaoh(await getBspaohForElastic(bspaoh));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _eq: testInput.destinationCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh1.id]);
  });
  it("should filter BSDDs on a list of destinationCompanySiret", async () => {
    const user = await userFactory();

    const testInput_1 = { recipientCompanySiret: siretify(1) };
    const form1 = await formFactory({
      ownerId: user.id,
      opt: testInput_1
    });

    const testInput = { recipientCompanySiret: siretify(2) };
    const form2 = await formFactory({
      ownerId: user.id,
      opt: testInput
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { recipientCompanySiret: siretify(3) }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFormForElastic(f));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _in: [
          testInput_1.recipientCompanySiret,
          testInput.recipientCompanySiret
        ]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id, form2.id]);
  });
  it("should filter BSDAs on a list of destinationCompanySiret", async () => {
    const testInput_2 = { destinationCompanySiret: siretify(1) };
    const bsda1 = await bsdaFactory({
      opt: testInput_2
    });

    const testInput = { destinationCompanySiret: siretify(2) };
    const bsda2 = await bsdaFactory({
      opt: testInput
    });

    const bsda3 = await bsdaFactory({
      opt: { destinationCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _in: [
          testInput_2.destinationCompanySiret,
          testInput.destinationCompanySiret
        ]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id, bsda2.id]);
  });
  it("should filter BSDASRIs on a list of destinationCompanySiret", async () => {
    const testInput_1 = { destinationCompanySiret: siretify(1) };
    const bsdasri1 = await bsdasriFactory({
      opt: testInput_1
    });

    const testInput = { destinationCompanySiret: siretify(2) };
    const bsdasri2 = await bsdasriFactory({
      opt: testInput
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { destinationCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsdasri => {
        return indexBsdasri(await getBsdasriForElastic(bsdasri));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _in: [
          testInput_1.destinationCompanySiret,
          testInput.destinationCompanySiret
        ]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id, bsdasri2.id]);
  });
  it("should filter BSPAOHs on a list of destinationCompanySiret", async () => {
    const testInput_1 = { destinationCompanySiret: siretify(1) };
    const bspaoh1 = await bspaohFactory({
      opt: testInput_1
    });

    const testInput = { destinationCompanySiret: siretify(2) };
    const bspaoh2 = await bspaohFactory({
      opt: testInput
    });

    const bspaoh3 = await bspaohFactory({
      opt: { destinationCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bspaoh1, bspaoh2, bspaoh3].map(async bspaoh => {
        return indexBspaoh(await getBspaohForElastic(bspaoh));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _in: [
          testInput_1.destinationCompanySiret,
          testInput.destinationCompanySiret
        ]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh1.id, bspaoh2.id]);
  });
  it("should filter BSVHUs on a list of destinationCompanySiret", async () => {
    const testInput_2 = { destinationCompanySiret: siretify(1) };
    const bsvhu1 = await bsvhuFactory({
      opt: testInput_2
    });

    const testInput = { destinationCompanySiret: siretify(2) };
    const bsvhu2 = await bsvhuFactory({
      opt: testInput
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { destinationCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsvhu => {
        return indexBsvhu(await getBsvhuForElastic(bsvhu));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _in: [
          testInput_2.destinationCompanySiret,
          testInput.destinationCompanySiret
        ]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id, bsvhu2.id]);
  });
  it("should filter BSFFs on a list of destinationCompanySiret", async () => {
    const testInput_1 = { destinationCompanySiret: siretify(1) };
    const bsff1 = await createBsff({}, { data: testInput_1 });

    const testInput = { destinationCompanySiret: siretify(2) };
    const bsff2 = await createBsff({}, { data: testInput });

    const bsff3 = await createBsff(
      {},
      { data: { destinationCompanySiret: siretify(3) } }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(await getBsffForElastic(bsff));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _in: [
          testInput_1.destinationCompanySiret,
          testInput.destinationCompanySiret
        ]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id, bsff2.id]);
  });
  it("should filter BSDDs on a list of destinationCompanySiret", async () => {
    const user = await userFactory();

    const testInput_6 = { recipientCompanySiret: siretify(1) };
    const form1 = await formFactory({
      ownerId: user.id,
      opt: testInput_6
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: { recipientCompanySiret: siretify(2) }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: { recipientCompanySiret: siretify(3) }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFormForElastic(f));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _contains: testInput_6.recipientCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id]);
  });

  it("should filter BSDAs on a substring of destinationCompanySiret", async () => {
    const testInput = { destinationCompanySiret: siretify(1) };
    const bsda1 = await bsdaFactory({
      opt: testInput
    });

    const bsda2 = await bsdaFactory({
      opt: { destinationCompanySiret: siretify(2) }
    });

    const bsda3 = await bsdaFactory({
      opt: { destinationCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _contains: testInput.destinationCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id]);
  });
  it("should filter BSDASRIs on a substring of destinationCompanySiret", async () => {
    const testInput_1 = { destinationCompanySiret: siretify(1) };
    const bsdasri1 = await bsdasriFactory({
      opt: testInput_1
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { destinationCompanySiret: siretify(2) }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { destinationCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsdasri => {
        return indexBsdasri(await getBsdasriForElastic(bsdasri));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _contains: testInput_1.destinationCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id]);
  });
  it("should filter BSPAOHs on a substring of destinationCompanySiret", async () => {
    const testInput_1 = { destinationCompanySiret: siretify(1) };
    const bspaoh1 = await bspaohFactory({
      opt: testInput_1
    });

    const bspaoh2 = await bspaohFactory({});

    const bspaoh3 = await bspaohFactory({});

    await Promise.all(
      [bspaoh1, bspaoh2, bspaoh3].map(async bspaoh => {
        return indexBspaoh(await getBspaohForElastic(bspaoh));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _contains: testInput_1.destinationCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh1.id]);
  });

  it("should filter BSVHUs on a substring of destinationCompanySiret", async () => {
    const testInput = { destinationCompanySiret: siretify(1) };
    const bsvhu1 = await bsvhuFactory({
      opt: testInput
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { destinationCompanySiret: siretify(2) }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { destinationCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsvhu => {
        return indexBsvhu(await getBsvhuForElastic(bsvhu));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _contains: testInput.destinationCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id]);
  });
  it("should filter BSFFs on a substring of destinationCompanySiret", async () => {
    const testInput_1 = { destinationCompanySiret: siretify(1) };
    const bsff1 = await createBsff({}, { data: testInput_1 });

    const bsff2 = await createBsff(
      {},
      { data: { destinationCompanySiret: siretify(2) } }
    );

    const bsff3 = await createBsff(
      {},
      { data: { destinationCompanySiret: siretify(3) } }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(await getBsffForElastic(bsff));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      destinationCompanySiret: {
        _contains: testInput_1.destinationCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id]);
  });
});
