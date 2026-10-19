# MMURRYTHM — Personal Website

The source for [mmurrythm.github.io](https://mmurrythm.github.io/), a static personal website for Muhammed Maruf-Ur-Rashid (Rythm), a Computer Science & Engineering undergraduate at BUET.

The visual system uses a dark, circuit-inspired backdrop, cyan-to-violet iridescent accents, the site's logo, and restrained ambient motion. The site is intentionally built with plain HTML, CSS, and JavaScript so it can be maintained page by page without a build toolchain.

## Site map

- **Home** — `index.html`: introduction and selected links.
- **Projects** — `projects.html`: project and experiment overview.
- **Academics** — `academics.html`: education and admission-related academic information.
- **Blogs** — `blogs.html`: writing and notes; it clearly indicates that entries are pending rather than presenting unpublished articles as existing posts.
- **More** — `more.html`: research identifiers, profiles, social links, and useful destinations.

The shared navigation links these five pages. Each page currently keeps its styles and small navigation/year script inline to make independent revisions straightforward.

## Repository layout

```text
.
├── index.html
├── projects.html
├── academics.html
├── blogs.html
├── more.html
├── README.md
├── robots.txt
├── sitemap.xml
└── assests/
    └── logo.png
```

**Note:** `assests/` is the existing repository directory name (including its spelling). The pages reference `assests/logo.png`; do not rename the folder unless every reference is updated at the same time.

## Local preview

No framework, package manager, or build step is required. Open `index.html` in a browser, or serve the repository root with any static HTTP server to test relative links and page navigation.

## GitHub Pages deployment

This repository's default branch is `docs`. Check **Settings → Pages** to confirm that GitHub Pages publishes from the intended branch and folder. Once a change is committed to that publishing source and the deployment finishes, visit [https://mmurrythm.github.io/](https://mmurrythm.github.io/).

The sitemap is at [`sitemap.xml`](sitemap.xml) and lists the five public pages. `robots.txt` allows normal crawling and points crawlers to `https://mmurrythm.github.io/sitemap.xml`.

## Design and accessibility notes

- The pages provide a skip-to-content link, keyboard-visible focus styles, responsive layouts, and a collapsible mobile navigation menu.
- Motion is reduced when the visitor enables the operating system's `prefers-reduced-motion` setting.
- Keep the dark circuit / cyan-violet iridescent identity and the existing logo consistent when revising individual pages.
- Keep content factual. Do not describe planned posts, projects, awards, or research as published accomplishments until they exist and can be verified.
- Update the sitemap when adding or removing public pages. Update `robots.txt` only if crawling policy or the sitemap URL changes.

## Public links

- GitHub profile: [github.com/mmurrythm](https://github.com/mmurrythm)
- Featured project repository: [Seibishi](https://github.com/mmurrythm/seibishi)
- ResearchGate: [Muhammed Maruf-Ur-Rashid](https://www.researchgate.net/profile/Muhammed-Maruf-Ur-Rashid)
- ORCID: [0009-0000-2438-780X](https://orcid.org/0009-0000-2438-780X)
- Facebook: [mmurrythm](https://facebook.com/mmurrythm)
- Instagram: [mmurrythm](https://instagram.com/mmurrythm)
