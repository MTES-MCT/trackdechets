const root = ReactDOM.createRoot(document.getElementById("graphiql"));
const fetcher = GraphiQL.createFetcher({
  url: window.location,
  headers: { "X-Example-Header": "foo" }
});
const explorerPlugin = GraphiQLPluginExplorer.explorerPlugin();
root.render(
  React.createElement(GraphiQL, {
    fetcher,
    defaultEditorToolsVisibility: true,
    plugins: [explorerPlugin]
  })
);
