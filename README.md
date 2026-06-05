# drdemirel.at – Praxis-Website

Statische Website für **Dr. Demirel Kardiologie**, gehostet auf **GitHub Pages**.

Inhalte werden als JSON gepflegt und mit einem Build-Script in `index.html` übernommen. Bearbeitung über **Decap CMS** unter `/admin` (siehe [ADMIN.md](./ADMIN.md)).

## Entwicklung

```bash
npm install
npm run build    # content/*.json → index.html
npm run dev      # http://localhost:8765
```

## Deployment

Push auf `main` startet den GitHub-Actions-Workflow (`.github/workflows/deploy.yml`).

Repository → **Settings** → **Pages** → Source: **GitHub Actions**

## DNS (Helloly)

| Name | Typ | Wert |
|------|-----|------|
| `@` | A (4×) | `185.199.108–111.153` |
| `www` | CNAME | `officemymobile-tech.github.io` |

E-Mail-Einträge (MX, mail.*, SPF, DKIM) nicht ändern.
