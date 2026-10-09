import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GET_PREVIOUS_PACKAGINGS } from "../../../../common/queries/bsff/queries";
import { useReconditioningContainers } from "./useReconditioningContainers";
import { BsffType } from "@td/codegen-ui";

it.each([BsffType.Reconditionnement, BsffType.Groupement])(
  "uses the operation filter and retains sources attached to the edited %s",
  async type => {
    const baseWhere = {
      operation: {
        code: { _in: type === BsffType.Groupement ? ["D13", "R12"] : ["D14"] },
        noTraceability: false
      },
      bsff: { destination: { company: { siret: { _eq: "22222222222222" } } } },
      nextBsff: null
    };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        addTypename={false}
        mocks={[
          {
            request: {
              query: GET_PREVIOUS_PACKAGINGS,
              variables: {
                where: {
                  _or: [
                    baseWhere,
                    { ...baseWhere, nextBsff: { id: { _eq: "edited" } } }
                  ]
                },
                first: 50
              }
            },
            result: {
              data: {
                bsffPackagings: {
                  totalCount: 0,
                  pageInfo: { hasNextPage: false, endCursor: null },
                  edges: []
                }
              }
            }
          }
        ]}
      >
        {children}
      </MockedProvider>
    );
    const { result } = renderHook(
      () => useReconditioningContainers("22222222222222", "edited", type),
      { wrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeUndefined();
    expect(result.current.containers).toEqual([]);
  }
);

it("does not query without an establishment", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MockedProvider>{children}</MockedProvider>
  );
  const { result } = renderHook(() => useReconditioningContainers(undefined), {
    wrapper
  });
  expect(result.current.loading).toBe(false);
  expect(result.current.containers).toEqual([]);
});
