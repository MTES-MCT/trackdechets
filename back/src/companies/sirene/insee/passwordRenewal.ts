import axios, { isAxiosError } from "axios";

const INSEE_PASSWORD_RENEWAL_URL =
  "https://api.insee.fr/api-sirene/prive/3.11/renouvellement";

export class InseePasswordRenewalError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly responseReceived = false
  ) {
    super(message);
    this.name = "InseePasswordRenewalError";
  }
}

type RenewPasswordInput = {
  token: string;
  oldPassword: string;
  newPassword: string;
};

export async function renewInseePassword({
  token,
  oldPassword,
  newPassword
}: RenewPasswordInput): Promise<void> {
  try {
    const response = await axios.post(
      INSEE_PASSWORD_RENEWAL_URL,
      {
        oldPassword,
        newPassword
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        timeout: 15_000,
        validateStatus: () => true
      }
    );

    if (response.status !== 200) {
      throw new InseePasswordRenewalError(
        `L'API de renouvellement INSEE a répondu HTTP ${response.status}`,
        response.status,
        true
      );
    }
  } catch (error) {
    if (error instanceof InseePasswordRenewalError) {
      throw error;
    }

    if (isAxiosError(error)) {
      throw new InseePasswordRenewalError(
        "Aucune réponse exploitable reçue de l'API de renouvellement INSEE",
        error.response?.status,
        Boolean(error.response)
      );
    }

    throw error;
  }
}
