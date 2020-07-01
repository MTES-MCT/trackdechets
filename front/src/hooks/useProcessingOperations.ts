import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
import { Query } from "../generated/graphql/types";

const GET_PROCESSING_OPERATIONS = gql`
  query GetProcessingOperations {
    processingOperations {
      code
      description
    }
  }
`;

export const useProcessingOperations = () => {
  const { data } = useQuery<Pick<Query, "processingOperations">>(
    GET_PROCESSING_OPERATIONS,
    {
      fetchPolicy: "cache-first",
    }
  );

  return data?.processingOperations ?? [];
};
