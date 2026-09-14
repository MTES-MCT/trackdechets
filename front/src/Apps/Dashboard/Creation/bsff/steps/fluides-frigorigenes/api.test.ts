import { FluidesFrigorigenesApiError, getFluidesFrigorigenes } from "./api";

const responsePayload = {
  success: true,
  count: 0,
  data: [],
  metadata: {
    fetchedAt: "2026-01-02T10:00:00.000Z",
    source: "fluides_frigo",
    dateRange: { debut: null, fin: null }
  }
};

const mockedFetch = jest.fn();

beforeAll(() => {
  global.fetch = mockedFetch;
});

beforeEach(() => mockedFetch.mockReset());

describe("getFluidesFrigorigenes", () => {
  it("calls the authenticated Trackdéchets REST endpoint", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(responsePayload)
    });

    await expect(getFluidesFrigorigenes("53075596600047")).resolves.toEqual(
      responsePayload
    );
    expect(mockedFetch).toHaveBeenCalledWith(
      "http://api.td.local/api/bsff/operateur/fluides-frigo/53075596600047",
      expect.objectContaining({ credentials: "include" })
    );
  });

  it.each([
    ["FF_NOT_FOUND", 404],
    ["SIRET_INVALID", 400],
    ["FORBIDDEN", 403],
    ["FF_CONFIG_ERROR", 500],
    ["FF_AUTH_ERROR", 502],
    ["FF_API_ERROR", 502],
    ["FF_FORBIDDEN", 403],
    ["FF_RATE_LIMITED", 503]
  ])("decodes the %s backend error", async (code, status) => {
    mockedFetch.mockResolvedValue({
      ok: false,
      status,
      json: jest.fn().mockResolvedValue({ error: code, message: "hidden" })
    });

    await expect(getFluidesFrigorigenes("53075596600047")).rejects.toEqual(
      expect.objectContaining({ code, status })
    );
  });

  it.each([
    [true, { unexpected: true }],
    [false, { unexpected: true }]
  ])("rejects an unexpected JSON response", async (ok, payload) => {
    mockedFetch.mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: jest.fn().mockResolvedValue(payload)
    });

    await expect(getFluidesFrigorigenes("53075596600047")).rejects.toEqual(
      expect.objectContaining({ code: "UNEXPECTED_RESPONSE" })
    );
  });

  it("rejects a non-JSON response", async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: jest.fn().mockRejectedValue(new SyntaxError())
    });

    await expect(
      getFluidesFrigorigenes("53075596600047")
    ).rejects.toBeInstanceOf(FluidesFrigorigenesApiError);
  });
});
