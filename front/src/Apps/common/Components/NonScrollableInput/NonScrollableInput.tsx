import React, { useEffect, useRef } from "react";
import Input, { InputProps } from "@codegouvfr/react-dsfr/Input";

export default function NonScrollableInput(props: InputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnWheel = event => {
      event.preventDefault();
    };

    if (inputRef && inputRef.current) {
      const input = inputRef.current;

      input.addEventListener("wheel", handleOnWheel, {
        passive: false
      });

      return () => {
        input.removeEventListener("wheel", handleOnWheel);
      };
    }
  }, [inputRef]);

  return <Input ref={inputRef} {...props} />;
}
