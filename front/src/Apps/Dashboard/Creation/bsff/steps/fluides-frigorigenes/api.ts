import { z } from "zod";
import { envConfig } from "../../../../../../common/envConfig";

const containerSchema = z.object({
  bouteilleId: z.string(),
  bouteilleIdentification: z.string(),
  codeDechet: z.string(),
  poidsFluide: z.number(),
  volumeContenant: z.number().nullable(),
  mentionADR: z.string().nullable()
});

const interventionSchema = z.object({
  ficheInterventionNumero: z.string(),
  dateIntervention: z.string().nullable(),
  dechets: z.array(containerSchema),
  detenteur: z.object({
    siret: z.string(),
    nom: z.string(),
    adresse: z.string().optional(),
    codePostal: z.string().optional(),
    ville: z.string().optional()
  }),
  operateur: z.object({
    siret: z.string(),
    nom: z.string()
  }),
  sourceData: z.literal("fluides_frigo"),
  ffFicheId: z.string(),
  quantiteTotalRecuperation: z.string().optional(),
  associatedBsffIds: z.array(z.string())
});

const responseSchema = z.object({
  success: z.literal(true),
  count: z.number(),
  data: z.array(interventionSchema),
  metadata: z.object({
    fetchedAt: z.string(),
    source: z.literal("fluides_frigo"),
    dateRange: z.object({
      debut: z.string().nullable(),
      fin: z.string().nullable()
    })
  })
});

const errorSchema = z.object({
  error: z.string(),
  message: z.string().optional()
});

export type FluidesFrigorigenesDto = z.infer<typeof interventionSchema>;
export type FluidesFrigorigenesResponse = z.infer<typeof responseSchema>;

export class FluidesFrigorigenesApiError extends Error {
  constructor(public readonly code: string, public readonly status?: number) {
    super(code);
  }
}

export async function getFluidesFrigorigenes(
  siret: string,
  signal?: AbortSignal
): Promise<FluidesFrigorigenesResponse> {
  const baseUrl = envConfig.VITE_API_ENDPOINT.replace(/\/$/, "");
  const response = await fetch(
    `${baseUrl}/api/bsff/operateur/fluides-frigo/${encodeURIComponent(siret)}`,
    { cache: "no-store", credentials: "include", signal }
  );

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new FluidesFrigorigenesApiError(
      "UNEXPECTED_RESPONSE",
      response.status
    );
  }

  if (!response.ok) {
    const parsedError = errorSchema.safeParse(payload);
    throw new FluidesFrigorigenesApiError(
      parsedError.success ? parsedError.data.error : "UNEXPECTED_RESPONSE",
      response.status
    );
  }

  const parsedResponse = responseSchema.safeParse(payload);
  if (!parsedResponse.success) {
    throw new FluidesFrigorigenesApiError(
      "UNEXPECTED_RESPONSE",
      response.status
    );
  }

  return parsedResponse.data;
}
