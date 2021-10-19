import { omitDeep } from "../omitDeep";
const dasri = {
  emitter: { lorem: "1", emission: 2 },
  transporter: { ipsum: 4, transport: "x" },
  destination: { bla: "foo", reception: "e", operation: "x" },
};

describe("omitDeep", () => {
  it("should omit top level key", () => {
    const expected = {
      transporter: { ipsum: 4, transport: "x" },
      destination: { bla: "foo", reception: "e", operation: "x" },
    };

    expect(omitDeep(dasri, ["emitter"])).toEqual(expected);
  });

  it("should omit nested key", () => {
    const expected = {
      emitter: { lorem: "1", emission: 2 },
      transporter: { transport: "x" },
      destination: { bla: "foo", reception: "e", operation: "x" },
    };

    expect(omitDeep(dasri, ["ipsum"])).toEqual(expected);
  });

  it("should omit nested and top level keys", () => {
    const expected = {
      transporter: { transport: "x" },
      destination: { bla: "foo", reception: "e" },
    };

    expect(omitDeep(dasri, ["emitter", "ipsum", "operation"])).toEqual(
      expected
    );
  });
});
