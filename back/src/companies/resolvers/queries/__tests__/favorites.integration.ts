import supertest from "supertest";
import { app } from "../../../../server";
import {
  formFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { AuthType } from "../../../../auth";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";
import {
  indexFavorites,
  favoritesConstrutor
} from "../../../../queue/jobs/indexFavorites";
import { convertUrls } from "../../../database";
import { searchCompany } from "../../../search";
import { index, client as elasticSearch } from "../../../../common/elastic";
import { getFormForElastic, indexForm } from "../../../../forms/elastic";

const request = supertest(app);

const FAVORITES = `query Favorites($orgId: String!, $type: FavoriteType!, $allowForeignCompanies: Boolean) {
  favorites(orgId: $orgId, type: $type, allowForeignCompanies: $allowForeignCompanies) {
    name
    orgId
    siret
    vatNumber
    address
    contact
    contactPhone
    contactEmail
    codePaysEtrangerEtablissement
    transporterReceipt {
      receiptNumber
    }
    traderReceipt {
      receiptNumber
    }
    brokerReceipt {
      receiptNumber
    }
  }
}`;

jest.mock("../../../search");

async function refreshIndices() {
  await elasticSearch.indices.refresh(
    {
      index: index.alias
    },
    {
      // do not throw an error on version conflicts
      ignore: [409]
    }
  );
}
describe("query favorites", () => {
  afterEach(resetDatabase);

  it("should deny access to unauthenticated requests", async () => {
    const res = await request.post("/").send({ query: "{ me { email } }" });
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].message).toEqual("Vous n'êtes pas connecté.");
    expect(res.body.data).toBeNull();
  });

  it("should not be possible to access favorites of other companies", async () => {
    const { user, company } = await userWithCompanyFactory();
    const { user: user2, company: company2 } = await userWithCompanyFactory(
      "MEMBER"
    );
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user2.id,
          opt: { recipientCompanySiret: company2.orgId }
        })
      )
    );
    await refreshIndices();

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      ...convertUrls(company)
    });
    await indexFavorites(
      await favoritesConstrutor({ orgId: company.orgId, type: "RECIPIENT" }),
      { orgId: company.orgId, type: "RECIPIENT" }
    );

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company2.orgId,
        type: "RECIPIENT"
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Vous n'êtes pas membre de l'entreprise portant l'identifiant "${company2.orgId}".`
      })
    ]);
  });

  it("should not be possible to access favorites of unknown companies", async () => {
    const user = await userFactory();
    const { query } = makeClient({ ...user, auth: AuthType.Session });
    await refreshIndices();

    const { errors } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: "orgId",
        type: "RECIPIENT"
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Cet établissement n'existe pas dans Trackdéchets"
      })
    ]);
  });

  it("should not return favorites of other users", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { user: user2, company: company2 } = await userWithCompanyFactory(
      "MEMBER"
    );
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user2.id,
          opt: { recipientCompanySiret: company2.orgId }
        })
      )
    );
    await refreshIndices();

    (searchCompany as jest.Mock).mockResolvedValueOnce({
      ...convertUrls(company)
    });
    await indexFavorites(
      await favoritesConstrutor({ orgId: company.orgId, type: "EMITTER" }),
      { orgId: company.orgId, type: "EMITTER" }
    );
    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({ orgId: company.orgId })
    ]);
  });

  it("should return favorites of foreign companies when allowForeignCompanies is true", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: company2 } = await userWithCompanyFactory("MEMBER", {
      vatNumber: "IT09301420155",
      orgId: "IT09301420155",
      siret: null
    });
    (searchCompany as jest.Mock)
      .mockResolvedValueOnce({
        name: company2.name,
        siret: null,
        vatNumber: company2.vatNumber,
        orgId: company2.orgId,
        contact: company2.contact,
        contactEmail: company2.contactEmail,
        contactPhone: company2.contactPhone,
        codePaysEtrangerEtablissement: "IT",
        address: company2.address,
        companyTypes: company2.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O"
      })
      .mockResolvedValueOnce({
        name: company.name,
        siret: company.siret,
        vatNumber: company.vatNumber,
        orgId: company.orgId,
        contact: company.contact,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        codePaysEtrangerEtablissement: "FR",
        address: company.address,
        companyTypes: company.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O"
      });

    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            transporters: {
              create: {
                transporterCompanyVatNumber: company2.vatNumber,
                number: 1
              }
            }
          }
        })
      )
    );

    await refreshIndices();
    await indexFavorites(
      await favoritesConstrutor({ orgId: company.orgId, type: "TRANSPORTER" }),
      { orgId: company.orgId, type: "TRANSPORTER" }
    );

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "TRANSPORTER",
        allowForeignCompanies: true
      }
    });

    // user 1 find itself in the favorites because it's a transporter
    expect(data.favorites).toEqual([
      expect.objectContaining({
        address: company2.address,
        brokerReceipt: null,
        codePaysEtrangerEtablissement: "IT",
        contact: company2.contact,
        contactEmail: company2.contactEmail,
        contactPhone: company2.contactPhone,
        name: company2.name,
        orgId: company2.orgId,
        siret: company2.siret,
        traderReceipt: null,
        transporterReceipt: null,
        vatNumber: company2.vatNumber
      }),
      expect.objectContaining({
        address: company.address,
        brokerReceipt: null,
        codePaysEtrangerEtablissement: "FR",
        contact: company.contact,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        name: company.name,
        orgId: company.orgId,
        siret: company.siret,
        traderReceipt: null,
        transporterReceipt: null,
        vatNumber: company.vatNumber
      })
    ]);
  });

  it("should NOT return foreign favorites when allowForeignCompanies is false", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: company2 } = await userWithCompanyFactory("MEMBER", {
      vatNumber: "IE6409733C",
      orgId: "IE6409733C",
      siret: null
    });
    (searchCompany as jest.Mock)
      .mockResolvedValueOnce({
        name: company2.name,
        siret: null,
        vatNumber: company2.vatNumber,
        orgId: company2.orgId,
        contact: company2.contact,
        contactEmail: company2.contactEmail,
        contactPhone: company2.contactPhone,
        codePaysEtrangerEtablissement: "IE",
        address: company2.address,
        companyTypes: company2.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O"
      })
      .mockResolvedValueOnce({
        name: company.name,
        siret: company.siret,
        vatNumber: company.vatNumber,
        orgId: company.orgId,
        contact: company.contact,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        codePaysEtrangerEtablissement: "FR",
        address: company.address,
        companyTypes: company.companyTypes,
        isRegistered: true,
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O"
      });

    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.orgId,
            transporters: {
              create: {
                transporterCompanyVatNumber: company2.vatNumber,
                number: 1
              }
            }
          }
        })
      )
    );

    await refreshIndices();
    await indexFavorites(
      await favoritesConstrutor({ orgId: company.orgId, type: "TRANSPORTER" }),
      { orgId: company.orgId, type: "TRANSPORTER" }
    );

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "TRANSPORTER",
        allowForeignCompanies: false
      }
    });

    // user 1 find itself in the favorites because it's a transporter
    expect(data.favorites).toEqual([
      expect.objectContaining({
        address: company.address,
        brokerReceipt: null,
        codePaysEtrangerEtablissement: "FR",
        contact: company.contact,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        name: company.name,
        orgId: company.orgId,
        siret: company.siret,
        traderReceipt: null,
        transporterReceipt: null,
        vatNumber: company.vatNumber
      })
    ]);
  });

  it("should NOT return any favorites of foreign companies when allowForeignCompanies is false", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      vatNumber: "ESB50629187",
      orgId: "ESB50629187",
      siret: undefined
    });
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: { recipientCompanySiret: company.orgId }
        })
      )
    );
    await refreshIndices();
    (searchCompany as jest.Mock).mockResolvedValueOnce({
      name: company.name,
      siret: null,
      vatNumber: company.vatNumber,
      orgId: company.orgId,
      contact: company.contact,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      codePaysEtrangerEtablissement: "ES",
      address: company.address,
      companyTypes: company.companyTypes,
      isRegistered: true,
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O"
    });
    await indexFavorites(
      await favoritesConstrutor({ orgId: company.orgId, type: "RECIPIENT" }),
      { orgId: company.orgId, type: "RECIPIENT" }
    );
    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "RECIPIENT",
        allowForeignCompanies: false
      }
    });

    expect(data.favorites.length).toEqual(0);
  });

  it("should NOT return any error when no favorites is found", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    await indexForm(
      await getFormForElastic(
        await formFactory({
          ownerId: user.id,
          opt: { recipientCompanySiret: company.orgId }
        })
      )
    );
    await refreshIndices();

    // do not call indexFavorites
    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data, errors } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "RECIPIENT"
      }
    });

    expect(data.favorites.length).toEqual(0);
    expect(errors).toBeUndefined();
  });
});
