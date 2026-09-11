import { act, renderHook, waitFor } from "@testing-library/react";
import {
  FluidesFrigorigenesApiError,
  FluidesFrigorigenesResponse,
  getFluidesFrigorigenes
} from "./api";
import { useFluidesFrigorigenes } from "./useFluidesFrigorigenes";

jest.mock("./api", () => ({
  ...jest.requireActual("./api"),
  getFluidesFrigorigenes: jest.fn()
}));

const mockedGetFluidesFrigorigenes = jest.mocked(getFluidesFrigorigenes);

const response = (number: string): FluidesFrigorigenesResponse => ({
  success: true,
  count: 1,
  data: [
    {
      ficheInterventionNumero: number,
      dateIntervention: null,
      dechets: [
        {
          bouteilleId: `b-${number}`,
          bouteilleIdentification: `BOUT-${number}`,
          codeDechet: "14 06 01*",
          poidsFluide: 1,
          volumeContenant: null,
          mentionADR: null
        }
      ],
      detenteur: { siret: "53075596600047", nom: "Détenteur" },
      operateur: { siret: "35600000000048", nom: "Opérateur" },
      sourceData: "fluides_frigo",
      ffFicheId: number,
      associatedBsffIds: []
    }
  ],
  metadata: {
    fetchedAt: "2026-01-02T10:00:00.000Z",
    source: "fluides_frigo",
    dateRange: { debut: null, fin: null }
  }
});

describe("useFluidesFrigorigenes", () => {
  beforeEach(() => mockedGetFluidesFrigorigenes.mockReset());

  it("does not request an empty SIRET", () => {
    const { result } = renderHook(() => useFluidesFrigorigenes(""));
    expect(result.current.status).toBe("missingSiret");
    expect(mockedGetFluidesFrigorigenes).not.toHaveBeenCalled();
  });

  it.each(["not-a-siret", "12345678901234"])(
    "does not request an invalid SIRET: %s",
    siret => {
      const { result } = renderHook(() => useFluidesFrigorigenes(siret));
      expect(result.current.status).toBe("unknownSiret");
      expect(mockedGetFluidesFrigorigenes).not.toHaveBeenCalled();
    }
  );

  it("requests a valid SIRET and exposes loading then adapted data", async () => {
    mockedGetFluidesFrigorigenes.mockResolvedValue(response("FI-1"));
    const { result } = renderHook(() =>
      useFluidesFrigorigenes("53075596600047")
    );

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(mockedGetFluidesFrigorigenes).toHaveBeenCalledWith(
      "53075596600047",
      expect.any(AbortSignal)
    );
    expect(result.current).toEqual(
      expect.objectContaining({
        interventions: [expect.objectContaining({ number: "FI-1" })]
      })
    );
  });

  it("exposes a 200 response with no data as an empty dataset", async () => {
    mockedGetFluidesFrigorigenes.mockResolvedValue({
      ...response("unused"),
      count: 0,
      data: []
    });
    const { result } = renderHook(() =>
      useFluidesFrigorigenes("53075596600047")
    );

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current).toEqual({ status: "success", interventions: [] });
  });

  it("exposes a 200 response containing several waste codes", async () => {
    const payload = response("FI-MIXED");
    payload.data[0].dechets.push({
      ...payload.data[0].dechets[0],
      bouteilleId: "b-mixed",
      bouteilleIdentification: "BOUT-MIXED",
      codeDechet: "16 05 04*"
    });
    mockedGetFluidesFrigorigenes.mockResolvedValue(payload);

    const { result } = renderHook(() =>
      useFluidesFrigorigenes("53075596600047")
    );

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current).toEqual(
      expect.objectContaining({
        interventions: [
          expect.objectContaining({
            wasteCodes: ["14 06 01*", "16 05 04*"]
          })
        ]
      })
    );
  });

  it("requests a changed SIRET and ignores the stale response", async () => {
    let resolveFirst!: (value: FluidesFrigorigenesResponse) => void;
    const first = new Promise<FluidesFrigorigenesResponse>(resolve => {
      resolveFirst = resolve;
    });
    mockedGetFluidesFrigorigenes
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce(response("FI-NEW"));

    const { result, rerender } = renderHook(
      ({ siret }) => useFluidesFrigorigenes(siret),
      { initialProps: { siret: "53075596600047" } }
    );
    rerender({ siret: "35600000000048" });

    await waitFor(() =>
      expect(result.current).toEqual(
        expect.objectContaining({
          interventions: [expect.objectContaining({ number: "FI-NEW" })]
        })
      )
    );
    await act(async () => resolveFirst(response("FI-OLD")));
    expect(result.current).toEqual(
      expect.objectContaining({
        interventions: [expect.objectContaining({ number: "FI-NEW" })]
      })
    );
  });

  it.each([
    ["FF_NOT_FOUND", "success"],
    ["SIRET_INVALID", "unknownSiret"],
    ["FF_FORBIDDEN", "unknownSiret"],
    ["FORBIDDEN", "serviceError"],
    ["FF_CONFIG_ERROR", "credentialsError"],
    ["FF_AUTH_ERROR", "credentialsError"],
    ["FF_API_ERROR", "serviceError"],
    ["FF_RATE_LIMITED", "serviceError"],
    ["UNEXPECTED_RESPONSE", "serviceError"]
  ])("maps %s to %s", async (code, status) => {
    mockedGetFluidesFrigorigenes.mockRejectedValue(
      new FluidesFrigorigenesApiError(code)
    );
    const { result } = renderHook(() =>
      useFluidesFrigorigenes("53075596600047")
    );

    await waitFor(() => expect(result.current.status).toBe(status));
    if (code === "FF_NOT_FOUND" && result.current.status === "success") {
      expect(result.current.interventions).toEqual([]);
    }
  });
});
