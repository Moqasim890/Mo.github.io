import { NavLink, Link } from "react-router-dom";
import downloadImg from "../assets/pokemon-symbol-logo-png-31.png";
import "../app.css";

export default function Navbar() {
  return (
    <header className="navbar">
      {/* Use a nav landmark with a clear label for screen readers */}
      <nav className="nav-container" aria-label="Main">
        {/* Logo: Link (or NavLink) back home; include width/height for CLS */}
        <Link to="/" className="nav-logo" aria-label="Home">
          <img
            src={downloadImg}
            alt="Pokémon logo"
            className="logo-img"
            width={128}
            height={32}
            decoding="async"
            loading="eager"
          />
     
        </Link>

        {/* Use a list for groups of site nav links */}
        <ul className="nav-links" role="list">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive, isPending }) =>
                [
                  "nav-link",
                  isActive ? "active" : "",
                  isPending ? "pending" : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/teams"
              className={({ isActive, isPending }) =>
                ["nav-link", isActive && "active", isPending && "pending"]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              Teams
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/pokedex"
              className={({ isActive, isPending }) =>
                ["nav-link", isActive && "active", isPending && "pending"]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              Pokédex
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}
