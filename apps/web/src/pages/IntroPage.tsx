import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AmanQDrawnText } from "../components/AmanQDrawnText";

const TIMELINE_STEPS = [
  "Anomaly detected",
  "Data encrypted",
  "Backup triggered",
  "Integrity verified",
  "System restored"
];

export function IntroPage() {
  const navigate = useNavigate();
  const timelineRef = useRef<HTMLElement | null>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setTimelineVisible(true),
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* Chatling chatbot – load on intro page only */
  useEffect(() => {
    (window as unknown as { chtlConfig?: { chatbotId: string } }).chtlConfig = {
      chatbotId: "7795731849",
    };
    if (document.getElementById("chtl-script")) return;
    const script = document.createElement("script");
    script.id = "chtl-script";
    script.type = "text/javascript";
    script.async = true;
    script.dataset.id = "7795731849";
    script.src = "https://chatling.ai/js/embed.js";
    document.body.appendChild(script);
    return () => {
      script.remove();
      delete (window as unknown as { chtlConfig?: { chatbotId: string } }).chtlConfig;
    };
  }, []);

  useEffect(() => {
    const refs = sectionRefs.current.filter(Boolean);
    if (refs.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        setVisibleSections((prev) => {
          const next = new Set(prev);
          entries.forEach((e) => {
            const i = refs.indexOf(e.target as HTMLElement);
            if (i >= 0 && e.isIntersecting) next.add(i);
          });
          return next;
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    refs.forEach((el) => { if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="intro-page">
      <header className="intro-header">
        <div className="intro-logo">
          <span className="intro-logo-icon">◇</span>
          <span className="intro-logo-text">
            <AmanQDrawnText />
          </span>
        </div>
        <nav className="intro-nav">
          <button type="button" onClick={() => navigate("/workspace")}>
            Workspace
          </button>
          <button type="button" onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>
          <button
            type="button"
            className="intro-cta"
            onClick={() => navigate("/workspace")}
          >
            Enter
          </button>
        </nav>
      </header>

      <div className="intro-bg-orbs" aria-hidden>
        <span className="intro-orb intro-orb-1" />
        <span className="intro-orb intro-orb-2" />
        <span className="intro-orb intro-orb-3" />
        <span className="intro-orb intro-orb-4" />
      </div>
      <div className="intro-grid-overlay" aria-hidden />

      <div className="intro-scroll">
        {/* Hero — Identity */}
        <main className="intro-main intro-hero-section">
          <div className="intro-hero">
            <div className="intro-copy">
              <p className="intro-tagline intro-reveal" style={{ animationDelay: "0.1s" }}>
                Quantum-inspired resilience
              </p>
              <h1 className="intro-title intro-reveal" style={{ animationDelay: "0.2s" }}>
                <span className="intro-title-brand">
                  <AmanQDrawnText />
                </span>
              </h1>
              <p className="intro-system-line intro-reveal" style={{ animationDelay: "0.28s" }}>
                Intelligent Server Management & Recovery System
              </p>
              <p className="intro-desc intro-reveal" style={{ animationDelay: "0.45s" }}>
                AI-driven load balancing and recovery for reliable digital services—even when the world is unstable.
              </p>
<div className="intro-btn-wrap intro-reveal" style={{ animationDelay: "0.65s" }}>
              <span className="intro-btn-border" aria-hidden />
              <button
                type="button"
                className="intro-btn"
                onClick={() => navigate("/workspace")}
              >
                <span className="intro-btn-shine" />
                Get Started
              </button>
            </div>
            <div className="intro-feature-strip intro-reveal" style={{ animationDelay: "0.75s" }}>
              <div className="intro-feature-pill">
                <span className="intro-feature-icon" aria-hidden>◇</span>
                <span>AI-Driven</span>
              </div>
              <div className="intro-feature-pill">
                <span className="intro-feature-icon" aria-hidden>⚛</span>
                <span>Quantum-Inspired Optimization</span>
              </div>
              <div className="intro-feature-pill">
                <span className="intro-feature-icon" aria-hidden>🛡</span>
                <span>Automated Backup</span>
              </div>
              <div className="intro-feature-pill">
                <span className="intro-feature-icon" aria-hidden>📊</span>
                <span>Real-Time Monitoring</span>
              </div>
            </div>
            <p className="intro-scroll-hint intro-reveal" style={{ animationDelay: "0.9s" }}>
              <span>Scroll to explore</span>
              <span className="intro-scroll-chevron" aria-hidden>↓</span>
            </p>
          </div>
            <div className="intro-hero-drawing" aria-hidden>
              <svg className="intro-drawing-svg intro-device-svg" viewBox="-20 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="intro-device-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(77, 166, 255, 0.9)" />
                    <stop offset="100%" stopColor="rgba(168, 85, 247, 0.8)" />
                  </linearGradient>
                  <filter id="intro-device-glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <path className="intro-device-body" d="M50 25 L150 25 Q165 25 165 40 L165 100 Q165 115 150 115 L50 115 Q35 115 35 100 L35 40 Q35 25 50 25 Z" fill="rgba(18, 22, 30, 0.95)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />
                <circle className="intro-device-ring" cx="115" cy="55" r="18" fill="none" stroke="url(#intro-device-grad)" strokeWidth="3" filter="url(#intro-device-glow)" />
                <circle cx="115" cy="55" r="14" fill="none" stroke="rgba(77, 166, 255, 0.4)" strokeWidth="1" />
                <text x="58" y="58" className="intro-device-label" fill="rgba(255,255,255,0.85)" fontSize="11" fontFamily="var(--font-sans), sans-serif" fontWeight="600">amanQ</text>
                <rect className="intro-device-sim" x="28" y="52" width="14" height="20" rx="2" fill="rgba(180,160,100,0.5)" stroke="rgba(77, 166, 255, 0.5)" strokeWidth="1" />
                <path className="intro-device-stream intro-device-stream-1" d="M28 58 Q0 55 0 70 Q0 85 20 82" stroke="url(#intro-device-grad)" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path className="intro-device-stream intro-device-stream-2" d="M28 65 Q-5 70 -5 85" stroke="rgba(77, 166, 255, 0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path className="intro-device-stream intro-device-stream-3" d="M28 72 Q5 78 10 95" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                <rect className="intro-device-usb" x="158" y="48" width="10" height="6" rx="1" fill="rgba(30,35,45,0.9)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
                <rect className="intro-device-usb" x="158" y="58" width="10" height="6" rx="1" fill="rgba(30,35,45,0.9)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
              </svg>
            </div>
        </div>
      </main>

        {/* Section 1: Why Aman Q — Problem */}
        <section
          className={`intro-section intro-section-problem ${visibleSections.has(0) ? "intro-section-inview" : ""}`}
          id="why"
          ref={(el) => { sectionRefs.current[0] = el; }}
        >
          <div className="intro-section-inner intro-two-col">
            <div className="intro-section-text">
              <h2 className="intro-section-title">Why Aman Q?</h2>
              <p className="intro-section-body">
                In unstable and resource-constrained environments, digital services fail due to overload, outages, and data loss. Aman Q is built to keep systems alive when conditions are not.
              </p>
            </div>
            <div className="intro-section-visual intro-problem-icons">
              <span className="intro-problem-icon intro-reveal" style={{ animationDelay: "0.1s" }} title="Power outage">⚡</span>
              <span className="intro-problem-icon intro-reveal" style={{ animationDelay: "0.3s" }} title="Network drop">📶</span>
              <span className="intro-problem-icon intro-reveal" style={{ animationDelay: "0.5s" }} title="Server overload">🖥</span>
            </div>
          </div>
        </section>

        {/* Section 2: How Aman Q Thinks — Intelligence */}
        <section
          className={`intro-section intro-section-intel ${visibleSections.has(1) ? "intro-section-inview" : ""}`}
          id="intelligence"
          ref={(el) => { sectionRefs.current[1] = el; }}
        >
          <div className="intro-section-inner intro-section-centered">
            <h2 className="intro-section-title">Intelligence at the Core</h2>
            <div className="intro-intel-card">
              <div className="intro-intel-loop">
                <span className="intro-intel-step">Monitor</span>
                <span className="intro-intel-arrow" />
                <span className="intro-intel-step">Analyze</span>
                <span className="intro-intel-arrow" />
                <span className="intro-intel-step">Decide</span>
                <span className="intro-intel-arrow" />
                <span className="intro-intel-step">Act</span>
              </div>
              <ul className="intro-intel-bullets">
                <li>Collects real-time server metrics</li>
                <li>Detects overload and failure patterns</li>
                <li>Makes autonomous routing decisions</li>
                <li>Activates backup and recovery instantly</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Quantum-Inspired — WOW */}
        <section
          className={`intro-section intro-section-quantum ${visibleSections.has(2) ? "intro-section-inview" : ""}`}
          id="quantum"
          ref={(el) => { sectionRefs.current[2] = el; }}
        >
          <div className="intro-section-inner intro-two-col">
            <div className="intro-section-text">
              <h2 className="intro-section-title">Quantum-Inspired Decisions</h2>
              <p className="intro-section-body">
                Aman Q uses quantum-inspired optimization models to explore multiple load distribution states simultaneously and select the most efficient outcome under stress.
              </p>
            </div>
            <div className="intro-section-visual intro-quantum-compare">
              <div className="intro-quantum-mode intro-quantum-traditional">
                <span className="intro-quantum-label">Traditional</span>
                <div className="intro-quantum-bars intro-quantum-uneven">
                  <span style={{ height: "85%" }} /><span style={{ height: "35%" }} /><span style={{ height: "70%" }} /><span style={{ height: "25%" }} />
                </div>
              </div>
              <div className="intro-quantum-toggle" aria-hidden>→</div>
              <div className="intro-quantum-mode intro-quantum-optimized">
                <span className="intro-quantum-label">Quantum mode</span>
                <div className="intro-quantum-bars intro-quantum-balanced">
                  <span style={{ height: "55%" }} /><span style={{ height: "52%" }} /><span style={{ height: "54%" }} /><span style={{ height: "53%" }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Virtual Desktop Concept */}
        <section
          className={`intro-section intro-section-desktop ${visibleSections.has(3) ? "intro-section-inview" : ""}`}
          id="desktop"
          ref={(el) => { sectionRefs.current[3] = el; }}
        >
          <div className="intro-section-inner intro-section-wide">
            <h2 className="intro-section-title">Aman Q Virtual Desktop</h2>
            <p className="intro-section-body intro-section-body-center">
              A simulated operational environment where system state, servers, files, and recovery actions are visualized as a controlled digital workspace.
            </p>
            <div className="intro-desktop-mock">
              <div className="intro-desktop-title-bar">
                <span className="intro-desktop-dots">
                  <span className="intro-dot red" /><span className="intro-dot yellow" /><span className="intro-dot green" />
                </span>
                <span>Aman Q — Workspace</span>
              </div>
              <div className="intro-desktop-content">
                <div className="intro-desktop-icon" title="Server S1"><span>🖥</span><span>S1</span></div>
                <div className="intro-desktop-icon" title="Server S2"><span>🖥</span><span>S2</span></div>
                <div className="intro-desktop-icon intro-desktop-folder" title="Critical Data"><span>📁</span><span>Critical Data</span></div>
                <div className="intro-desktop-status">
                  <span className="intro-status-dot green" /> Live
                  <span className="intro-status-dot yellow" /> Standby
                  <span className="intro-status-dot red" /> Failover
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Resilience & Recovery — Timeline */}
        <section
          className={`intro-section intro-section-timeline ${visibleSections.has(4) ? "intro-section-inview" : ""}`}
          id="resilience"
          ref={(el) => {
            sectionRefs.current[4] = el;
            timelineRef.current = el;
          }}
        >
          <div className="intro-section-inner intro-section-centered">
            <h2 className="intro-section-title">Resilience & Recovery</h2>
            <p className="intro-section-body intro-section-body-center">
              From detection to restoration in a single flow.
            </p>
            <div className={`intro-timeline ${timelineVisible ? "intro-timeline-visible" : ""}`}>
              {TIMELINE_STEPS.map((label, i) => (
                <div key={label} className="intro-timeline-step" style={{ animationDelay: `${i * 0.15}s` }}>
                  <span className="intro-timeline-dot" />
                  <span className="intro-timeline-label">{label}</span>
                  {i < TIMELINE_STEPS.length - 1 && <span className="intro-timeline-line" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Designed for Reality */}
        <section
          className={`intro-section intro-section-reality ${visibleSections.has(5) ? "intro-section-inview" : ""}`}
          id="reality"
          ref={(el) => { sectionRefs.current[5] = el; }}
        >
          <div className="intro-section-inner intro-section-centered">
            <h2 className="intro-section-title">Designed for Reality</h2>
            <p className="intro-section-body intro-section-body-center intro-reality-text">
              Designed for environments with unstable internet, limited infrastructure, and frequent outages — where resilience is not optional.
            </p>
            <p className="intro-section-caption">Academic & research-focused prototype</p>
          </div>
        </section>

        {/* Section 7: Final CTA */}
        <section
          className={`intro-section intro-section-cta ${visibleSections.has(6) ? "intro-section-inview" : ""}`}
          id="enter"
          ref={(el) => { sectionRefs.current[6] = el; }}
        >
          <div className="intro-section-inner intro-section-centered">
            <p className="intro-cta-text">Enter the Aman Q Environment</p>
            <div className="intro-btn-wrap">
              <span className="intro-btn-border" aria-hidden />
              <button
                type="button"
                className="intro-btn intro-btn-final"
                onClick={() => navigate("/workspace")}
              >
                <span className="intro-btn-shine" />
                Enter Virtual Desktop
              </button>
            </div>
          </div>
        </section>

        {/* Hero graphic — last thing, scroll to see */}
        <section className="intro-hero-graphic-section" ref={(el) => { sectionRefs.current[7] = el; }}>
          <img
            src="/intro-hero-graphic.png"
            alt="AmanQ — Intelligent Server Management & Recovery System. Quantum Edge Device with AI-Driven, Quantum-inspired Optimization, Automated Backup, and Real-Time Monitoring."
            className="intro-hero-graphic-img"
          />
        </section>
      </div>
    </div>
  );
}
