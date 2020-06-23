import { TemporaryStorageDetail } from "../generated/graphql/types";

export function createTemporaryStorageDetail(
  props: Partial<TemporaryStorageDetail>
): TemporaryStorageDetail {
  return {
    __typename: "TemporaryStorageDetail",
    temporaryStorer: null,
    destination: null,
    wasteDetails: null,
    transporter: null,
    signedBy: null,
    signedAt: null,
    ...props,
  };
}
