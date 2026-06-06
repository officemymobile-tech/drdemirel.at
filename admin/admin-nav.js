(function () {
  const path = window.location.pathname;
  const links = [
    { href: "/admin/", label: "Mitteilungen", match: /\/admin\/?$/ },
    { href: "/admin/inhalte.html", label: "Texte", match: /inhalte/ },
    { href: "/admin/bilder.html", label: "Bilder", match: /bilder/ },
    { href: "/admin/anleitung.html", label: "Anleitung", match: /anleitung/ },
  ];

  const nav = document.createElement("nav");
  nav.className = "admin-nav";
  nav.setAttribute("aria-label", "Admin-Bereiche");

  for (const link of links) {
    const a = document.createElement("a");
    a.href = link.href;
    a.textContent = link.label;
    if (link.match.test(path)) a.className = "active";
    nav.appendChild(a);
  }

  const wrap = document.querySelector(".wrap");
  if (wrap) wrap.insertBefore(nav, wrap.firstChild);
})();
