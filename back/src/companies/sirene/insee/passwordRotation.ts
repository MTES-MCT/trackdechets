import {
  restartScalingoApplication,
  updateScalingoEnvironmentVariable
} from "../../../common/scalingo";
import { clearToken, generateToken } from "./token";
import { decodeInseeJwt, getPasswordAgeInDays } from "./jwt";
import { generateInseePassword } from "./password";
import {
  InseePasswordRenewalError,
  renewInseePassword
} from "./passwordRenewal";

// Le mot de passe expire après environ 3 mois.
// Rotation anticipée pour conserver une marge de sécurité.
const ROTATION_AFTER_DAYS = 80;

const SCALINGO_UPDATE_ATTEMPTS = 5;
const SCALINGO_RESTART_ATTEMPTS = 3;

type RotationResult =
  | {
      status: "disabled";
    }
  | {
      status: "skipped";
      passwordAgeInDays: number;
    }
  | {
      status: "rotated";
      passwordAgeInDays: number;
    };

function isRotationEnabled(): boolean {
  return process.env.INSEE_PASSWORD_ROTATION_ENABLED === "true";
}

function getOldPassword(): string {
  const oldPassword = process.env.INSEE_PASSWORD;

  if (!oldPassword) {
    throw new Error("La variable INSEE_PASSWORD est manquante");
  }

  return oldPassword;
}

function wait(delayInMilliseconds: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, delayInMilliseconds);
  });
}

async function retry<T>({
  operation,
  attempts,
  operationName
}: {
  operation: () => Promise<T>;
  attempts: number;
  operationName: string;
}): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      console.error(`${operationName} en échec`, {
        attempt,
        attempts,
        message: error instanceof Error ? error.message : "Erreur inconnue"
      });

      if (attempt < attempts) {
        const delay = 1_000 * 2 ** (attempt - 1);

        await wait(delay);
      }
    }
  }

  throw lastError;
}

