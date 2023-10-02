import { parseString } from "@fast-csv/parse";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../../integration-tests/helper";
import supertest from "supertest";
import { ErrorCode } from "../../../../common/errors";
import { app } from "../../../../server";
import {
  companyFactory,
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Query } from "../../../../generated/graphql/types";
import { WASTES_REGISTRY_CSV } from "./queries";
import { getFormForElastic, indexForm } from "../../../../forms/elastic";

function emitterFormFactory(ownerId: string, siret: string) {
  return formFactory({
    ownerId,
    opt: {
      emitterCompanySiret: siret,
      status: "PROCESSED",
      sentAt: new Date(),
      receivedAt: new Date()
    }
  });
}

function recipientFormFactory(ownerId: string, siret: string) {
  return formFactory({
    ownerId,
    opt: {
      recipientCompanySiret: siret,
      status: "PROCESSED",
      sentAt: new Date(),
      receivedAt: new Date()
    }
  });
}

function transporterFormFactory(ownerId: string, siret: string) {
  return formFactory({
    ownerId,
    opt: {
      status: "PROCESSED",
      sentAt: new Date(),
      receivedAt: new Date(),
      transporters: {
        create: {
          transporterCompanySiret: siret,
          number: 1
        }
      }
    }
  });
}

function traderFormFactory(ownerId: string, siret: string) {
  return formFactory({
    ownerId,
    opt: {
      traderCompanySiret: siret,
      status: "PROCESSED",
      sentAt: new Date(),
      receivedAt: new Date()
    }
  });
}

describe("query { wastesRegistryCsv }", () => {
  afterEach(resetDatabase);

  it("should throw exception if registry is empty", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "wastesRegistryCsv">>(
      WASTES_REGISTRY_CSV,
      {
        variables: {
          registryType: "INCOMING",
          sirets: [company.siret]
        }
      }
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Aucune donnée à exporter sur la période sélectionnée"
    );
  });

  it("throw FORBIDDEN error if user is not member of a siret", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const otherCompany = await companyFactory();
    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "wastesRegistryCsv">>(
      WASTES_REGISTRY_CSV,
      {
        variables: {
          registryType: "INCOMING",
          sirets: [company.siret, otherCompany.siret]
        }
      }
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].extensions?.code).toEqual(ErrorCode.FORBIDDEN);
  });

  // Test CSV export for different registry types
  it.each(["INCOMING", "OUTGOING", "TRANSPORTED"])(
    "should download CSV %p wastes registry",
    async registryType => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const customFormFactory =
        registryType === "OUTGOING"
          ? emitterFormFactory
          : registryType === "INCOMING"
          ? recipientFormFactory
          : registryType === "TRANSPORTED"
          ? transporterFormFactory
          : registryType === "MANAGED"
          ? traderFormFactory
          : emitterFormFactory;
      const form = await customFormFactory(user.id, company.siret!);
      await indexForm(await getFormForElastic(form));
      await refreshElasticSearch();
      const { query } = makeClient(user);
      const { data } = await query<Pick<Query, "wastesRegistryCsv">>(
        WASTES_REGISTRY_CSV,
        {
          variables: {
            registryType,
            sirets: [company.siret]
          }
        }
      );
      expect(data.wastesRegistryCsv.token).not.toBeUndefined();
      expect(data.wastesRegistryCsv.token).not.toBeNull();

      const request = supertest(app);

      const res = await request
        .get("/download")
        .query({ token: data.wastesRegistryCsv.token });

      expect(res.status).toBe(200);

      const rows: any[] = [];

      parseString(res.text, { headers: true, delimiter: ";" })
        .on("data", row => rows.push(row))
        .on("end", (rowCount: number) => {
          expect(rowCount).toEqual(1);
          const row = rows[0];
          expect(row["N° de bordereau"]).toEqual(form.readableId);
        });
    }
  );
});
