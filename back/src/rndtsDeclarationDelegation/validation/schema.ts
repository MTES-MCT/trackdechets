import { z } from "zod";
import { siretSchema } from "../../common/validation/zod/schema";
import { endOfDay, startOfDay, todayAtMidnight } from "../../utils";

const idSchema = z.coerce.string().length(25, "L'id doit faire 25 caractères.");

export const createRndtsDeclarationDelegationInputSchema = z
  .object({
    delegateOrgId: siretSchema(),
    delegatorOrgId: siretSchema(),
    startDate: z.coerce
      .date()
      .nullish()
      .transform<Date>((date): Date => {
        // By default, today
        if (!date) return todayAtMidnight();
        // Else, chosen date at midnight
        return startOfDay(date);
      })
      .refine(val => !val || val >= todayAtMidnight(), {
        message: "La date de début de validité ne peut pas être dans le passé."
      }),
    endDate: z.coerce
      .date()
      .nullish()
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

export const delegationIdSchema = z.object({
  delegationId: idSchema
});

export const queryRndtsDeclarationDelegationsArgsSchema = z.object({
  where: z
    .object({
      delegatorOrgId: siretSchema().nullish(),
      delegateOrgId: siretSchema().nullish()
    })
    .refine(
      data => Boolean(data.delegatorOrgId) || Boolean(data.delegateOrgId),
      "Vous devez renseigner un des deux champs (delegatorOrgId ou delegateOrgId)."
    )
    .refine(
      data => !(Boolean(data.delegatorOrgId) && Boolean(data.delegateOrgId)),
      "Vous ne pouvez pas renseigner les deux champs (delegatorOrgId et delegateOrgId)."
    ),
  skip: z.number().nonnegative().nullish(),
  first: z.number().min(1).max(50).nullish()
});
