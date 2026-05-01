(function () {
  "use strict";

  const app = document.getElementById("app");
  const rawData = window.DYS_DATA;
  const page = window.DYS_PAGE || { type: "home" };

  if (!app || !rawData || !Array.isArray(rawData.performers)) {
    return;
  }

  const catalog = createCatalog(rawData);
  const state = {
    currentRef: null,
    audio: null,
    lastPersist: 0,
    theme: "light",
    isScrubbing: false,
  };
  const THEME_KEY = "dys:theme";
  const THEME_COLOR = {
    light: "#f5efe6",
    dark: "#081015",
  };

  initTheme();
  render();

  function createCatalog(data) {
    const performers = data.performers.map((performer) => {
      const tracks = performer.tracks.map((track) => ({
        ...track,
        ref: buildRef(performer.key, track.id),
      }));
      return { ...performer, tracks };
    });

    const byKey = Object.fromEntries(performers.map((performer) => [performer.key, performer]));
    const flatTracks = performers.flatMap((performer) =>
      performer.tracks.map((track) => ({ performer, track }))
    );

    return {
      site: data.site,
      performers,
      byKey,
      flatTracks,
    };
  }

  function render() {
    const pageMarkup = renderPage();
    document.body.classList.remove("nav-open");
    document.body.dataset.page = page.type;
    app.innerHTML = [
      '<div class="site-shell">',
      '<div class="site-atmosphere" aria-hidden="true">',
      '<span class="site-atmosphere__orb site-atmosphere__orb--one"></span>',
      '<span class="site-atmosphere__orb site-atmosphere__orb--two"></span>',
      '<span class="site-atmosphere__orb site-atmosphere__orb--three"></span>',
      '<span class="site-atmosphere__ribbon site-atmosphere__ribbon--one"></span>',
      '<span class="site-atmosphere__ribbon site-atmosphere__ribbon--two"></span>',
      "</div>",
      renderHeader(),
      renderMobileChrome(),
      `<main class="shell-container">${pageMarkup}</main>`,
      renderFooter(),
      "</div>",
      renderPlayer(),
    ].join("");

    state.audio = document.getElementById("audio-player");
    bindPlayerControls();
    bindPlayButtons(document);
    bindAudioEvents();
    bindPageEvents();
    bindNavToggle();
    bindThemeToggle();
    initMotion();
    restoreLastTrack();
    updateActiveTrackState();
    updateThemeButtons();
  }

  function renderPage() {
    switch (page.type) {
      case "artists":
        return renderArtistsPage();
      case "artist":
        return renderArtistPage(page.artistKey);
      case "404":
        return renderNotFoundPage();
      case "home":
      default:
        return renderHomePage();
    }
  }

  function renderHeader() {
    const currentArtist = page.type === "artist" ? catalog.byKey[page.artistKey] : null;
    return `
      <header class="site-header">
        <div class="shell-container site-header__row">
          <a class="brand" href="index.html" aria-label="返回馆藏首页">
            <span class="brand__seal">德</span>
            <span>
              <strong class="brand__title">${escapeHtml(catalog.site.name)}</strong>
              <span class="brand__meta">${escapeHtml(catalog.site.tagline)}</span>
            </span>
          </a>
          <div class="site-header__actions">
            <button class="theme-toggle desktop-only" type="button" data-action="toggle-theme" aria-pressed="false">
              <span class="theme-toggle__icon">◐</span>
              <span class="theme-toggle__label">黑夜模式</span>
            </button>
            <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
              菜单
            </button>
          </div>
          <nav class="site-nav" id="site-nav" aria-label="站点导航">
            <a href="index.html" class="${page.type === "home" ? "is-current" : ""}">馆藏首页</a>
            <a href="role.html" class="${page.type === "artists" ? "is-current" : ""}">演员总览</a>
            ${
              currentArtist
                ? `<a href="${escapeHtml(currentArtist.page)}" class="is-current">${escapeHtml(
                    currentArtist.name
                  )}</a>`
                : ""
            }
          </nav>
        </div>
      </header>
    `;
  }

  function renderMobileChrome() {
    const meta = getMobileMeta();
    return `
      <section class="mobile-capsule shell-container">
        <div class="mobile-capsule__panel">
          <div class="mobile-capsule__eyebrow">${escapeHtml(meta.eyebrow)}</div>
          <div class="mobile-capsule__title">${escapeHtml(meta.title)}</div>
          <div class="mobile-capsule__meta">${escapeHtml(meta.meta)}</div>
        </div>
        <div class="mobile-capsule__actions">
          <a class="mobile-capsule__link ${page.type === "home" ? "is-current" : ""}" href="index.html">首页</a>
          <a class="mobile-capsule__link ${page.type === "artists" ? "is-current" : ""}" href="role.html">演员</a>
          <button class="mobile-capsule__button" type="button" data-action="toggle-theme">
            <span class="theme-toggle__icon">◐</span>
            <span class="theme-toggle__label">黑夜模式</span>
          </button>
          <button class="mobile-capsule__button" type="button" data-action="toggle-nav">菜单</button>
        </div>
      </section>
    `;
  }

  function renderHomePage() {
    const featuredTracks = catalog.site.featured
      .map((item) => resolveTrack(item.artistKey, item.trackId))
      .filter(Boolean);

    const quickTracks = catalog.performers.flatMap((performer) =>
      performer.tracks.slice(0, 2).map((track) => ({ performer, track }))
    );

    return `
      <section class="hero">
        <article class="hero__main">
          <span class="hero__eyebrow">德云馆藏 · 现代重制</span>
          <h1>把相声听得更轻松一点。</h1>
          <p>${escapeHtml(
            "这是一座更克制、更清爽也更实用的线上曲艺馆。按演员找、按作品听、点开就播，让馆藏真正为内容服务。"
          )}</p>
          <div class="hero__actions">
            <a class="button" href="role.html">按演员浏览</a>
            <a class="button-secondary" href="#home-featured">先听代表作品</a>
          </div>
        </article>
        <aside class="hero__side">
          <h2>馆藏一览</h2>
          <p>${escapeHtml(
            "我们都有什么？馆藏数量和演员数量是很多人关心的基本信息，现在直接放在这里了。后续也会考虑加一些更有特色的数据统计。"
          )}</p>
          <div class="stat-grid">
            <div class="stat-card">
              <strong>${formatCount(catalog.site.performerCount)}</strong>
              <span>组演员搭档</span>
            </div>
            <div class="stat-card">
              <strong>${formatCount(catalog.site.trackCount)}</strong>
              <span>段馆藏音频</span>
            </div>
            <div class="stat-card">
              <strong>纯静态</strong>
              <span>更容易维护和部署</span>
            </div>
            <div class="stat-card">
              <strong>一键直听</strong>
              <span>统一播放器与列表交互</span>
            </div>
          </div>
        </aside>
      </section>

      <section class="section">
        <div class="grid grid--three">
          ${[
            {
              title: "先找人，再找段子",
              text: "首页和演员页分工清晰，适合先按搭档认人，再深入翻作品。",
            },
            {
              title: "中华文化做底，现代视觉为体",
              text: "视觉上用宣纸、印章、宋体气质和朱砂点缀，保留传统意味，但整体依旧现代。",
            },
            {
              title: "未来继续加馆藏也不怕",
              text: "后续还会更新更多演员或曲目，让我们持续更新。",
            },
          ]
            .map(renderGuideCard)
            .join("")}
        </div>
      </section>

      <section class="section" id="home-featured">
        <div class="section-heading">
          <div>
            <h2>馆长推荐</h2>
            <p>现在就来听听下面推荐的作品吧。</p>
          </div>
        </div>
        <div class="grid grid--three">
          ${featuredTracks.slice(0, 6).map(renderFeatureCard).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <div>
            <h2>按演员浏览</h2>
            <p>先从熟悉的搭档入手，再慢慢扩展自己的馆藏口味。</p>
          </div>
          <a class="pill-button" href="role.html">查看全部演员</a>
        </div>
        <div class="grid grid--three">
          ${catalog.performers.map(renderArtistCard).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <div>
            <h2>开馆速听</h2>
            <p>每组演员都为您推荐两款作品，适合边逛边试听。</p>
          </div>
        </div>
        <div class="list">
          ${quickTracks.slice(0, 12).map(renderTrackRow).join("")}
        </div>
      </section>
    `;
  }

  function renderArtistsPage() {
    return `
      <section class="hero">
        <article class="hero__main">
          <span class="hero__eyebrow">演员总览</span>
          <h1>从台柱到新生代，一眼看清馆藏脉络。</h1>
          <p>${escapeHtml(
            "有喜欢的演员吗？直接在这里找就对了。每个演员页都展示了代表作品、标签和馆藏数量，帮你更快判断该从谁开始听。"
          )}</p>
          <div class="hero__actions">
            <a class="button" href="index.html">返回首页</a>
            <a class="button-secondary" href="#artist-directory">直接找演员</a>
          </div>
        </article>
        <aside class="hero__side">
          <h2>总览方式</h2>
          <p>演员页现在不再只是堆图片，而是把代表作品、标签和馆藏数量一起展示，帮你更快判断该从谁开始听。</p>
          <div class="stat-grid">
            <div class="stat-card">
              <strong>${formatCount(catalog.site.performerCount)}</strong>
              <span>演员页面</span>
            </div>
            <div class="stat-card">
              <strong>${formatCount(catalog.site.trackCount)}</strong>
              <span>全站曲目</span>
            </div>
          </div>
        </aside>
      </section>

      <section class="section" id="artist-directory">
        <div class="section-heading">
          <div>
            <h2>演员目录</h2>
            <p>输入演员名、城市或风格标签，就能快速筛到想听的搭档。</p>
          </div>
        </div>
        <div class="section-card">
          <div class="toolbar">
            <div class="toolbar__group">
              <input id="artist-search" type="search" placeholder="搜索演员、城市或风格标签">
            </div>
            <div class="track-row__plain" id="artist-count"></div>
          </div>
          <div class="grid grid--three" id="artist-results">
            ${catalog.performers.map(renderArtistCard).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderArtistPage(artistKey) {
    const performer = catalog.byKey[artistKey];
    if (!performer) {
      return renderNotFoundPage();
    }

    const featuredTracks = performer.featuredTrackIds
      .map((trackId) => resolveTrack(performer.key, trackId))
      .filter(Boolean);

    return `
      <section class="hero artist-hero">
        <article class="hero__main" style="--artist-soft:${escapeHtml(performer.muted)};">
          <span class="hero__eyebrow">${escapeHtml(performer.city)}</span>
          <h1>${escapeHtml(performer.name)}</h1>
          <p>${escapeHtml(performer.tagline)}</p>
          <p style="margin-top:18px;">${escapeHtml(performer.description)}</p>
          <div class="hero__actions">
            <a class="button" href="#artist-track-list">浏览全部曲目</a>
            <a class="button-secondary" href="role.html">切换其他演员</a>
          </div>
        </article>
        <aside class="hero__side">
          <div class="artist-hero__cover" style="--artist-soft:${escapeHtml(performer.muted)};">
            <img src="${escapeHtml(performer.portrait)}" alt="${escapeHtml(performer.name)}">
          </div>
          <div class="artist-hero__facts">
            <div class="artist-hero__fact">
              <strong>馆藏数量</strong>
              <span>${formatCount(performer.trackCount)} 段可直接播放</span>
            </div>
            <div class="artist-hero__fact">
              <strong>风格标签</strong>
              <span>${escapeHtml(performer.tags.join(" / "))}</span>
            </div>
            <div class="artist-hero__fact">
              <strong>适合从这里开始</strong>
              <span>${escapeHtml(performer.highlights.join("、"))}</span>
            </div>
          </div>
        </aside>
      </section>

      <section class="section">
        <div class="section-heading">
          <div>
            <h2>代表作品</h2>
            <p>先把这个页面最有辨识度的几段放前面，适合第一次认识这组搭档的人。</p>
          </div>
        </div>
        <div class="grid grid--four">
          ${featuredTracks.map(renderFeatureCard).join("")}
        </div>
      </section>

      <section class="section" id="artist-track-list">
        <div class="section-heading">
          <div>
            <h2>全部曲目</h2>
            <p>支持按标题搜索，也能切换目录顺序和标题排序。</p>
          </div>
        </div>
        <div class="section-card">
          <div class="toolbar">
            <div class="toolbar__group">
              <input id="track-search" type="search" placeholder="搜索段子标题、演员名">
              <select id="track-sort" aria-label="曲目排序">
                <option value="number-asc">按目录顺序</option>
                <option value="number-desc">按目录倒序</option>
                <option value="title-asc">按标题字母</option>
              </select>
            </div>
            <div class="track-row__plain" id="track-count"></div>
          </div>
          <div class="list" id="track-results">
            ${performer.tracks.map((track) => renderTrackRow({ performer, track })).join("")}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <div>
            <h2>继续逛馆</h2>
            <p>如果你喜欢这组搭档，也可以顺手去看看气质接近的页面。</p>
          </div>
        </div>
        <div class="grid grid--three">
          ${catalog.performers
            .filter((item) => item.key !== performer.key)
            .slice(0, 3)
            .map(renderArtistCard)
            .join("")}
        </div>
      </section>
    `;
  }

  function renderNotFoundPage() {
    return `
      <section class="hero page-not-found">
        <article class="hero__main">
          <span class="hero__eyebrow">404</span>
          <h1>这页暂时没找到，包袱还在馆里。</h1>
          <p>${escapeHtml(
            "你可以回到首页继续听，也可以直接去演员总览挑一组搭档。新的结构已经把入口收得更清楚，不会再像以前那样迷路。"
          )}</p>
          <div class="center-actions">
            <a class="button" href="index.html">返回首页</a>
            <a class="button-secondary" href="role.html">查看演员总览</a>
          </div>
        </article>
        <aside class="hero__side">
          <h2>不妨从这里重新开始</h2>
          <div class="grid">
            ${catalog.performers.slice(0, 3).map(renderArtistCardCompact).join("")}
          </div>
        </aside>
      </section>
    `;
  }

  function renderFooter() {
    return `
      <footer class="footer shell-container">
        <div class="footer-card">
          <div class="footer-grid">
            <div>
              <h2>${escapeHtml(catalog.site.name)}</h2>
              <p>${escapeHtml(
                "德云社的线上曲艺馆，提供更清爽实用的浏览和播放体验，让更多人能方便地听到这些经典的相声段子。"
              )}</p>
              <div class="footer-links">
                <a href="index.html">馆藏首页</a>
                <a href="role.html">演员总览</a>
                ${
                  catalog.performers[0]
                    ? `<a href="${escapeHtml(catalog.performers[0].page)}">先听经典馆藏</a>`
                    : ""
                }
              </div>
            </div>
            <div>
              <h2>让每一个人都能轻松享受相声艺术</h2>
              <p>好的作品应该被更多人发现和喜爱，艺术的价值在于分享。</p>
              <div class="footer-note">${escapeHtml(catalog.site.footer)}</div>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  function renderPlayer() {
    const placeholder = catalog.performers[0];
    return `
      <section class="player-dock" aria-label="站点播放器">
        <div class="player-dock__cover">
          <img id="player-cover" src="${escapeHtml(placeholder.portrait)}" alt="当前封面">
        </div>
        <div>
          <div class="player-dock__kicker">Now Playing</div>
          <div class="player-dock__title" id="player-title">未选择曲目</div>
          <div class="player-dock__artist" id="player-artist">点击任一作品开始播放</div>
          <div class="player-dock__hint" id="player-hint">播放器会在全站保持统一，切换页面也能快速续听。</div>
        </div>
        <audio id="audio-player" controls preload="none"></audio>
      </section>
    `;
  }

  function renderGuideCard(card) {
    return `
      <article class="guide-card">
        <h3>${escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.text)}</p>
      </article>
    `;
  }

  function renderFeatureCard(entry) {
    if (!entry) {
      return "";
    }
    const performer = entry.performer;
    const track = entry.track;
    return `
      <article class="feature-card" data-track-ref="${escapeHtml(track.ref)}" style="--artist-soft:${escapeHtml(
        performer.muted
      )};">
        <div class="feature-card__image">
          <img src="${escapeHtml(performer.cover)}" alt="${escapeHtml(track.title)}">
        </div>
        <div class="feature-card__body">
          <div class="feature-card__meta">
            <span>${escapeHtml(performer.duo)}</span>
            <span>${formatIndex(track.number)}</span>
          </div>
          <h3>${escapeHtml(track.title)}</h3>
          <p>${escapeHtml(performer.tagline)}</p>
          <div class="feature-card__actions" style="margin-top:16px;">
            <button
              class="play-button"
              data-action="play-track"
              data-artist-key="${escapeHtml(performer.key)}"
              data-track-id="${escapeHtml(track.id)}"
            >
              播放选段
            </button>
            <a class="pill-button" href="${escapeHtml(performer.page)}">进入演员页</a>
          </div>
        </div>
      </article>
    `;
  }

  function renderArtistCard(performer) {
    const highlightText = performer.featuredTrackIds
      .slice(0, 3)
      .map((trackId) => resolveTrack(performer.key, trackId))
      .filter(Boolean)
      .map((entry) => entry.track.title)
      .join(" / ");

    return `
      <a class="artist-card" href="${escapeHtml(performer.page)}" style="--artist-soft:${escapeHtml(
        performer.muted
      )};">
        <div class="artist-card__portrait">
          <img src="${escapeHtml(performer.portrait)}" alt="${escapeHtml(performer.name)}">
        </div>
        <div>
          <div class="artist-card__meta">
            <span>${escapeHtml(performer.city)}</span>
            <span>${formatCount(performer.trackCount)} 段</span>
          </div>
          <h3>${escapeHtml(performer.name)}</h3>
          <p>${escapeHtml(performer.tagline)}</p>
          <div class="tag-list" style="margin-top:12px;">
            ${performer.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <p style="margin-top:12px;"><strong>代表作：</strong>${escapeHtml(highlightText)}</p>
        </div>
      </a>
    `;
  }

  function renderArtistCardCompact(performer) {
    return `
      <a class="artist-card" href="${escapeHtml(performer.page)}" style="--artist-soft:${escapeHtml(
        performer.muted
      )};">
        <div class="artist-card__portrait">
          <img src="${escapeHtml(performer.portrait)}" alt="${escapeHtml(performer.name)}">
        </div>
        <div>
          <div class="artist-card__meta">
            <span>${formatCount(performer.trackCount)} 段</span>
          </div>
          <h3>${escapeHtml(performer.name)}</h3>
          <p>${escapeHtml(performer.tagline)}</p>
        </div>
      </a>
    `;
  }

  function renderTrackRow(entry) {
    const performer = entry.performer;
    const track = entry.track;
    return `
      <article class="track-row" data-track-ref="${escapeHtml(track.ref)}">
        <div class="track-row__index">${formatIndex(track.number)}</div>
        <div>
          <div class="track-row__title">${escapeHtml(track.title)}</div>
          <div class="track-row__meta">
            <span>${escapeHtml(performer.duo)}</span>
            <span>${escapeHtml(track.performers || performer.name)}</span>
          </div>
        </div>
        <div class="track-row__actions">
          <button
            class="play-button"
            data-action="play-track"
            data-artist-key="${escapeHtml(performer.key)}"
            data-track-id="${escapeHtml(track.id)}"
          >
            立即播放
          </button>
          ${
            page.type === "artist" && page.artistKey === performer.key
              ? ""
              : `<a class="pill-button" href="${escapeHtml(performer.page)}">查看演员页</a>`
          }
        </div>
      </article>
    `;
  }

  function bindPageEvents() {
    if (page.type === "artists") {
      const input = document.getElementById("artist-search");
      if (input) {
        input.addEventListener("input", updateArtistFilter);
        updateArtistFilter();
      }
    }

    if (page.type === "artist" && catalog.byKey[page.artistKey]) {
      const search = document.getElementById("track-search");
      const sort = document.getElementById("track-sort");
      if (search) {
        search.addEventListener("input", updateTrackFilter);
      }
      if (sort) {
        sort.addEventListener("change", updateTrackFilter);
      }
      updateTrackFilter();
    }
  }

  function bindNavToggle() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("site-nav");
    if (!toggle || !nav) {
      return;
    }

    const setOpen = (open) => {
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    };

    toggle.addEventListener("click", function () {
      setOpen(!document.body.classList.contains("nav-open"));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 780) {
        setOpen(false);
      }
    });

    document.querySelectorAll('[data-action="toggle-nav"]').forEach((button) => {
      button.addEventListener("click", function () {
        setOpen(!document.body.classList.contains("nav-open"));
      });
    });
  }

  function bindThemeToggle() {
    document.querySelectorAll('[data-action="toggle-theme"]').forEach((button) => {
      button.addEventListener("click", function () {
        applyTheme(state.theme === "dark" ? "light" : "dark");
      });
    });
  }

  function initTheme() {
    let theme = "light";
    try {
      const stored = window.localStorage.getItem(THEME_KEY);
      if (stored === "dark" || stored === "light") {
        theme = stored;
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        theme = "dark";
      }
    } catch (_error) {
      theme = "light";
    }
    applyTheme(theme, false);
  }

  function applyTheme(theme, persist) {
    state.theme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.style.colorScheme = state.theme;
    syncThemeColor();
    if (persist !== false) {
      try {
        window.localStorage.setItem(THEME_KEY, state.theme);
      } catch (_error) {
        return;
      }
    }
    updateThemeButtons();
  }

  function syncThemeColor() {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = THEME_COLOR[state.theme] || THEME_COLOR.light;
  }

  function updateThemeButtons() {
    const isDark = state.theme === "dark";
    document.querySelectorAll('[data-action="toggle-theme"]').forEach((button) => {
      const label = button.querySelector(".theme-toggle__label");
      const icon = button.querySelector(".theme-toggle__icon");
      button.setAttribute("aria-pressed", isDark ? "true" : "false");
      if (label) {
        label.textContent = isDark ? "切换日间" : "黑夜模式";
      } else {
        button.textContent = isDark ? "切换日间" : "黑夜模式";
      }
      if (icon) {
        icon.textContent = isDark ? "☼" : "◐";
      }
    });
  }

  function getMobileMeta() {
    if (page.type === "artist") {
      const performer = catalog.byKey[page.artistKey];
      if (performer) {
        return {
          eyebrow: "演员页",
          title: performer.name,
          meta: `${formatCount(performer.trackCount)} 段馆藏 · ${performer.city}`,
        };
      }
    }

    if (page.type === "artists") {
      return {
        eyebrow: "演员总览",
        title: "按搭档快速找人",
        meta: `${formatCount(catalog.site.performerCount)} 组演员 · ${formatCount(catalog.site.trackCount)} 段作品`,
      };
    }

    if (page.type === "404") {
      return {
        eyebrow: "页面未找到",
        title: "回到馆里继续听",
        meta: `${formatCount(catalog.site.performerCount)} 组演员仍可浏览`,
      };
    }

    return {
      eyebrow: "馆藏首页",
      title: "今日随手开听",
      meta: `${formatCount(catalog.site.performerCount)} 组演员 · ${formatCount(catalog.site.trackCount)} 段馆藏`,
    };
  }

  function bindPlayButtons(root) {
    root.querySelectorAll('[data-action="play-track"]').forEach((button) => {
      button.addEventListener("click", onPlayClick);
    });
  }

  function onPlayClick(event) {
    event.preventDefault();
    const button = event.currentTarget;
    playTrack(button.dataset.artistKey, button.dataset.trackId);
  }

  function bindAudioEvents() {
    if (!state.audio || state.audio.dataset.bound === "true") {
      return;
    }
    state.audio.dataset.bound = "true";
    state.audio.addEventListener("ended", playNextTrack);
    state.audio.addEventListener("timeupdate", persistPlaybackState);
    state.audio.addEventListener("timeupdate", updateProgressUI);
    state.audio.addEventListener("loadedmetadata", updateProgressUI);
    state.audio.addEventListener("durationchange", updateProgressUI);
    state.audio.addEventListener("play", updatePlayButtonState);
    state.audio.addEventListener("pause", updatePlayButtonState);
    state.audio.addEventListener("volumechange", updateVolumeUI);
  }

  function bindPlayerControls() {
    const dock = document.querySelector(".player-dock");
    if (!dock || !state.audio) {
      return;
    }

    if (!dock.dataset.enhanced) {
      const cover = document.getElementById("player-cover");
      const title = document.getElementById("player-title");
      const artist = document.getElementById("player-artist");
      const hint = document.getElementById("player-hint");
      dock.innerHTML = `
        <div class="player-dock__summary">
          <div class="player-dock__cover">
            <img id="player-cover" src="${escapeHtml(cover ? cover.getAttribute("src") || "" : "")}" alt="${escapeHtml(
              cover ? cover.getAttribute("alt") || "" : ""
            )}">
          </div>
          <div class="player-dock__copy">
            <div class="player-dock__kicker">Now Playing</div>
            <div class="player-dock__title" id="player-title">${escapeHtml(
              title ? title.textContent || "" : "未选择曲目"
            )}</div>
            <div class="player-dock__artist" id="player-artist">${escapeHtml(
              artist ? artist.textContent || "" : "点击任一作品开始播放"
            )}</div>
            <div class="player-dock__hint" id="player-hint">${escapeHtml(
              hint ? hint.textContent || "" : "播放器会在全站保持统一，切换页面也能快速续听。"
            )}</div>
          </div>
        </div>
        <div class="player-dock__transport">
          <div class="player-dock__timeline">
            <span class="player-dock__time" id="player-current-time">00:00</span>
            <input class="player-dock__progress" id="player-progress" type="range" min="0" max="1000" value="0" step="1" aria-label="播放进度">
            <span class="player-dock__time" id="player-duration">00:00</span>
          </div>
          <div class="player-dock__controls">
            <button class="player-control player-control--primary" type="button" id="player-toggle" data-player-action="toggle-play">
              <span class="player-control__icon" id="player-toggle-icon">▶</span>
              <span id="player-toggle-label">播放</span>
            </button>
            <button class="player-control player-control--secondary" type="button" data-player-action="next-track">下一段</button>
            <label class="player-dock__volume" for="player-volume">
              <span>音量</span>
              <input id="player-volume" type="range" min="0" max="100" value="92" step="1" aria-label="音量">
            </label>
          </div>
        </div>
      `;
      dock.appendChild(state.audio);
      dock.dataset.enhanced = "true";
    }

    if (state.audio.dataset.controlsBound === "true") {
      updateProgressUI();
      updatePlayButtonState();
      updateVolumeUI();
      return;
    }

    state.audio.dataset.controlsBound = "true";
    state.audio.removeAttribute("controls");
    state.audio.volume = 0.92;

    const toggle = document.getElementById("player-toggle");
    const progress = document.getElementById("player-progress");
    const volume = document.getElementById("player-volume");
    const next = document.querySelector('[data-player-action="next-track"]');

    if (toggle) {
      toggle.addEventListener("click", togglePlayback);
    }

    if (next) {
      next.addEventListener("click", playNextTrack);
    }

    if (progress) {
      progress.addEventListener("input", function () {
        state.isScrubbing = true;
        updateProgressUI(Number(progress.value));
      });
      progress.addEventListener("change", function () {
        if (!state.audio || !Number.isFinite(state.audio.duration) || state.audio.duration <= 0) {
          state.isScrubbing = false;
          return;
        }
        state.audio.currentTime = (Number(progress.value) / 1000) * state.audio.duration;
        state.isScrubbing = false;
        updateProgressUI();
      });
    }

    if (volume) {
      volume.addEventListener("input", function () {
        if (!state.audio) {
          return;
        }
        state.audio.volume = Number(volume.value) / 100;
        state.audio.muted = state.audio.volume === 0;
        updateVolumeUI();
      });
    }

    updateProgressUI();
    updatePlayButtonState();
    updateVolumeUI();
  }

  function playTrack(artistKey, trackId, resumeTime) {
    const resolved = resolveTrack(artistKey, trackId);
    if (!resolved || !state.audio) {
      return;
    }

    state.currentRef = resolved.track.ref;
    state.isScrubbing = false;
    state.audio.src = encodeURI(resolved.track.file);
    state.audio.dataset.artistKey = artistKey;
    state.audio.dataset.trackId = trackId;

    updatePlayerMeta(resolved.performer, resolved.track);
    updateActiveTrackState();

    const doPlay = () => {
      if (typeof resumeTime === "number" && Number.isFinite(resumeTime) && resumeTime > 0) {
        state.audio.currentTime = resumeTime;
      }
      state.audio.play().catch(function () {
        return undefined;
      });
    };

    if (typeof resumeTime === "number" && resumeTime > 0) {
      state.audio.addEventListener("loadedmetadata", doPlay, { once: true });
      state.audio.load();
    } else {
      doPlay();
    }

    persistCurrentTrack();
  }

  function updatePlayerMeta(performer, track) {
    setText("player-title", track.title);
    setText("player-artist", performer.name);
    setText("player-hint", performer.tagline);
    const cover = document.getElementById("player-cover");
    if (cover) {
      cover.src = performer.portrait;
      cover.alt = performer.name;
    }
  }

  function togglePlayback() {
    if (!state.audio) {
      return;
    }

    if (!state.audio.src) {
      const fallback = catalog.flatTracks[0];
      if (fallback) {
        playTrack(fallback.performer.key, fallback.track.id);
      }
      return;
    }

    if (state.audio.paused) {
      state.audio.play().catch(function () {
        return undefined;
      });
    } else {
      state.audio.pause();
    }
  }

  function updateArtistFilter() {
    const input = document.getElementById("artist-search");
    const container = document.getElementById("artist-results");
    const count = document.getElementById("artist-count");
    if (!input || !container || !count) {
      return;
    }
    const query = input.value.trim().toLowerCase();
    const filtered = catalog.performers.filter((performer) => {
      const haystack = [
        performer.name,
        performer.city,
        performer.tagline,
        performer.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    count.textContent = `共 ${formatCount(filtered.length)} 组演员`;
    container.innerHTML = filtered.length
      ? filtered.map(renderArtistCard).join("")
      : '<div class="empty-state">没有找到匹配的演员，可以换个名字或标签试试。</div>';
  }

  function updateTrackFilter() {
    const performer = catalog.byKey[page.artistKey];
    const search = document.getElementById("track-search");
    const sort = document.getElementById("track-sort");
    const container = document.getElementById("track-results");
    const count = document.getElementById("track-count");
    if (!performer || !search || !sort || !container || !count) {
      return;
    }

    const query = search.value.trim().toLowerCase();
    const sorted = [...performer.tracks].filter((track) => {
      const haystack = [track.title, track.performers, performer.name].join(" ").toLowerCase();
      return haystack.includes(query);
    });

    switch (sort.value) {
      case "number-desc":
        sorted.sort((a, b) => b.number - a.number);
        break;
      case "title-asc":
        sorted.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
        break;
      case "number-asc":
      default:
        sorted.sort((a, b) => a.number - b.number);
        break;
    }

    count.textContent = `当前显示 ${formatCount(sorted.length)} / ${formatCount(performer.trackCount)} 段`;
    container.innerHTML = sorted.length
      ? sorted.map((track) => renderTrackRow({ performer, track })).join("")
      : '<div class="empty-state">没有找到匹配的曲目，可以换个标题关键词继续找。</div>';
    bindPlayButtons(container);
    updateActiveTrackState();
  }

  function updateActiveTrackState() {
    document.querySelectorAll("[data-track-ref].is-active").forEach((element) => {
      element.classList.remove("is-active");
    });

    if (!state.currentRef) {
      return;
    }

    document.querySelectorAll(`[data-track-ref="${cssEscape(state.currentRef)}"]`).forEach((element) => {
      element.classList.add("is-active");
    });
  }

  function initMotion() {
    const revealTargets = document.querySelectorAll(
      ".hero__main, .hero__side, .guide-card, .feature-card, .artist-card, .track-row, .section-card, .footer-card, .stat-card, .artist-hero__fact"
    );

    if (!revealTargets.length) {
      return;
    }

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    revealTargets.forEach((element, index) => {
      element.classList.add("js-reveal");
      element.style.setProperty("--reveal-delay", `${Math.min(index % 8, 7) * 55}ms`);
      if (prefersReduced) {
        element.classList.add("is-visible");
      }
    });

    if (prefersReduced || !("IntersectionObserver" in window)) {
      revealTargets.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    revealTargets.forEach((element) => observer.observe(element));
  }

  function playNextTrack() {
    if (!state.currentRef) {
      return;
    }
    const currentIndex = catalog.flatTracks.findIndex(({ track }) => track.ref === state.currentRef);
    if (currentIndex === -1) {
      return;
    }
    const next = catalog.flatTracks[currentIndex + 1];
    if (next) {
      playTrack(next.performer.key, next.track.id);
    } else if (state.audio) {
      state.audio.pause();
      state.audio.currentTime = 0;
      updateProgressUI();
    }
  }

  function restoreLastTrack() {
    try {
      const stored = JSON.parse(window.localStorage.getItem("dys:last-track") || "null");
      if (!stored || !stored.artistKey || !stored.trackId) {
        return;
      }
      const resolved = resolveTrack(stored.artistKey, stored.trackId);
      if (!resolved) {
        return;
      }
      state.currentRef = resolved.track.ref;
      if (state.audio) {
        state.audio.src = encodeURI(resolved.track.file);
        state.audio.dataset.artistKey = stored.artistKey;
        state.audio.dataset.trackId = stored.trackId;
        if (typeof stored.time === "number" && stored.time > 0) {
          state.audio.addEventListener(
            "loadedmetadata",
            function () {
              state.audio.currentTime = stored.time;
            },
            { once: true }
          );
        }
      }
      updatePlayerMeta(resolved.performer, resolved.track);
      updateProgressUI();
    } catch (_error) {
      return;
    }
  }

  function persistPlaybackState() {
    if (!state.audio || !state.audio.dataset.artistKey || !state.audio.dataset.trackId) {
      return;
    }

    const now = Date.now();
    if (now - state.lastPersist < 4000) {
      return;
    }
    state.lastPersist = now;
    persistCurrentTrack(state.audio.currentTime);
  }

  function persistCurrentTrack(time) {
    if (!state.audio || !state.audio.dataset.artistKey || !state.audio.dataset.trackId) {
      return;
    }
    try {
      window.localStorage.setItem(
        "dys:last-track",
        JSON.stringify({
          artistKey: state.audio.dataset.artistKey,
          trackId: state.audio.dataset.trackId,
          time: typeof time === "number" ? time : 0,
        })
      );
    } catch (_error) {
      return;
    }
  }

  function resolveTrack(artistKey, trackId) {
    const performer = catalog.byKey[artistKey];
    if (!performer) {
      return null;
    }
    const track = performer.tracks.find((item) => item.id === trackId);
    if (!track) {
      return null;
    }
    return { performer, track };
  }

  function buildRef(artistKey, trackId) {
    return `${artistKey}::${trackId}`;
  }

  function formatCount(value) {
    return Number(value || 0).toLocaleString("zh-CN");
  }

  function formatIndex(value) {
    return String(value || 0).padStart(3, "0");
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  function updatePlayButtonState() {
    const icon = document.getElementById("player-toggle-icon");
    const label = document.getElementById("player-toggle-label");
    if (!state.audio || !icon || !label) {
      return;
    }
    const isPlaying = !!state.audio.src && !state.audio.paused;
    icon.textContent = isPlaying ? "❚❚" : "▶";
    label.textContent = isPlaying ? "暂停" : "播放";
  }

  function updateProgressUI(scrubValue) {
    const progress = document.getElementById("player-progress");
    const current = document.getElementById("player-current-time");
    const duration = document.getElementById("player-duration");
    if (!progress || !current || !duration || !state.audio) {
      return;
    }

    const total = Number.isFinite(state.audio.duration) ? state.audio.duration : 0;
    const ratio =
      typeof scrubValue === "number"
        ? Math.max(0, Math.min(1000, scrubValue))
        : total > 0
          ? Math.round((state.audio.currentTime / total) * 1000)
          : 0;
    const currentTime =
      typeof scrubValue === "number" && total > 0
        ? (ratio / 1000) * total
        : state.audio.currentTime || 0;

    if (!state.isScrubbing || typeof scrubValue === "number") {
      progress.value = String(ratio);
    }
    progress.style.setProperty("--progress-ratio", `${ratio / 10}%`);
    current.textContent = formatDuration(currentTime);
    duration.textContent = formatDuration(total);
  }

  function updateVolumeUI() {
    const volume = document.getElementById("player-volume");
    if (!volume || !state.audio) {
      return;
    }
    const value = Math.round((state.audio.muted ? 0 : state.audio.volume) * 100);
    volume.value = String(value);
    volume.style.setProperty("--volume-ratio", `${value}%`);
  }

  function formatDuration(value) {
    const totalSeconds = Math.max(0, Math.floor(Number(value) || 0));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }
    return String(value).replace(/["\\]/g, "\\$&");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
