import React from "react";
import cn from "classnames";

const Link = ({
  children,
  ...rest
}: {
  children: React.ReactNode;
  [key: string]: any;
}) => {
  return rest["aria-disabled"] === true ? (
    <a {...rest}>{children}</a>
  ) : (
    <button {...rest}>{children}</button>
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
            onClick={event => {
              event.preventDefault();
              if (!contentLoading) {
                onFirstClick();
              }
            }}
            aria-disabled={!hasPreviousPage || contentLoading}
            title="Première page"
          >
            Première page
          </Link>
        </li>
        <li>
          <Link
            className="fr-link fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label"
            onClick={event => {
              event.preventDefault();
              if (!contentLoading) {
                onPreviousClick();
              }
            }}
            aria-disabled={!hasPreviousPage || contentLoading}
            title="Page précédente"
          >
            Page précédente
          </Link>
        </li>
        {/* <li>
          <Link
            className="fr-link fr-pagination__link"
            title={`Page ${currentPage}`}
            aria-current="page"
          >
            {currentPage}
          </Link>
        </li> */}
        <li>
          <Link
            className="fr-link fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label"
            onClick={event => {
              event.preventDefault();
              if (!contentLoading) {
                onNextClick();
              }
            }}
            aria-disabled={!hasNextPage || contentLoading}
            title="Page suivante"
          >
            Page suivante
          </Link>
        </li>
        <li>
          <Link
            className="fr-link fr-pagination__link fr-pagination__link--last"
            onClick={event => {
              event.preventDefault();
              if (!contentLoading) {
                onLastClick();
              }
            }}
            aria-disabled={!hasNextPage || contentLoading}
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
