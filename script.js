// Global State
let currentCategoryPool = [];
let currentCategoryIndex = 0;
let filteredArticles = [...articles];

// DOM Elements
const frontPage = document.getElementById('front-page');
const readerView = document.getElementById('reader-view');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const searchStatus = document.getElementById('search-status');
const siteHeader = document.getElementById('site-header-container');
const mainLayout = document.getElementById('main-layout');
const frontSidebar = document.getElementById('front-sidebar');

// Render All Columns on Front Page
function renderFrontPage() {
  const categories = ['philosophy', 'physics', 'mathematics'];
  
  categories.forEach(cat => {
    const listElem = document.getElementById(`list-${cat}`);
    const countElem = document.getElementById(`count-${cat}`);
    
    const catArticles = filteredArticles.filter(a => a.category === cat);
    
    countElem.textContent = catArticles.length;
    listElem.innerHTML = '';

    if (catArticles.length === 0) {
      listElem.innerHTML = '<p class="card-snippet" style="font-style:italic;">No articles found.</p>';
      return;
    }

    catArticles.forEach(art => {
      const card = document.createElement('article');
      card.className = 'article-card';
      card.onclick = () => openArticle(art.id);

      card.innerHTML = `
        <h3 class="card-title">${art.title}</h3>
        <p class="card-snippet">${art.body.slice(0, 110)}...</p>
        <div class="card-meta">${art.date}</div>
      `;
      listElem.appendChild(card);
    });
  });
}

// Open Article Reader Spread View (Restricts rotation pool strictly to that category)
function openArticle(articleId) {
  const targetArt = articles.find(a => a.id === articleId);
  if (!targetArt) return;

  // Filter pool strictly by the selected article's category
  currentCategoryPool = articles.filter(a => a.category === targetArt.category);
  currentCategoryIndex = currentCategoryPool.findIndex(a => a.id === articleId);

  displayCurrentArticle();

  // Transition UI: Shrink masthead, hide sidebar, expand reader focus
  frontPage.classList.remove('active');
  readerView.classList.add('active');
  siteHeader.classList.add('compact');
  mainLayout.classList.add('full-width');
  frontSidebar.style.display = 'none';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Display Active Article in Book Spread Format
function displayCurrentArticle() {
  const art = currentCategoryPool[currentCategoryIndex];
  if (!art) return;

  document.getElementById('article-category').textContent = art.category.toUpperCase();
  document.getElementById('article-date').textContent = art.date;
  document.getElementById('article-title').textContent = art.title;
  document.getElementById('article-quote').textContent = art.quote || "—";
  document.getElementById('right-essay-tag').textContent = art.category.toUpperCase();

  // Process Paragraphs for Center-Aligned Column
  const container = document.getElementById('article-body-container');
  container.innerHTML = '';
  const paragraphs = art.body.split('\n\n');
  paragraphs.forEach(pText => {
    if (pText.trim()) {
      const p = document.createElement('p');
      p.textContent = pText;
      container.appendChild(p);
    }
  });

  // Page Numbers & Position Indicator
  document.getElementById('page-num-left').textContent = String((currentCategoryIndex * 2) + 1).padStart(2, '0');
  document.getElementById('page-num-right').textContent = String((currentCategoryIndex * 2) + 2).padStart(2, '0');
  document.getElementById('reading-position').textContent = `${art.category.toUpperCase()} (${currentCategoryIndex + 1} of ${currentCategoryPool.length})`;

  // Update Nav Buttons State (Rotates within the same category compartment)
  document.getElementById('prev-article').disabled = currentCategoryIndex === 0;
  document.getElementById('next-article').disabled = currentCategoryIndex === currentCategoryPool.length - 1;

  // Update Table of Contents list highlight
  renderTOCList();
}

// Render Table of Contents inside collapsible menu
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

// Return to Newspaper Front Page
function returnToFront() {
  readerView.classList.remove('active');
  frontPage.classList.add('active');
  siteHeader.classList.remove('compact');
  mainLayout.classList.remove('full-width');
  frontSidebar.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Search Filtering on Front Page
function handleSearch() {
  const query = searchInput.value.toLowerCase().trim();
  
  if (query === '') {
    filteredArticles = [...articles];
    clearSearchBtn.style.display = 'none';
    searchStatus.textContent = '';
  } else {
    clearSearchBtn.style.display = 'block';
    filteredArticles = articles.filter(art => {
      const inTitle = art.title.toLowerCase().includes(query);
      const inBody = art.body.toLowerCase().includes(query);
      const inCategory = art.category.toLowerCase().includes(query);
      const inTags = art.tags && art.tags.some(tag => tag.toLowerCase().includes(query));
      return inTitle || inBody || inCategory || inTags;
    });
    searchStatus.textContent = `Found ${filteredArticles.length} matching result(s)`;
  }
  
  renderFrontPage();
}

// Event Listeners Initialization
document.addEventListener('DOMContentLoaded', () => {
  renderFrontPage();

  // Search Input Listener
  searchInput.addEventListener('input', handleSearch);
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    handleSearch();
  });

  // Navigation Buttons
  document.getElementById('home-btn').onclick = returnToFront;
  document.getElementById('back-to-front').onclick = returnToFront;
  document.getElementById('site-title').onclick = returnToFront;

  // Compartment Rotation (Next / Prev within Category)
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

  // TOC Dropdown Toggle
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

  // Reader TOC Search Filter
  const readerSearchInput = document.getElementById('reader-search-input');
  readerSearchInput.addEventListener('input', (e) => {
    renderTOCList(e.target.value.trim());
  });

  // Modal Handlers
  const modalOverlay = document.getElementById('modal-overlay');
  document.getElementById('add-article-btn').onclick = () => modalOverlay.classList.add('active');
  document.getElementById('close-modal').onclick = () => modalOverlay.classList.remove('active');
  document.getElementById('cancel-form').onclick = () => modalOverlay.classList.remove('active');

  // New Article Form Submit
  document.getElementById('article-form').onsubmit = (e) => {
    e.preventDefault();
    
    const title = document.getElementById('form-title').value;
    const category = document.getElementById('form-category').value;
    const date = document.getElementById('form-date').value || 'OCTOBER 2026';
    const quote = document.getElementById('form-quote').value;
    const body = document.getElementById('form-content').value;
    const tagsRaw = document.getElementById('form-tags').value;
    
    const tags = tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(t => t);

    const newArt = {
      id: 'art_' + Date.now(),
      category,
      title: title.toUpperCase(),
      date,
      quote,
      body,
      tags
    };

    articles.unshift(newArt);
    filteredArticles = [...articles];
    
    renderFrontPage();
    modalOverlay.classList.remove('active');
    document.getElementById('article-form').reset();

    // Open newly drafted article
    openArticle(newArt.id);
  };
});