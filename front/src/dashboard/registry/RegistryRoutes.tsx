import { Navigate, Route, Routes } from "react-router-dom";
import React from "react";

import RegistryMenu from "./RegistryMenu";
import { useMedia } from "../../common/use-media";
import { MEDIA_QUERIES } from "../../common/config";
import { CompanyImports } from "./CompanyImports";
import routes, { getRelativeRoute } from "../../Apps/routes";
import { MyExports } from "./MyExports";
import { MyImports } from "./MyImports";

const toRelative = route => {
  return getRelativeRoute(routes.registry_new.index, route);
};

export default function RegistryRoutes() {
  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);

  return (
    <div className="dashboard">
      {!isMobile && <RegistryMenu />}
      <div className="tw-flex-grow">
        <Routes>
          <Route
            index
            element={<Navigate to={routes.registry_new.myImports} replace />}
          />

          <Route
            path={toRelative(routes.registry_new.myImports)}
            element={<MyImports />}
          />

          <Route
            path={toRelative(routes.registry_new.companyImports)}
            element={<CompanyImports />}
          />

          <Route
            path={toRelative(routes.registry_new.export)}
            element={<MyExports />}
          />

          <Route
            path={`${routes.registry_new.index}/*`}
            element={<Navigate to={routes.registry_new.myImports} replace />}
          />
        </Routes>
      </div>
    </div>
  );
}
