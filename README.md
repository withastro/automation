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

## Cloudflare Worker deploys

Two reusable workflows deploy a Cloudflare Worker to production on pushes and publish per-PR previews. They are split into two files on purpose, for security: the deploy workflow runs on the `pull_request` event (untrusted fork code, no token on forks) and never deploys PR code — it only deploys to production on `push` and hands PRs off as artifacts. The preview workflow runs on `workflow_run` in the trusted base-repo context, consuming only those artifacts (it never checks out or runs PR code) and interpolating only sanitized values (a numeric PR number and an `[a-z0-9-]` alias).

Using both gives you production deploys on your default branch plus a `https://<branch-alias>.<preview-domain>` preview commented on every PR.

### Prerequisites

- Add a `CLOUDFLARE_API_TOKEN` secret to the repository, with permission to deploy the Worker.
- The Worker must already exist in Cloudflare, and its preview domain must be configured (so `<alias>.<preview-domain>` resolves).
- A `wrangler.jsonc` in the repo whose `name` matches the deployed Worker.

### [`cloudflare-deploy.yml`](./.github/workflows/cloudflare-deploy.yml)

Call this from a workflow named `Deploy` (the name is referenced by the preview workflow) that triggers on `push` to your production branch(es) and on `pull_request`:

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
      # Optional build setup (omit all of these for a repo with no build step):
      node-version: "24.18.0"
      package-manager: pnpm
      install-command: pnpm install
      build-command: pnpm build
    secrets:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

#### Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `preview-domain` | yes | — | Base domain for preview URLs, e.g. `previews.docs.astro.build`. The branch alias is prepended. |
| `artifact-paths` | yes | — | Newline-delimited files/dirs to hand off to the preview workflow. Must include your wrangler config and everything `wrangler deploy` needs. |
| `deploy-command` | no | `deploy` | The `wrangler-action` command used for the production deploy. |
| `build-command` | no | `""` | Shell command that produces the build output. Skipped when empty. |
| `install-command` | no | `""` | Shell command to install dependencies (e.g. `pnpm install`). Skipped when empty. |
| `node-version` | no | `""` | If set, installs Node.js (and pnpm when `package-manager` is `pnpm`). |
| `package-manager` | no | `pnpm` | Package manager used for dependency caching: `pnpm` or `npm`. |
| `node-options` | no | `""` | Value for `NODE_OPTIONS` during the build (e.g. `--max_old_space_size=8192`). |
| `wrangler-version` | no | `""` | Pin the wrangler version used by `wrangler-action`. |

### [`cloudflare-deploy-preview.yml`](./.github/workflows/cloudflare-deploy-preview.yml)

Call this from a second workflow triggered by `workflow_run` on completion of your `Deploy` workflow:

```yml
name: Deploy Preview

on:
  workflow_run:
    workflows: ["Deploy"]
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

#### Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `worker-name` | yes | — | Worker to publish the preview against. Previews are always created on this Worker so they resolve on its preview domain. |
| `wrangler-version` | no | `""` | Pin the wrangler version used by `wrangler-action`. |

## Releases

To publish a new release of the reusable workflows:

1. Merge the desired changes to main.
1. Review the automatically generated draft release.
1. Update the release tag and title if needed.
1. Publish the release.
