import axios from "axios";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  userFactory
} from "../../../../__tests__/factories";
import { createUserAccountHash } from "../../../database";
import { AuthType } from "../../../../auth";
import makeClient from "../../../../__tests__/testClient";

// Intercept mail calls
const mockedAxiosPost = jest.spyOn(axios, "post");
mockedAxiosPost.mockResolvedValue({} as any);

describe("mutation resendInvitation", () => {
  afterEach(resetDatabase);

  beforeEach(() => {
    mockedAxiosPost.mockClear();
  });

  it("should resend a pending invitation", async () => {
    // set up an user, a company, its admin and an invitation (UserAccountHash)
    const { user: admin, company } = await userWithCompanyFactory("ADMIN");
    const usrToInvite = await userFactory();
    await createUserAccountHash(usrToInvite.email, "MEMBER", company.siret);

    const { mutate } = makeClient({ ...admin, auth: AuthType.Session });

    // Call the mutation to resend the invitation

    const mutation = `
        mutation {
          resendInvitation(email: "${usrToInvite.email}", siret: "${company.siret}")
        }
      `;
    const res = await mutate(mutation);

    expect(res).toEqual({ data: { resendInvitation: true } });
    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);

    const postArgs = mockedAxiosPost.mock.calls[0];

    expect(postArgs[0]).toEqual("http://td-mail/send");

    //  Check To
    expect(postArgs[1].to[0].email).toEqual(usrToInvite.email);
    expect(postArgs[1].subject).toContain(
      "Vous avez été invité à rejoindre Trackdéchets"
    );

    expect(postArgs[1].body).toContain(
      "vous a invité à rejoindre Trackdéchets"
    );
    expect(postArgs[1].body).toContain(company.name);
  });
});
