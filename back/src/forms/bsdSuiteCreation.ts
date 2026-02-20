import { Prisma } from "@td/prisma";
import { randomUUID } from "node:crypto";
/**
 * Minimal type for Prisma client or transaction used for form.findFirst/update.
 * Allows both the global prisma and transaction client from repository.
 */
type PrismaFormClient = {
  form: {
    findFirst: (args: unknown) => Promise<{ id: string } | null>;
    update: (args: unknown) => Promise<unknown>;
  };
};

/** Type for nested forwardedIn.create when it's an object with optional readableId */
type ForwardedInCreateWithReadableId = {
  readableId?: string;
  [key: string]: unknown;
};

/**
 * Returns the intended BSD suite readableId when the form input creates a
 * forwardedIn (BSD suite) via forwardedIn.create with readableId ending in "-suite",
 * or "" otherwise. Used to decide whether to free the readableId proactively before create/update.
 */
export function getBsdSuiteReadableIdFromFormInput(
  data: Prisma.FormCreateInput | Prisma.FormUpdateInput
): string {
  const forwardedIn = data.forwardedIn;
  if (!forwardedIn) return "";
  if (!forwardedIn.create) return "";
  const create = forwardedIn.create as ForwardedInCreateWithReadableId;
  if (!create?.readableId) return "";
  return create.readableId.endsWith("-suite") ? create.readableId : "";
}

/**
 * If a soft-deleted Form exists with the given readableId (e.g. a BSD suite that was
 * removed), renames it by appending a random suffix so the readableId can be reused.
 * Call this *before* create/update when creating a BSD suite to avoid unique constraint
 * errors. Only renames when isDeleted=true to avoid overwriting an active form.
 * Uses the same prisma instance (or transaction) so it participates in the current
 * transaction when applicable.
 */
export async function renameExistingBsdSuiteReadableId(
  prisma: PrismaFormClient,
  intendedSuiteReadableId: string
): Promise<void> {
  const existing = await prisma.form.findFirst({
    where: {
      readableId: intendedSuiteReadableId,
      isDeleted: true
    },
    select: { id: true }
  });
  if (!existing) return;

  const newReadableId = `${intendedSuiteReadableId}-${randomUUID()}`;
  await prisma.form.update({
    where: { id: existing.id },
    data: { readableId: newReadableId }
  });
}
