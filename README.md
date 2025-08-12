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
    uses: withastro/automation/.github/workflows/congratsbot.yml@main
    secrets:
      DISCORD_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK_CONGRATS }}
```

### Optional inputs

You can customize the emojis and co-author message templates to give your repository its own personality. You can set these under `with` in your job:

```yml
jobs:
  congrats:
    if: ${{ github.repository_owner == 'withastro' }}
    uses: withastro/automation/.github/workflows/congratsbot.yml@main
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
    uses: withastro/automation/.github/workflows/format.yml@main
    with:
      # Set command to this repository’s package script that runs Prettier
      command: 'format:ci'
    secrets: inherit
```
