import { isSiret } from "@td/constants";
import { useEffect, useState } from "react";
import { envConfig } from "../../../../../../common/envConfig";
import { adaptFluidesFrigorigenesIntervention } from "./adapter";
import { FluidesFrigorigenesApiError, getFluidesFrigorigenes } from "./api";
import { FluidesFrigorigenesDataState } from "./model";

type RequestState = {
  siret?: string;
  dataState: FluidesFrigorigenesDataState;
};

const toErrorState = (error: unknown): FluidesFrigorigenesDataState => {
  if (error instanceof FluidesFrigorigenesApiError) {
    if (error.code === "FF_NOT_FOUND") {
      return { status: "success", interventions: [] };
    }
    if (error.code === "SIRET_INVALID" || error.code === "FF_FORBIDDEN") {
      return { status: "unknownSiret" };
    }
    if (error.code === "FF_CONFIG_ERROR" || error.code === "FF_AUTH_ERROR") {
      return { status: "credentialsError" };
    }
  }
  return { status: "serviceError" };
};

export function useFluidesFrigorigenes(
  siret: string
): FluidesFrigorigenesDataState {
  const hasSiret = siret.length > 0;
  const validSiret = isSiret(siret, envConfig.VITE_ALLOW_TEST_COMPANY);
  const [requestState, setRequestState] = useState<RequestState>({
    dataState: { status: "loading" }
  });

  useEffect(() => {
    if (!validSiret) {
      return;
    }

    const controller = new AbortController();
    setRequestState({ siret, dataState: { status: "loading" } });

    getFluidesFrigorigenes(siret, controller.signal)
      .then(response => {
        if (!controller.signal.aborted) {
          setRequestState({
            siret,
            dataState: {
              status: "success",
              interventions: response.data.map(
                adaptFluidesFrigorigenesIntervention
              )
            }
          });
        }
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setRequestState({ siret, dataState: toErrorState(error) });
        }
      });

    return () => controller.abort();
  }, [siret, validSiret]);

  if (!hasSiret) {
    return { status: "missingSiret" };
  }
  if (!validSiret) {
    return { status: "unknownSiret" };
  }

  return requestState.siret === siret
    ? requestState.dataState
    : { status: "loading" };
}
