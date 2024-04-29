const root = ReactDOM.createRoot(document.getElementById("graphiql"));
const fetcher = GraphiQL.createFetcher({
  url: window.location,
  headers: { "X-TD-Playground": "true" }
});
const explorerPlugin = GraphiQLPluginExplorer.explorerPlugin();
root.render(
  React.createElement(GraphiQL, {
    fetcher,
    defaultEditorToolsVisibility: true,
    plugins: [explorerPlugin]
  })
);
