import { testRule } from "../../common/__tests__/rules.test";
import { canAccessForm } from "../rules";

describe("canAccessForm", () => {
  it("should be true if the user created the form", async () => {
    const formFragment = jest.fn();
    const userFragment = jest.fn();
    const prisma = {
      form: jest.fn(() => ({ $fragment: formFragment })),
      user: jest.fn(() => ({ $fragment: userFragment }))
    };

    formFragment.mockResolvedValue({ owner: { id: "current user id" } });
    userFragment.mockResolvedValue({ companyAssociations: [] });

    const result = await testRule(canAccessForm)(
      null,
      { id: "12345" },
      { user: { id: "current user id" }, prisma }
    );

    expect(result).toBe(true);
  });

  it("should be true if the user belongs to the company that emitted the form", async () => {
    const formFragment = jest.fn();
    const userFragment = jest.fn();
    const prisma = {
      form: jest.fn(() => ({ $fragment: formFragment })),
      user: jest.fn(() => ({ $fragment: userFragment }))
    };

    formFragment.mockResolvedValue({
      owner: { id: null },
      emitterCompanySiret: "a siret"
    });
    userFragment.mockResolvedValue({
      companyAssociations: [{ company: { siret: "a siret" } }]
    });

    const result = await testRule(canAccessForm)(
      null,
      { id: "12345" },
      { user: { id: "id" }, prisma }
    );
    expect(result).toBe(true);
  });

  it("should be true if the user belongs to the company that received the form", async () => {
    const formFragment = jest.fn();
    const userFragment = jest.fn();
    const prisma = {
      form: jest.fn(() => ({ $fragment: formFragment })),
      user: jest.fn(() => ({ $fragment: userFragment }))
    };

    formFragment.mockResolvedValue({
      owner: { id: null },
      emitterCompanySiret: "other siret",
      recipientCompanySiret: "a siret"
    });
    userFragment.mockResolvedValue({
      companyAssociations: [{ company: { siret: "a siret" } }]
    });

    const result = await testRule(canAccessForm)(
      null,
      { id: "12345" },
      { user: { id: "id" }, prisma }
    );
    expect(result).toBe(true);
  });

  it("should be false if the user has nothing to do with the form", async () => {
    const formFragment = jest.fn();
    const userFragment = jest.fn();
    const prisma = {
      form: jest.fn(() => ({ $fragment: formFragment })),
      user: jest.fn(() => ({ $fragment: userFragment }))
    };

    formFragment.mockResolvedValue({
      owner: { id: "an unkmown id" },
      emitterCompanySiret: "other siret",
      recipientCompanySiret: "yet another siret"
    });
    userFragment.mockResolvedValue({
      companyAssociations: [{ company: { siret: "a siret" } }]
    });

    const result = await testRule(canAccessForm)(
      null,
      { id: "12345" },
      { user: { id: "id" }, prisma }
    );
    expect(result).toBeInstanceOf(Error);
  });
});

describe("isFormTransporter", () => {
  it("should be true if the user is the form transporter", async () => {
    const formFragment = jest.fn();
    const userFragment = jest.fn();
    const prisma = {
      form: jest.fn(() => ({ $fragment: formFragment })),
      user: jest.fn(() => ({ $fragment: userFragment }))
    };

    formFragment.mockResolvedValue({
      owner: { id: "current user id" },
      emitterCompanySiret: "other siret",
      recipientCompanySiret: "yet another siret",
      transporterCompanySiret: "transporter siret"
    });
    userFragment.mockResolvedValue({
      companyAssociations: [{ company: { siret: "transporter siret" } }]
    });

    const result = await testRule(canAccessForm)(
      null,
      { id: "12345" },
      { user: { id: "current user id" }, prisma }
    );

    expect(result).toBe(true);
  });
});

describe("isFormEmitter", () => {
  it("should be true if the user is the form emitter", async () => {
    const formFragment = jest.fn();
    const userFragment = jest.fn();
    const prisma = {
      form: jest.fn(() => ({ $fragment: formFragment })),
      user: jest.fn(() => ({ $fragment: userFragment }))
    };

    formFragment.mockResolvedValue({
      owner: { id: "current user id" },
      emitterCompanySiret: "emitter siret",
      recipientCompanySiret: "recipient siret",
      transporterCompanySiret: "transporter siret"
    });
    userFragment.mockResolvedValue({
      companyAssociations: [{ company: { siret: "emitter siret" } }]
    });

    const result = await testRule(canAccessForm)(
      null,
      { id: "12345" },
      { user: { id: "current user id" }, prisma }
    );

    expect(result).toBe(true);
  });
});

describe("isFormRecipient", () => {
  it("should be true if the user is the form emitter", async () => {
    const formFragment = jest.fn();
    const userFragment = jest.fn();
    const prisma = {
      form: jest.fn(() => ({ $fragment: formFragment })),
      user: jest.fn(() => ({ $fragment: userFragment }))
    };

    formFragment.mockResolvedValue({
      owner: { id: "current user id" },
      emitterCompanySiret: "emitter siret",
      recipientCompanySiret: "recipient siret",
      transporterCompanySiret: "transporter siret"
    });
    userFragment.mockResolvedValue({
      companyAssociations: [{ company: { siret: "recipient siret" } }]
    });

    const result = await testRule(canAccessForm)(
      null,
      { id: "12345" },
      { user: { id: "current user id" }, prisma }
    );

    expect(result).toBe(true);
  });
});
