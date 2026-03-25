function memberLink(label, href, isMail) {
  if (!href) {
    return `<a class="member-btn member-btn-disabled" href="#" aria-disabled="true">${label} (TBD)</a>`;
  }

  if (isMail) {
    return `<a class="member-btn" href="mailto:${href}">${label}</a>`;
  }

  return `<a class="member-btn" href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function parseDateOnly(dateText) {
  return new Date(`${dateText}T00:00:00`);
}

function normalizeLooseDate(dateText, isEndDate = false) {
  if (!dateText) return null;
  const cleaned = dateText.trim().replace(/\.$/, "");
  const parts = cleaned.split(/[./-]/).filter(Boolean);
  if (parts.length < 2) return null;

  const year = parts[0];
  const month = parts[1].padStart(2, "0");
  const day = parts[2] ? parts[2].padStart(2, "0") : isEndDate ? "31" : "01";
  const parsed = new Date(`${year}-${month}-${day}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    if (!parts[2] && isEndDate) {
      const monthStart = new Date(`${year}-${month}-01T00:00:00`);
      if (Number.isNaN(monthStart.getTime())) return null;
      return new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    }
    return null;
  }

  if (!parts[2] && isEndDate) {
    return new Date(parsed.getFullYear(), parsed.getMonth() + 1, 0);
  }

  return parsed;
}

function getNewsBaseDate(newsItem) {
  return newsItem.publicationDate || newsItem.startDate || null;
}

function isWithinDays(baseDateText, days, futureDays = 0) {
  if (!baseDateText) return false;
  const created = parseDateOnly(baseDateText);
  const now = new Date();
  const ms = now.getTime() - created.getTime();
  return ms >= futureDays * -24 * 60 * 60 * 1000 && ms <= days * 24 * 60 * 60 * 1000;
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function extractQuotedTitle(citation) {
  const matched = citation.match(/"([^"]+)"/);
  return matched ? matched[1] : citation;
}

function extractConferenceName(citation) {
  const afterTitle = citation.split('"').slice(2).join('"').trim();
  const withoutDate = afterTitle.replace(/,\s*[A-Za-z]+,?\s+\d{1,2},?\s+\d{4}\s*\.?$/i, "").trim();
  return withoutDate || "Conference presentation";
}

