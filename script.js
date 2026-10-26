// Global State
let currentCategoryPool = [];
let currentCategoryIndex = 0;
let allArticles = [];

async function loadArticlesDatabase() {
  const saved = localStorage.getItem('iv_articles');
  if (saved) {
    try {
      allArticles = JSON.parse(saved);
      return;
    } catch (e) {
      allArticles = [];
    }
  }
  try {
    const response = await fetch('articles.json');
    if (response.ok) {
      allArticles = await response.json();
      localStorage.setItem('iv_articles', JSON.stringify(allArticles));
    }
  } catch (e) {
    allArticles = [];
  }
}

// DOM Elements
const frontPage = document.getElementById('front-page');
const archiveView = document.getElementById('archive-view');
const readerView = document.getElementById('reader-view');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const searchStatus = document.getElementById('search-status');
const siteHeader = document.getElementById('site-header-container');
const mainLayout = document.getElementById('main-layout');
const frontSidebar = document.getElementById('front-sidebar');

async function renderFrontPage(filteredList = null) {
  await loadArticlesDatabase();
  const categories = ['philosophy', 'physics', 'mathematics'];
  const listToUse = filteredList || allArticles;
  
  categories.forEach(cat => {
    const showcaseElem = document.getElementById(`showcase-${cat}`);
    const catArticles = listToUse.filter(a => a.category === cat);
    showcaseElem.innerHTML = '';

    if (catArticles.length === 0) {
      showcaseElem.innerHTML = '<p class="card-snippet" style="font-style:italic; color:var(--muted-ink);">No articles published in this section yet.</p>';
      return;
    }

    const latestArt = catArticles[0];
    const card = document.createElement('article');
    card.className = 'article-card';
    card.onclick = () => openArticle(latestArt.id);

    card.innerHTML = `
      <h3 class="card-title">${latestArt.title}</h3>
      <p class="card-snippet">${latestArt.excerpt || latestArt.body.slice(0, 110) + '...'}</p>
      <div class="card-meta">${latestArt.date} &bull; Read Article &rarr;</div>
    `;
    showcaseElem.appendChild(card);
  });
}

