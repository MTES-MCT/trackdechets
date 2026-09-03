import { isSiret } from "@td/constants";
import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import { Response, Router } from "express";
import { z } from "zod";
import {
  fluidesFrigoClient,
  FluidesFrigoApiError,
  FluidesFrigoConfigError
} from "../bsffs/fluidesFrigo/client";
import { mapCerfaToBsffOperateurDraft } from "../bsffs/fluidesFrigo/mapper";
import ensureLoggedIn from "../common/middlewares/ensureLoggedIn";

const fluidesFrigoBsffRouter = Router();

const paramsSchema = z.object({
  siret: z.string().refine(isSiret, {
    message: "SIRET invalide (format attendu: 14 chiffres valides)"
  })
});

const querySchema = z.object({
  debut: z.string().datetime().optional(),
  fin: z.string().datetime().optional(),
  identifiantBouteille: z.string().optional()
});

const handleFluidesFrigoError = (
  error: unknown,
  res: Response,
  siret: string
) => {
  if (error instanceof FluidesFrigoConfigError) {
    logger.error(error.message);

    return res.status(500).json({
      error: "FF_CONFIG_ERROR",
      message: error.message
    });
  }

  if (error instanceof FluidesFrigoApiError) {
    logger.error(error.message, {
      status: error.status,
      details: error.details
    });

    switch (error.status) {
      case 404:
        return res.status(404).json({
          error: "FF_NOT_FOUND",
          message: `Aucune fiche CERFA trouvée pour le SIRET ${siret}.`
        });

      case 403:
        return res.status(403).json({
          error: "FF_FORBIDDEN",
          message: "Accès refusé par l'API Fluides Frigorigènes pour ce SIRET."
        });

      case 429:
        return res.status(503).json({
          error: "FF_RATE_LIMITED",
          message:
            "Service Fluides Frigorigènes temporairement indisponible (limitation de débit)."
        });

      default:
        return res.status(502).json({
          error: "FF_API_ERROR",
          message:
            "Erreur lors de la récupération des données Fluides Frigorigènes."
        });
    }
  }

  throw error;
};

fluidesFrigoBsffRouter.get(
  "/api/bsff/operateur/fluides-frigo/:siret",
  ensureLoggedIn,
  async (req, res) => {
    const parsedParams = paramsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      return res.status(400).json({
        error: "SIRET_INVALID",
        message: parsedParams.error.issues[0]?.message
      });
    }

    const parsedQuery = querySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      return res.status(400).json({
        error: "INVALID_QUERY_PARAMS",
        message: "Les paramètres de date doivent être au format ISO 8601."
      });
    }

    const { siret } = parsedParams.data;

    const association = await prisma.companyAssociation.findFirst({
      where: {
        userId: req.user!.id,
        company: { orgId: siret }
      },
      select: { id: true }
    });

    if (!association) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message:
          "Vous devez être membre de l'établissement pour charger ses fiches Fluides Frigorigènes."
      });
    }

    try {
      const cerfas = await fluidesFrigoClient.getCerfaBySiret({
        siret,
        debut: parsedQuery.data.debut,
        fin: parsedQuery.data.fin,
        identifiantBouteille: parsedQuery.data.identifiantBouteille
      });

      const data = cerfas.map(mapCerfaToBsffOperateurDraft);

      return res.status(200).json({
        success: true,
        count: data.length,
        data,
        metadata: {
          fetchedAt: new Date().toISOString(),
          source: "fluides_frigo",
          dateRange: {
            debut: parsedQuery.data.debut ?? null,
            fin: parsedQuery.data.fin ?? null
          }
        }
      });
    } catch (error) {
      return handleFluidesFrigoError(error, res, siret);
    }
  }
);

export { fluidesFrigoBsffRouter };
