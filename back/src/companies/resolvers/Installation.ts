import { getRubriques, getDeclarations } from "../database";
import { InstallationResolvers } from "@td/codegen-back";

const installationResolvers: InstallationResolvers = {
  urlFiche: parent =>
    `https://www.georisques.gouv.fr/risques/installations/donnees/details/${parent.codeS3ic}`,
  rubriques: async parent => {
    const rub = await getRubriques(parent.codeS3ic);

    return rub.map(el => ({ ...el, category: el.category || "" }));
  },
  declarations: async parent => getDeclarations(parent.codeS3ic)
};

export default installationResolvers;
