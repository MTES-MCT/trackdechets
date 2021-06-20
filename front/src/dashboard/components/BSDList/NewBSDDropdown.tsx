import { IconChevronDown } from "common/components/Icons";
import routes from "common/routes";
import React, { useEffect, useState } from "react";
import { generatePath, Link } from "react-router-dom";

type Props = { siret: string };

const links = [
  { title: "Bordereau de suivi DD", route: routes.dashboard.bsdds.create },
  {
    title: "Bordereau de suivi DASRI",
    route: routes.dashboard.bsdasris.create,
  },
  { title: "Bordereau de suivi VHU", route: routes.dashboard.bsvhus.create },
];

export function NewBSDDropdown({ siret }: Props) {
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!showDropdown) return;

    const hideDropdown = () => setShowDropdown(false);
    document.addEventListener("click", hideDropdown);

    return () => document.removeEventListener("click", hideDropdown);
  }, [showDropdown]);

  return (
    <div className="tw-relative tw-inline-block">
      <button
        className="btn btn--primary"
        onClick={() => setShowDropdown(true)}
        type="button"
      >
        Créer un bordereau <IconChevronDown className="tw-pl-2" />
      </button>

      {showDropdown && (
        <div className="tw-absolute tw-mt-2 tw-w-56 tw-rounded-md tw-shadow-lg tw-bg-white tw-z-50">
          {links.map(link => (
            <Link
              className="tw-block tw-px-4 tw-py-2 tw-text-sm hover:tw-bg-gray-300"
              to={generatePath(link.route, { siret })}
              key={link.title}
            >
              {link.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
