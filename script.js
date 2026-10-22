// Global State
let currentArticleIndex = 0;
let filteredArticles = [...articles];

// DOM Elements
const frontPage = document.getElementById('front-page');
const readerView = document.getElementById('reader-view');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const searchStatus = document.getElementById('search-status');

// Render All Columns on Front Page
function renderFrontPage() {
  const categories = ['philosophy', 'physics', 'mathematics'];
  
  categories.forEach(cat => {
    const listElem = document.getElementById(`list-${cat}`);
    const countElem = document.getElementById(`count-${cat}`);
    
    // Filter articles for this column matching active search
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

// Open Article Reader Spread View
function openArticle(articleId) {
  const index = filteredArticles.findIndex(a => a.id === articleId);
  if (index !== -1) {
    currentArticleIndex = index;
    displayCurrentArticle();
    frontPage.classList.remove('active');
    readerView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Display Active Article in Book Spread Format
function displayCurrentArticle() {
  const art = filteredArticles[currentArticleIndex];
  if (!art) return;

  document.getElementById('article-category').textContent = art.category.toUpperCase();
  document.getElementById('article-date').textContent = art.date;
  document.getElementById('article-title').textContent = art.title;
  document.getElementById('article-quote').textContent = art.quote || "—";

  // Process Paragraphs
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
  document.getElementById('page-num-left').textContent = String((currentArticleIndex * 2) + 1).padStart(2, '0');
  document.getElementById('page-num-right').textContent = String((currentArticleIndex * 2) + 2).padStart(2, '0');
  document.getElementById('reading-position').textContent = `Article ${currentArticleIndex + 1} of ${filteredArticles.length}`;

  // Update Nav Buttons State
  document.getElementById('prev-article').disabled = currentArticleIndex === 0;
  document.getElementById('next-article').disabled = currentArticleIndex === filteredArticles.length - 1;
}

// Search Filtering (Searches Title, Body Text, and Hidden Tags)
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
  document.getElementById('home-btn').onclick = () => {
    readerView.classList.remove('active');
    frontPage.classList.add('active');
  };

  document.getElementById('back-to-front').onclick = () => {
    readerView.classList.remove('active');
    frontPage.classList.add('active');
  };

  document.getElementById('site-title').onclick = () => {
    readerView.classList.remove('active');
    frontPage.classList.add('active');
  };

  document.getElementById('prev-article').onclick = () => {
    if (currentArticleIndex > 0) {
      currentArticleIndex--;
      displayCurrentArticle();
    }
  };

  document.getElementById('next-article').onclick = () => {
    if (currentArticleIndex < filteredArticles.length - 1) {
      currentArticleIndex++;
      displayCurrentArticle();
    }
  };

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

    // Automatically open newly drafted article
    openArticle(newArt.id);
  };
});