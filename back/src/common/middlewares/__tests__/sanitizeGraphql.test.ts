import sanitizeGraphql from "../sanitizeGraphql";

describe("sanitizeGraphqlMiddleware", () => {
  const callMiddleware = body => {
    const middleware = sanitizeGraphql("/");
    const req: any = { path: "/", body };
    middleware(req, null, () => {});
  };

  it("should not modify valid variables", async () => {
    const body = { variables: { foo: "bar" } };
    callMiddleware(body);
    expect(body.variables.foo).toEqual("bar");
  });

  it("should fail with forbidden opening tag only", async () => {
    const body = { variables: { foo: "<script>" } };
    expect.assertions(1);
    try {
      callMiddleware(body);
    } catch (err) {
      expect(err.message).toBe("Unexpected end of JSON input");
    }
  });

  it("should strip complete forbidden tag", async () => {
    const body = { variables: { foo: "<script>alert(1)</script>bar" } };
    callMiddleware(body);
    expect(body.variables.foo).toEqual("bar");
  });

  it("should handle nested tags", async () => {
    const body = {
      variables: { foo: "<sc<script></script>ript>alert(1)</script>" }
    };
    callMiddleware(body);
    expect(body.variables.foo).toEqual("ript&gt;alert(1)");
  });

  it("should handle nested variables", async () => {
    const body = {
      variables: {
        foo: { bar: { nesting: { deeply: "<script></script>bar" } } }
      }
    };
    callMiddleware(body);
    expect(body.variables.foo.bar.nesting.deeply).toEqual("bar");
  });
});
