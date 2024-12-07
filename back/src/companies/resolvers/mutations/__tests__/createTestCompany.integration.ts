import { prisma } from "@td/prisma";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Mutation } from "@td/codegen-back";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { generateUniqueTestSiret } from "../createTestCompany";
import * as utils from "../../../../utils";
import { TEST_COMPANY_PREFIX } from "@td/constants";

jest.mock("../../../../utils", () => ({
  __esModule: true,
  ...jest.requireActual("../../../../utils")
}));

const CREATE_TEST_COMPANY = gql`
  mutation CreateTestCompany {
    createTestCompany
  }
`;

describe("createTestCompany", () => {
  afterEach(async () => {
    await resetDatabase();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe("generateUniqueTestSiret", () => {
    it("should generate a random siret with 14 characters, and the first 6 should be the test prefix", async () => {
      // Given

      // When
      const randomSiret = await generateUniqueTestSiret();

      // Then
      expect(randomSiret.length).toEqual(14);
      expect(randomSiret.startsWith(TEST_COMPANY_PREFIX)).toBeTruthy();
    });
  });

  it("if a company already has random siret, should pick another one", async () => {
    // Given
    await prisma.anonymousCompany.create({
      data: {
        name: "Test company",
        siret: "00000000000133", // 000001 + luhn
        orgId: "00000000000133",
        address: "",
        codeNaf: "",
        libelleNaf: "",
        codeCommune: ""
      }
    });
    await prisma.anonymousCompany.create({
      data: {
        name: "Test company",
        siret: "00000000000224", // 000002 + luhn
        orgId: "00000000000224",
        address: "",
        codeNaf: "",
        libelleNaf: "",
        codeCommune: ""
      }
    });

    // https://github.com/aelbore/esbuild-jest/issues/26#issuecomment-968853688
    const randomNbrChainSpy = jest.spyOn(utils, "randomNbrChain");
    (randomNbrChainSpy as jest.Mock)
      .mockReturnValueOnce("000001")
      .mockReturnValueOnce("000002")
      .mockReturnValueOnce("000003");

    // When
    const testSiret = await generateUniqueTestSiret();

    // Then
    expect(randomNbrChainSpy).toHaveBeenCalledTimes(3);
    expect(testSiret).toEqual("00000000000323"); // 000003 + luhn
  });
});

describe("mutation CREATE_TEST_COMPANY", () => {
  it("should generate a random siret with 14 characters, and the first 6 should be the test prefix", async () => {
    // Given
    const user = await userFactory();
    const { mutate } = makeClient(user);

    // When
    const { data } = await mutate<Pick<Mutation, "createTestCompany">>(
      CREATE_TEST_COMPANY
    );

    // Then
    const siret = data.createTestCompany;
    expect(siret.length).toEqual(14);
    expect(siret.startsWith(TEST_COMPANY_PREFIX)).toBeTruthy();
  });
});
