import axios from "axios";
import supertest from "supertest";
import { app } from "../../server";
import { resetDatabase } from "../../../integration-tests/helper";
import { logIn } from "../../__tests__/auth.helper";
import { siretify, userWithCompanyFactory } from "../../__tests__/factories";
import { resetFluidesFrigoTokenCacheForTests } from "../../bsffs/fluidesFrigo/client";

jest.mock("axios");

const request = supertest(app);

describe("Fluides Frigorigènes BSFF router", () => {
  const previousEnv = {
    FF_API_BASE_URL: process.env.FF_API_BASE_URL,
    FF_OIDC_TOKEN_URL: process.env.FF_OIDC_TOKEN_URL,
    FF_OIDC_CLIENT_ID: process.env.FF_OIDC_CLIENT_ID,
    FF_OIDC_CLIENT_SECRET: process.env.FF_OIDC_CLIENT_SECRET
  };

  beforeEach(() => {
    process.env.FF_API_BASE_URL = "https://ff.test";
    process.env.FF_OIDC_TOKEN_URL = "https://ff.test/token";
    process.env.FF_OIDC_CLIENT_ID = "client-id";
    process.env.FF_OIDC_CLIENT_SECRET = "client-secret";
    resetFluidesFrigoTokenCacheForTests();
    jest.clearAllMocks();
  });

  afterEach(resetDatabase);

  afterAll(() => {
    process.env.FF_API_BASE_URL = previousEnv.FF_API_BASE_URL;
    process.env.FF_OIDC_TOKEN_URL = previousEnv.FF_OIDC_TOKEN_URL;
    process.env.FF_OIDC_CLIENT_ID = previousEnv.FF_OIDC_CLIENT_ID;
    process.env.FF_OIDC_CLIENT_SECRET = previousEnv.FF_OIDC_CLIENT_SECRET;
  });

  it("returns 401 for unauthenticated users", async () => {
    const response = await request.get(
      `/api/bsff/operateur/fluides-frigo/${siretify()}`
    );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not Authorized" });
  });

  it("returns 400 when SIRET is invalid", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");
    const { sessionCookie } = await logIn(app, user.email, "pass");

    const response = await request
      .get("/api/bsff/operateur/fluides-frigo/not-a-siret")
      .set("Cookie", sessionCookie);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("SIRET_INVALID");
  });

  it("returns 403 when user is not associated with the requested SIRET", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");
    const { sessionCookie } = await logIn(app, user.email, "pass");

    const response = await request
      .get(`/api/bsff/operateur/fluides-frigo/${siretify()}`)
      .set("Cookie", sessionCookie);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("FORBIDDEN");
  });

  it("returns mapped BSFF operator drafts", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { sessionCookie } = await logIn(app, user.email, "pass");

    (axios.post as jest.Mock).mockResolvedValueOnce({
      data: {
        access_token: "token",
        expires_in: 3600
      }
    });

    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          siret: company.siret,
          ficheInterventionNumero: "FI-123",
          operateur: { nom: "Operateur test", siret: company.siret },
          detenteur: {
            nom: "Detenteur test",
            siret: siretify(),
            adresseCerfa: {
              adresse: "10 rue des Frigos",
              codePostal: "75010",
              ville: "Paris"
            }
          },
          dateSignatureTechnicien: "2026-01-01T10:00:00.000Z",
          bouteilleRecuperations: [
            {
              bouteilleId: "btl-1",
              bouteilleIdentification: "BOUT-001",
              capaciteUtilisee: 42
            }
          ],
          quantiteTotalRecuperation: "42"
        }
      ]
    });

    const response = await request
      .get(`/api/bsff/operateur/fluides-frigo/${company.siret}`)
      .set("Cookie", sessionCookie)
      .query({
        debut: "2026-01-01T00:00:00.000Z",
        fin: "2026-12-31T23:59:59.000Z"
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      count: 1,
      data: [
        {
          ficheInterventionNumero: "FI-123",
          dateIntervention: "2026-01-01T10:00:00.000Z",
          dechets: [
            {
              bouteilleId: "btl-1",
              bouteilleIdentification: "BOUT-001",
              codeDechet: "14 06 01*",
              poidsFluide: 42,
              volumeContenant: null,
              mentionADR: null
            }
          ],
          detenteur: {
            siret: expect.any(String),
            nom: "Detenteur test",
            adresse: "10 rue des Frigos, 75010 Paris"
          },
          operateur: {
            siret: company.siret,
            nom: "Operateur test"
          },
          sourceData: "fluides_frigo",
          ffFicheId: "FI-123",
          quantiteTotalRecuperation: "42"
        }
      ],
      metadata: {
        fetchedAt: expect.any(String),
        source: "fluides_frigo",
        dateRange: {
          debut: "2026-01-01T00:00:00.000Z",
          fin: "2026-12-31T23:59:59.000Z"
        }
      }
    });

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(
      `https://ff.test/api-ext/${company.siret}/cerfa`,
      expect.objectContaining({
        headers: { Authorization: "Bearer token" }
      })
    );
  });

  it("renews token once when FF API returns 401", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { sessionCookie } = await logIn(app, user.email, "pass");

    (axios.post as jest.Mock)
      .mockResolvedValueOnce({
        data: { access_token: "expired-token", expires_in: 3600 }
      })
      .mockResolvedValueOnce({
        data: { access_token: "fresh-token", expires_in: 3600 }
      });

    (axios.get as jest.Mock)
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 401, data: { message: "expired token" } }
      })
      .mockResolvedValueOnce({
        data: []
      });

    const response = await request
      .get(`/api/bsff/operateur/fluides-frigo/${company.siret}`)
      .set("Cookie", sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(0);
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});
