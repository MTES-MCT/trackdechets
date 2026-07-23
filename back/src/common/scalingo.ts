import axios from "axios";

type ScalingoBearerResponse = {
  token: string;
};

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`La variable ${name} est obligatoire`);
  }

  return value;
}

function getApiUrl(): string {
  const configuredUrl = requiredEnvironmentVariable("SCALINGO_API_URL");

  return configuredUrl.startsWith("https://")
    ? configuredUrl.replace(/\/$/, "")
    : `https://${configuredUrl.replace(/\/$/, "")}`;
}

function getAppName(): string {
  return (
    process.env.SCALINGO_APP_NAME ?? requiredEnvironmentVariable("SCALINGO_APP")
  );
}

async function getScalingoBearerToken(): Promise<string> {
  const apiToken = requiredEnvironmentVariable("SCALINGO_TOKEN");

  const response = await axios.post<ScalingoBearerResponse>(
    "https://auth.scalingo.com/v1/tokens/exchange",
    undefined,
    {
      auth: {
        username: "",
        password: apiToken
      },
      headers: {
        Accept: "application/json"
      },
      timeout: 15_000
    }
  );

  if (!response.data.token) {
    throw new Error("Scalingo n'a pas retourné de bearer token");
  }

  return response.data.token;
}

async function getHeaders(): Promise<Record<string, string>> {
  const bearerToken = await getScalingoBearerToken();

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${bearerToken}`
  };
}

export async function updateScalingoEnvironmentVariable(
  name: string,
  value: string
): Promise<void> {
  const appName = getAppName();
  const apiUrl = getApiUrl();
  const headers = await getHeaders();

  await axios.put(
    `${apiUrl}/v1/apps/${encodeURIComponent(appName)}/variables`,
    {
      variables: [
        {
          name,
          value
        }
      ]
    },
    {
      headers,
      timeout: 15_000
    }
  );
}

export async function restartScalingoApplication(): Promise<void> {
  const appName = getAppName();
  const apiUrl = getApiUrl();
  const headers = await getHeaders();

  await axios.post(
    `${apiUrl}/v1/apps/${encodeURIComponent(appName)}/restart`,
    {
      scope: null
    },
    {
      headers,
      timeout: 15_000
    }
  );
}
