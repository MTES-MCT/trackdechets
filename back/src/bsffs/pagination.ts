import { PaginationArgs, validatePaginationArgs } from "../common/pagination";

export async function getConnectionsArgs({
  first,
  after,
  last,
  before,
  defaultPaginateBy = 50,
  maxPaginateBy = 500
}: PaginationArgs) {
  validatePaginationArgs({ first, after, last, before, maxPaginateBy });

  return {
    take: before ? -defaultPaginateBy - 1 : defaultPaginateBy + 1, // Default value
    ...(first ? { take: first + 1 } : {}),
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
    ...(last ? { take: -last - 1 } : {}),
    ...(before ? { cursor: { id: before }, skip: 1 } : {})
  };
}
