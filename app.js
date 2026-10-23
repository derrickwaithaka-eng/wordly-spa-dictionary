const API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

// DOM Elements
const searchForm = document.getElementById('search-form');
const wordInput = document.getElementById('word-input');
const statusMessage = document.getElementById('status-message');
const resultsContainer = document.getElementById('results-container');
const wordTitle = document.getElementById('word-title');
const phoneticText = document.getElementById('phonetic-text');
const audioBtn = document.getElementById('audio-btn');
const favoriteBtn = document.getElementById('favorite-btn');
const meaningsContainer = document.getElementById('meanings-container');
const sourceLink = document.getElementById('source-link');
const favoritesList = document.getElementById('favorites-list');
const themeToggle = document.getElementById('theme-toggle');

let currentWordData = null;
let audioUrl = '';
let savedWords = JSON.parse(localStorage.getItem('wordly_favorites')) || [];

// Event Listeners
searchForm.addEventListener('submit', handleSearch);
themeToggle.addEventListener('click', toggleTheme);
audioBtn.addEventListener('click', playAudio);
favoriteBtn.addEventListener('click', toggleFavorite);

// Initialize Saved Words on Load
renderFavorites();

async function handleSearch(e) {
  e.preventDefault();
  const query = wordInput.value.trim();

  if (!query) return;

  clearUI();
  showStatus('Searching...');

  try {
    const response = await fetch(`${API_URL}${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Word not found. Please try another search.');
    }

    const data = await response.json();
    currentWordData = data[0];
    displayResults(currentWordData);
  } catch (error) {
    showStatus(error.message, true);
  }
}

function displayResults(data) {
  clearStatus();
  resultsContainer.classList.remove('hidden');

  wordTitle.textContent = data.word;

  // Find phonetic text
  const phonetic = data.phonetic || (data.phonetics.find(p => p.text)?.text) || 'N/A';
  phoneticText.textContent = phonetic;

  // Find audio stream
  const audioObj = data.phonetics.find(p => p.audio && p.audio.length > 0);
  if (audioObj) {
    audioUrl = audioObj.audio;
    audioBtn.classList.remove('hidden');
  } else {
    audioBtn.classList.add('hidden');
  }

  // Update Favorite Button State
  updateFavoriteIcon(data.word);

  // Render Meanings
  meaningsContainer.innerHTML = '';
  data.meanings.forEach(meaning => {
    const block = document.createElement('div');
    block.className = 'meaning-block';

    const pos = document.createElement('div');
    pos.className = 'part-of-speech';
    pos.textContent = meaning.partOfSpeech;
    block.appendChild(pos);

    const ul = document.createElement('ul');
    ul.className = 'definitions';

    meaning.definitions.slice(0, 3).forEach(def => {
      const li = document.createElement('li');
      li.textContent = def.definition;
      if (def.example) {
        const exampleDiv = document.createElement('div');
        exampleDiv.className = 'example';
        exampleDiv.textContent = `"${def.example}"`;
        li.appendChild(exampleDiv);
      }
      ul.appendChild(li);
    });
    block.appendChild(ul);

    // Display Synonyms if available
    if (meaning.synonyms && meaning.synonyms.length > 0) {
      const synonymsDiv = document.createElement('div');
      synonymsDiv.className = 'synonyms';
      synonymsDiv.innerHTML = '<strong>Synonyms: </strong>';
      meaning.synonyms.slice(0, 5).forEach(syn => {
        const span = document.createElement('span');
        span.className = 'synonym-tag';
        span.textContent = syn;
        span.addEventListener('click', () => {
          wordInput.value = syn;
          handleSearch(new Event('submit'));
        });
        synonymsDiv.appendChild(span);
      });
      block.appendChild(synonymsDiv);
    }

    meaningsContainer.appendChild(block);
  });

  // Display Source Link
  if (data.sourceUrls && data.sourceUrls.length > 0) {
    sourceLink.href = data.sourceUrls[0];
    sourceLink.textContent = data.sourceUrls[0];
  }
}

function playAudio() {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play();
  }
}

function toggleFavorite() {
  if (!currentWordData) return;
  const word = currentWordData.word;

  if (savedWords.includes(word)) {
    savedWords = savedWords.filter(w => w !== word);
  } else {
    savedWords.push(word);
  }

  localStorage.setItem('wordly_favorites', JSON.stringify(savedWords));
  updateFavoriteIcon(word);
  renderFavorites();
}

function updateFavoriteIcon(word) {
  const icon = favoriteBtn.querySelector('i');
  if (savedWords.includes(word)) {
    icon.className = 'fa-solid fa-bookmark';
  } else {
    icon.className = 'fa-regular fa-bookmark';
  }
}

function renderFavorites() {
  favoritesList.innerHTML = '';
  if (savedWords.length === 0) {
    favoritesList.innerHTML = '<li style="color: var(--text-secondary); font-size: 0.9rem;">No saved words yet.</li>';
    return;
  }

  savedWords.forEach(word => {
    const li = document.createElement('li');
    li.className = 'favorite-item';
    li.innerHTML = `<span>${word}</span> <i class="fa-solid fa-xmark remove-btn"></i>`;
    
    // Click word to search
    li.querySelector('span').addEventListener('click', () => {
      wordInput.value = word;
      handleSearch(new Event('submit'));
    });

    // Click 'x' to remove
    li.querySelector('.remove-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      savedWords = savedWords.filter(w => w !== word);
      localStorage.setItem('wordly_favorites', JSON.stringify(savedWords));
      renderFavorites();
      if (currentWordData && currentWordData.word === word) {
        updateFavoriteIcon(word);
      }
    });

    favoritesList.appendChild(li);
  });
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const icon = themeToggle.querySelector('i');

  if (currentTheme === 'dark') {
    document.body.removeAttribute('data-theme');
    icon.className = 'fa-solid fa-moon';
  } else {
    document.body.setAttribute('data-theme', 'dark');
    icon.className = 'fa-solid fa-sun';
  }
}

function showStatus(msg, isError = false) {
  statusMessage.textContent = msg;
  statusMessage.className = `status-message ${isError ? 'error' : ''}`;
}

function clearStatus() {
  statusMessage.textContent = '';
  statusMessage.className = 'status-message';
}

function clearUI() {
  clearStatus();
  resultsContainer.classList.add('hidden');
}