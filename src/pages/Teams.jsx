// src/pages/Teams.jsx
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { teams as seedTeams } from '../data/sampleTeams.js';
import useLocalStorage from '../hooks/useLocalStorage.jsx';
import '../App.css';


function cleanName(v) {
  return String(v || '').trim().toLowerCase();
}

async function validatePokemonExists(name) {
  const n = cleanName(name);
  if (!n) throw new Error('Voer een naam in');
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(n)}`);
  if (!res.ok) throw new Error(`Pokémon "${n}" bestaat niet`);
  return n;
}

/* ---------------- Page ---------------- */
export default function Teams() {
  const [teams, setTeams] = useLocalStorage('ptm:teams', seedTeams);
  const [newTeamName, setNewTeamName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // {type:'ok'|'err', text}

  function toast(type, text) {
    setMsg({ type, text });
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(() => setMsg(null), 2200);
  }

  function addTeam() {
    const name = newTeamName.trim();
    if (!name) return toast('err', 'Teamnaam is leeg');
    const id = name.toLowerCase().replace(/\s+/g, '-');
    if (teams.some((t) => t.id === id)) return toast('err', 'Team met die naam bestaat al');
    setTeams([{ id, name, members: [] }, ...teams]);
    setNewTeamName('');
    toast('ok', 'Team aangemaakt');
  }

  function deleteTeam(id) {
    setTeams(teams.filter((t) => t.id !== id));
    toast('ok', 'Team verwijderd');
  }

  function renameTeam(id, nextName) {
    const name = nextName.trim();
    if (!name) return toast('err', 'Naam mag niet leeg zijn');
    setTeams(teams.map((t) => (t.id === id ? { ...t, name } : t)));
    toast('ok', 'Team hernoemd');
  }

  async function addMember(teamId, rawName, done) {
    try {
      setBusy(true);
      const name = await validatePokemonExists(rawName);
      setTeams(
        teams.map((t) => {
          if (t.id !== teamId) return t;
          if (t.members.includes(name)) return t;
          if (t.members.length >= 6) return t; // 6-cap
          return { ...t, members: [...t.members, name] };
        })
      );
      toast('ok', 'Pokémon toegevoegd');
    } catch (e) {
      toast('err', e.message || 'Kon Pokémon niet toevoegen');
    } finally {
      setBusy(false);
      done?.();
    }
  }

  function removeMember(teamId, name) {
    setTeams(
      teams.map((t) =>
        t.id === teamId ? { ...t, members: t.members.filter((m) => m !== name) } : t
      )
    );
    toast('ok', 'Pokémon verwijderd');
  }

  return (
    <section className="teams-page">
      <h1 className="page-title" style={{ padding: 40 }}>Your Pokémon Teams</h1>
      <p className="lead">Create and manage your battle-ready teams</p>

      {msg && <div className={`toast-message ${msg.type}`}>{msg.text}</div>}

      {/* Create team */}
      <div className="create-team">
        <input
          aria-label="New team name"
          placeholder="Enter new team name..."
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTeam()}
        />
        <button onClick={addTeam} className="btn">Create Team</button>
      </div>

      {/* Empty state */}
      {teams.length === 0 && (
        <div className="empty">
          <p>You haven't created any teams yet. Get started by creating your first team!</p>
        </div>
      )}

      {/* Teams */}
      <div className="teams-list">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            onDelete={() => deleteTeam(team.id)}
            onRename={(name) => renameTeam(team.id, name)}
            onAdd={(name, done) => addMember(team.id, name, done)}
            onRemove={(name) => removeMember(team.id, name)}
            busy={busy}
          />
        ))}
      </div>
    </section>
  );
}

/* ---------------- Team Card ---------------- */
function TeamCard({ team, onDelete, onRename, onAdd, onRemove, busy }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [input, setInput] = useState('');

  function saveName() {
    onRename(name);
    setEditing(false);
  }

  return (
    <article className="team-card">
      <header className="team-head">
        <div>
          {editing ? (
            <div className="edit-title">
              <input
                aria-label="Team name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                className="edit-input"
              />
              <div className="team-actions">
                <button onClick={saveName} className="btn sm">Save</button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setName(team.name);
                  }}
                  className="btn sm secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="team-name">{team.name}</div>
              <div className="team-meta">({team.members.length}/6)</div>
            </>
          )}
        </div>

        <div className="team-actions">
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn sm secondary">
              Edit
            </button>
          )}
          <button onClick={onDelete} className="btn sm">Delete</button>
        </div>
      </header>

      {/* Pokémon chips */}
      <div className="pokemon-row">
        {team.members.length === 0 ? (
          <p className="empty-team">No Pokémon added yet</p>
        ) : (
          team.members.map((p) => (
            <span key={p} className="poke-chip">
              <Link
                to={`/pokemon/${cleanName(p)}`}
                className="chip-link"
                title={`View ${p} details`}
              >
                {p}
              </Link>
              <button
                onClick={() => onRemove(p)}
                className="remove"
                aria-label={`Remove ${p}`}
                title="Remove"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {/* Add Pokémon */}
      <div className="add-row">
        <input
          aria-label="Add Pokémon"
          placeholder="Add a Pokémon (e.g. Pikachu)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !busy && onAdd(input, () => setInput(''))}
          type="search"
        />
        <button
          disabled={busy}
          onClick={() => onAdd(input, () => setInput(''))}
          className={`btn ${busy ? 'disabled' : ''}`}
          aria-busy={busy}
        >
          {busy ? 'Adding…' : 'Add Pokémon'}
        </button>
      </div>

      <p className="helper-text">Tip: maximum 6 Pokémon per team.</p>
    </article>
  );
}
