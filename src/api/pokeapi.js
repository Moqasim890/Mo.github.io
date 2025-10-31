// src/api/pokeapi.js   
const cache = new Map();

export async function getPokemon(name) {
  const key = String(name || "").trim().toLowerCase();
  if (!key) throw new Error("No Pokémon name provided");

  if (cache.has(key)) return cache.get(key);

  const res = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(key)}`
  );

  if (!res.ok) {
    throw new Error(`Pokémon "${key}" not found`);
  }

  const data = await res.json();
  cache.set(key, data);
  return data;
}