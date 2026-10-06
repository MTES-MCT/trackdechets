import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { BsffOperationCode } from "@td/codegen-ui";
import { GET_RECONDITIONING_PACKAGINGS } from "../../../../common/queries/bsff/queries";
import { MAX_BSFF_COUNT_TABLE_DISPLAY } from "./BsffSelectableWasteTable";
import { useReconditioningContainers } from "./useReconditioningContainers";

const SIRET = "22222222222222";

const baseWhere = {
  operation: { code: { _in: [BsffOperationCode.D14] }, noTraceability: false },
  bsff: { destination: { company: { siret: { _eq: SIRET } } } },
  nextBsff: null
};

const emptyResult = {
  data: {
    bsffPackagings: {
      totalCount: 0,
      edges: []
    }
  }
};

describe("useReconditioningContainers", () => {
  it("uses the historical D14 contract and retains sources attached to the edited BSFF", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        addTypename={false}
        mocks={[
          {
            request: {
              query: GET_RECONDITIONING_PACKAGINGS,
              variables: {
                where: {
                  _or: [
                    baseWhere,
                    { ...baseWhere, nextBsff: { id: { _eq: "edited" } } }
                  ]
                },
                first: MAX_BSFF_COUNT_TABLE_DISPLAY
              }
            },
            result: emptyResult
          }
        ]}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(
      () => useReconditioningContainers(SIRET, "edited"),
      { wrapper }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeUndefined();
    expect(result.current.containers).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it("queries only unattached D14 packagings when there is no edited BSFF", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        addTypename={false}
        mocks={[
          {
            request: {
              query: GET_RECONDITIONING_PACKAGINGS,
              variables: {
                where: baseWhere,
                first: MAX_BSFF_COUNT_TABLE_DISPLAY
              }
            },
            result: emptyResult
          }
        ]}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useReconditioningContainers(SIRET), {
      wrapper
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeUndefined();
    expect(result.current.containers).toEqual([]);
  });

  it("does not query without an establishment", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider addTypename={false}>{children}</MockedProvider>
    );

    const { result } = renderHook(
      () => useReconditioningContainers(undefined),
      { wrapper }
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.containers).toEqual([]);
  });
});
