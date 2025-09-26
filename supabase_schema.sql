-- ArtistFindr Database Schema for Supabase
-- This file contains the complete database schema needed to recreate your ArtistFindr project in Supabase

-- Enable Row Level Security (RLS) on all tables
-- Note: You'll need to configure RLS policies based on your authentication needs

-- ============================================================================
-- Table: playlist
-- Stores Spotify playlists scraped from Reddit via the scrape_playlist webhook
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.playlist (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    playlistID TEXT NOT NULL UNIQUE, -- Spotify playlist ID (used as unique identifier)
    curator TEXT, -- Playlist creator's name (can be "Unknown")
    playlistImage TEXT, -- URL to playlist cover image or placeholder
    playlistLink TEXT, -- Spotify playlist URL
    genre TEXT -- Genre from the scrape request (Lo-Fi, RnB, Hip Hop, etc.)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_playlist_playlistid ON public.playlist(playlistID);
CREATE INDEX IF NOT EXISTS idx_playlist_created_at ON public.playlist(created_at);
CREATE INDEX IF NOT EXISTS idx_playlist_genre ON public.playlist(genre);

-- ============================================================================
-- Table: artist
-- Stores Spotify artists found within playlists via the find_artist webhook
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.artist (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    artist TEXT NOT NULL, -- Artist name
    followers BIGINT DEFAULT 0, -- Number of followers
    monthlyListeners BIGINT DEFAULT 0, -- Monthly listener count
    socialLink TEXT, -- Instagram/social media profile URL
    artistID TEXT NOT NULL UNIQUE, -- Spotify artist ID (used as unique identifier)
    imageLink TEXT -- URL to artist profile image or placeholder
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_artist_artistid ON public.artist(artistID);
CREATE INDEX IF NOT EXISTS idx_artist_monthly_listeners ON public.artist(monthlyListeners);
CREATE INDEX IF NOT EXISTS idx_artist_followers ON public.artist(followers);
CREATE INDEX IF NOT EXISTS idx_artist_created_at ON public.artist(created_at);

-- ============================================================================
-- Table: run
-- Temporary staging table for processing scraped playlist data from Reddit
-- Gets cleared and populated during each scrape operation
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.run (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    playlistID TEXT NOT NULL, -- Spotify playlist ID
    curator TEXT, -- Playlist creator's name
    playlistImage TEXT, -- URL to playlist cover image
    playlistLink TEXT, -- Spotify playlist URL
    genre TEXT -- Genre from the scrape request
);

-- Add indexes for run table
CREATE INDEX IF NOT EXISTS idx_run_playlistid ON public.run(playlistID);
CREATE INDEX IF NOT EXISTS idx_run_genre ON public.run(genre);

-- ============================================================================
-- Table: artist_run
-- Temporary staging table for processing artist data from Spotify
-- Stores basic artist info before detailed scraping
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.artist_run (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL, -- Artist name from Spotify
    spotify_link TEXT, -- Spotify artist URL
    artistID TEXT NOT NULL -- Spotify artist ID
);

-- Add indexes for artist_run table
CREATE INDEX IF NOT EXISTS idx_artist_run_artistid ON public.artist_run(artistID);
CREATE INDEX IF NOT EXISTS idx_artist_run_name ON public.artist_run(name);

-- ============================================================================
-- Table: artist_send
-- Final output table for processed artist data with detailed metrics
-- Contains complete artist information after scraping external sources
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.artist_send (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    artist TEXT NOT NULL, -- Artist name
    followers BIGINT DEFAULT 0, -- Number of followers
    monthlyListeners BIGINT DEFAULT 0, -- Monthly listener count
    socialLink TEXT, -- Instagram/social media profile URL
    artistID TEXT NOT NULL, -- Spotify artist ID
    imageLink TEXT -- URL to artist profile image
);

-- Add indexes for artist_send table
CREATE INDEX IF NOT EXISTS idx_artist_send_artistid ON public.artist_send(artistID);
CREATE INDEX IF NOT EXISTS idx_artist_send_monthly_listeners ON public.artist_send(monthlyListeners);
CREATE INDEX IF NOT EXISTS idx_artist_send_followers ON public.artist_send(followers);

-- ============================================================================
-- Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.playlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_send ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies (Example - adjust based on your authentication requirements)
-- ============================================================================

-- Allow authenticated users to read all playlists
CREATE POLICY "Enable read access for authenticated users" ON public.playlist
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert playlists
CREATE POLICY "Enable insert for authenticated users" ON public.playlist
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete playlists
CREATE POLICY "Enable delete for authenticated users" ON public.playlist
    FOR DELETE USING (auth.role() = 'authenticated');

-- Allow authenticated users to read all artists
CREATE POLICY "Enable read access for authenticated users" ON public.artist
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert artists
CREATE POLICY "Enable insert for authenticated users" ON public.artist
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete artists
CREATE POLICY "Enable delete for authenticated users" ON public.artist
    FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for run table (temporary staging)
CREATE POLICY "Enable read access for authenticated users" ON public.run
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.run
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.run
    FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for artist_run table (temporary staging)
CREATE POLICY "Enable read access for authenticated users" ON public.artist_run
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.artist_run
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.artist_run
    FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for artist_send table (final output)
CREATE POLICY "Enable read access for authenticated users" ON public.artist_send
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.artist_send
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.artist_send
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Uncomment the following lines if you want to add sample data for testing

/*
-- Sample playlist data
INSERT INTO public.playlist (playlistID, curator, playlistImage, playlistLink) VALUES
    ('37i9dQZF1DWWQRwui0ExPn', 'Spotify', 'https://i.scdn.co/image/ab67706f00000002e086b2ffb6316df7a924c1d6', 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn'),
    ('37i9dQZF1DX0XUsuxWHRQd', 'Spotify', 'https://i.scdn.co/image/ab67706f00000002c9c7a2df7b9f5e8c3b1e2d8f', 'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd');

-- Sample artist data
INSERT INTO public.artist (artist, followers, monthlyListeners, socialLink, artistID, imageLink) VALUES
    ('The Weeknd', 25000000, 80000000, 'https://instagram.com/theweeknd', '1Xyo4u8uXC1ZmMpatF05PJ', 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb'),
    ('Billie Eilish', 45000000, 75000000, 'https://instagram.com/billieeilish', '6qqNVTkY8uBg9cP3Jd8DAH', 'https://i.scdn.co/image/ab6761610000e5eb6b2e5b3f6e4a0a3b8c9d0e1f');
*/

-- ============================================================================
-- Notes for Implementation
-- ============================================================================

/*
IMPORTANT SETUP NOTES:

1. ENVIRONMENT VARIABLES:
   Make sure your .env file contains:
   - VITE_SUPABASE_URL=your_supabase_project_url
   - VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   - VITE_N8N_WEBHOOK_URL=your_n8n_webhook_url

2. ROW LEVEL SECURITY:
   The RLS policies above assume you're using Supabase Auth.
   Adjust the policies based on your authentication strategy:
   - If using public access: Replace auth.role() = 'authenticated' with true
   - If using user-specific access: Add user ID checks
   - If using API keys: Adjust accordingly

3. N8N WEBHOOK INTEGRATION:
   Your N8N workflow uses these tables in sequence:

   FOR SCRAPE_PLAYLIST SERVICE:
   - Clears 'run' table at start
   - Scrapes Reddit for playlists
   - Inserts valid playlists into 'run' table
   - Validates playlists exist on Spotify
   - Moves validated playlists to 'playlist' table
   - Returns aggregated playlist data to frontend

   FOR FIND_ARTIST SERVICE:
   - Clears 'artist_run' and 'artist_send' tables at start
   - Gets tracks from specified playlist via Spotify API
   - Inserts basic artist info into 'artist_run' table
   - Calls external scraper service (localhost:3000/scrape) for detailed data
   - Filters artists by monthly listener range
   - Checks for duplicates in 'artist' table
   - Inserts new valid artists into both 'artist' and 'artist_send' tables
   - Returns aggregated artist data to frontend

4. DATA FLOW:
   Complete workflow based on N8N analysis:
   - Frontend calls webhook with serviceType "scrape_playlist"
   - N8N workflow scrapes Reddit → validates on Spotify → saves to 'playlist' table
   - Frontend calls webhook with serviceType "find_artist"
   - N8N workflow gets playlist tracks → scrapes artist details → filters → saves to 'artist' table
   - Frontend queries Supabase directly for displaying saved data

   TEMPORARY TABLES:
   - 'run': Staging for playlist processing (cleared each scrape)
   - 'artist_run': Staging for basic artist data (cleared each find)
   - 'artist_send': Final processed artist data for response

5. UNIQUE CONSTRAINTS:
   - playlist.playlistID should be unique (Spotify playlist ID)
   - artist.artistID should be unique (Spotify artist ID)

6. OPTIONAL ENHANCEMENTS:
   You could add these tables for more advanced features:
   - user_playlists: Link playlists to specific users
   - playlist_artists: Many-to-many relationship between playlists and artists
   - genres: Separate genre table with FK relationships
   - search_history: Track user searches
*/