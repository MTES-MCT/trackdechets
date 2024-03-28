import { redundant } from "../redundancy";
import { ErrorCode } from "../../../common/errors";
import {
  AnonymousCompanyError,
  ClosedCompanyError,
  SiretNotFoundError
} from "../errors";

const fn1 = jest.fn();
const fn2 = jest.fn();

describe("redundant", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not call fallback function when the first function succeeds", async () => {
    const fn = redundant(fn1, fn2);

    // test fn1 returns something
    fn1.mockResolvedValueOnce("bar");

    const response = await fn("foo");
    expect(response).toEqual("bar");

    // fn2 should not be called
    expect(fn1).toHaveBeenCalled();
    expect(fn2).not.toHaveBeenCalled();
  });

  it("should not call fallback function when the first function throws AnonymousCompanyError", async () => {
    const fn = redundant(fn1, fn2);

    // test fn1 throws AnonymousCompanyError
    fn1.mockRejectedValueOnce(new AnonymousCompanyError());

    try {
      await fn("foo");
    } catch (err) {
      expect(err).toBeInstanceOf(AnonymousCompanyError);
    }
    // fn2 should not be called
    expect(fn1).toHaveBeenCalled();
    expect(fn2).not.toHaveBeenCalled();
  });

  it("should not call fallback function when the first function throws ClosedCompanyError", async () => {
    const fn = redundant(fn1, fn2);

    // test fn1 throws ClosedCompanyError
    fn1.mockRejectedValueOnce(new ClosedCompanyError());

    try {
      await fn("foo");
    } catch (err) {
      expect(err).toBeInstanceOf(ClosedCompanyError);
    }
    // fn2 should not be called
    expect(fn1).toHaveBeenCalled();
    expect(fn2).not.toHaveBeenCalled();
  });

  it("should call fallback function when the first function throws SiretNotFoundError", async () => {
    const fn = redundant(fn1, fn2);

    // test fn1 throws UserInputError
    fn1.mockRejectedValueOnce(new SiretNotFoundError());
    fn2.mockResolvedValueOnce("bar");

    const response = await fn("foo");

    expect(response).toEqual("bar");
    expect(fn1).toHaveBeenCalled();
    // fn2 should have been called
    expect(fn2).toHaveBeenCalled();
  });

  it("should call fallback function when the first function returns 5xx", async () => {
    // test fn1 throw 5xx
    fn1.mockRejectedValueOnce({ response: { status: 502 } });
    fn2.mockResolvedValueOnce("bar");

    const fn = redundant(fn1, fn2);
    const response = await fn("foo");
    expect(response).toEqual("bar");
    // fn2 should have been called
    expect(fn1).toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();
  });

  it("should call fallback function when the first function returns TOO_MANY_REQUESTS", async () => {
    const fn = redundant(fn1, fn2);

    // test fn1 throw TooManyRequests
    fn1.mockRejectedValueOnce({
      extensions: { code: ErrorCode.TOO_MANY_REQUESTS }
    });
    fn2.mockResolvedValueOnce("bar");

    const response = await fn("foo");
    expect(response).toEqual("bar");
    // fn2 should have been called
    expect(fn1).toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();
  });

  it("should throw first error when both functions fail", async () => {
    expect.assertions(1);

    const fn1BadGateway = "fn1 Bad Gateway";
    const fn2BadGateway = "fn2 Bad Gateway";

    // test both fn1 and fn2 throws 5xx
    fn1.mockRejectedValueOnce({
      response: { status: 502, message: fn1BadGateway }
    });
    fn2.mockRejectedValueOnce({
      response: { status: 502, message: fn2BadGateway }
    });

    const fn = redundant(fn1, fn2);

    try {
      await fn("foo");
    } catch (err) {
      // in case both failed, return first err message
      expect(err.response.message).toEqual(fn1BadGateway);
    }
  });
});
