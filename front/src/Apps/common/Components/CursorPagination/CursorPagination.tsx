import React from "react";
import cn from "classnames";

const Link = ({
  children,
  ...rest
}: {
  children: React.ReactNode;
  [key: string]: any;
}) => {
  return rest.disabled === true ? (
    <a {...rest}>{children}</a>
  ) : (
    <button type="button" {...rest}>
      {children}
    </button>
  );
};

const CursorPagination = ({
  id,
  className,
  onFirstClick,
  onLastClick,
  onNextClick,
  onPreviousClick,
  hasNextPage,
  hasPreviousPage,
  contentLoading
}: {
  id?: string;
  className?: string;
  onFirstClick: () => void;
  onLastClick: () => void;
  onNextClick: () => void;
  onPreviousClick: () => void;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  contentLoading: boolean;
}) => {
  return (
    <nav id={id} role="navigation" className={cn("fr-pagination", className)}>
      <ul className={"fr-pagination__list"}>
        <li>
          <Link
            className="fr-link fr-pagination__link fr-pagination__link--first"
            onClick={() => {
              if (hasPreviousPage && !contentLoading) {
                onFirstClick();
              }
            }}
            disabled={!hasPreviousPage || contentLoading}
            title="Première page"
          >
            Première page
          </Link>
        </li>
        <li>
          <Link
            className="fr-link fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label"
            onClick={() => {
              if (hasPreviousPage && !contentLoading) {
                onPreviousClick();
              }
            }}
            disabled={!hasPreviousPage || contentLoading}
            title="Page précédente"
          >
            Page précédente
          </Link>
        </li>
        <li>
          <Link
            className="fr-link fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label"
            onClick={() => {
              if (hasNextPage && !contentLoading) {
                onNextClick();
              }
            }}
            disabled={!hasNextPage || contentLoading}
            title="Page suivante"
          >
            Page suivante
          </Link>
        </li>
        <li>
          <Link
            className="fr-link fr-pagination__link fr-pagination__link--last"
            onClick={() => {
              if (hasNextPage && !contentLoading) {
                onLastClick();
              }
            }}
            disabled={!hasNextPage || contentLoading}
            title="Dernière page"
          >
            Dernière page
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default CursorPagination;
