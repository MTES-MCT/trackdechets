import { z } from "zod";
import { siretSchema } from "../../common/validation/zod/schema";
import { endOfDay, startOfDay, todayAtMidnight } from "../../utils";

export const createRndtsDeclarationDelegationInputSchema = z
  .object({
    delegateOrgId: siretSchema(),
    delegatorOrgId: siretSchema(),
    startDate: z.coerce
      .date()
      .optional()
      .transform(date => {
        if (!date) return date;
        return startOfDay(date);
      })
      .refine(val => !val || val >= todayAtMidnight(), {
        message: "La date de début de validité ne peut pas être dans le passé."
      }),
    endDate: z.coerce
      .date()
      .optional()
      .transform(date => {
        if (!date) return date;
        return endOfDay(date);
      })
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
