import { InitialFormResolvers } from "../../generated/graphql/types";
import { isFormReader } from "../permissions";

const initialFormResolvers: InitialFormResolvers = {
  emitter: async (parent, _, { user, dataloaders }) => {
    const form = await dataloaders.formsForReadCheck.load(parent.id);
    if (!form || !(await isFormReader(user!, form))) {
      return null;
    }
    return parent.emitter ?? null;
  }
};

export default initialFormResolvers;
