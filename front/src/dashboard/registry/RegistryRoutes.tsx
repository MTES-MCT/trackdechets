import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";
import React, { useCallback } from "react";

import RegistryMenu from "./RegistryMenu";
import { useMedia } from "../../common/use-media";
import { MEDIA_QUERIES } from "../../common/config";
import { CompanyImports } from "./companyImport/CompanyImports";
import routes, { getRelativeRoute } from "../../Apps/routes";
import { MyExports } from "./MyExports";
import { MyImports } from "./MyImports";
import { MyLines } from "./myLines/MyLines";
import { FormContainer } from "./myLines/FormContainer";
import Exports from "../exports/Registry";
import "../../Apps/Dashboard/dashboard.scss";
import { RegistryImportType } from "@td/codegen-ui";

const toRelative = route => {
  return getRelativeRoute(routes.registry_new.index, route);
};

export default function RegistryRoutes() {
  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);
  const location = useLocation();
  const navigate = useNavigate();
  // Check if we're on the form route directly
  const isDirectFormAccess = location.pathname.includes(
    routes.registry_new.form.ssd
  );

  // If accessing form directly, create a synthetic background location for the lines page
  const backgroundLocation =
    location.state?.background ||
    (isDirectFormAccess
      ? {
          pathname: routes.registry_new.lines,
          search: "",
          hash: "",
          state: null
        }
      : null);

  const handleClose = useCallback(() => {
    if (location.state?.background) {
      navigate(-1);
    } else {
      navigate(routes.registry_new.lines);
    }
  }, [location, navigate]);

  return (
    <div className="dashboard">
      {!isMobile && <RegistryMenu />}
      <div className="dashboard-content">
        <Routes location={backgroundLocation ?? location}>
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
            path={toRelative(routes.registry_new.exhaustive)}
            element={<Exports />}
          />

          <Route
            path={`${routes.registry_new.index}/*`}
            element={<Navigate to={routes.registry_new.myImports} replace />}
          />
        </Routes>

        {backgroundLocation && (
          <Routes location={location}>
            <Route
              path={toRelative(routes.registry_new.form.ssd)}
              element={
                <FormContainer
                  onClose={handleClose}
                  type={RegistryImportType.Ssd}
                />
              }
            />
            <Route
              path={toRelative(routes.registry_new.form.incomingTexs)}
              element={
                <FormContainer
                  onClose={handleClose}
                  type={RegistryImportType.IncomingTexs}
                />
              }
            />
          </Routes>
        )}
      </div>
    </div>
  );
}
