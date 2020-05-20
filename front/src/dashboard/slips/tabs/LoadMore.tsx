import React from "react";
import { Form } from "../../../generated/graphql/types";

type Props = {
  forms: Form[];
  fetchMore: (any) => Promise<any>;
};

export default function LoadMore({ forms, fetchMore }: Props) {
  if (forms.length < 50) {
    return null;
  }

  return (
    <div style={{ textAlign: "center" }}>
      <button
        className="center button small"
        onClick={() =>
          fetchMore({
            variables: {
              skip: forms.length,
            },
            updateQuery: (prev, { fetchMoreResult }) => {
              if (!fetchMoreResult) return prev;
              return Object.assign({}, prev, {
                feed: [...prev.forms, ...fetchMoreResult.forms],
              });
            },
          })
        }
      >
        Charger plus de bordereaux
      </button>
    </div>
  );
}
