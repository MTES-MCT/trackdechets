import { Navigate, Route, Routes } from "react-router-dom";
import React from "react";

import RegistryMenu from "./RegistryMenu";
import { useMedia } from "../../common/use-media";
import { MEDIA_QUERIES } from "../../common/config";
import { CompanyImports } from "./companyImport/CompanyImports";
import routes, { getRelativeRoute } from "../../Apps/routes";
import { MyExports } from "./MyExports";
import { MyImports } from "./MyImports";
import { MyLines } from "./myLines/MyLines";
import { FormContainer } from "./myLines/FormContainer";

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
            path={toRelative(routes.registry_new.lines)}
            element={<MyLines />}
          />

          <Route
            path={toRelative(routes.registry_new.form.ssd)}
            element={<FormContainer />}
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
