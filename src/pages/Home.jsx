import { Link } from 'react-router-dom';
import downloadImg from '../assets/pokemon-symbol-logo-png-31.png';
import '../App.css';

export default function Home() {
  return (
    <div className="site-wrapper">
      <main className="main-content">
        <section className="hero">
          <div className="hero-content">
            <h1>Build Your Dream Pokémon Team</h1>
            <div className="hero-buttons">
              <Link to="/teams" className="primary-button">Get Started</Link>
              <Link to="/learn" className="secondary-button">Learn More</Link>
            </div>
          </div>
          <div className="hero-image">
            <img src={downloadImg} alt="Featured Pokémon" />
          </div>
        </section>
      </main>
    </div>
  );
}