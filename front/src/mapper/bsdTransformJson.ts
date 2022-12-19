export const transformBsdTo = <Type>(bsd: Type): Type => {
  const bsddJson = JSON.stringify(bsd);
  let bsddParsed = JSON.parse(bsddJson);
  return bsddParsed as Type;
};
