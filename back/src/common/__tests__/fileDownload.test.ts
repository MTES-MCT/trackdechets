import { getFileDownload } from "../fileDownload";

const redisGetMock = jest.fn(() => Promise.reject(null));
const setInCacheMock = jest.fn(() => Promise.resolve());

jest.mock("../redis", () => ({
  redisClient: { get: () => redisGetMock() },
  setInCache: () => setInCacheMock()
}));

describe("getFileDownload", () => {
  it("should set token in cache", async () => {
    await getFileDownload({ handler: "formPdf", params: null as any });

    expect(setInCacheMock).toHaveBeenCalled();
  });

  it("should return token and link", async () => {
    const response = await getFileDownload({
      handler: "formPdf",
      params: null as any
    });

    expect(response.token).not.toBeNull();
    expect(response.downloadLink).not.toBeNull();
  });

  it("should return different tokens every time", async () => {
    const res1 = await getFileDownload({
      handler: "formPdf",
      params: null as any
    });
    const res2 = await getFileDownload({
      handler: "formPdf",
      params: null as any
    });

    expect(res1.token).not.toBe(res2.token);
  });
});