async function openCategoryArchive(categoryName) {
  await loadArticlesDatabase();
  const catArticles = allArticles.filter(a => a.category === categoryName);
  
  document.getElementById('archive-title').textContent = `${categoryName.toUpperCase()} ARCHIVE`;
  const archiveList = document.getElementById('archive-list');
  archiveList.innerHTML = '';

  if (catArticles.length === 0) {
    archiveList.innerHTML = '<p style="font-style:italic; color:var(--muted-ink);">No articles found in this category yet.</p>';
  } else {
    catArticles.forEach(art => {
      const box = document.createElement('div');
      box.className = 'archive-lightbox';
      box.onclick = () => openArticle(art.id);

      box.innerHTML = `
        <div class="lightbox-content">
          <h3 class="lightbox-title">${art.title}</h3>
          <p class="lightbox-extract">${art.excerpt || art.body.slice(0, 130) + '...'}</p>
        </div>
        <div class="lightbox-meta">
          <div>${art.date}</div>
          <div style="margin-top: 4px; font-weight:700;">Read &rarr;</div>
        </div>
      `;
      archiveList.appendChild(box);
    });
  }

  frontPage.classList.remove('active');
  readerView.classList.remove('active');
  archiveView.classList.add('active');
  siteHeader.classList.add('compact');
  mainLayout.classList.add('full-width');
  frontSidebar.style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function openArticle(articleId) {
  await loadArticlesDatabase();
  const targetArt = allArticles.find(a => a.id === articleId);
  if (!targetArt) return;

  currentCategoryPool = allArticles.filter(a => a.category === targetArt.category);
  currentCategoryIndex = currentCategoryPool.findIndex(a => a.id === articleId);

  displayCurrentArticle();

  frontPage.classList.remove('active');
  archiveView.classList.remove('active');
  readerView.classList.add('active');
  siteHeader.classList.add('compact');
  mainLayout.classList.add('full-width');
  frontSidebar.style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function displayCurrentArticle() {
  const art = currentCategoryPool[currentCategoryIndex];
  if (!art) return;

  document.getElementById('article-category').textContent = art.category.toUpperCase();
  document.getElementById('article-date').textContent = art.date;
  document.getElementById('article-title').textContent = art.title;
  document.getElementById('article-quote').textContent = art.quote || "—";
  document.getElementById('right-essay-tag').textContent = art.category.toUpperCase();

  // Parse Markdown & KaTeX LaTeX formatting inside the body
  const container = document.getElementById('article-body-container');
  container.innerHTML = marked.parse(art.body);

  // Automatically render mathematical formulas using KaTeX
  renderMathInElement(container, {
    delimiters: [
      {left: '$$', right: '$$', display: true},
      {left: '$', right: '$', display: false},
      {left: '\\(', right: '\\)', display: false},
      {left: '\\[', right: '\\]', display: true}
    ],
    throwOnError: false
  });

  document.getElementById('page-num-left').textContent = String((currentCategoryIndex * 2) + 1).padStart(2, '0');
  document.getElementById('page-num-right').textContent = String((currentCategoryIndex * 2) + 2).padStart(2, '0');
  document.getElementById('reading-position').textContent = `${art.category.toUpperCase()} (${currentCategoryIndex + 1} of ${currentCategoryPool.length})`;

  document.getElementById('prev-article').disabled = currentCategoryIndex === 0;
  document.getElementById('next-article').disabled = currentCategoryIndex === currentCategoryPool.length - 1;

  renderTOCList();
}

function renderTOCList(filterQuery = '') {
  const tocList = document.getElementById('toc-articles-list');
  tocList.innerHTML = '';

  const pool = currentCategoryPool.filter(art => {
    if (!filterQuery) return true;
    return art.title.toLowerCase().includes(filterQuery.toLowerCase()) || 
           art.body.toLowerCase().includes(filterQuery.toLowerCase()) ||
           (art.tags && art.tags.some(t => t.toLowerCase().includes(filterQuery.toLowerCase())));
  });

  if (pool.length === 0) {
    tocList.innerHTML = '<div style="font-size:0.75rem; padding:6px; color:#777;">No articles found</div>';
    return;
  }

  pool.forEach(art => {
    const originalIdx = currentCategoryPool.findIndex(a => a.id === art.id);
    const item = document.createElement('div');
    item.className = 'toc-item';
    if (originalIdx === currentCategoryIndex) {
      item.style.borderLeftColor = 'var(--ink-color)';
      item.style.background = 'var(--bg-color)';
    }
    item.onclick = () => {
      currentCategoryIndex = originalIdx;
      displayCurrentArticle();
      document.getElementById('toc-dropdown-panel').classList.remove('active');
    };

    item.innerHTML = `
      <div class="toc-item-title">${art.title}</div>
      <div class="toc-item-meta">${art.date}</div>
    `;
    tocList.appendChild(item);
  });
}

function returnToFront() {
  archiveView.classList.remove('active');
  readerView.classList.remove('active');
  frontPage.classList.add('active');
  siteHeader.classList.remove('compact');
  mainLayout.classList.remove('full-width');
  frontSidebar.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleSearch() {
  await loadArticlesDatabase();
  const query = searchInput.value.toLowerCase().trim();
  
  if (query === '') {
    clearSearchBtn.style.display = 'none';
    searchStatus.textContent = '';
    renderFrontPage(allArticles);
  } else {
    clearSearchBtn.style.display = 'block';
    const matches = allArticles.filter(art => {
      const inTitle = art.title.toLowerCase().includes(query);
      const inBody = art.body.toLowerCase().includes(query);
      const inExcerpt = art.excerpt && art.excerpt.toLowerCase().includes(query);
      const inCategory = art.category.toLowerCase().includes(query);
      const inTags = art.tags && art.tags.some(tag => tag.toLowerCase().includes(query));
      return inTitle || inBody || inExcerpt || inCategory || inTags;
    });
    searchStatus.textContent = `Found ${matches.length} matching result(s)`;
    renderFrontPage(matches);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderFrontPage();

  searchInput.addEventListener('input', handleSearch);
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    handleSearch();
  });

  document.getElementById('home-btn').onclick = returnToFront;
  document.getElementById('site-title').onclick = returnToFront;
  document.getElementById('back-to-front').onclick = returnToFront;
  document.getElementById('archive-back-btn').onclick = returnToFront;

  document.getElementById('prev-article').onclick = () => {
    if (currentCategoryIndex > 0) {
      currentCategoryIndex--;
      displayCurrentArticle();
    }
  };

  document.getElementById('next-article').onclick = () => {
    if (currentCategoryIndex < currentCategoryPool.length - 1) {
      currentCategoryIndex++;
      displayCurrentArticle();
    }
  };

  const tocBtn = document.getElementById('toc-toggle-btn');
  const tocPanel = document.getElementById('toc-dropdown-panel');
  tocBtn.onclick = (e) => {
    e.stopPropagation();
    tocPanel.classList.toggle('active');
    if (tocPanel.classList.contains('active')) {
      renderTOCList();
    }
  };

  document.addEventListener('click', (e) => {
    if (!tocPanel.contains(e.target) && e.target !== tocBtn) {
      tocPanel.classList.remove('active');
    }
  });

  const readerSearchInput = document.getElementById('reader-search-input');
  readerSearchInput.addEventListener('input', (e) => {
    renderTOCList(e.target.value.trim());
  });
});