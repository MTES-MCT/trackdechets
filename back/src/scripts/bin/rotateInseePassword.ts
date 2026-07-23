import { rotateInseePasswordIfNeeded } from "../../companies/sirene/insee/passwordRotation";

async function main(): Promise<void> {
  try {
    const result = await rotateInseePasswordIfNeeded();

    console.info("Vérification du mot de passe INSEE terminée", {
      status: result.status,
      passwordAgeInDays: result.passwordAgeInDays
    });
  } catch (error) {
    console.error("Échec du renouvellement du mot de passe INSEE", {
      message: error instanceof Error ? error.message : "Erreur inconnue"
    });

    process.exitCode = 1;
  }
}

void main();
