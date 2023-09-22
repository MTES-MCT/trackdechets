const buildUpdateQueryFn = (name: string) => {
  const updateQueryFn = (prev, { fetchMoreResult }) => {
    if (fetchMoreResult == null) {
      return prev;
    }

    return {
      ...prev,
      [name]: {
        ...prev[name],
        ...fetchMoreResult[name],
        edges: prev[name].edges.concat(fetchMoreResult[name].edges)
      }
    };
  };
  return updateQueryFn;
};
export default buildUpdateQueryFn;
