import { DomainError, ErrorCode } from "../errors";

describe("DomainError", () => {
  test("should extend Error", async () => {
    const error = new DomainError("An error");

    expect(error instanceof Error).toBeTruthy();
  });

  test("should add a `isDomainError` property", async () => {
    const error = new DomainError("An error");

    expect(error.extensions.isDomainError).toBeTruthy();
  });

  test("should accept a code", async () => {
    const error = new DomainError("An error", ErrorCode.FORBIDDEN);

    expect(error.extensions.code).toBe(ErrorCode.FORBIDDEN);
  });

  test("should accept any additional properties", async () => {
    const error = new DomainError("An error", ErrorCode.FORBIDDEN, {
      foo: "bar"
    });

    expect(error.extensions.foo).toBe("bar");
  });
});
