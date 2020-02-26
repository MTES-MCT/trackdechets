import { reportError } from "../server";
import {
  UserInputError,
  ApolloError,
  AuthenticationError,
  ForbiddenError,
  ValidationError,
  SyntaxError
} from "apollo-server-express";

describe("sentry report error", () => {
  it("should report Error", () => {
    expect(reportError(new Error(""))).toBeTruthy();
  });

  it("should report generic ApolloError", () => {
    expect(reportError(new ApolloError(""))).toBeTruthy();
  });

  it("should not report UserInputError", () => {
    expect(reportError(new UserInputError(""))).toBeFalsy();
  });

  it("should not report AuthenticationError", () => {
    expect(reportError(new AuthenticationError(""))).toBeFalsy();
  });

  it("should not report ForbiddenError", () => {
    expect(reportError(new ForbiddenError(""))).toBeFalsy();
  });

  it("should not report ValidationError", () => {
    expect(reportError(new ValidationError(""))).toBeFalsy();
  });

  it("should not report SyntaxError", () => {
    expect(reportError(new SyntaxError(""))).toBeFalsy();
  });
});
