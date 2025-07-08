const appendix2EoExceptions = JSON.parse(
  process.env.APPENDIX2_EO_EXCEPTIONS ?? "[]"
) as string[];

// Si l'éco-organisme est autorisé à créer une annexe 2
export const isEOAllowedToCreateAppendix2 = (siret: string): boolean => {
  return appendix2EoExceptions.includes(siret);
};
