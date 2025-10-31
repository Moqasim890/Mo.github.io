// App.jsx
import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import React, { Suspense, lazy, useEffect } from "react";

// Lazy-load page bundles (keeps initial JS smaller)
const Home = lazy(() => import("./pages/Home.jsx"));
const Teams = lazy(() => import("./pages/Teams.jsx"));
const PokemonDetail = lazy(() => import("./pages/PokemonDetail.jsx"));
const Pokedex = lazy(() => import("./pages/Pokedex.jsx"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // jump to top on route change; no animation to respect reduced-motion users
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.body.classList.add('theme--glass-night'); // Voeg de klasse toe aan de body
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="app">
      {/* Skip link becomes visible on :focus, see CSS note below */}
     

      <Navbar />
      <ScrollToTop />

      <main id="content" className="container" role="main">
        <Suspense fallback={<p>Loading…</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/pokemon/:name" element={<PokemonDetail />} />
            <Route path="/pokedex" element={<Pokedex />} />
            <Route path="*" element={<h2>Niet gevonden</h2>} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
