const themes = {
  light: {
    bg: '#fafaf8',
    surface: '#ffffff',
    text: '#2c2c2c',
    textSecondary: '#666666',
    accent: '#8b4513',
    accentHover: '#a0522d',
    border: '#e8e4e0',
    heroBg: '#2c2c2c',
    heroText: '#fafaf8',
    cardShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  dark: {
    bg: '#1a1a1a',
    surface: '#2a2a2a',
    text: '#e8e8e8',
    textSecondary: '#aaaaaa',
    accent: '#d4a574',
    accentHover: '#e0b88a',
    border: '#3a3a3a',
    heroBg: '#0d0d0d',
    heroText: '#f0f0f0',
    cardShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  minimal: {
    bg: '#ffffff',
    surface: '#ffffff',
    text: '#111111',
    textSecondary: '#555555',
    accent: '#111111',
    accentHover: '#333333',
    border: '#dddddd',
    heroBg: '#ffffff',
    heroText: '#111111',
    cardShadow: 'none',
  },
};

export function getStyles(theme = 'light') {
  const t = themes[theme] || themes.light;

  return `
    *,
    *::before,
    *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      background-color: ${t.bg};
      color: ${t.text};
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }

    h1, h2, h3, h4 {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-weight: 600;
      line-height: 1.2;
    }

    a {
      color: ${t.accent};
      text-decoration: none;
      transition: color 0.2s;
    }

    a:hover {
      color: ${t.accentHover};
    }

    img {
      max-width: 100%;
      height: auto;
      display: block;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* Hero */
    .hero {
      background-color: ${t.heroBg};
      color: ${t.heroText};
      padding: 80px 24px;
      text-align: center;
    }

    .hero h1 {
      font-size: clamp(2rem, 5vw, 3.5rem);
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }

    .hero .subtitle {
      font-size: clamp(1.1rem, 2.5vw, 1.4rem);
      font-style: italic;
      opacity: 0.85;
      margin-bottom: 24px;
    }

    .hero .dates {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 8px;
    }

    .hero .venue-name {
      font-size: 1.1rem;
      opacity: 0.8;
    }

    /* Sections */
    .section {
      padding: 64px 0;
    }

    .section-title {
      font-size: 1.8rem;
      margin-bottom: 40px;
      text-align: center;
      position: relative;
    }

    .section-title::after {
      content: '';
      display: block;
      width: 60px;
      height: 2px;
      background: ${t.accent};
      margin: 16px auto 0;
    }

    /* About */
    .about-text p {
      max-width: 720px;
      margin: 0 auto 16px;
      font-size: 1.05rem;
      text-align: center;
    }

    .curator-card {
      display: flex;
      align-items: center;
      gap: 24px;
      max-width: 600px;
      margin: 40px auto 0;
      padding: 24px;
      background: ${t.surface};
      border: 1px solid ${t.border};
      border-radius: 8px;
      box-shadow: ${t.cardShadow};
    }

    .curator-card img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .curator-card .curator-label {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${t.textSecondary};
      margin-bottom: 4px;
    }

    .curator-card .curator-name {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-weight: 600;
      font-size: 1.1rem;
      margin-bottom: 4px;
    }

    .curator-card .curator-bio {
      font-size: 0.9rem;
      color: ${t.textSecondary};
    }

    /* Artists Grid */
    .artists-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 32px;
    }

    .artist-card {
      background: ${t.surface};
      border: 1px solid ${t.border};
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      box-shadow: ${t.cardShadow};
      transition: transform 0.2s;
    }

    .artist-card:hover {
      transform: translateY(-2px);
    }

    .artist-card img {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      margin: 0 auto 16px;
    }

    .artist-card .artist-name {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-weight: 600;
      font-size: 1.15rem;
      margin-bottom: 4px;
    }

    .artist-card .artist-meta {
      font-size: 0.85rem;
      color: ${t.textSecondary};
      margin-bottom: 8px;
    }

    .artist-card .artist-bio {
      font-size: 0.9rem;
      color: ${t.textSecondary};
      line-height: 1.5;
    }

    /* Gallery Grid */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 32px;
    }

    .artwork-card {
      background: ${t.surface};
      border: 1px solid ${t.border};
      border-radius: 8px;
      overflow: hidden;
      box-shadow: ${t.cardShadow};
      transition: transform 0.2s;
    }

    .artwork-card:hover {
      transform: translateY(-2px);
    }

    .artwork-card .artwork-image {
      width: 100%;
      height: 280px;
      object-fit: cover;
      background: ${t.border};
    }

    .artwork-card .artwork-info {
      padding: 20px;
    }

    .artwork-card .artwork-title {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-weight: 600;
      font-size: 1.1rem;
      margin-bottom: 4px;
    }

    .artwork-card .artwork-artist {
      color: ${t.accent};
      font-size: 0.95rem;
      margin-bottom: 8px;
    }

    .artwork-card .artwork-details {
      font-size: 0.85rem;
      color: ${t.textSecondary};
      line-height: 1.6;
    }

    .artwork-card .artwork-price {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-weight: 600;
      font-size: 0.95rem;
      margin-top: 12px;
      color: ${t.text};
    }

    /* Visitor Info */
    .visitor-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 32px;
      max-width: 900px;
      margin: 0 auto;
    }

    .info-block {
      background: ${t.surface};
      border: 1px solid ${t.border};
      border-radius: 8px;
      padding: 24px;
      box-shadow: ${t.cardShadow};
    }

    .info-block h3 {
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 16px;
      color: ${t.accent};
    }

    .hours-table {
      width: 100%;
      border-collapse: collapse;
    }

    .hours-table td {
      padding: 6px 0;
      border-bottom: 1px solid ${t.border};
      font-size: 0.95rem;
    }

    .hours-table td:first-child {
      font-weight: 600;
      padding-right: 16px;
    }

    .hours-table tr:last-child td {
      border-bottom: none;
    }

    .admission-list {
      list-style: none;
    }

    .admission-list li {
      padding: 6px 0;
      border-bottom: 1px solid ${t.border};
      font-size: 0.95rem;
      display: flex;
      justify-content: space-between;
    }

    .admission-list li:last-child {
      border-bottom: none;
    }

    .admission-notes {
      font-size: 0.85rem;
      color: ${t.textSecondary};
      font-style: italic;
      margin-top: 8px;
    }

    .address-block p {
      font-size: 0.95rem;
      margin-bottom: 4px;
    }

    .address-block .info-link {
      display: inline-block;
      margin-top: 12px;
      margin-right: 12px;
      font-size: 0.9rem;
    }

    /* Footer */
    .footer {
      background: ${t.heroBg};
      color: ${t.heroText};
      padding: 48px 24px;
      text-align: center;
    }

    .footer .footer-title {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .footer .footer-venue {
      font-size: 0.95rem;
      opacity: 0.8;
      margin-bottom: 20px;
    }

    .social-links {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .social-links a {
      color: ${t.heroText};
      opacity: 0.7;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      transition: opacity 0.2s;
    }

    .social-links a:hover {
      opacity: 1;
      color: ${t.heroText};
    }

    .footer .copyright {
      font-size: 0.8rem;
      opacity: 0.5;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .hero {
        padding: 48px 20px;
      }

      .section {
        padding: 40px 0;
      }

      .gallery-grid {
        grid-template-columns: 1fr;
      }

      .artists-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      }

      .curator-card {
        flex-direction: column;
        text-align: center;
      }
    }
  `;
}
