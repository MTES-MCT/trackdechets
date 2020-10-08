import React from "react";
import { Form } from "generated/graphql/types";
import { ITEMS_PER_PAGE } from "../../constants";

type Props = {
  forms: Form[];
  fetchMore: (any) => Promise<any>;
};

export default function LoadMore({ forms, fetchMore }: Props) {
  if (forms.length < ITEMS_PER_PAGE) {
    return null;
    
  }

  return (
    <div style={{ textAlign: "center" }}>
      <button
        className="center btn btn--primary small"
        onClick={() =>
          fetchMore({
            variables: {
              skip: forms.length,
            },
            updateQuery: (prev, { fetchMoreResult }) => {
              if (!fetchMoreResult) return prev;
              return {
                ...prev,
                forms: [...prev.forms, ...fetchMoreResult.forms],
              };
            },
          })
        }
      >
        Charger plus de bordereaux
      </button>
    </div>
  );
}
