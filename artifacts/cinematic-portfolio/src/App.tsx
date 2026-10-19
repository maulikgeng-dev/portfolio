import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Menu, X } from 'lucide-react';
import { portfolio } from './data/portfolio';
import { OrbitalCursor } from './components/OrbitalCursor';

const CinematicWorld = lazy(() =>
  import('./components/CinematicWorld').then((module) => ({ default: module.CinematicWorld })),
);

const sections = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Interests' },
  { id: 'projects', label: 'Projects' },
  { id: 'achievements', label: 'Journey' },
  { id: 'contact', label: 'Contact' },
];

function App() {
  const [active, setActive] = useState('about');
  const [menuOpen, setMenuOpen] = useState(false);
  const [resumeMessage, setResumeMessage] = useState('');

  useEffect(() => {
    document.title = `${portfolio.name} — Student · Developer · Creative thinker`;
    const descriptions = [
      ['name', 'description', 'A personal portfolio journey through curiosity, ideas, projects, and what comes next.'],
      ['property', 'og:title', `${portfolio.name} — A journey still unfolding`],
      ['property', 'og:description', 'A cinematic portfolio for a student, developer, and creative thinker.'],
      ['name', 'theme-color', '#080b13'],
    ];
    const managedMeta: HTMLMetaElement[] = [];
    descriptions.forEach(([attribute, key, content]) => {
      let meta = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, key);
        document.head.appendChild(meta);
        managedMeta.push(meta);
      }
      meta.content = content;
    });
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
    const revealNodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sceneObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
    nodes.forEach((node) => sceneObserver.observe(node));

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealNodes.forEach((node) => revealObserver.observe(node));

    let frame = 0;
    const updateJourney = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
        const root = document.documentElement;
        root.style.setProperty('--progress', `${progress * 100}%`);
        document.querySelector('.scroll-meter')?.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
      });
    };
    window.addEventListener('scroll', updateJourney, { passive: true });
    window.addEventListener('resize', updateJourney);
    updateJourney();
    if (reduced) {
      revealNodes.forEach((node) => node.classList.add('is-visible'));
    }
    return () => {
      sceneObserver.disconnect();
      revealObserver.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateJourney);
      window.removeEventListener('resize', updateJourney);
      managedMeta.forEach((meta) => meta.remove());
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const handleResume = () => {
    if (portfolio.resumePath) {
      const link = document.createElement('a');
      link.href = portfolio.resumePath;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setResumeMessage('Your resume download has started.');
      return;
    }
    setResumeMessage('Resume not added yet. Place your file at public/resume.pdf, then set resumePath to “/resume.pdf” in src/data/portfolio.ts.');
  };

  const contactItems = [
    { label: 'Email', value: portfolio.contact.email },
    { label: 'LinkedIn', value: portfolio.contact.linkedin },
    { label: 'GitHub', value: portfolio.contact.github },
  ];

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content" data-testid="link-skip-content">Skip to content</a>
      <Suspense fallback={null}>
        <CinematicWorld />
      </Suspense>
      <div className="journey-world" aria-hidden="true">
        <div className="world-index" />
        <div className="world-arch" />
        <div className="world-ribbon" />
        <div className="world-orb" />
        <div className="world-glow" />
        <div className="world-floor" />
      </div>
      <div className="scroll-meter" role="progressbar" aria-label="Page progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}><span /></div>
      <header className="topbar">
        <a className="wordmark" href="#home" aria-label={`${portfolio.name} — home`} onClick={closeMenu}>
          <span className="wordmark-mark" aria-hidden="true" />
          <span data-testid="text-portfolio-name">{portfolio.name}</span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className={`nav-link ${active === section.id ? 'active' : ''}`} aria-current={active === section.id ? 'location' : undefined} data-testid={`link-navigation-${section.id}`}>
              {section.label}
            </a>
          ))}
        </nav>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)} data-testid="button-mobile-menu">
          {menuOpen ? <X size={15} /> : <Menu size={15} />}
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </header>
      <nav id="mobile-navigation" className={`mobile-panel ${menuOpen ? 'open' : ''}`} aria-label="Mobile navigation" aria-hidden={!menuOpen}>
        {sections.map((section) => (
          <a key={section.id} href={`#${section.id}`} onClick={closeMenu} data-testid={`link-mobile-${section.id}`}>{section.label}</a>
        ))}
      </nav>
      <main id="main-content">
        <section className="scene hero border-t-[0px] border-r-[0px] border-b-[0px] border-l-[0px]" id="home" data-scene aria-labelledby="hero-title">
          <div className="scene-inner">
            <div className="hero-copy">
              <div className="eyebrow reveal">Independent mind · open horizon</div>
              <h1 id="hero-title" className="border-t-[color:var(--night)] border-r-[color:var(--night)] border-b-[color:var(--night)] border-l-[color:var(--night)]" data-testid="text-hero-title">Maulik Gupta<br /><em>building what's next...</em></h1>
              <p className="hero-role reveal reveal-delay-2">{portfolio.role}</p>
              <p className="hero-description reveal reveal-delay-2">{portfolio.intro}</p>
              <div className="hero-actions reveal reveal-delay-2">
                <a className="button-primary" href="#projects" data-testid="link-explore-projects">Explore my work <ArrowDownRight className="arrow" size={16} /></a>
                <button className="button-quiet" type="button" onClick={handleResume} data-testid="button-view-resume">View resume <ArrowUpRight className="arrow" size={15} /></button>
              </div>
            </div>
            <div className="hero-coordinate" aria-hidden="true"><strong>FIELD NOTE 001</strong><span>AN IDEA, TAKING SHAPE</span><span>WORLD / 001</span></div>
          </div>
          <div className="scroll-cue" aria-hidden="true"><i /> SCROLL TO EXPLORE</div>
          <p className="webgl-fallback">
            <span className="webgl-live-copy">ONE CAMERA · CONTINUOUS WORLD</span>
            <span className="webgl-fallback-copy">STATIC VISUAL FALLBACK · CONTENT REMAINS AVAILABLE</span>
          </p>
        </section>

        <section className="scene" id="about" data-scene aria-labelledby="about-title">
          <div className="scene-inner">
            <div className="section-heading reveal">
              <div><div className="eyebrow">01 / The origin</div><h2 id="about-title">A mind in<br /><em>motion.</em></h2></div>
              <p>Every path starts with a question. This is where the curiosity, context, and way of working behind the work belong.</p>
            </div>
            <div className="about-layout">
              <div className="reveal">
                <div className="about-index">PERSONAL FIELD NOTES</div>
                <p className="about-quote">{portfolio.about.statement.split('/')[0]} <em>{portfolio.about.statement.split('/')[1]}</em></p>
                <span className="placeholder-note">Editable profile placeholder</span>
              </div>
              <div className="editorial-list reveal reveal-delay-1">
                <div className="editorial-row"><span>INTRO</span><p>{portfolio.about.introduction}</p></div>
                <div className="editorial-row"><span>STUDY</span><p>{portfolio.about.academic}</p></div>
                <div className="editorial-row"><span>CURIOSITY</span><p>{portfolio.about.interests}</p></div>
                <div className="editorial-row"><span>METHOD</span><p>{portfolio.about.approach}</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="scene skills-section" id="skills" data-scene aria-labelledby="skills-title">
          <div className="scene-inner">
            <div className="section-heading reveal">
              <div><div className="eyebrow">02 / Skills &amp; interests</div><h2 id="skills-title">Things worth<br /><em>learning.</em></h2></div>
              <p>A living network of subjects, tools, and questions. Add the technologies and interests that truly feel like yours.</p>
            </div>
            <div className="skills-grid">
              {portfolio.skills.map((skill, index) => (
                <div className="skill-item reveal" key={skill.name} data-cursor="skill" data-skill-index={index} data-testid={`row-skill-${index + 1}`}>
                  <span className="skill-number">0{index + 1}</span><span className="skill-name">{skill.name}</span><span className="skill-detail">{skill.detail}</span>
                </div>
              ))}
            </div>
            <div className="skills-foot">No rankings or proficiency scores — just room for the real story.</div>
          </div>
        </section>

        <section className="scene" id="projects" data-scene aria-labelledby="projects-title">
          <div className="scene-inner">
            <div className="section-heading reveal">
              <div><div className="eyebrow">03 / Made real</div><h2 id="projects-title">Ideas with<br /><em>somewhere to go.</em></h2></div>
              <p>Selected work will live along this path. Replace each marker with a real project, its story, tools, contribution, and working destination.</p>
            </div>
            <div className="project-list">
              {portfolio.projects.map((project, index) => (
                <article className="project-row reveal" key={project.title} data-cursor="project" data-project-index={index} data-testid={`row-project-${index + 1}`}>
                  <span className="project-number">0{index + 1} / FIELD</span>
                  <div><span className="project-title">{project.title}</span><span className="project-placeholder">Project details to be added</span></div>
                  <div className="project-description">
                    {project.preview && <img className="project-preview" src={project.preview} alt={`${project.title} preview`} loading="lazy" />}
                    <p>{project.description}</p>
                    <small>{project.contribution} · {project.technologies}</small>
                    {(project.demo || project.repository) && (
                      <div className="project-actions">
                        {project.demo && <a href={project.demo} target="_blank" rel="noreferrer" data-testid={`link-project-demo-${index + 1}`}>Live demo <ArrowUpRight size={13} /></a>}
                        {project.repository && <a href={project.repository} target="_blank" rel="noreferrer" data-testid={`link-project-repository-${index + 1}`}>Repository <ArrowUpRight size={13} /></a>}
                      </div>
                    )}
                  </div>
                  <span className="project-open" aria-hidden="true" />
                </article>
              ))}
            </div>
            <p className="projects-caption">Repository and live-demo links are intentionally omitted until supplied.</p>
          </div>
        </section>

        <section className="scene" id="achievements" data-scene aria-labelledby="achievements-title">
          <div className="scene-inner">
            <div className="section-heading reveal">
              <div><div className="eyebrow">04 / Achievements &amp; academic journey</div><h2 id="achievements-title">A work in<br /><em>progress.</em></h2></div>
              <p>Milestones make a map, not a measure. Add real academic steps, research, awards, and experiences here.</p>
            </div>
            <div className="timeline">
              {portfolio.milestones.map((milestone, index) => (
                <article className="milestone reveal" key={`${milestone.date}-${index}`} data-testid={`row-milestone-${index + 1}`}>
                  <time>{milestone.date}</time><div><h3>{milestone.title}</h3><p>{milestone.description}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="scene horizon" id="contact" data-scene aria-labelledby="contact-title">
          <div className="scene-inner">
            <div className="eyebrow reveal">05 / The horizon</div>
            <div className="horizon-block reveal reveal-delay-1">
              <h2 id="contact-title">What's<br /><em>next?</em></h2>
              <div>
                <p className="horizon-copy">{portfolio.next}</p>
                <button className="button-primary" type="button" onClick={handleResume} data-testid="button-download-resume">Download resume <ArrowUpRight size={15} /></button>
                {!portfolio.resumePath && <p className="resume-guidance">To enable this download: add your file as <strong>public/resume.pdf</strong>, then set <strong>resumePath</strong> to <strong>"/resume.pdf"</strong> in <strong>src/data/portfolio.ts</strong>.</p>}
                <p className="resume-message" role="status" aria-live="polite" data-testid="status-resume">{resumeMessage}</p>
                <div className="contact-links">
                  {contactItems.map((item) => item.value
                    ? <a key={item.label} href={item.label === 'Email' ? `mailto:${item.value}` : item.value} target={item.label === 'Email' ? undefined : '_blank'} rel={item.label === 'Email' ? undefined : 'noreferrer'} data-testid={`link-contact-${item.label.toLowerCase()}`}>{item.label}</a>
                    : <span key={item.label} className="contact-placeholder">{item.label} · add details</span>)}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer"><span>{portfolio.name}</span><span>© {new Date().getFullYear()} · A journey still unfolding</span></footer>
      <OrbitalCursor />
    </div>
  );
}

export default App;
