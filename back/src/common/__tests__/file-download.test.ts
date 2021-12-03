import { downloadFileHandler, getFileDownload } from "../fileDownload";

const res: any = {};
res.status = jest.fn().mockReturnValue(res);
res.send = jest.fn().mockReturnValue(res);

const redisGetMock: any = jest.fn(() => Promise.reject(null));
const setInCacheMock = jest.fn(() => Promise.resolve());

jest.mock("../redis", () => ({
  redisClient: { get: () => redisGetMock() },
  setInCache: () => setInCacheMock()
}));

describe("File download token", () => {
  const handler = () => null;

  it("should set token in cache", async () => {
    await getFileDownload({ type: "A_TYPE", params: null }, handler);

    expect(setInCacheMock).toHaveBeenCalled();
  });

  it("should return token and link", async () => {
    const response = await getFileDownload(
      { type: "A_TYPE", params: null },
      handler
    );

    expect(response.token).not.toBeNull();
    expect(response.downloadLink).not.toBeNull();
  });

  it("should return different tokens every time", async () => {
    const res1 = await getFileDownload(
      { type: "A_TYPE", params: null },
      handler
    );
    const res2 = await getFileDownload(
      { type: "A_TYPE", params: null },
      handler
    );

    expect(res1.token).not.toBe(res2.token);
  });
});

describe("File download handler", () => {
  beforeEach(() => jest.restoreAllMocks());

  test("should return an error when token does not exist", async () => {
    await downloadFileHandler({ query: { token: "TOKEN" } } as any, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("should return an error when token refer to an unknown type", async () => {
    redisGetMock.mockResolvedValue(
      JSON.stringify({ type: "UNKNOWN", params: null })
    );

    await downloadFileHandler({ query: { token: "TOKEN" } } as any, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("should work when token and type are known", async () => {
    redisGetMock.mockResolvedValue(
      JSON.stringify({ type: "EXISTS", params: null })
    );
    const fileDownloader = jest.fn();
    await getFileDownload({ type: "EXISTS", params: null }, fileDownloader);

    await downloadFileHandler({ query: { token: "TOKEN" } } as any, res);

    expect(fileDownloader).toHaveBeenCalled();
  });
});
