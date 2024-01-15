import { BsdasriPackaging } from "@td/codegen-ui";

export const aggregatePackagings = (packagingsArray: BsdasriPackaging[][]) => {
  return packagingsArray.reduce((prev, cur) => {
    for (const packaging of cur ?? []) {
      const idx = prev.findIndex(
        item =>
          item.type === packaging.type &&
          item.other === packaging.other &&
          item.volume === packaging.volume
      );
      if (idx !== -1) {
        const found = prev[idx];
        prev.splice(idx, 1, {
          ...found,
          quantity: found.quantity + packaging.quantity
        });
      } else {
        prev.push(packaging);
      }
    }
    return prev;
  }, [] as BsdasriPackaging[]);
};
