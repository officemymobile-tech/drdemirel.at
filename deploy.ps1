# Nach "gh auth login" ausführen: .\deploy.ps1
$ErrorActionPreference = "Stop"
$repo = "drdemirel-website"

gh auth status | Out-Null
$user = gh api user -q .login
Write-Host "GitHub-Benutzer: $user"

if (-not (gh repo view "$user/$repo" 2>$null)) {
  gh repo create $repo --public --source . --remote origin --push
} else {
  git push -u origin master 2>$null
  if ($LASTEXITCODE -ne 0) { git push -u origin main }
}

gh api -X POST "repos/$user/$repo/pages" -f build_type=legacy -f source[branch]=master -f source[path]=/ 2>$null
gh api -X PUT "repos/$user/$repo/pages" -f build_type=legacy -f source[branch]=master -f source[path]=/ 2>$null

Write-Host ""
Write-Host "GitHub Pages: https://$user.github.io/$repo/"
Write-Host "Custom domain in Repo-Settings setzen: drdemirel.at"
Write-Host "DNS www-CNAME auf: $user.github.io"
