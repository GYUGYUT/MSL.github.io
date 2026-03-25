function memberLink(label, href, isMail) {
  if (!href) {
    return `<a class="member-btn member-btn-disabled" href="#" aria-disabled="true">${label} (TBD)</a>`;
  }

  if (isMail) {
    return `<a class="member-btn" href="mailto:${href}">${label}</a>`;
  }

  return `<a class="member-btn" href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function renderProfessor() {
  const p = siteData.professor;
  const root = document.getElementById("professor-root");
  if (!root) return;

  root.innerHTML = `
    <section class="panel">
      <h2>Professor</h2>
      <div class="card professor-card">
        <h3>${p.name}</h3>
        <p class="prof-role">${p.role}</p>
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
    <section class="panel">
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

renderProfessor();
renderMembers();
renderAlumni();
renderProjects();
