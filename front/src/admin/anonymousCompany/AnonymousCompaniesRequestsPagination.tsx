import Pagination from "@codegouvfr/react-dsfr/Pagination";
import React, { useEffect, useState } from "react";

export const AnonymousCompaniesRequestsPagination = ({
  totalCount,
  countPerPage,
  refetch
}) => {
  const [skip, setSkip] = useState(0);

  let count = 0;
  if (totalCount) {
    count = Math.ceil(totalCount / countPerPage);
  }

  let page = 1;
  if (totalCount) {
    page = skip ? skip / countPerPage + 1 : 1;
  }

  const gotoPage = page => {
    setSkip(page * countPerPage);
  };

  useEffect(() => {
    refetch({ skip });
  }, [skip, refetch]);

  return (
    <Pagination
      showFirstLast
      count={count}
      defaultPage={page}
      getPageLinkProps={pageNumber => ({
        onClick: event => {
          event.preventDefault();
          gotoPage(pageNumber - 1);
        },
        href: "#",
        key: `pagination-link-${pageNumber}`
      })}
      className={"fr-mt-1w"}
    />
  );
};
