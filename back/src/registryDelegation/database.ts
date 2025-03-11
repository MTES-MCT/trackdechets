import { prisma } from "@td/prisma";

export async function getDelegatorsByDelegateForEachCompanies(
  companiesIds: string[]
) {
  const receivedDelegations = await prisma.registryDelegation.findMany({
    where: {
      delegateId: { in: companiesIds },
      revokedBy: null,
      cancelledBy: null,
      startDate: { lte: new Date() },
      OR: [{ endDate: null }, { endDate: { gt: new Date() } }]
    },
    include: {
      delegator: { select: { orgId: true } },
      delegate: { select: { orgId: true } }
    }
  });

  const possibleDelegationsByCompany = receivedDelegations.reduce(
    (map, delegation) => {
      if (map.has(delegation.delegate.orgId)) {
        map.get(delegation.delegate.orgId)!.push(delegation.delegator.orgId);
      } else {
        map.set(delegation.delegate.orgId, [delegation.delegator.orgId]);
      }
      return map;
    },
    new Map<string, string[]>()
  );

  return possibleDelegationsByCompany;
}
