# GitHub Actions workflows (move into .github/workflows/)

These two files come unchanged from the `@n8n/node-cli` 0.50.4 scaffold:

- `publish.yml`: publishes to npm with a provenance statement when a version tag (for example `0.1.0`) is pushed. n8n requires this for verified community nodes from May 1, 2026.
- `ci.yml`: runs lint and build on pushes to `main` and on pull requests.

They live here instead of `.github/workflows/` only because the token used to push this repository does not have GitHub's `workflow` scope. To enable them, a maintainer with that scope runs:

```sh
mkdir -p .github/workflows
git mv publish-workflow/publish.yml publish-workflow/ci.yml .github/workflows/
git commit -m "ci: enable publish and CI workflows"
git push
```

Then set up npm Trusted Publishing for the package (npmjs.com > package settings > Publish access > Trusted Publishers > GitHub Actions; repository `weioai/n8n-nodes-weio`, workflow `publish.yml`), or store an npm granular token as the `NPM_TOKEN` Actions secret.
