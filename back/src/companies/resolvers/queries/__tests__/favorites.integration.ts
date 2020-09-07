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

  it("should return most common companies used in forms", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({ ownerId: user.id });
    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query(FAVORITES, {
      variables: { type: "EMITTER" }
    });
    expect(data.favorites.map(c => c.siret)).toEqual([
      form.emitterCompanySiret
    ]);
  });
});