async function passwordCanGenerateToken(password: string): Promise<boolean> {
  try {
    await generateToken({
      password,
      cache: false
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Cas ambigu :
 * l'appel de renouvellement a pu être traité par l'INSEE,
 * mais la réponse n'est jamais arrivée à Trackdéchets.
 */
async function resolveAmbiguousRenewal({
  oldPassword,
  newPassword
}: {
  oldPassword: string;
  newPassword: string;
}): Promise<"old" | "new" | "none"> {
  if (await passwordCanGenerateToken(newPassword)) {
    return "new";
  }

  if (await passwordCanGenerateToken(oldPassword)) {
    return "old";
  }

  return "none";
}

/**
 * Tente de restaurer l'ancien mot de passe côté INSEE.
 *
 * Cette fonction est utilisée lorsque le renouvellement INSEE a réussi,
 * mais que Scalingo ne peut pas enregistrer le nouveau mot de passe.
 */
async function rollbackInseePassword({
  newToken,
  oldPassword,
  newPassword
}: {
  newToken: string;
  oldPassword: string;
  newPassword: string;
}): Promise<void> {
  console.error(
    "Échec de mise à jour Scalingo : tentative de restauration du mot de passe INSEE"
  );

  await renewInseePassword({
    token: newToken,
    oldPassword: newPassword,
    newPassword: oldPassword
  });

  const oldPasswordWorks = await passwordCanGenerateToken(oldPassword);

  if (!oldPasswordWorks) {
    throw new Error("La restauration du mot de passe INSEE a échoué");
  }

  console.info("L'ancien mot de passe INSEE a été restauré avec succès");
}

export async function rotateInseePasswordIfNeeded(
  now = new Date()
): Promise<RotationResult> {
  /*
   * Protection indispensable :
   * le cron.json peut également être pris en compte sur les autres
   * environnements et les Review Apps.
   */
  if (!isRotationEnabled()) {
    console.info(
      "Rotation du mot de passe INSEE désactivée sur cet environnement"
    );

    return {
      status: "disabled"
    };
  }

  const oldPassword = getOldPassword();

  /*
   * Génération sans cache pour :
   * - tester réellement le mot de passe actuel ;
   * - récupérer un JWT récent ;
   * - lire pwdChangedTime.
   */
  const currentToken = await generateToken({
    password: oldPassword,
    cache: false
  });

  const currentPayload = decodeInseeJwt(currentToken);

  if (!currentPayload.pwdChangedTime) {
    throw new Error("Le token INSEE ne contient pas le champ pwdChangedTime");
  }

  const passwordAgeInDays = getPasswordAgeInDays(currentToken, now);

  if (passwordAgeInDays < 0) {
    throw new Error(
      "La date pwdChangedTime du token INSEE est située dans le futur"
    );
  }

  if (passwordAgeInDays < ROTATION_AFTER_DAYS) {
    console.info("Rotation du mot de passe INSEE non nécessaire", {
      passwordAgeInDays,
      rotationAfterDays: ROTATION_AFTER_DAYS
    });

    return {
      status: "skipped",
      passwordAgeInDays
    };
  }

  const newPassword = generateInseePassword();

  console.info("Démarrage de la rotation du mot de passe INSEE", {
    passwordAgeInDays,
    rotationAfterDays: ROTATION_AFTER_DAYS
  });

  let inseePasswordWasUpdated = false;

  try {
    await renewInseePassword({
      token: currentToken,
      oldPassword,
      newPassword
    });

    inseePasswordWasUpdated = true;
  } catch (error) {
    /*
     * Réponse HTTP explicite de l'INSEE :
     * la rotation a été refusée.
     */
    if (error instanceof InseePasswordRenewalError && error.responseReceived) {
      throw error;
    }

    /*
     * Timeout ou coupure réseau :
     * déterminer lequel des deux mots de passe est actif.
     */
    const activePassword = await resolveAmbiguousRenewal({
      oldPassword,
      newPassword
    });

    if (activePassword === "old") {
      throw new Error(
        "La rotation INSEE n'a pas été appliquée ; l'ancien mot de passe reste actif"
      );
    }

    if (activePassword === "none") {
      throw new Error("Impossible de déterminer le mot de passe INSEE actif");
    }

    inseePasswordWasUpdated = true;
  }

  if (!inseePasswordWasUpdated) {
    throw new Error("Le mot de passe INSEE n'a pas été renouvelé");
  }

  /*
   * Vérification du nouveau mot de passe.
   */
  const verificationToken = await generateToken({
    password: newPassword,
    cache: false
  });

  const verificationPayload = decodeInseeJwt(verificationToken);

  if (!verificationPayload.pwdChangedTime) {
    throw new Error("Le nouveau token INSEE ne contient pas pwdChangedTime");
  }

  /*
   * À partir d'ici le nouveau mot de passe est actif chez l'INSEE.
   *
   * On essaie plusieurs fois de l'enregistrer dans Scalingo.
   */
  try {
    await retry({
      operation: () =>
        updateScalingoEnvironmentVariable("INSEE_PASSWORD", newPassword),
      attempts: SCALINGO_UPDATE_ATTEMPTS,
      operationName: "Mise à jour de INSEE_PASSWORD dans Scalingo"
    });
  } catch (scalingoError) {
    /*
     * Scalingo n'a pas enregistré le nouveau mot de passe.
     *
     * On restaure l'ancien mot de passe côté INSEE pour éviter
     * que Scalingo conserve un secret devenu invalide.
     */
    try {
      await rollbackInseePassword({
        newToken: verificationToken,
        oldPassword,
        newPassword
      });
    } catch (rollbackError) {
      console.error(
        "ERREUR CRITIQUE : le nouveau mot de passe INSEE est actif mais n'a pas pu être enregistré dans Scalingo",
        {
          scalingoError:
            scalingoError instanceof Error
              ? scalingoError.message
              : "Erreur inconnue",
          rollbackError:
            rollbackError instanceof Error
              ? rollbackError.message
              : "Erreur inconnue"
        }
      );

      /*
       * Ne jamais écrire newPassword dans les logs.
       */
      throw new Error(
        "Échec critique de synchronisation du mot de passe entre l'INSEE et Scalingo"
      );
    }

    throw new Error(
      "La mise à jour Scalingo a échoué ; l'ancien mot de passe INSEE a été restauré"
    );
  }

  /*
   * La variable Scalingo est désormais correctement enregistrée.
   */
  await clearToken();

  console.info(
    "Mot de passe INSEE renouvelé et variable Scalingo mise à jour",
    {
      passwordAgeInDays
    }
  );

  /*
   * Le redémarrage est retenté.
   *
   * Si le redémarrage échoue malgré tout, ce n'est pas aussi critique :
   * la nouvelle valeur est déjà persistée dans Scalingo.
   */
  await retry({
    operation: restartScalingoApplication,
    attempts: SCALINGO_RESTART_ATTEMPTS,
    operationName: "Redémarrage de l'application Scalingo"
  });

  return {
    status: "rotated",
    passwordAgeInDays
  };
}
