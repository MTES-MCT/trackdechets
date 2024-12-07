import { InitialFormResolvers } from "@td/codegen-back";
import { isFormReader } from "../permissions";

const initialFormResolvers: InitialFormResolvers = {
  emitter: async (parent, _, { user, dataloaders }) => {
    const form = await dataloaders.formsForReadCheck.load(parent.id);
    const userRoles = await dataloaders.userRoles.load(user!.id);
    if (!form || !isFormReader(userRoles, form)) {
      return null;
    }
    return parent.emitter ?? null;
  }
};

export default initialFormResolvers;
