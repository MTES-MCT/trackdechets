import axios from "axios";
import {
  fluidesFrigoClient,
  FluidesFrigoApiError,
  resetFluidesFrigoTokenCacheForTests
} from "../client";

jest.mock("axios");

describe("FluidesFrigoClient", () => {
  const previousEnv = { ...process.env };

  beforeEach(() => {
    process.env.FF_API_BASE_URL = "https://ff.test";
    process.env.FF_OIDC_TOKEN_URL = "https://ff.test/token";
    process.env.FF_OIDC_CLIENT_ID = "client-id";
    process.env.FF_OIDC_CLIENT_SECRET = "client-secret";
    Reflect.deleteProperty(process.env, "FF_API_TIMEOUT");
    Reflect.deleteProperty(process.env, "FF_API_RETRIES");
    resetFluidesFrigoTokenCacheForTests();
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = previousEnv;
  });

  it("uses defaults when timeout and retries are absent", async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: { access_token: "token", expires_in: 3600 }
    });
    (axios.get as jest.Mock).mockResolvedValue({ data: [] });

    await fluidesFrigoClient.getCerfaBySiret({ siret: "53075596600047" });

    expect(axios.post).toHaveBeenCalledWith(
      "https://ff.test/token",
      expect.any(URLSearchParams),
      expect.objectContaining({ timeout: 30_000 })
    );
    expect(axios.get).toHaveBeenCalledWith(
      "https://ff.test/53075596600047/cerfa",
      expect.objectContaining({ timeout: 30_000 })
    );
  });

  it("converts a failure after token renewal to a domain API error", async () => {
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    (axios.post as jest.Mock).mockResolvedValue({
      data: { access_token: "token", expires_in: 3600 }
    });
    (axios.get as jest.Mock)
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockRejectedValueOnce({ response: { status: 503, data: "down" } });

    await expect(
      fluidesFrigoClient.getCerfaBySiret({ siret: "53075596600047" })
    ).rejects.toEqual(
      expect.objectContaining<Partial<FluidesFrigoApiError>>({ status: 503 })
    );
  });
});
