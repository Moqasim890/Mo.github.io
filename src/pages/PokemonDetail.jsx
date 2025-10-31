import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getPokemon } from '../api/pokeapi.js';
import '../App.css';

const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export default function PokemonDetail() {
  const { name } = useParams();
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    getPokemon(name)
      .then((data) => { if (!ignore) setPokemon(data); })
      .catch((err) => { if (!ignore) setError(err); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [name]);

  const displayName = titleCase(name);

  if (loading) {
    return (
      <section className="pokemon-detail">
        <Link to="/teams" className="back-link">← Back to teams</Link>
        <h1>{displayName || '...'}</h1>
        <div className="loading-card"><strong>Loading…</strong> please wait, trainer.</div>
      </section>
    );
  }
  if (error) {
    return (
      <section className="pokemon-detail">
        <Link to="/teams" className="back-link">← Back to teams</Link>
        <h1>{displayName}</h1>
        <div className="error-card"><strong>Failed:</strong> {error.message}</div>
      </section>
    );
  }
  if (!pokemon) return null;

  const spritePrimary =
    pokemon.sprites?.other?.['official-artwork']?.front_default ||
    pokemon.sprites?.other?.home?.front_default ||
    pokemon.sprites?.other?.dream_world?.front_default ||
    pokemon.sprites?.front_default ||
    pokemon.sprites?.back_default ||
    null;

  const spriteFallbackById = pokemon.id
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
    : null;

  const types = (pokemon.types || []).map((t) => t.type.name);
  const abilities = (pokemon.abilities || []).map((a) => a.ability.name);
  const stats = pokemon.stats || [];
  const moves = (pokemon.moves || []).slice(0, 8).map((m) => m.move.name);

  return (
    <section className="pokemon-detail">
      <Link to="/teams" className="back-link">← Back to teams</Link>

      <header className="pokemon-header">
        <h1>{titleCase(pokemon.name)}</h1>
        <p className="pokemon-id">#{String(pokemon.id).padStart(3, '0')}</p>
      </header>

      <div className="pokemon-grid">
        <div className="artwork-card">
          {spritePrimary || spriteFallbackById ? (
            <img
              src={spritePrimary || spriteFallbackById}
              alt={pokemon.name}
              className="pokemon-image"
              onError={(e) => {
                if (spriteFallbackById && e.currentTarget.src !== spriteFallbackById) {
                  e.currentTarget.src = spriteFallbackById;
                } else {
                  e.currentTarget.removeAttribute('src');
                }
              }}
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              width="512"
              height="512"
            />
          ) : (
            <div className="no-image">(no image available)</div>
          )}
        </div>

        <div className="pokemon-info">
          <div className="info-card">
            <div className="info-row">
              <strong>Types:</strong> {types.map(titleCase).join(', ') || '—'}
            </div>
            <div className="info-row">
              <strong>Abilities:</strong> {abilities.map(titleCase).join(', ') || '—'}
            </div>
            <div className="stats-container">
              <strong>Stats:</strong>
              <div className="stats-grid">
                {stats.map((s) => (
                  <div key={s.stat.name} className="stat-row">
                    <span className="stat-name">{titleCase(s.stat.name)}</span>
                    <div className="stat-bar-container">
                      <div
                        className="stat-bar"
                        style={{ width: `${(Math.min(s.base_stat, 150) / 150) * 100}%` }}
                      />
                    </div>
                    <span className="stat-value">{s.base_stat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="moves-card">
            <strong>Moves (first 8):</strong>
            <div className="moves-grid">
              {moves.length ? (
                moves.map((m) => <span key={m} className="move-tag">{m}</span>)
              ) : (
                <span>—</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
