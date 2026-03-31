import React, { useState, useEffect, useContext } from 'react';
import './Music.css';
import { SettingsContext } from '../contexts/SettingsContext';
import { translations } from '../translations';

const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID || 'a29bdebfec8a4eada4c40228bb1335c7';
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI || 'https://andree23-i.github.io/LifeOs-react/';
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const RESPONSE_TYPE = "code";
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-top-read",
  "user-library-read",
  "playlist-read-private",
  "playlist-read-collaborative",
  "search-library"
].join(" ");

const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

function Music({ user }) {
  const { language } = useContext(SettingsContext);
  const t = translations[language];
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [spotifyUser, setSpotifyUser] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const savedToken = window.localStorage.getItem("spotify_token");

      if (savedToken) {
        setToken(savedToken);
        fetchSpotifyData(savedToken);
        return;
      }

      if (code) {
        setLoading(true);
        const codeVerifier = window.localStorage.getItem('spotify_code_verifier');
        
        try {
          const payload = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: CLIENT_ID,
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: REDIRECT_URI,
              code_verifier: codeVerifier,
            }),
          };

          const response = await fetch(TOKEN_ENDPOINT, payload);
          const data = await response.json();

          if (data.access_token) {
            window.localStorage.setItem("spotify_token", data.access_token);
            setToken(data.access_token);
            fetchSpotifyData(data.access_token);
            // Pulisce l'URL mantenendo il path corretto per GitHub Pages
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          } else {
            setError("Errore durante lo scambio del codice. Riprova il login.");
          }
        } catch (error) {
          console.error("Auth error:", error);
          setError("Errore di connessione con Spotify.");
        } finally {
          setLoading(false);
        }
      }
    };

    handleCallback();
  }, []);

  // Debounce per la ricerca - versione semplificata
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const currentToken = window.localStorage.getItem("spotify_token");
    if (!currentToken) {
      console.warn("Token non trovato in localStorage");
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        console.log("Ricercando:", searchQuery);
        const headers = { Authorization: `Bearer ${currentToken}` };
        const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=20`;
        console.log("URL:", url);
        
        const response = await fetch(url, { headers });
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`Spotify API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Results found:", data.tracks?.items?.length);
        setSearchResults(data.tracks?.items || []);
      } catch (error) {
        console.error("Search error:", error);
        setError("Errore nella ricerca: " + error.message);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchSpotifyData = async (accessToken) => {
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      
      // Fetch Profile
      const profileRes = await fetch('https://api.spotify.com/v1/me', { headers });
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      const profileData = await profileRes.json();
      setSpotifyUser(profileData);

      // Fetch Top Tracks
      const tracksRes = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=50', { headers });
      if (tracksRes.ok) {
        const tracksData = await tracksRes.json();
        setTopTracks(tracksData.items || []);
      }

      // Fetch Playlists
      const playlistsRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', { headers });
      if (playlistsRes.ok) {
        const playlistsData = await playlistsRes.json();
        console.log("Playlists received:", playlistsData.items?.length);
        setPlaylists(playlistsData.items || []);
      } else {
        console.error("Playlists fetch failed:", await playlistsRes.text());
        setError("Impossibile caricare le playlist. Prova a ricollegare Spotify.");
      }

    } catch (error) {
      console.error("Data fetch error:", error);
      setError("Sessione scaduta o errore nei permessi. Effettua nuovamente il login.");
      // Se il token è invalido, resettiamo tutto
      if (error.message.includes('401') || error.message.includes('profile')) {
        handleSpotifyLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSpotifyLogin = async () => {
    setError(null);
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);
    window.localStorage.setItem('spotify_code_verifier', codeVerifier);

    const params = {
      response_type: RESPONSE_TYPE,
      client_id: CLIENT_ID,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: REDIRECT_URI,
    };

    const authUrl = new URL(AUTH_ENDPOINT);
    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
  };

  const handleSpotifyLogout = () => {
    setToken("");
    setSpotifyUser(null);
    setTopTracks([]);
    setPlaylists([]);
    setSearchResults([]);
    setSearchQuery("");
    setError(null);
    window.localStorage.removeItem("spotify_token");
    window.localStorage.removeItem("spotify_code_verifier");
  };

  const searchTracks = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    if (!token) {
      console.warn("Token non disponibile per la ricerca");
      return;
    }

    setIsSearching(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
        { headers }
      );
      
      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
      }
      
      const data = await response.json();
      setSearchResults(data.tracks?.items || []);
    } catch (error) {
      console.error("Search error:", error);
      setError("Errore nella ricerca. Riprova.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  return (
    <div className="music-container fade-in">
      <header className="page-header">
        <h1>{t.Music}</h1>
        <p className="subtitle">{t.MusicSub}</p>
      </header>

      {error && (
        <div className="music-error-banner glass-panel">
          <p>{error}</p>
          <button className="btn-primary" onClick={handleSpotifyLogout}>Ricollega Spotify</button>
        </div>
      )}

      <div className="music-content">
        {loading && !spotifyUser ? (
          <div className="glass-panel spotify-card">
            <div className="loading-spinner"></div>
            <p>Connessione in corso...</p>
          </div>
        ) : !token ? (
          <div className="glass-panel spotify-card">
            <div className="spotify-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.31c-.218.358-.684.47-1.042.252-2.822-1.722-6.375-2.113-10.562-1.158-.41.093-.814-.162-.907-.572-.093-.41.162-.814.572-.907 4.588-1.048 8.523-.598 11.687 1.334.358.218.47.684.252 1.042zm1.47-3.255c-.275.446-.856.587-1.303.312-3.232-1.987-8.16-2.56-11.982-1.398-.503.153-1.037-.134-1.19-.637-.153-.503.134-1.037.637-1.19 4.37-1.326 9.79-.675 13.523 1.61.446.275.587.856.312 1.303zm.127-3.39c-3.876-2.302-10.278-2.513-14.004-1.382-.594.18-1.224-.162-1.404-.756-.18-.594.162-1.224.756-1.404 4.283-1.3 11.353-1.046 15.82 1.604.533.317.708 1.005.391 1.538-.317.533-1.005.708-1.538.391z"/></svg>
            </div>
            <h3>Spotify</h3>
            <p className="subtitle">{t.SpotifyLoginDesc}</p>
            <button className="btn-primary" onClick={handleSpotifyLogin}>Connect Spotify</button>
          </div>
        ) : (
          <div className="glass-panel spotify-card connected compact-profile">
            <div className="profile-main">
              {spotifyUser?.images?.[0] ? (
                <img src={spotifyUser.images[0].url} alt="Profile" className="spotify-profile-img" />
              ) : (
                <div className="spotify-icon"><svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.31c-.218.358-.684.47-1.042.252-2.822-1.722-6.375-2.113-10.562-1.158-.41.093-.814-.162-.907-.572-.093-.41.162-.814.572-.907 4.588-1.048 8.523-.598 11.687 1.334.358.218.47.684.252 1.042zm1.47-3.255c-.275.446-.856.587-1.303.312-3.232-1.987-8.16-2.56-11.982-1.398-.503.153-1.037-.134-1.19-.637-.153-.503.134-1.037.637-1.19 4.37-1.326 9.79-.675 13.523 1.61.446.275.587.856.312 1.303zm.127-3.39c-3.876-2.302-10.278-2.513-14.004-1.382-.594.18-1.224-.162-1.404-.756-.18-.594.162-1.224.756-1.404 4.283-1.3 11.353-1.046 15.82 1.604.533.317.708 1.005.391 1.538-.317.533-1.005.708-1.538.391z"/></svg></div>
              )}
              <div className="profile-info">
                <h3>{spotifyUser?.display_name || 'Connected'}</h3>
                <p className="user-email">{spotifyUser?.email}</p>
              </div>
            </div>
            <button className="btn-secondary btn-sm" onClick={handleSpotifyLogout}>Disconnetti</button>
          </div>
        )}

        {token && (
          <>
            <div className="glass-panel search-section">
              <input
                type="text"
                placeholder="Cerca canzoni, artisti..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>

            {searchQuery && (
              <div className="glass-panel music-section search-results-section">
                <div className="section-header">
                  <h2>Risultati ricerca ({searchResults.length})</h2>
                </div>
                <div className="vertical-slider tracks-list">
                  {searchResults.map(track => (
                    <div key={track.id} className="track-item-v">
                      <img src={track.album.images[2]?.url || track.album.images[1]?.url || 'https://via.placeholder.com/48'} alt={track.name} />
                      <div className="track-info">
                        <span className="track-name">{track.name}</span>
                        <span className="track-artist">{track.artists[0].name}</span>
                      </div>
                      <div className="play-btn-v">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                  ))}
                  {!isSearching && searchResults.length === 0 && <p className="empty-state">Nessun risultato trovato.</p>}
                </div>
              </div>
            )}

            <div className="music-sections">
            <div className="glass-panel music-section tracks-section">
              <div className="section-header">
                <h2>{t.TopTracks}</h2>
                <button className="refresh-btn" onClick={() => fetchSpotifyData(token)} title="Aggiorna">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                </button>
              </div>
              <div className="vertical-slider tracks-list">
                {topTracks.map(track => (
                  <div key={track.id} className="track-item-v">
                    <img src={track.album.images[2]?.url || track.album.images[1]?.url} alt={track.name} />
                    <div className="track-info">
                      <span className="track-name">{track.name}</span>
                      <span className="track-artist">{track.artists[0].name}</span>
                    </div>
                    <div className="play-btn-v">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                ))}
                {!loading && topTracks.length === 0 && <p className="empty-state">{t.noRecentActivity}</p>}
              </div>
            </div>

            <div className="glass-panel music-section playlists-section">
              <div className="section-header">
                <h2>Playlist</h2>
                <button className="refresh-btn" onClick={() => fetchSpotifyData(token)} title="Aggiorna">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                </button>
              </div>
              <div className="vertical-slider playlists-list">
                {playlists.map(pl => (
                  <div key={pl.id} className="track-item-v">
                    <img src={pl.images[0]?.url || 'https://via.placeholder.com/150'} alt={pl.name} />
                    <div className="track-info">
                      <span className="track-name">{pl.name}</span>
                      <span className="track-artist">{(pl.tracks && typeof pl.tracks.total !== 'undefined') ? `${pl.tracks.total} brani` : 'Vedi playlist'}</span>
                    </div>
                    <div className="play-btn-v">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                ))}
                {!loading && playlists.length === 0 && <p className="empty-state">Nessuna playlist trovata.</p>}
              </div>
            </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Music;
