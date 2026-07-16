# Astro Automation Tools

This repository contains GitHub Action workflows that are shared across repos in the `withastro` GitHub org.

> **Warning**  
> These workflows are not designed for use _outside_ of the `withastro` GitHub org.

## [`congratsbot.yml`](./.github/workflows/congratsbot.yml)

This workflow posts a celebratory message in a Discord channel of your choice for each commit. For example:

> 🎊 **Merged!** Houston (Bot): [`[ci] release (#232)`](#)  
> _Featuring contributions by github-actions[bot]! 🌟_

### Prerequisites

[Create a new Discord webhook](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks) and add the URL to your repository secrets as `DISCORD_WEBHOOK_CONGRATS`.

### Usage

```yml
name: Congratsbot

on:
  push:
    branches: [main]

jobs:
  congrats:
    if: ${{ github.repository_owner == 'withastro' }}
    uses: withastro/automation/.github/workflows/congratsbot.yml@<commit-sha> # vX.Y.Z
    secrets:
      DISCORD_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK_CONGRATS }}
```

### Optional inputs

You can customize the emojis and co-author message templates to give your repository its own personality. You can set these under `with` in your job:

```yml
jobs:
  congrats:
    if: ${{ github.repository_owner == 'withastro' }}
    uses: withastro/automation/.github/workflows/congratsbot.yml@<commit-sha> # vX.Y.Z
    with:
      EMOJIS: 🤖,👻,😱
      COAUTHOR_TEMPLATES: >
        [
          "Woahhh, <names> really gave us a fright! 🎃",
          "We weren’t sure what we were doing until <names> showed up. 🤝"
        ]
    secrets:
      DISCORD_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK_CONGRATS }}
```

#### `EMOJIS`

**default:** `🎉,🎊,🧑‍🚀,🥳,🙌,🚀`

A comma-delimited set of emojis.
Each congrats bot message will pick one at random for the start of the message.

#### `COAUTHOR_TEMPLATES`

**default:** see [`congratsbot.yml`](./.github/workflows/congratsbot.yml#L31)

A JSON array of co-author recognition templates.
Each template should contain the `<names>` placeholder to be replaced by the names of one or more co-authors for this commit.
(Ignored for commits without any co-authors.)

When writing congrats messages, remember that `<names>` could be one, two, or more names. So, create messages that can work for both a single co-author and for several people, for example, "This PR was made even better by `<names>`!"

## [`format.yml`](./.github/workflows/format.yml)

This workflow runs a repository’s code formatting tooling (e.g. Prettier) and commits any resulting changes directly.

### Usage

```yml
name: Format

on:
  workflow_dispatch:
  push:
    branches:
      - main

jobs:
  prettier:
    if: github.repository_owner == 'withastro'
    uses: withastro/automation/.github/workflows/format.yml@<commit-sha> # vX.Y.Z
    with:
      # Set command to this repository’s package script that runs Prettier
      command: 'format:ci'
    secrets: inherit
```

## [`cloudflare-deploy.yml`](./.github/workflows/cloudflare-deploy.yml)

This workflow deploys a Cloudflare Worker to production on pushes, and on pull requests uploads the build output and PR metadata for [`cloudflare-deploy-preview.yml`](#cloudflare-deploy-previewyml) to publish a preview. It requires a `CLOUDFLARE_API_TOKEN` secret and a `wrangler.jsonc` whose `name` matches the Worker.

### Usage

```yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:

jobs:
  deploy:
    if: github.repository_owner == 'withastro'
    permissions:
      contents: read
    uses: withastro/automation/.github/workflows/cloudflare-deploy.yml@<commit-sha> # vX.Y.Z
    with:
      preview-domain: previews.my-worker.astro.build
      artifact-paths: |
        dist/
        worker.js
        wrangler.jsonc
      # Optional build setup, omit for a repo with no build step:
      node-version: '24.18.0'
      install-command: 'pnpm install'
      build-command: 'pnpm build'
    secrets:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

See the [workflow inputs](./.github/workflows/cloudflare-deploy.yml) for the full list of options.

## [`cloudflare-deploy-preview.yml`](./.github/workflows/cloudflare-deploy-preview.yml)

This workflow publishes a Cloudflare Worker preview for a pull request and comments the preview URL. It runs from the trusted base-repo context (via `workflow_run`) so it can deploy fork PRs safely without exposing the token. Use it alongside [`cloudflare-deploy.yml`](#cloudflare-deployyml).

### Usage

```yml
name: Deploy Preview

on:
  workflow_run:
    workflows: ['Deploy']
    types: [completed]

jobs:
  deploy-preview:
    if: github.repository_owner == 'withastro'
    permissions:
      pull-requests: write
    uses: withastro/automation/.github/workflows/cloudflare-deploy-preview.yml@<commit-sha> # vX.Y.Z
    with:
      worker-name: my-worker
    secrets:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### How fork previews stay safe

GitHub doesn't give fork pull requests access to secrets, so the two workflows split the work:

- `Deploy` runs on the PR **without the token**. It only builds and uploads the result as an artifact — it never deploys.
- `Deploy Preview` then runs on `workflow_run`, using the workflow file from your default branch **with the token**. It only downloads that artifact and publishes the preview — it never runs the fork's code.

So the untrusted side never sees the token, and the trusted side never runs untrusted code.

## Releases

To publish a new release of the reusable workflows:

1. Merge the desired changes to main.
1. Review the automatically generated draft release.
1. Update the release tag and title if needed.
1. Publish the release.
