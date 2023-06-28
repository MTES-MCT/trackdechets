import {
  formFactory,
  formWithTempStorageFactory,
  userFactory
} from "../../../../__tests__/factories";
import { AuthType } from "../../../../auth";
import prisma from "../../../../prisma";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../../integration-tests/helper";
import { ApiResponse, estypes } from "@elastic/elasticsearch";
import {
  client,
  BsdElastic,
  index,
  indexBsd
} from "../../../../common/elastic";
import { indexForm, toBsdElastic } from "../../../elastic";
import { getStream } from "../../../../activity-events";
import { getFormRepository } from "../..";
import { getFullForm } from "../../../database";

describe("formRepository.delete", () => {
  afterEach(resetDatabase);

  it("should soft delete BSDD, create event and delete document in Elasticsearch", async () => {
    async function searchBsds() {
      const { body }: ApiResponse<estypes.SearchResponse<BsdElastic>> =
        await client.search({
          index: index.alias,
          body: {
            query: { match_all: {} }
          }
        });
      return body.hits.hits;
    }

    const user = await userFactory();

    const form = await formFactory({ ownerId: user.id });

    await indexForm(await getFullForm(form));
    await refreshElasticSearch();

    const hits = await searchBsds();
    expect(hits).toHaveLength(1);
    expect(hits[0]._id).toEqual(form.id);

    const { delete: deleteForm } = getFormRepository({
      ...user,
      auth: AuthType.Session
    });

    await deleteForm({ id: form.id });

    const deletedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    expect(deletedForm.isDeleted).toBe(true);

    const events = await getStream(deletedForm.id);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      streamId: form.id,
      type: "BsddDeleted",
      metadata: { authType: "SESSION" },
      actor: user.id
    });

    await refreshElasticSearch();

    expect(await searchBsds()).toHaveLength(0);
  });

  it("should soft delete BSDD with temp storage, create event and delete document in Elasticsearch", async () => {
    async function searchBsds() {
      const { body }: ApiResponse<estypes.SearchResponse<BsdElastic>> =
        await client.search({
          index: index.alias,
          body: {
            query: { match_all: {} }
          }
        });
      return body.hits.hits;
    }

    const user = await userFactory();

    const form = await formWithTempStorageFactory({ ownerId: user.id });
    const fullForm = await getFullForm(form);

    await indexBsd(await toBsdElastic(fullForm));
    await indexBsd(
      await toBsdElastic(await getFullForm(fullForm.forwardedIn!))
    );

    await refreshElasticSearch();

    const hits = await searchBsds();
    // both BSD and BSD suite should be indexed
    expect(hits).toHaveLength(2);
    expect([form.id, form.forwardedInId]).toContain(hits[0]._id);
    expect([form.id, form.forwardedInId]).toContain(hits[1]._id);

    const { delete: deleteForm } = getFormRepository({
      ...user,
      auth: AuthType.Session
    });

    await deleteForm({ id: form.id });

    const deletedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { forwardedIn: true }
    });
    expect(deletedForm.isDeleted).toBe(true);
    expect(deletedForm.forwardedIn!.isDeleted).toBe(true);

    const events = await getStream(deletedForm.id);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      streamId: form.id,
      type: "BsddDeleted",
      metadata: { authType: "SESSION" },
      actor: user.id
    });

    await refreshElasticSearch();

    // both BSD and BSD suite should have been deleted
    expect(await searchBsds()).toHaveLength(0);
  });
});
