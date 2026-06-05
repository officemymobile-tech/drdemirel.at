# Admin-Panel für Dr. Demirel

Die Website wird über **Decap CMS** bearbeitet – ohne Programmierkenntnisse, direkt im Browser.

**Admin-URL (nach Einrichtung):** https://drdemirel.at/admin

---

## Was Sie bearbeiten können

- **Globale Einstellungen:** Telefon, E-Mail, Adresse, Links
- **Startseite (Deutsch):** Texte, Bilder, Vorteile, Publikationen, Videos
- **Bilder:** Beim Bearbeiten von Bildfeldern hochladen (landen im Ordner `uploads/`)

Änderungen werden als Entwurf gespeichert und nach Freigabe („Publish“) automatisch auf der Website sichtbar (ca. 1–2 Minuten).

---

## Einmalige Einrichtung (Techniker / Büro)

### 1. GitHub-Zugang

Dr. Demirel (oder eine vertrauenswürdige Person) braucht ein **GitHub-Konto** mit **Schreibrecht** auf das Repository:

`https://github.com/officemymobile-tech/drdemirel.at`

→ Repository → **Settings** → **Collaborators** → Person einladen.

### 2. GitHub OAuth App (für Login unter drdemirel.at)

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. Ausfüllen:
   - **Application name:** `Decap CMS drdemirel.at`
   - **Homepage URL:** `https://drdemirel.at`
   - **Authorization callback URL:** `https://IHR-OAUTH-PROXY.vercel.app/callback`
3. **Client ID** und **Client Secret** notieren

### 3. OAuth-Proxy deployen (kostenlos)

Decap CMS auf GitHub Pages braucht einen kleinen OAuth-Proxy. Empfohlen: [decapbridge](https://decapbridge.com) oder selbst hosten, z. B.:

**Option A – decapbridge (einfach):** Anleitung auf https://decapbridge.com/docs

**Option B – Vercel (selbst):**

1. Repository forken/deployen: https://github.com/sterlingwes/decap-proxy  
   (oder vergleichbarer `netlify-cms-github-oauth-provider`)
2. Auf Vercel deployen mit Umgebungsvariablen:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
3. Callback-URL in der OAuth App anpassen

### 4. config.yml aktivieren

In `admin/config.yml` die auskommentierten Zeilen eintragen:

```yaml
backend:
  name: github
  repo: officemymobile-tech/drdemirel.at
  branch: main
  base_url: https://IHR-OAUTH-PROXY.vercel.app
  auth_endpoint: auth
```

Änderung committen und pushen.

### 5. GitHub Pages auf Actions umstellen

Repository → **Settings** → **Pages** → **Source:** **GitHub Actions**

---

## Tägliche Nutzung (Dr. Demirel)

1. Browser öffnen: **https://drdemirel.at/admin**
2. Mit **GitHub** anmelden
3. Bereich wählen (z. B. „Startseite (Deutsch)“)
4. Texte/Bilder ändern → **Save**
5. Oben **Workflow:** Entwurf → **Publish** (oder „Ready“ / „In Review“ je nach Einstellung)

---

## Lokal testen (optional)

```bash
npm install
npm run build
npm run dev
```

Admin lokal mit Backend-Mock:

```bash
npx decap-server
```

In `admin/config.yml` temporär `local_backend: true` setzen, dann http://localhost:8765/admin öffnen.

---

## Hilfe

- Decap CMS Dokumentation: https://decapcms.org/docs/
- Bei Problemen: Techniker kontaktieren oder Issue im GitHub-Repository erstellen
