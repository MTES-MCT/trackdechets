import { z } from "zod";
import { siretSchema } from "../../common/validation/zod/schema";
import { todayAtMidnight } from "../../utils";

export const createRndtsDeclarationDelegationInputSchema = z
  .object({
    delegateOrgId: siretSchema(),
    delegatorOrgId: siretSchema(),
    startDate: z.coerce
      .date()
      .optional()
      // Validate that the start date is not in the past. Technically we
      // authorize dates in the past as long as they are after midnight of current day.
      // Else if front sends { startDate: new Date() }, they will always get an
      // error because with network latency, set date will be inferior to now() on the server
      .refine(val => !val || val >= todayAtMidnight(), {
        message: "La date de début de validité ne peut pas être dans le passé."
      }),
    endDate: z.coerce
      .date()
      .optional()
      .refine(val => !val || val > new Date(), {
        message: "La date de fin de validité ne peut pas être dans le passé."
      }),
    comment: z.string().max(500).optional()
  })
  .refine(
    ({ delegateOrgId, delegatorOrgId }) => delegateOrgId !== delegatorOrgId,
    {
      path: ["delegatorOrgId"],
      message: "Le délégant et le délégataire doivent être différents."
    }
  )
  .refine(
    data => {
      const { startDate, endDate } = data;

      if (startDate && endDate) {
        return startDate < endDate;
      }

      return true;
    },
    {
      path: ["endDate"],
      message: "La date de début de validité doit être avant la date de fin."
    }
  );

export const queryRndtsDeclarationDelegationArgsSchema = z.object({
  id: z.coerce.string().length(25, "L'id doit faire 25 caractères.")
});
