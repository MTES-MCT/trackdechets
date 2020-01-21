import { RuleTypeMap } from "./types";

export function mergeValidationRules(rulesMap: RuleTypeMap[]) {
  // We want to merge only 2 levels deep, otherwise we losse the yup prototype
  const merge = (r1: RuleTypeMap, r2: RuleTypeMap) => {
    const keys = Object.keys({ ...r1, ...r2 });

    return keys.reduce((mergedRules, key) => {
      mergedRules[key] = { ...r1[key], ...r2[key] };
      return mergedRules;
    }, {});
  };

  return rulesMap.reduce((prev, cur) => merge(prev, cur));
}
