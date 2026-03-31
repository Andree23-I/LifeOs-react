import React, { useState, useEffect, useContext } from 'react';
import './Music.css';
import { SettingsContext } from '../contexts/SettingsContext';
import { translations } from '../translations';

const SPOTIFY_CLIENT_ID = '86510d6ae01b450daf5d6103ca421df9';
const REDIRECT_URI = 'https://andree23-i.github.io/LifeOs-react/';
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const SCOPES = [
    "user-read-currently-playing",
    "user-read-recently-played",
    "user-top-read",
    "playlist-read-private"
].join("%20");

// PKCE Helpers
const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(values).map((x) => possible[x % possible.length]).join('');
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
    const [spotifyUser, setSpotifyUser] = useState(null);
    const [topTracks, setTopTracks] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleAuth = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            let code = urlParams.get('code');
            let storedToken = window.localStorage.getItem("spotify_token");

            if (storedToken) {
                setToken(storedToken);
                fetchSpotifyData(storedToken);
                return;
            }

            if (code) {
                const codeVerifier = window.localStorage.getItem('code_verifier');
                
                const payload = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        client_id: SPOTIFY_CLIENT_ID,
                        grant_type: 'authorization_code',
                        code,
                        redirect_uri: REDIRECT_URI,
                        code_verifier: codeVerifier,
                    }),
                };

                try {
                    const res = await fetch(TOKEN_ENDPOINT, payload);
                    const data = await res.json();
                    if (data.access_token) {
                        window.localStorage.setItem("spotify_token", data.access_token);
                        setToken(data.access_token);
                        fetchSpotifyData(data.access_token);
                        // Pulisce l'URL
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                } catch (error) {
                    console.error("Error exchanging code for token:", error);
                }
            }
        };

        handleAuth();
    }, []);

    const fetchSpotifyData = async (token) => {
        setLoading(true);
        try {
            // Fetch User Profile
            const userRes = await fetch("https://api.spotify.com/v1/me", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (userRes.status === 401) {
                logout();
                return;
            }
            const userData = await userRes.json();
            setSpotifyUser(userData);

            // Fetch Top Tracks
            const tracksRes = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=5", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const tracksData = await tracksRes.json();
            setTopTracks(tracksData.items || []);
        } catch (error) {
            console.error("Error fetching Spotify data:", error);
        } finally {
            setLoading(false);
        }
    };

    const searchTracks = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;
        
        setLoading(true);
        try {
            const res = await fetch(`https://api.spotify.com/v1/search?q=${searchQuery}&type=track&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setSearchResults(data.tracks.items || []);
        } catch (error) {
            console.error("Error searching tracks:", error);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setToken("");
        setSpotifyUser(null);
        setTopTracks([]);
        setSearchResults([]);
        setSearchQuery("");
        window.localStorage.removeItem("spotify_token");
        window.localStorage.removeItem("code_verifier");
    };

    const handleLogin = async () => {
        const codeVerifier = generateRandomString(128);
        const hashed = await sha256(codeVerifier);
        const codeChallenge = base64encode(hashed);

        window.localStorage.setItem('code_verifier', codeVerifier);

        const params = {
            response_type: 'code',
            client_id: SPOTIFY_CLIENT_ID,
            scope: SCOPES.replace(/%20/g, ' '),
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            redirect_uri: REDIRECT_URI,
        };

        const authUrl = new URL(AUTH_ENDPOINT);
        authUrl.search = new URLSearchParams(params).toString();
        window.location.href = authUrl.toString();
    };

    return (
        <div className="music-container">
            <header className="music-header">
                <h2>{t.Music || 'Music'}</h2>
                <p>{t.MusicSub || 'Connect your Spotify to see your favorite tracks.'}</p>
            </header>

            {!token ? (
                <div className="spotify-login-section">
                    <div className="spotify-card">
                        <div className="spotify-logo">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="#1DB954">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.508 17.302c-.218.358-.684.474-1.042.255-2.853-1.743-6.444-2.138-10.672-1.171-.409.092-.817-.16-.909-.569-.092-.408.16-.817.569-.909 4.636-1.06 8.604-.616 11.797 1.336.358.218.474.684.257 1.042zm1.472-3.255c-.274.446-.859.591-1.305.317-3.264-2.006-8.239-2.59-12.099-1.417-.501.152-1.026-.135-1.178-.637-.152-.501.135-1.026.637-1.178 4.414-1.34 9.904-.683 13.629 1.609.445.274.59.859.316 1.306zm.126-3.414C15.222 8.232 8.815 8.02 5.093 9.15c-.582.176-1.196-.156-1.373-.738-.176-.582.156-1.196.738-1.373 4.258-1.293 11.336-1.053 15.82 1.61.523.311.693.987.382 1.51-.311.523-.987.693-1.51.382z"/>
                            </svg>
                        </div>
                        <h3>Spotify</h3>
                        <p>{t.SpotifyLoginDesc || 'Connect to your Spotify account to see your stats.'}</p>
                        <button onClick={handleLogin} className="spotify-btn">
                            Login with Spotify
                        </button>
                    </div>
                </div>
            ) : (
                <div className="spotify-content">
                    {loading ? (
                        <div className="loader">Loading...</div>
                    ) : (
                        <>
                            {spotifyUser && (
                                <div className="spotify-profile">
                                    <img src={spotifyUser.images?.[0]?.url || 'https://via.placeholder.com/150'} alt="Profile" className="profile-img" />
                                    <div className="profile-info">
                                        <h3>{spotifyUser.display_name}</h3>
                                        <p>{spotifyUser.followers?.total} followers</p>
                                        <button onClick={logout} className="logout-link">Logout</button>
                                    </div>
                                </div>
                            )}

                            <div className="search-section">
                                <form onSubmit={searchTracks} className="search-bar">
                                    <input 
                                        type="text" 
                                        placeholder={t.SearchPlaceholder || "Search for a song..."} 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <button type="submit">{t.Search || "Search"}</button>
                                </form>
                                {searchResults.length > 0 && (
                                    <div className="search-results">
                                        <h3>{t.SearchResults || "Search Results"}</h3>
                                        <div className="tracks-grid">
                                            {searchResults.map(track => (
                                                <div key={track.id} className="track-card">
                                                    <img src={track.album.images[0]?.url} alt={track.name} />
                                                    <div className="track-details">
                                                        <span className="track-name">{track.name}</span>
                                                        <span className="track-artist">{track.artists.map(a => a.name).join(", ")}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="tracks-section">
                                <h3>{t.TopTracks || 'Your Top Tracks'}</h3>
                                <div className="tracks-grid">
                                    {topTracks.map(track => (
                                        <div key={track.id} className="track-card">
                                            <img src={track.album.images[0]?.url} alt={track.name} />
                                            <div className="track-details">
                                                <span className="track-name">{track.name}</span>
                                                <span className="track-artist">{track.artists.map(a => a.name).join(", ")}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {topTracks.length === 0 && <p>No tracks found.</p>}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default Music;
