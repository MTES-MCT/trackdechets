import React, { useState, useCallback } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import classNames from "classnames";
import "./Captcha.scss";
import { Loader } from "common/components";

const { VITE_API_ENDPOINT } = import.meta.env;

const CaptchaAudio = ({ captchaToken }) => {
  const [playing, setPlaying] = useState(false);

  const onClick = useCallback(
    () => getCaptchaAudio(captchaToken),
    [captchaToken]
  );

  const getCaptchaAudio = async captchaToken => {
    fetch(`${VITE_API_ENDPOINT}/captcha-audio/${captchaToken}`)
      .then(res => {
        res.json().then(data => {
          if (res.status === 200) {
            setPlaying(true);
            const player = new Audio();
            let n = 0;
            player.src = `data:audio/mp3;base64,${data.audio[n]}`;
            player.play();
            player.addEventListener("ended", () => {
              n += 1;
              if (n < data.playList.length) {
                player.src = `data:audio/mp3;base64,${
                  data.audio[data.playList[n]]
                }`;
                player.play();
              } else {
                setPlaying(false);
                player.remove();
              }
            });
          }
        });
      })
      .catch(_err => {});
  };
  return (
    <Button
      priority="secondary"
      size="small"
      iconId="ri-volume-up-line"
      title="Écouter le code"
      onClick={onClick}
      disabled={playing}
    >
      Écouter
    </Button>
  );
};

export const Captcha = ({
  captchaInput,
  setCaptchaInput,
  captchaImg,
  refetch,
  captchaToken,
  narrow = false,
}) => {
  return (
    <>
      <div
        className={classNames("captcha__wrapper", {
          "captcha__wrapper--narrow": narrow,
        })}
      >
        {!!captchaImg ? (
          <img src={captchaImg} alt="Captcha visuel" />
        ) : (
          <Loader />
        )}

        <div
          className={classNames("captcha__components", {
            "captcha__components--narrow": narrow,
          })}
        >
          <Button
            onClick={refetch}
            priority="secondary"
            title="Rafraîchir l'image"
            iconId="ri-restart-line"
            size="small"
          >
            Nouvelle image
          </Button>
          <CaptchaAudio captchaToken={captchaToken} />
        </div>
      </div>
      <Input
        label="Anti-robots: recopiez le texte ci-dessus"
        nativeInputProps={{
          required: true,
          name: "captchaInput",
          value: captchaInput,
          onChange: e => setCaptchaInput(e.target.value),
        }}
      />
    </>
  );
};
