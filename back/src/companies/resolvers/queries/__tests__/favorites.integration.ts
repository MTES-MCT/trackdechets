import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { AuthType } from "../../../../auth";
import { resetDatabase } from "../../../../../integration-tests/helper";

const FAVORITES = `query Favorites($type: FavoriteType!){
  favorites(type: $type){
    siret
  }
}`;

describe("query favorites", () => {
  afterAll(resetDatabase);

  it("should return the recent EMITTER", async () => {
    const { user } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });
    const form = await formFactory({
      ownerId: user.id
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query(FAVORITES, {
      variables: { type: "EMITTER" }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        siret: form.emitterCompanySiret
      })
    ]);
  });

  it.todo("should return the user's company if it matches the favorite type");
  it.todo("should return the user's company even if there are other results");
  it.todo("should return the user's company based on an existing BSD");
  it.todo("should not return the same company twice");
});
