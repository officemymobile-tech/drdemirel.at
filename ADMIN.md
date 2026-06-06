# Admin-Panel für Dr. Demirel (drdemirel.at)

Gleiches System wie **hno-alici.at**: Passwort-Admin, **kein GitHub-Login** für die Ordination.

## URLs

| Bereich | Adresse |
|---------|---------|
| **Mitteilungen** | https://drdemirel.at/admin/ |
| **Texte** | https://drdemirel.at/admin/inhalte.html |
| **Bilder** | https://drdemirel.at/admin/bilder.html |

**Passwort:** vom Techniker (gleiches Schema wie HNO Alici, z. B. `SDyf1F4azlxPgonOBX`)

Nach dem Speichern: Website aktualisiert sich in **ca. 2–3 Minuten**.

---

## Tägliche Nutzung

1. https://drdemirel.at/admin/ öffnen
2. Bereich wählen (Mitteilungen / Texte / Bilder)
3. Passwort eingeben
4. **Veröffentlichen** oder **Hochladen**

Mitteilungen erscheinen unter **„Aktuelles“** in der Navigation.

---

## Einmalige Einrichtung (Techniker)

### 1. Cloudflare Worker deployen

```powershell
cd workers
npx wrangler login
.\setup.ps1 -GitHubPat "GITHUB_PAT_MIT_REPO_ZUGRIFF" -AdminPassword "IHR_PASSWORT"
```

- GitHub PAT: Classic `repo` oder fine-grained mit Schreibzugriff auf `officemymobile-tech/drdemirel.at`
- Das Skript setzt Secrets, deployt den Worker und trägt die URL in `admin/config.js` ein
- **Committen und pushen**

### 2. GitHub Pages

Repository → **Settings** → **Pages** → Source: **GitHub Actions** (bereits eingerichtet)

Push auf `main` → Build (`npm run build`) → Deploy

---

## Technik

| Datei | Inhalt |
|-------|--------|
| `content/announcements.json` | Mitteilungen |
| `content/settings.json` | Kontakt, Telefon, Sticky-Leiste |
| `content/de/home.json` | Startseitentexte & Bildpfade |
| `uploads/` | Hochgeladene Bilder |
| `workers/cms-api.js` | Cloudflare Worker → GitHub API |

---

## Hinweis: Altes Decap CMS

Die Datei `admin/config.yml` (Decap CMS mit GitHub-Login) wird **nicht mehr** für die Ordination genutzt. Sie kann als Referenz bleiben oder entfernt werden.
