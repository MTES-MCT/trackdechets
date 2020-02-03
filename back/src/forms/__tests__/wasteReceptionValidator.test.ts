import { receivedInfoSchema } from "../schema-validation";

const acceptedInfo = {
  wasteAcceptationStatus: "ACCEPTED",
  quantityReceived: 12.5,
  wasteRefusalReason: "",
  receivedBy: "Jim",
  receivedAt :"2020-01-17T10:12:00+0100"
};

describe("waste is accepted", () => {
  const { wasteAcceptationStatus, quantityReceived } = acceptedInfo;

  it("should be valid when waste is accepted", async () => {
    const isValid = await receivedInfoSchema.isValid(acceptedInfo);
    expect(isValid).toEqual(true);
  });

  it("should be invalid when quantityReceived is missing", async () => {
    let isValid = await receivedInfoSchema.isValid({ wasteAcceptationStatus });
    expect(isValid).toEqual(false);
  });
  it("should be invalid when wasteAcceptationStatus is missing", async () => {
    let isValid = await receivedInfoSchema.isValid({ quantityReceived });
    expect(isValid).toEqual(false);
  });

  it("should be invalid when quantityReceived is 0", async () => {
    // quantityReceived should be > 0
    let isValid = await receivedInfoSchema.isValid({
      wasteAcceptationStatus,
      quantityReceived: 0
    });
  });
  it("should be invalid when wasteRefusalReason is here", async () => {
    let isValid = await receivedInfoSchema.isValid({
      wasteAcceptationStatus,
      quantityReceived,
      wasteRefusalReason: "lorem"
    });
    expect(isValid).toEqual(false);
  });
});

const refusedInfo = {
  wasteAcceptationStatus: "REFUSED",
  quantityReceived: 0,
  wasteRefusalReason: "non conformity",
  receivedBy: "Joe",
  receivedAt :"2020-01-17T10:12:00+0100"
};

describe("waste is refused", () => {
  const { wasteAcceptationStatus, quantityReceived } = refusedInfo;

  it.only("should be valid when waste is refused", async () => {
    const isValid = await receivedInfoSchema.isValid(refusedInfo);
    expect(isValid).toEqual(true);
  });

  it("should be invalid when quantityReceived and wasteRefusalReason are missing ", async () => {
    let isValid = await receivedInfoSchema.isValid({ wasteAcceptationStatus });
    expect(isValid).toEqual(false);
  });

  it("should be invalid when quantityReceived is not 0", async () => {
    let isValid = await receivedInfoSchema.isValid({
      wasteAcceptationStatus,
      quantityReceived: 22
    });
    expect(isValid).toEqual(false);
  });

  it("should be invalid when wasteRefusalReason is missing ", async () => {
    let isValid = await receivedInfoSchema.isValid({
      wasteAcceptationStatus,
      quantityReceived
    });
    expect(isValid).toEqual(false);
  });
});

const partiallyRefusedInfo = {
  wasteAcceptationStatus: "PARTIALLY_REFUSED",
  quantityReceived: 11,
  wasteRefusalReason: "mixed waste",
  receivedBy: "Bill",
  receivedAt :"2020-01-17T10:12:00+0100"
};
describe("waste is partially accepted", () => {
  const { wasteAcceptationStatus, quantityReceived } = partiallyRefusedInfo;

  it("should be valid when waste partially accepted", async () => {
    const isValid = await receivedInfoSchema.isValid(partiallyRefusedInfo);
    expect(isValid).toEqual(true);
  });

  it("should be invalid when quantityReceived and wasteRefusalReason are missing ", async () => {
    let isValid = await receivedInfoSchema.isValid({ wasteAcceptationStatus });
    expect(isValid).toEqual(false);
  });

  it("should be invalid when quantityReceived is 0", async () => {
    let isValid = await receivedInfoSchema.isValid({
      wasteAcceptationStatus,
      quantityReceived: 0
    });
    expect(isValid).toEqual(false);
  });

  it("should be invalid when wasteRefusalReason is missing", async () => {
    let isValid = await receivedInfoSchema.isValid({
      wasteAcceptationStatus,
      quantityReceived
    });
    expect(isValid).toEqual(false);
  });
});