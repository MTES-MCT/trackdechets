import React from "react";
import { generatePath, useLocation } from "react-router-dom";
import DropdownMenu from "../../../Apps/common/Components/DropdownMenu/DropdownMenu";
import routes from "../../../Apps/routes";

export function MyLines() {
  const location = useLocation();

  return (
    <div className="tw-px-6 tw-py-4">
      <DropdownMenu
        links={[
          {
            title: "SSD",
            route: generatePath(routes.registry_new.form.ssd),
            state: { background: location }
          }
        ]}
        isDisabled={false}
        menuTitle={"Créer une déclaration"}
        primary
      />
    </div>
  );
}
