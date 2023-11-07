import { useState, useEffect } from "react";

export interface CaptchaData {
  img: string;
  token: string;
}

const { VITE_API_ENDPOINT } = import.meta.env;
const captchaUrl = `${VITE_API_ENDPOINT}/captcha`;

export function useCaptcha(displayCaptcha: boolean) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const fallbackError = "Une erreur est survenue";

  const refetchCaptcha = () => {
    setRefreshIndex(refreshIndex + 1);
  };

  const getCaptchaData = async () => {
    fetch(captchaUrl)
      .then(res => {
        res.json().then(data => {
          if (res.status === 200) {
            const { img, token } = data;
            setCaptchaData({ img, token });

            setLoading(false);
          } else {
            if (data.error_description) {
              setError(data.error_description);
              setLoading(false);
            } else {
              setError(fallbackError);
              setLoading(false);
            }
          }
        });
      })
      .catch(_err => {
        setError(fallbackError);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!displayCaptcha) {
      return;
    }
    getCaptchaData();
  }, [displayCaptcha, refreshIndex]);

  return {
    captchaLoading: loading,
    captchaError: error,
    captchaData,
    refetchCaptcha
  };
}