function parsePublicationDate(citation) {
  const matched = citation.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December),?\s+(\d{1,2}),?\s+((?:19|20)\d{2})\b/i
  );
  if (!matched) return null;

  const parsed = new Date(`${matched[1]} ${matched[2]}, ${matched[3]}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getAutoConferenceNews() {
  if (typeof publicationData === "undefined" || !publicationData.conference) return [];

  const items = Object.values(publicationData.conference)
    .flat()
    .map((item) => {
      const parsedDate = parsePublicationDate(item.citation);
      if (!parsedDate) return null;

      return {
        baseDate: formatDateOnly(parsedDate),
        title: extractQuotedTitle(item.citation),
        description: extractConferenceName(item.citation),
        citation: item.citation
      };
    })
    .filter(Boolean)
    .filter((item) => isWithinDays(item.baseDate, 365, 120))
    .sort((a, b) => new Date(b.baseDate) - new Date(a.baseDate));

  const uniqueByCitation = new Map();
  items.forEach((item) => {
    uniqueByCitation.set(item.citation, item);
  });

  return Array.from(uniqueByCitation.values()).slice(0, 6);
}

function extractProjectEndDate(projectText) {
  const matchedRange = projectText.match(/~\s*((?:19|20)\d{2}[./-]\d{2}(?:[./-]\d{2})?)/);
  if (!matchedRange) return null;
  return normalizeLooseDate(matchedRange[1], true);
}

function classifyProjects(projects) {
  const now = new Date();
  const grouped = { current: [], past: [] };

  projects.forEach((project) => {
    const endDate = extractProjectEndDate(project);
    if (endDate && endDate < now) {
      grouped.past.push(project);
      return;
    }
    grouped.current.push(project);
  });

  return grouped;
}

function countPublicationItems(type) {
  if (typeof publicationData === "undefined" || !publicationData[type]) return 0;
  return Object.values(publicationData[type]).reduce((sum, items) => sum + items.length, 0);
}

function renderHeroStats() {
  const summary = document.getElementById("hero-summary");
  const statsRoot = document.getElementById("hero-stats");
  if (!summary || !statsRoot) return;

  const allProjects = [...(siteData.projects.current || []), ...(siteData.projects.past || [])];
  const groupedProjects = classifyProjects(allProjects);
  const journalCount = countPublicationItems("journal");
  const conferenceCount = countPublicationItems("conference");
  const patentCount = countPublicationItems("patent");
  const currentProjectCount = groupedProjects.current.length;
  const pastProjectCount = groupedProjects.past.length;

  summary.textContent =
    `We currently maintain ${journalCount} journal papers, ${conferenceCount} conference papers, ${patentCount} patents, ${currentProjectCount} ongoing projects, and ${pastProjectCount} completed projects.`;

  const stats = [
    { label: "Journals", value: `${journalCount}` },
    { label: "Conferences", value: `${conferenceCount}` },
    { label: "Patents", value: `${patentCount}` },
    { label: "Current Projects", value: `${currentProjectCount}` },
    { label: "Past Projects", value: `${pastProjectCount}` }
  ];

  statsRoot.innerHTML = stats
    .map(
      (item) => `
        <article class="hero-stat">
          <strong>${item.value}</strong>
          <span>${item.label}</span>
        </article>
      `
    )
    .join("");
}

function renderNews() {
  const root = document.getElementById("news-root");
  if (!root) return;

  const NEWS_ACTIVE_DAYS = 365;
  const UPCOMING_NEWS_DAYS = 120;
  const manualNews = (siteData.news || [])
    .map((n) => ({ ...n, baseDate: getNewsBaseDate(n) }))
    .filter((n) => isWithinDays(n.baseDate, NEWS_ACTIVE_DAYS, UPCOMING_NEWS_DAYS));
  const autoConferenceNews = getAutoConferenceNews();
  const activeNews = [...manualNews, ...autoConferenceNews]
    .sort((a, b) => new Date(b.baseDate) - new Date(a.baseDate))
    .slice(0, 8);

  root.innerHTML = `
    <section class="panel" id="news">
      <div class="panel-head">
        <h2>News</h2>
        <p>Recent updates and upcoming presentations are shown automatically.</p>
      </div>
      <div class="news-grid">
        ${
          activeNews.length
            ? activeNews
                .map(
                  (n) => `
              <article class="card news-card">
                <p class="news-date">${n.baseDate}</p>
                <h3>${n.title}</h3>
                <p class="news-text">${n.description}</p>
              </article>
            `
                )
                .join("")
            : '<article class="card news-card"><p class="news-text">There are no recent news items to display at the moment.</p></article>'
        }
      </div>
    </section>
  `;
}

function renderResearch() {
  const root = document.getElementById("research-root");
  if (!root) return;

  root.innerHTML = `
    <section class="panel" id="research">
      <div class="panel-head">
        <h2>Research</h2>
        <p>${siteData.labIntro || ""}</p>
      </div>
      <div class="research-grid">
        ${(siteData.research || [])
          .map(
            (r) => `
              <article class="card research-card">
                <button class="research-image-btn" type="button" aria-label="Expand ${r.title} image">
                  <img class="research-image" src="${r.image}" alt="${r.imageAlt || r.title}" />
                </button>
                <h3>${r.title}</h3>
                <p>${r.summary}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function setupResearchLightbox() {
  const root = document.getElementById("research-root");
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const closeButton = document.getElementById("lightbox-close");
  if (!root || !lightbox || !lightboxImage || !closeButton) return;

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.removeAttribute("src");
    lightboxImage.alt = "";
    document.body.classList.remove("lightbox-open");
  }

  root.addEventListener("click", (event) => {
    const trigger = event.target.closest(".research-image-btn");
    if (!trigger) return;

    const image = trigger.querySelector(".research-image");
    if (!image) return;

    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
  });

  closeButton.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });
}

function renderMembers() {
  const p = siteData.professor;
  const root = document.getElementById("members-root");
  if (!root) return;

  root.innerHTML = `
    <section class="panel" id="members">
      <h2>Members</h2>
      <div class="card professor-card">
        <img class="prof-photo" src="${p.photo}" alt="${p.photoAlt || p.name}" />
        <h3>${p.name}</h3>
        <p class="prof-role">${p.role}</p>
        <p class="member-email">${p.email}</p>
        <div class="member-actions">
          ${memberLink("Google Scholar", p.scholar, false)}
          ${memberLink("Email", p.email, true)}
        </div>
        <p class="prof-affiliation">${p.affiliation}</p>
        ${
          p.coordinates?.length
            ? `
        <div class="prof-coordinates">
          <h4>Coordinates</h4>
          <p>${p.coordinates.join("<br />")}</p>
        </div>
        `
            : ""
        }
        <h4>Educations</h4>
        <ul class="edu-list">
          ${p.educations.map((e) => `<li>${e}</li>`).join("")}
        </ul>
      </div>
      <div class="member-grid">
        ${siteData.members
          .map(
            (m) => `
              <article class="card">
                <img class="member-photo" src="${m.photo}" alt="${m.alt}" />
                <h3>${m.nameHtml}</h3>
                <p>${m.role}</p>
                <p class="member-email">${m.email || "Email not available"}</p>
                <div class="member-actions">
                  ${memberLink("Google Scholar", m.scholar, false)}
                  ${memberLink("Email", m.email, true)}
                  ${memberLink("Homepage", m.homepage, false)}
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function alumniCards(list) {
  return list
    .map(
      (a) => `
        <article class="card alumni-card">
          <h3>${a.name}</h3>
          <p class="alumni-meta">${a.meta}</p>
          <p class="alumni-topic">${a.topic}</p>
        </article>
      `
    )
    .join("");
}

function renderAlumni() {
  const root = document.getElementById("alumni-root");
  if (!root) return;

  root.innerHTML = `
    <section class="panel" id="alumni">
      <div class="panel-head">
        <h2>Graduated Alumni</h2>
        <p>Ph.D Students</p>
      </div>
      <div class="alumni-grid">
        ${alumniCards(siteData.alumni.phd)}
      </div>
      <div class="alumni-subhead">
        <h3>M.S Students</h3>
      </div>
      <div class="alumni-grid">
        ${alumniCards(siteData.alumni.ms)}
      </div>
    </section>
  `;
}

function renderProjects() {
  const root = document.getElementById("projects-root");
  if (!root) return;

  const allProjects = [...(siteData.projects.current || []), ...(siteData.projects.past || [])];
  const groupedProjects = classifyProjects(allProjects);
  const currentItems = groupedProjects.current.map((i) => `<li>${i}</li>`).join("");
  const pastItems = groupedProjects.past.map((i) => `<li>${i}</li>`).join("");

  root.innerHTML = `
    <section class="panel" id="projects">
      <div class="panel-head">
        <h2>Projects</h2>
        <p>Projects are classified automatically into current and past categories based on their end dates.</p>
      </div>
      <div class="project-columns">
        <article class="card project-card">
          <h3>Current Projects</h3>
          <ul class="project-list">${currentItems || "<li>There are no ongoing projects at the moment.</li>"}</ul>
        </article>
        <article class="card project-card">
          <h3>Past Projects</h3>
          <ul class="project-list">${pastItems || "<li>There are no completed projects listed yet.</li>"}</ul>
        </article>
      </div>
    </section>
  `;
}

function renderLocation() {
  const location = siteData.location;
  const root = document.getElementById("location-root");
  if (!root || !location) return;

  root.innerHTML = `
    <section class="panel" id="location">
      <div class="panel-head">
        <h2>Location</h2>
        <p>${location.title}, ${location.campus}</p>
      </div>
      <div class="location-layout">
        <article class="card location-card">
          <h3>Lab Address</h3>
          <p class="location-address">${location.addressLines.join("<br />")}</p>
          <div class="location-actions">
            <a class="location-link" href="${location.mapLink}" target="_blank" rel="noopener noreferrer">
              Open in Google Maps
            </a>
          </div>
        </article>
        <article class="card location-card">
          <h3>How To Reach</h3>
          <div class="location-directions">
            ${(location.directions || []).map((line) => `<p>${line}</p>`).join("")}
          </div>
          <p class="location-note">The in-page map embed was removed because Google iframe embeds can fail on static hosting. The external map link opens reliably.</p>
        </article>
      </div>
    </section>
  `;
}

function setupSectionNavigation() {
  const navLinks = Array.from(document.querySelectorAll(".top-nav__inner a"));
  const allSections = ["news", "research", "members", "alumni", "projects", "location", "publications"];
  const homeSections = ["news", "research"];

  function setActiveNav(hash) {
    navLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${hash}`;
      link.classList.toggle("is-active", active);
      link.setAttribute("aria-current", active ? "page" : "false");
    });
  }

  function showOnly(sectionIds) {
    allSections.forEach((id) => {
      const section = document.getElementById(id);
      if (!section) return;
      section.classList.toggle("section-hidden", !sectionIds.includes(id));
    });
  }

  function applyFromHash() {
    const hash = (window.location.hash || "#home").replace("#", "");
    if (hash === "home") {
      showOnly(homeSections);
      setActiveNav("home");
      return;
    }

    if (allSections.includes(hash)) {
      showOnly([hash]);
      setActiveNav(hash);
      return;
    }

    showOnly(homeSections);
    setActiveNav("home");
  }

  window.addEventListener("hashchange", applyFromHash);
  applyFromHash();
}

renderHeroStats();
renderNews();
renderResearch();
setupResearchLightbox();
renderMembers();
renderAlumni();
renderProjects();
renderLocation();
setupSectionNavigation();
