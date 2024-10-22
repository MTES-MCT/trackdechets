import { useEffect } from "react";
import { matchRoutes, useLocation } from "react-router-dom";
import { titles } from "../../../routes";

const PageTitle = () => {
  const currentLocation = useLocation();

  const paths = Object.keys(titles)
    .filter(key => key !== "default")
    .map(title => {
      return {
        path: title
      };
    });

  const matches = matchRoutes(paths, currentLocation);
  const titlePath = matches ? matches[0].route.path : "default";
  const title = titles[titlePath] ? titles[titlePath] : titles.default;

  useEffect(() => {
    document.title = title;
  }, [title]);

  return null;
};

export default PageTitle;
