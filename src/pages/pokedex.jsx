import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../App.css";

/** Helpers */
const clean = (v) => String(v || "").trim().toLowerCase();
const getIdFromUrl = (url) => {
  const m = url.match(/\/pokemon\/(\d+)\/?$/);
  return m ? Number(m[1]) : null;
};
const artFor = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const spriteFallback = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

/** Intersection observer for infinite scroll */
function useOnScreen(ref, rootMargin = "400px") {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { root: null, rootMargin }
    );
    obs.observe(el);
    return () => {
      try { obs.unobserve(el); } catch {}
      obs.disconnect();
    };
  }, [ref, rootMargin]);
  return visible;
}

export default function Pokedex() {
  const [items, setItems] = useState([]); // {name, url, id}
  const [nextUrl, setNextUrl] = useState(
    "https://pokeapi.co/api/v2/pokemon?limit=60&offset=0"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");

  // modal state
  const [searchParams, setSearchParams] = useSearchParams();
  const selected = searchParams.get("pokemon"); // string | null

  const sentinelRef = useRef(null);
  const shouldLoadMore = useOnScreen(sentinelRef);
  const inFlight = useRef(false);

  async function fetchPage(url) {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      const mapped = (data.results || []).map((r) => {
        const id = getIdFromUrl(r.url);
        return { ...r, id };
      });

      // de-dup by id
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const add = mapped.filter((m) => m.id && !seen.has(m.id));
        return [...prev, ...add];
      });

      setNextUrl(data.next || null); // null when done
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }

  // initial load
  useEffect(() => {
    if (items.length === 0 && nextUrl) fetchPage(nextUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // infinite scroll
  useEffect(() => {
    if (shouldLoadMore && !loading && nextUrl) {
      fetchPage(nextUrl);
    }
  }, [shouldLoadMore, loading, nextUrl]);

  // filter
  const filtered = useMemo(() => {
    const needle = clean(q);
    if (!needle) return items;
    const idNeedle = needle.startsWith("#") ? needle.slice(1) : needle;
    return items.filter(
      (p) =>
        clean(p.name).includes(needle) ||
        String(p.id || "").startsWith(idNeedle)
    );
  }, [q, items]);

  function openModal(name) {
    const params = new URLSearchParams(searchParams);
    params.set("pokemon", clean(name));
    setSearchParams(params, { replace: false });
  }
  function closeModal() {
    const params = new URLSearchParams(searchParams);
    params.delete("pokemon");
    setSearchParams(params, { replace: true });
  }

  return (
    <section className="pokedex-page">
      <h1 className="page-title" style={{ padding: 40 }}>Pokédex</h1>
      <p className="lead">Browse and click any Pokémon to preview full details.</p>

      {/* search */}
      <div className="pokedex-controls">
        <input
          type="search"
          aria-label="Search Pokémon"
          placeholder="Search by name or # (e.g. pikachu or 025)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="pokedex-count">
          {filtered.length}/{items.length}
          {nextUrl ? "" : " (all loaded)"}
        </div>
      </div>

      {/* error */}
      {error && (
        <div className="error-card">
          <strong>Couldn’t load the Pokédex.</strong>
          <div style={{ marginTop: 8 }}>{error}</div>
          <div style={{ marginTop: 12 }}>
            <button
              className="btn sm"
              onClick={() => nextUrl && fetchPage(nextUrl)}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* grid */}
      <ul className="pokedex-grid" role="list">
        {filtered.map((p) => (
          <li key={`${p.id}-${p.name}`}>
            <button
              type="button"
              className="pokedex-card as-button"
              onClick={() => openModal(p.name)}
              aria-haspopup="dialog"
              aria-controls="pokemon-detail-modal"
              aria-label={`Open details for ${p.name}`}
            >
              <figure className="pokedex-figure">
                <img
                  src={artFor(p.id)}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  width="256"
                  height="256"
                  onError={(e) => {
                    // fallback to classic sprite if official artwork is missing
                    if (p.id && e.currentTarget.src !== spriteFallback(p.id)) {
                      e.currentTarget.src = spriteFallback(p.id);
                    }
                  }}
                />
              </figure>
              <div className="pokedex-meta">
                <span className="pokedex-id">#{String(p.id).padStart(3, "0")}</span>
                <span className="pokedex-name">{p.name}</span>
              </div>
            </button>
          </li>
        ))}

        {loading && items.length === 0 &&
          Array.from({ length: 12 }).map((_, i) => (
            <li key={`skeleton-${i}`} className="pokedex-card skeleton">
              <div className="pokedex-figure" />
              <div className="pokedex-meta">
                <span className="pokedex-id">&nbsp;</span>
                <span className="pokedex-name">&nbsp;</span>
              </div>
            </li>
          ))}
      </ul>

      {/* infinite scroll sentinel */}
      <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />

      {/* loading footer */}
      {loading && items.length > 0 && (
        <div className="loading-card">
          <strong>Loading more…</strong>
        </div>
      )}
      {!nextUrl && items.length > 0 && (
        <div className="loading-card">
          <strong>All Pokémon loaded.</strong>
        </div>
      )}

      {/* modal */}
      {selected && (
        <PokemonDetailModal
          name={selected}
          onClose={closeModal}
        />
      )}
    </section>
  );
}

/** Detail modal (self-contained; fetches by name) */
function PokemonDetailModal({ name, onClose }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState(null);
  const closeBtnRef = useRef(null);

  // fetch details
  useEffect(() => {
    let mounted = true;
    setBusy(true);
    setErr(null);
    fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Not found"))))
      .then((j) => mounted && setData(j))
      .catch((e) => mounted && setErr(e.message || "Failed"))
      .finally(() => mounted && setBusy(false));
    return () => { mounted = false; };
  }, [name]);

  // focus & ESC & scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const id = data?.id;
  const sprite = id ? artFor(id) : "";
  const types = (data?.types || []).map((t) => t.type.name);
  const abilities = (data?.abilities || []).map((a) => a.ability.name);
  const stats = (data?.stats || []).map((s) => ({ name: s.stat.name, value: s.base_stat }));
  const moves = (data?.moves || []).slice(0, 12).map((m) => m.move.name);

  // click outside to close
  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pokemon-modal-title"
      id="pokemon-detail-modal"
    >
      <div className="modal-panel">
        <button
          className="modal-close btn sm secondary"
          onClick={onClose}
          ref={closeBtnRef}
          aria-label="Close dialog"
        >
          Close
        </button>

        {busy && (
          <div className="loading-card">
            <strong>Loading details…</strong>
          </div>
        )}
        {err && (
          <div className="error-card">
            <strong>Couldn’t load details.</strong>
            <div style={{ marginTop: 8 }}>{err}</div>
          </div>
        )}
        {!busy && !err && data && (
          <div className="pokemon-detail" style={{ margin: 0, padding: 0 }}>
            {/* Header */}
            <header className="pokemon-header">
              <h2 id="pokemon-modal-title" style={{ textTransform: "capitalize" }}>
                {data.name}
              </h2>
              <div className="pokemon-id">#{String(id).padStart(3, "0")}</div>
            </header>

            {/* Layout grid */}
            <div className="pokemon-grid">
              {/* Artwork */}
              <section className="artwork-card">
                {sprite ? (
                  <img
                    className="pokemon-image"
                    src={sprite}
                    alt={data.name}
                    width="512"
                    height="512"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (id && e.currentTarget.src !== spriteFallback(id)) {
                        e.currentTarget.src = spriteFallback(id);
                      }
                    }}
                  />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </section>

              {/* Info */}
              <section className="pokemon-info">
                {/* Quick facts */}
                <div className="info-card">
                  <div className="info-row">
                    <strong>Types</strong>
                    <div>{types.join(", ") || "—"}</div>
                  </div>
                  <div className="info-row">
                    <strong>Abilities</strong>
                    <div>{abilities.join(", ") || "—"}</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="stats-container">
                  <strong>Base Stats</strong>
                  <div className="stats-grid">
                    {stats.map((s) => (
                      <div key={s.name} className="stat-row">
                        <div className="stat-name">{s.name}</div>
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-bar-container">
                          <div
                            className="stat-bar"
                            style={{
                              width: `${Math.min(100, (s.value / 180) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Moves */}
                <div className="moves-card">
                  <strong>Moves (first 12)</strong>
                  <div className="moves-grid">
                    {moves.map((m) => (
                      <span className="move-tag" key={m}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
