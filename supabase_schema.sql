create table public.artist (
  id bigserial not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  artist text not null,
  followers bigint null default 0,
  monthlylisteners bigint null default 0,
  sociallink text null,
  artistid text not null,
  imagelink text null,
  constraint artist_pkey primary key (id),
  constraint artist_artistid_key unique (artistid)
) TABLESPACE pg_default;

create index IF not exists idx_artist_artistid on public.artist using btree (artistid) TABLESPACE pg_default;

create index IF not exists idx_artist_monthly_listeners on public.artist using btree (monthlylisteners) TABLESPACE pg_default;

create index IF not exists idx_artist_followers on public.artist using btree (followers) TABLESPACE pg_default;

create index IF not exists idx_artist_created_at on public.artist using btree (created_at) TABLESPACE pg_default;


____________________

create table public.artist_run (
  id bigserial not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  name text not null,
  spotify_link text null,
  artistid text not null,
  constraint artist_run_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_artist_run_artistid on public.artist_run using btree (artistid) TABLESPACE pg_default;

create index IF not exists idx_artist_run_name on public.artist_run using btree (name) TABLESPACE pg_default;

________________________

create table public.artist_send (
  id bigserial not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  artist text not null,
  followers bigint null default 0,
  monthlylisteners bigint null default 0,
  sociallink text null,
  artistid text not null,
  imagelink text null,
  constraint artist_send_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_artist_send_artistid on public.artist_send using btree (artistid) TABLESPACE pg_default;

create index IF not exists idx_artist_send_monthly_listeners on public.artist_send using btree (monthlylisteners) TABLESPACE pg_default;

create index IF not exists idx_artist_send_followers on public.artist_send using btree (followers) TABLESPACE pg_default;

____________________

create table public.playlist (
  id bigserial not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  playlistid text not null,
  curator text null,
  playlistimage text null,
  playlistlink text null,
  genre text null,
  constraint playlist_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_playlist_playlistid on public.playlist using btree (playlistid) TABLESPACE pg_default;

create index IF not exists idx_playlist_created_at on public.playlist using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_playlist_genre on public.playlist using btree (genre) TABLESPACE pg_default;

____________________

create table public.run (
  id bigserial not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  playlistid text not null,
  curator text null,
  playlistimage text null,
  playlistlink text null,
  genre text null,
  constraint run_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_run_playlistid on public.run using btree (playlistid) TABLESPACE pg_default;

create index IF not exists idx_run_genre on public.run using btree (genre) TABLESPACE pg_default;

____________________



