function openDiscordServers() {
  let dialog = document.getElementById("discord-servers");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "discord-servers";
    dialog.className = "discord-servers-dialog";
    dialog.setAttribute("aria-labelledby", "discord-servers-title");
    dialog.innerHTML = `
      <div class="discord-servers-shell">
        <button type="button" class="discord-servers-close btn-close" aria-label="Close Discord servers">✕</button>
        <div class="info-heading">
          <h1 id="discord-servers-title">Discord Servers</h1>
          <p>Connect with the reader’s communities.</p>
        </div>
        <div class="discord-server-profiles">
          <h2>Support / Official Server</h2>
          <div class="discord-server-list">
          <article class="identity-card developer-profile discord-server-profile discord-server-workshop" aria-label="The Workshop">
            <div class="identity-art"></div>
            <div class="identity-copy">
              <span class="identity-icon"><img src="/assets/servers/workshop.png" alt="The Workshop server icon" /></span>
              <div class="developer-name"><h2>The Workshop</h2><span class="developer-role">Official Server</span></div>
              <nav class="developer-links" aria-label="The Workshop server">
                <a class="discord-server-link" data-server="workshop" target="_blank" rel="noopener noreferrer">Join server ↗</a>
              </nav>
              <p class="developer-bio">A united community of different web novel readers.</p>
              <span class="discord-recommended">Recommended to join</span>
            </div>
          </article>
          <article class="identity-card developer-profile discord-server-profile discord-server-meaowland" aria-label="Meaowland">
            <div class="identity-art"></div>
            <div class="identity-copy">
              <span class="identity-icon"><img src="/assets/servers/meaowland.png" alt="Meaowland server icon" /></span>
              <div class="developer-name"><h2>Meaowland</h2><span class="developer-role">Official Server</span></div>
              <nav class="developer-links" aria-label="Meaowland server">
                <a class="discord-server-link" data-server="meaowland" target="_blank" rel="noopener noreferrer">Join server ↗</a>
              </nav>
              <p class="developer-bio">Official server of MrMeaow46, one of the developers of the site.</p>
              <span class="discord-recommended">Recommended to join</span>
            </div>
          </article>
          </div>

        </div>
      </div>`;
    document.body.append(dialog);
    dialog
      .querySelector(".discord-servers-close")
      .addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });

    const config = window.READER_CONFIG || {};
    const urls = {
      workshop: config.discordUrl,
      meaowland: "https://discord.gg/a3cQ8atwQH",
    };
    dialog.querySelectorAll(".discord-server-link").forEach((card) => {
      const url = urls[card.dataset.server];
      if (typeof url === "string" && /^https:\/\//i.test(url)) {
        card.href = url;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
        card.textContent = "Join server ↗";
      } else {
        card.classList.add("is-unavailable");
        card.addEventListener("click", (event) => event.preventDefault());
      }
    });
  }
  dialog.showModal();
}

document.querySelectorAll('[data-community="discordUrl"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openDiscordServers();
  });
});

document
  .querySelectorAll('[data-community]:not([data-community="discordUrl"])')
  .forEach((link) => {
    const url = (window.READER_CONFIG || {})[link.dataset.community];
    if (typeof url === "string" && /^https:\/\//i.test(url)) {
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.title = link.getAttribute("aria-label");
    } else {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        let notice = document.getElementById("community-notice");
        if (!notice) {
          notice = document.createElement("div");
          notice.id = "community-notice";
          notice.setAttribute("role", "status");
          document.body.append(notice);
        }
        notice.textContent =
          link.getAttribute("aria-label") + " link coming soon.";
        notice.hidden = false;
        clearTimeout(notice.hideTimer);
        notice.hideTimer = setTimeout(() => (notice.hidden = true), 3000);
      });
    }
  });
