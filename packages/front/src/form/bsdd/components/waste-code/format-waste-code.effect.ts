import { Dispatch, SetStateAction } from "react";

export default function formatWasteCodeEffect(
  wasteCode: string,
  setWasteCode: Dispatch<SetStateAction<string>>
) {
  if (wasteCode.trim() !== wasteCode) {
    setWasteCode(wasteCode.trim());
  }

  const stringLength = wasteCode.length;
  if (
    [3, 6].indexOf(stringLength) > -1 &&
    wasteCode[stringLength - 1] !== " "
  ) {
    setWasteCode(
      `${wasteCode.substr(0, stringLength - 1)} ${wasteCode.substr(
        stringLength - 1,
        1
      )}`
    );
  }
}
