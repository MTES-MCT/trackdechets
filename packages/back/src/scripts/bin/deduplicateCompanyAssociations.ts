#!/usr/bin/env ts-node
import deduplicateCompanyAssociations from "./deduplicateCompanyAssociations.helpers";

(async () => {
  await deduplicateCompanyAssociations();
})();
