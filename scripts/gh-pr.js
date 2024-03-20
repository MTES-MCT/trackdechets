module.exports = async ({ github, context, core }) => {
  const prs = await github.rest.pulls.list({
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: "open"
  });

  const prsReadyToReview = prs.data.filter(pr =>
    pr.labels.some(label => label.name === "ready for review")
  );

  const output = prsReadyToReview
  .map(pr => `- ${pr.title} | [PR ${pr.number}](${pr.html_url})`)
  .join("\n");
  console.log(output)

  core.setOutput('prs', output);
};
