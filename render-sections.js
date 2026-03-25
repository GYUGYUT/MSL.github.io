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

function getNewsBaseDate(newsItem) {
  return newsItem.publicationDate || newsItem.startDate || null;
}

function isWithinDays(baseDateText, days) {
  if (!baseDateText) return false;
  const created = parseDateOnly(baseDateText);
  const now = new Date();
  const ms = now.getTime() - created.getTime();
  return ms >= 0 && ms <= days * 24 * 60 * 60 * 1000;
}

function renderNews() {
  const root = document.getElementById("news-root");
  if (!root) return;

  const NEWS_ACTIVE_DAYS = 365;
  const activeNews = (siteData.news || [])
    .map((n) => ({ ...n, baseDate: getNewsBaseDate(n) }))
    .filter((n) => isWithinDays(n.baseDate, NEWS_ACTIVE_DAYS));

  root.innerHTML = `
    <section class="panel" id="news">
      <div class="panel-head">
        <h2>News</h2>
        <p>출판일 또는 시작일 기준 최근 1년 내 소식만 자동 노출됩니다.</p>
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
            : '<article class="card news-card"><p class="news-text">현재 표시할 최근 뉴스가 없습니다.</p></article>'
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
                <img class="research-image" src="${r.image}" alt="${r.imageAlt || r.title}" />
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

function renderProfessor() {
  const p = siteData.professor;
  const root = document.getElementById("professor-root");
  if (!root) return;

  root.innerHTML = `
    <section class="panel" id="professor">
      <h2>Professor</h2>
      <div class="card professor-card">
        <img class="prof-photo" src="${p.photo}" alt="${p.photoAlt || p.name}" />
        <h3>${p.name}</h3>
        <p class="prof-role">${p.role}</p>
        <div class="member-actions">
          ${memberLink("Google Scholar", p.scholar, false)}
          ${memberLink("Email", p.email, true)}
        </div>
        <p class="prof-affiliation">${p.affiliation}</p>
        <h4>Educations</h4>
        <ul class="edu-list">
          ${p.educations.map((e) => `<li>${e}</li>`).join("")}
        </ul>
      </div>
    </section>
  `;
}

function renderMembers() {
  const root = document.getElementById("members-root");
  if (!root) return;

  root.innerHTML = `
    <section class="panel" id="members">
      <h2>Members</h2>
      <div class="member-grid">
        ${siteData.members
          .map(
            (m) => `
              <article class="card">
                <img class="member-photo" src="${m.photo}" alt="${m.alt}" />
                <h3>${m.nameHtml}</h3>
                <p>${m.role}</p>
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

  const currentItems = siteData.projects.current.map((i) => `<li>${i}</li>`).join("");
  const pastItems = siteData.projects.past.map((i) => `<li>${i}</li>`).join("");

  root.innerHTML = `
    <section class="panel" id="projects">
      <div class="panel-head">
        <h2>Projects</h2>
        <p>Current Projects / Past Projects</p>
      </div>
      <div class="project-columns">
        <article class="card project-card">
          <h3>Current Projects</h3>
          <ul class="project-list">${currentItems}</ul>
        </article>
        <article class="card project-card">
          <h3>Past Projects</h3>
          <ul class="project-list">${pastItems}</ul>
        </article>
      </div>
    </section>
  `;
}

function setupSectionNavigation() {
  const navLinks = Array.from(document.querySelectorAll(".top-nav__inner a"));
  const allSections = ["news", "research", "professor", "members", "alumni", "projects", "publications"];
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

renderNews();
renderResearch();
renderProfessor();
renderMembers();
renderAlumni();
renderProjects();
setupSectionNavigation();
