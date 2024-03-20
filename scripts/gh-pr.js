module.exports = async ({ github, context, core }) => {
  const prs = await github.rest.pulls.list({
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: "open"
  });
  console.log(prs.data)
  const prsReadyToReview = prs.data.filter(pr =>
    pr.labels.some(label => label.name === "ready for review")
  );

  console.log(prsReadyToReview)
  
  const output = prsReadyToReview
  .map(pr => `- ${pr.title} (${pr.html_url})`)
  .join("\n");
  console.log(output)

  core.setOutput('prs', output);
};
