import { useState, useEffect, useMemo } from 'react';
import './App.css';

// Language → color mapping
const languageColor = (lang) => {
  const map = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
    Java: '#b07219', Go: '#00ADD8', Rust: '#dea584', C: '#555555',
    'C++': '#f34b7d', 'C#': '#178600', Ruby: '#701516', PHP: '#4F5D95',
    Swift: '#F05138', Kotlin: '#A97BFF', HTML: '#e34c26', CSS: '#563d7c',
    Shell: '#89e051', Vue: '#41b883', Svelte: '#ff3e00', Dart: '#00B4AB',
  };
  return map[lang] || '#8b949e';
};

function App() {
  // ---------- State ----------
  const [username, setUsername] = useState('');   // input starts empty
  const [query, setQuery] = useState('');         // nothing fetched on load     
  const [repos, setRepos] = useState([]);                 // RAW repos from API
  const [sortBy, setSortBy] = useState('stars');          // 🡐 lifted state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ---------- useEffect: Data Fetching ----------
  useEffect(() => {
    if (!query) return;

    const controller = new AbortController();

    const fetchRepos = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch(
          `https://api.github.com/users/${encodeURIComponent(query)}/repos?per_page=100&sort=updated`,
          { signal: controller.signal }
        );
        if (res.status === 404) throw new Error(`User "${query}" not found on GitHub.`);
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        const data = await res.json();
        setRepos(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to fetch repositories.');
          setRepos([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepos();
    return () => controller.abort();   // cleanup on unmount / new query
  }, [query]);

  // ---------- Derived (sorted) data via useMemo ----------
  const sortedRepos = useMemo(() => {
    const copy = [...repos];
    switch (sortBy) {
      case 'stars':
        return copy.sort((a, b) => b.stargazers_count - a.stargazers_count);
      case 'recent':
        return copy.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      case 'name':
        return copy.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );
      default:
        return copy;
    }
  }, [repos, sortBy]);

  // ---------- Handlers ----------
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed) setQuery(trimmed);
  };

  // ---------- Render ----------
  return (
    <div className="app">
      <header className="header">
        <h1>
          <svg height="30" width="30" viewBox="0 0 16 16" fill="#24292f">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          Repo Explorer
        </h1>
      </header>

      <form className="control-bar" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="GitHub username (e.g. vercel)"
          />
          <button type="submit">Fetch repos</button>
        </div>

        <div className="sort-wrapper">
          <label htmlFor="sortSelect">Sort by</label>
          <select
            id="sortSelect"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}  // 🡐 lifted state update
          >
            <option value="stars">⭐ Stars (high → low)</option>
            <option value="recent">🕒 Recently updated</option>
            <option value="name">🔤 Name (A → Z)</option>
          </select>
        </div>
      </form>

      {isLoading && (
        <div className="status"><span className="spinner" /> Loading repositories…</div>
      )}
      {error && <div className="error">{error}</div>}

      {!isLoading && !error && (
        <>
          {sortedRepos.length > 0 && (
            <div className="status">
              Showing {sortedRepos.length} repos · sorted by {sortBy}
            </div>
          )}

          <div className="repo-grid">
            {sortedRepos.length === 0 ? (
              <div className="empty-state">
                <strong>No repositories to show</strong><br />
                Try another username.
              </div>
            ) : (
              sortedRepos.map((repo) => (
                <a
                  key={repo.id}
                  className="repo-card"
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="repo-name">{repo.name}</div>
                  <div className="repo-desc">
                    {repo.description || 'No description provided.'}
                  </div>
                  <div className="repo-meta">
                    <span className="stars">
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
                      </svg>
                      {repo.stargazers_count.toLocaleString()}
                    </span>
                    <span className="lang">
                      <span
                        className="lang-dot"
                        style={{ background: languageColor(repo.language) }}
                      />
                      {repo.language || 'Unknown'}
                    </span>
                  </div>
                </a>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;