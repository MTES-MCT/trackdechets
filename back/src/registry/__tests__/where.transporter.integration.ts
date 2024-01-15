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
  it("should filter BSDDs on transporterCompanySiret (exact)", async () => {
    const user = await userFactory();

    const testInput_1 = { transporterCompanySiret: siretify(1), number: 1 };
    const form1 = await formFactory({
      ownerId: user.id,
      opt: { transporters: { create: testInput_1 } }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: siretify(2),
            number: 1
          }
        }
      }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: siretify(3),
            number: 1
          }
        }
      }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFormForElastic(f));
      })
    );
    await refreshElasticSearch();

    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _eq: testInput_1.transporterCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id]);
  });
  it("should filter BSDAs on transporterCompanySiret (exact)", async () => {
    const testInput = { transporterCompanySiret: siretify(1) };
    const bsda1 = await bsdaFactory({
      opt: testInput
    });

    const bsda2 = await bsdaFactory({
      opt: { transporterCompanySiret: siretify(2) }
    });

    const bsda3 = await bsdaFactory({
      opt: { transporterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _eq: testInput.transporterCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id]);
  });
  it("should filter BSDASRIs on transporterCompanySiret (exact)", async () => {
    const testInput_1 = { transporterCompanySiret: siretify(1) };
    const bsdasri1 = await bsdasriFactory({
      opt: testInput_1
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { transporterCompanySiret: siretify(2) }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { transporterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsdasri => {
        return indexBsdasri(await getBsdasriForElastic(bsdasri));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _eq: testInput_1.transporterCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id]);
  });
  it("should filter BSPAOHs on transporterCompanySiret (exact)", async () => {
    const siret1 = siretify(1);

    const bspaoh1 = await bspaohFactory({
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: siret1,
            number: 1
          }
        }
      }
    });

    const bspaoh2 = await bspaohFactory({
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: siretify(2),
            number: 1
          }
        }
      }
    });

    const bspaoh3 = await bspaohFactory({
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: siretify(3),

            number: 1
          }
        }
      }
    });
    await Promise.all(
      [bspaoh1, bspaoh2, bspaoh3].map(async bspaoh => {
        return indexBspaoh(await getBspaohForElastic(bspaoh));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _eq: siret1
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh1.id]);
  });
  it("should filter BSVHUs on transporterCompanySiret (exact)", async () => {
    const testInput = { transporterCompanySiret: siretify(1) };
    const bsvhu1 = await bsvhuFactory({
      opt: testInput
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { transporterCompanySiret: siretify(2) }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { transporterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsda => {
        return indexBsvhu(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _eq: testInput.transporterCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id]);
  });
  it("should filter BSFFs on transporterCompanySiret (exact)", async () => {
    const testInput_1 = { transporterCompanySiret: siretify(1) };
    const bsff1 = await createBsff({}, testInput_1);

    const bsff2 = await createBsff(
      {},
      { transporterCompanySiret: siretify(2) }
    );

    const bsff3 = await createBsff(
      {},
      { transporterCompanySiret: siretify(3) }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(await getBsffForElastic(bsff));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _eq: testInput_1.transporterCompanySiret
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id]);
  });
  it("should filter BSDDs on a list of transporterCompanySiret", async () => {
    const user = await userFactory();

    const testInput = { transporterCompanySiret: siretify(1), number: 1 };
    const form1 = await formFactory({
      ownerId: user.id,
      opt: { transporters: { create: testInput } }
    });

    const testInput_1 = { transporterCompanySiret: siretify(2), number: 1 };
    const form2 = await formFactory({
      ownerId: user.id,
      opt: { transporters: { create: testInput_1 } }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: {
        transporters: {
          create: { transporterCompanySiret: siretify(3), number: 1 }
        }
      }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFormForElastic(f));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _in: [
          testInput.transporterCompanySiret,
          testInput_1.transporterCompanySiret
        ]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id, form2.id]);
  });
  it("should filter BSDAs on a list of transporterCompanySiret", async () => {
    const testInput_2 = { transporterCompanySiret: siretify(1) };
    const bsda1 = await bsdaFactory({
      opt: testInput_2
    });

    const testInput = { transporterCompanySiret: siretify(2) };
    const bsda2 = await bsdaFactory({
      opt: testInput
    });

    const bsda3 = await bsdaFactory({
      opt: { transporterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _in: [
          testInput_2.transporterCompanySiret,
          testInput.transporterCompanySiret
        ]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id, bsda2.id]);
  });
  it("should filter BSDASRIs on a list of transporterCompanySiret", async () => {
    const testInput_1 = { transporterCompanySiret: siretify(1) };
    const bsdasri1 = await bsdasriFactory({
      opt: testInput_1
    });

    const testInput = { transporterCompanySiret: siretify(2) };
    const bsdasri2 = await bsdasriFactory({
      opt: testInput
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { transporterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsdasri => {
        return indexBsdasri(await getBsdasriForElastic(bsdasri));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _in: [
          testInput_1.transporterCompanySiret,
          testInput.transporterCompanySiret
        ]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id, bsdasri2.id]);
  });
  it("should filter BSPAOHs on a list of transporterCompanySiret (exact)", async () => {
    const siret1 = siretify(1);

    const bspaoh1 = await bspaohFactory({
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: siret1,
            number: 1
          }
        }
      }
    });
    const siret2 = siretify(2);
    const bspaoh2 = await bspaohFactory({
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: siret2,
            number: 1
          }
        }
      }
    });

    const bspaoh3 = await bspaohFactory({
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: siretify(3),

            number: 1
          }
        }
      }
    });
    await Promise.all(
      [bspaoh1, bspaoh2, bspaoh3].map(async bspaoh => {
        return indexBspaoh(await getBspaohForElastic(bspaoh));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _in: [siret1, siret2]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh1.id, bspaoh2.id]);
  });
  it("should filter BSVHUs on a list of transporterCompanySiret", async () => {
    const testInput_2 = { transporterCompanySiret: siretify(1) };
    const bsvhu1 = await bsvhuFactory({
      opt: testInput_2
    });

    const testInput = { transporterCompanySiret: siretify(2) };
    const bsvhu2 = await bsvhuFactory({
      opt: testInput
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { transporterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsda => {
        return indexBsvhu(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _in: [
          testInput_2.transporterCompanySiret,
          testInput.transporterCompanySiret
        ]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id, bsvhu2.id]);
  });
  it("should filter BSFFs on a list of transporterCompanySiret", async () => {
    const testInput_1 = { transporterCompanySiret: siretify(1) };
    const bsff1 = await createBsff({}, testInput_1);

    const testInput = { transporterCompanySiret: siretify(2) };
    const bsff2 = await createBsff({}, testInput);

    const bsff3 = await createBsff(
      {},
      { transporterCompanySiret: siretify(3) }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(await getBsffForElastic(bsff));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _in: [
          testInput_1.transporterCompanySiret,
          testInput.transporterCompanySiret
        ]
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id, bsff2.id]);
  });
  it("should filter BSDDs on a list of transporterCompanySiret", async () => {
    const user = await userFactory();

    const testInput_5 = { transporterCompanySiret: siretify(1), number: 1 };
    const form1 = await formFactory({
      ownerId: user.id,
      opt: { transporters: { create: testInput_5 } }
    });

    const form2 = await formFactory({
      ownerId: user.id,
      opt: {
        transporters: {
          create: { transporterCompanySiret: siretify(2), number: 1 }
        }
      }
    });

    const form3 = await formFactory({
      ownerId: user.id,
      opt: {
        transporters: {
          create: { transporterCompanySiret: siretify(3), number: 1 }
        }
      }
    });

    await Promise.all(
      [form1, form2, form3].map(async f => {
        return indexForm(await getFormForElastic(f));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _contains: testInput_5.transporterCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([form1.id]);
  });

  it("should filter BSDAs on a substring of transporterCompanySiret", async () => {
    const testInput = { transporterCompanySiret: siretify(1) };
    const bsda1 = await bsdaFactory({
      opt: testInput
    });

    const bsda2 = await bsdaFactory({
      opt: { transporterCompanySiret: siretify(2) }
    });

    const bsda3 = await bsdaFactory({
      opt: { transporterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsda1, bsda2, bsda3].map(async bsda => {
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _contains: testInput.transporterCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsda1.id]);
  });
  it("should filter BSDASRIs on a substring of transporterCompanySiret", async () => {
    const testInput_1 = { transporterCompanySiret: siretify(1) };
    const bsdasri1 = await bsdasriFactory({
      opt: testInput_1
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { transporterCompanySiret: siretify(2) }
    });

    const bsdasri3 = await bsdasriFactory({
      opt: { transporterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsdasri1, bsdasri2, bsdasri3].map(async bsdasri => {
        return indexBsdasri(await getBsdasriForElastic(bsdasri));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _contains: testInput_1.transporterCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsdasri1.id]);
  });

  it("should filter BSPAOHs on a substring of transporterCompanySiret (exact)", async () => {
    const siret1 = siretify(1);

    const bspaoh1 = await bspaohFactory({
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: siret1,
            number: 1
          }
        }
      }
    });

    const bspaoh2 = await bspaohFactory({
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: siretify(2),
            number: 1
          }
        }
      }
    });

    const bspaoh3 = await bspaohFactory({
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: siretify(3),

            number: 1
          }
        }
      }
    });
    await Promise.all(
      [bspaoh1, bspaoh2, bspaoh3].map(async bspaoh => {
        return indexBspaoh(await getBspaohForElastic(bspaoh));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _eq: siret1
      }
    };
    const bsds = await searchBsds(where);

    expect(bsds.map(bsd => bsd.id)).toEqual([bspaoh1.id]);
  });
  it("should filter BSVHUs on a substring of transporterCompanySiret", async () => {
    const testInput = { transporterCompanySiret: siretify(1) };
    const bsvhu1 = await bsvhuFactory({
      opt: testInput
    });

    const bsvhu2 = await bsvhuFactory({
      opt: { transporterCompanySiret: siretify(2) }
    });

    const bsvhu3 = await bsvhuFactory({
      opt: { transporterCompanySiret: siretify(3) }
    });

    await Promise.all(
      [bsvhu1, bsvhu2, bsvhu3].map(async bsda => {
        return indexBsvhu(bsda);
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _contains: testInput.transporterCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsvhu1.id]);
  });
  it("should filter BSFFs on a substring of transporterCompanySiret", async () => {
    const testInput_1 = { transporterCompanySiret: siretify(1) };
    const bsff1 = await createBsff({}, testInput_1);

    const bsff2 = await createBsff(
      {},
      { transporterCompanySiret: siretify(2) }
    );

    const bsff3 = await createBsff(
      {},
      { transporterCompanySiret: siretify(3) }
    );

    await Promise.all(
      [bsff1, bsff2, bsff3].map(async bsff => {
        return indexBsff(await getBsffForElastic(bsff));
      })
    );
    await refreshElasticSearch();
    const where: WasteRegistryWhere = {
      transporterCompanySiret: {
        _contains: testInput_1.transporterCompanySiret.slice(4)
      }
    };
    const bsds = await searchBsds(where);
    expect(bsds.map(bsd => bsd.id)).toEqual([bsff1.id]);
  });
});
