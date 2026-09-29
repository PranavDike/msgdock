# MsgDock Project Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a fast, static GitHub Pages project site for MsgDock that accurately documents the current local runtime and gives developers a clear path from installation to API/SMTP usage.

**Architecture:** Keep the site independent from the React application and runtime. Use plain HTML/CSS with a tiny progressive-enhancement script, deployed directly from the repository through GitHub Pages Actions.

**Tech Stack:** HTML, CSS, vanilla JavaScript, GitHub Actions Pages deployment.

**Spec:** `UI-Design.md.txt` and the current `README.md`, `docs/architecture/README.md`, and `docs/api/README.md`.

## Global Constraints

- Preserve the dark developer-environment direction: near-black blue graphite, hairline borders, restrained lime status accent.
- Use Geist/Geist Mono where available, with system fallbacks.
- Do not invent metrics, customer logos, delivery claims, or cloud functionality.
- Document the current runtime accurately: HTTP `:6969`, SMTP `:1430`, optional SMS `:1431`.
- Keep the site static and independent from the runtime implementation.
- Do not introduce a new frontend dependency or build tool.
- Keep the site compatible with GitHub Pages.

---

### Task 1: Static site shell

**Files:**
- Create: `website/index.html`
- Create: `website/styles.css`
- Create: `website/script.js`

- [ ] Build the page shell and navigation.
- [ ] Add hero, current runtime summary, quick start, architecture, API, FAQ, and GitHub sections.
- [ ] Implement responsive layout and reduced-motion support.
- [ ] Add copy-to-clipboard enhancement without making content depend on JavaScript.

### Task 2: Pages deployment

**Files:**
- Create: `.github/workflows/pages.yml`

- [ ] Upload the static `website/` directory as a Pages artifact.
- [ ] Deploy it with the official GitHub Pages actions.
- [ ] Keep deployment independent from the application build.

### Task 3: Repository discoverability

**Files:**
- Modify: `README.md`

- [ ] Add a Project Site link.
- [ ] Keep the existing runtime quick start unchanged.
- [ ] Avoid duplicating the full website content in README.

### Task 4: Verification

- [ ] Validate HTML/CSS/JS structure and repository diff.
- [ ] Verify the Pages workflow syntax and referenced paths.
- [ ] Run the repository quality checks required by the current project where practical.
- [ ] Create a PR from `feature/project-site-pages` to `main`.
- [ ] After merge/Pages configuration, verify the published URL.
