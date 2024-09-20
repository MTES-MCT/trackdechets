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
      BSDD: await getFormForElastic(await formFactory({ ownerId: user.id })),
      BSDA: await getBsdaForElastic(await bsdaFactory({})),
      BSDASRI: await getBsdasriForElastic(await bsdasriFactory({})),
      BSVHU: await getBsvhuForElastic(await bsvhuFactory({})),
      BSFF: await getBsffForElastic(await createBsff()),
      BSPAOH: await getBspaohForElastic(await bspaohFactory({}))
    };
    await Promise.all([
      indexForm(BSDS["BSDD"]),
      indexBsda({ ...BSDS["BSDA"] }),
      indexBsdasri(BSDS["BSDASRI"]),
      indexBsvhu(BSDS["BSVHU"]),
      indexBsff(BSDS["BSFF"]),
      indexBspaoh(BSDS["BSPAOH"])
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

    bsds = await searchBsds({ id: { _eq: BSDS.BSPAOH.id } });
    expect(bsds).toHaveLength(1);
    expect(bsds[0].id).toEqual(BSDS.BSPAOH.id);
  });

  it.each(["BSDD", "BSDA", "BSDASRI", "BSVHU", "BSFF", "BSPAOH"] as BsdType[])(
    "should filter on %p type (equality)",
    async bsdType => {
      const user = await userFactory();
      const BSDS = {
        BSDD: await getFormForElastic(await formFactory({ ownerId: user.id })),
        BSDA: await getBsdaForElastic(await bsdaFactory({})),
        BSDASRI: await getBsdasriForElastic(await bsdasriFactory({})),
        BSVHU: await getBsvhuForElastic(await bsvhuFactory({})),
        BSFF: await getBsffForElastic(await createBsff()),
        BSPAOH: await getBspaohForElastic(await bspaohFactory({}))
      };

      const where: WasteRegistryWhere = {
        bsdType: { _eq: bsdType }
      };

      await Promise.all([
        indexForm(BSDS["BSDD"]),
        indexBsda({ ...BSDS["BSDA"] }),
        indexBsdasri(BSDS["BSDASRI"]),
        indexBsvhu(BSDS["BSVHU"]),
        indexBsff(BSDS["BSFF"]),
        indexBspaoh(BSDS["BSPAOH"])
      ]);
      await refreshElasticSearch();

      const bsds = await searchBsds(where);

      expect(bsds.map(bsd => bsd.id)).toEqual([BSDS[bsdType].id]);
    }
  );

  it("should filter on bsdType (present in list)", async () => {
    const user = await userFactory();
    const BSDS = {
      BSDD: await getFormForElastic(await formFactory({ ownerId: user.id })),
      BSDA: await getBsdaForElastic(await bsdaFactory({})),
      BSDASRI: await getBsdasriForElastic(await bsdasriFactory({})),
      BSVHU: await getBsvhuForElastic(await bsvhuFactory({})),
      BSFF: await getBsffForElastic(await createBsff()),
      BSPAOH: await getBspaohForElastic(await bspaohFactory({}))
    };

    const where: WasteRegistryWhere = {
      bsdType: { _in: ["BSDD", "BSDASRI"] }
    };

    await Promise.all([
      indexForm(BSDS["BSDD"]),
      indexBsda({ ...BSDS["BSDA"] }),
      indexBsdasri(BSDS["BSDASRI"]),
      indexBsvhu(BSDS["BSVHU"]),
      indexBsff(BSDS["BSFF"]),
      indexBspaoh(BSDS["BSPAOH"])
    ]);
    await refreshElasticSearch();

    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual(
      where.bsdType!._in!.map(t => BSDS[t].id)
    );
  });
});
