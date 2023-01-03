import React from "react";
import { TextInput } from "@dataesr/react-dsfr";

export const Captcha = ({ captchaInput, setCaptchaInput, captchaImg }) => {
  return (
    <>
      <div>
        <img src={captchaImg} alt="" />
      </div>
      <TextInput
        type={"text"}
        // @ts-ignore
        onChange={e => setCaptchaInput(e.target.value)}
        required
        name="captchaInput"
        value={captchaInput}
        label="Anti-robots: recopiez le texte ci-dessus"
      />
    </>
  );
};
