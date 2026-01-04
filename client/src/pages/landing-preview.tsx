import { useEffect } from "react";
import bgImage from "@assets/IMG_1888_1767528747402.png";
import phoneImage from "@assets/80C6108A-A430-49A8-A44D-F78715AF6CB4_1767530168873.png";

export default function LandingPreview() {
  useEffect(() => {
    document.documentElement.style.setProperty("--bg0", "#05060a");
    document.documentElement.style.setProperty("--bg1", "#070818");
    document.documentElement.style.setProperty("--text", "rgba(255,255,255,0.92)");
    document.documentElement.style.setProperty("--muted", "rgba(255,255,255,0.72)");
    document.documentElement.style.setProperty("--glass", "rgba(255,255,255,0.06)");
    document.documentElement.style.setProperty("--glass2", "rgba(255,255,255,0.10)");
    document.documentElement.style.setProperty("--stroke", "rgba(255,255,255,0.14)");
    document.documentElement.style.setProperty("--shadow", "rgba(0,0,0,0.55)");
    document.documentElement.style.setProperty("--cyan", "#39d5ff");
    document.documentElement.style.setProperty("--blue", "#0a5cff");
    document.documentElement.style.setProperty("--magenta", "#ff4fd8");
    document.documentElement.style.setProperty("--pink", "#ff4a8a");
    document.documentElement.style.setProperty("--orange", "#ff7a3d");
    document.documentElement.style.setProperty("--lime", "#31f7a5");
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg0)",
      color: "var(--text)",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      
      {/* ===== BACKGROUND IMAGE ===== */}
      
      {/* Main Background Image */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${bgImage})`,
        }} 
      />
      
      {/* Dark Overlay for Text Readability */}
      <div className="fixed inset-0 z-[1] pointer-events-none bg-gradient-to-b from-black/60 via-black/30 to-black/50" />
      
      {/* Curved Neon Wave Streaks SVG */}
      <svg
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "8%",
          width: "100%",
          height: "200px",
          zIndex: 5,
          pointerEvents: "none",
        }}
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="neonGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(57,213,255,0.5)" />
            <stop offset="50%" stopColor="rgba(255,79,216,0.4)" />
            <stop offset="100%" stopColor="rgba(255,122,61,0.35)" />
          </linearGradient>
          <linearGradient id="neonGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,79,216,0.4)" />
            <stop offset="50%" stopColor="rgba(57,213,255,0.5)" />
            <stop offset="100%" stopColor="rgba(49,247,165,0.35)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M0,120 Q360,60 720,100 T1440,80"
          fill="none"
          stroke="url(#neonGrad1)"
          strokeWidth="3"
          filter="url(#glow)"
          opacity="0.5"
        />
        <path
          d="M0,150 Q400,100 800,140 T1440,120"
          fill="none"
          stroke="url(#neonGrad2)"
          strokeWidth="4"
          filter="url(#glow)"
          opacity="0.4"
        />
      </svg>
      
      {/* Noise/Grain Overlay */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 6,
        pointerEvents: "none",
        opacity: 0.025,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
        backgroundSize: "3px 3px",
      }} />
      
      {/* ===== MAIN CONTENT ===== */}
      <div style={{ position: "relative", zIndex: 10 }}>
        
        {/* Navigation */}
        <nav style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "76px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          zIndex: 100,
          background: "linear-gradient(to bottom, rgba(5,6,10,0.8), rgba(5,6,10,0))",
        }}>
          {/* Logo */}
          <a href="#" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }} data-testid="link-home">
            {/* Neon Diamond Logo SVG */}
            <svg width="32" height="32" viewBox="0 0 32 32" style={{ filter: "drop-shadow(0 0 10px rgba(57,213,255,0.5))" }}>
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#39d5ff" />
                  <stop offset="100%" stopColor="#ff4fd8" />
                </linearGradient>
              </defs>
              <path
                d="M16 2 L28 16 L16 30 L4 16 Z"
                fill="none"
                stroke="url(#logoGrad)"
                strokeWidth="2"
              />
              <circle cx="16" cy="10" r="2" fill="#39d5ff" />
              <circle cx="16" cy="22" r="2" fill="#ff4fd8" />
              <line x1="16" y1="10" x2="16" y2="22" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
              <line x1="10" y1="16" x2="22" y2="16" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
              <circle cx="10" cy="16" r="1.5" fill="#39d5ff" />
              <circle cx="22" cy="16" r="1.5" fill="#ff4fd8" />
            </svg>
            <span style={{ 
              fontSize: "16px", 
              fontWeight: 700, 
              letterSpacing: "0.08em",
              background: "linear-gradient(90deg, #39d5ff, #ff4fd8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              TREASURE COAST AI
            </span>
          </a>
          
          {/* Nav Links */}
          <div style={{ display: "flex", gap: "32px" }} className="nav-links">
            {[
              { label: "How It Works", href: "#how-it-works" },
              { label: "Templates", href: "#templates" },
              { label: "Pricing", href: "#pricing" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleSmoothScroll(e, link.href)}
                style={{
                  color: "var(--muted)",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--text)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted)"}
                data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label}
              </a>
            ))}
          </div>
          
          {/* Book Demo Button */}
          <a
            href="#book-demo"
            onClick={(e) => handleSmoothScroll(e, "#book-demo")}
            style={{
              padding: "10px 20px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, rgba(57,213,255,0.15), rgba(255,79,216,0.12))",
              border: "1px solid rgba(57,213,255,0.35)",
              color: "var(--text)",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 0 20px rgba(57,213,255,0.15)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(57,213,255,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(57,213,255,0.15)";
            }}
            data-testid="button-book-demo-nav"
          >
            Book Demo
          </a>
        </nav>
        
        {/* Hero Section */}
        <section style={{
          minHeight: "92vh",
          paddingTop: "110px",
          paddingBottom: "60px",
          display: "flex",
          alignItems: "center",
        }}>
          <div style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: "56px",
            alignItems: "center",
          }} className="hero-grid">
            
            {/* Left Column */}
            <div>
              <h1 style={{
                fontSize: "clamp(44px, 5.5vw, 72px)",
                fontWeight: 700,
                lineHeight: 1.0,
                marginBottom: "24px",
                fontFamily: "'DM Serif Display', Georgia, serif",
              }}>
                AI Chatbots that<br />
                run your front desk<br />
                <span style={{ fontWeight: 800 }}>24/7.</span>
              </h1>
              
              <p style={{
                fontSize: "18px",
                lineHeight: 1.7,
                color: "var(--muted)",
                maxWidth: "440px",
                marginBottom: "32px",
              }}>
                Answer questions instantly, capture leads,<br />
                and send customers to booking—without<br />
                hiring staff.
              </p>
              
              {/* CTA Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "280px" }}>
                <a
                  href="#book-demo"
                  onClick={(e) => handleSmoothScroll(e, "#book-demo")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "14px 28px",
                    borderRadius: "999px",
                    background: "linear-gradient(135deg, rgba(57,213,255,0.18), rgba(255,79,216,0.14))",
                    border: "1px solid rgba(57,213,255,0.4)",
                    color: "var(--text)",
                    fontSize: "15px",
                    fontWeight: 600,
                    textDecoration: "none",
                    boxShadow: "0 0 25px rgba(57,213,255,0.2), 0 8px 32px rgba(0,0,0,0.3)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 0 35px rgba(57,213,255,0.3), 0 12px 40px rgba(0,0,0,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 0 25px rgba(57,213,255,0.2), 0 8px 32px rgba(0,0,0,0.3)";
                  }}
                  data-testid="button-book-live-demo"
                >
                  Book a Live Demo
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
                
                <a
                  href="#demos"
                  onClick={(e) => handleSmoothScroll(e, "#demos")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "14px 28px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: "var(--text)",
                    fontSize: "15px",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }}
                  data-testid="button-view-interactive-demo"
                >
                  View Interactive Demo
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Right Column - Phone Mockup Image */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <img
                src={phoneImage}
                alt="AI Assistant Chat Interface"
                style={{
                  maxWidth: "min(380px, 85vw)",
                  height: "auto",
                  transform: "rotate(2deg)",
                  animation: "float 8s ease-in-out infinite",
                  filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.5)) drop-shadow(0 0 40px rgba(57,213,255,0.15))",
                }}
                data-testid="img-phone-mockup"
              />
            </div>
          </div>
        </section>
        
        {/* Feature Chips Row */}
        <section style={{ padding: "0 24px 40px" }}>
          <div style={{
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "16px 24px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }} className="feature-capsule">
            {[
              { iconType: "clock", label: "24/7 Responses" },
              { iconType: "clipboard", label: "Lead Capture + Booking" },
              { iconType: "settings", label: "Done-For-You Setup" },
              { iconType: "file", label: "Multi-industry Templates" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 0",
                  flex: "1 1 auto",
                  justifyContent: "center",
                  minWidth: "180px",
                }}
              >
                <div style={{ width: "20px", height: "20px", color: "#39d5ff" }}>
                  {item.iconType === "clock" && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                    </svg>
                  )}
                  {item.iconType === "clipboard" && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" />
                    </svg>
                  )}
                  {item.iconType === "settings" && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  )}
                  {item.iconType === "file" && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
        
        {/* Built For Section */}
        <section style={{ padding: "40px 24px" }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
            {/* Title with lines */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginBottom: "28px" }}>
              <div style={{ flex: 1, maxWidth: "200px", height: "1px", background: "rgba(255,255,255,0.2)" }} />
              <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.05em" }}>Built For:</span>
              <div style={{ flex: 1, maxWidth: "200px", height: "1px", background: "rgba(255,255,255,0.2)" }} />
            </div>
            
            {/* Industry Buttons */}
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "14px" }}>
              {[
                { iconType: "scissors", label: "Barbershops" },
                { iconType: "sparkles", label: "Salons" },
                { iconType: "home", label: "Sober Living" },
                { iconType: "wrench", label: "Home Services" },
              ].map((item, i) => (
                <button
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "14px 24px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "var(--text)",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(57,213,255,0.4)";
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(57,213,255,0.15)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                  data-testid={`button-industry-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div style={{ width: "18px", height: "18px", color: "#ff4fd8" }}>
                    {item.iconType === "scissors" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
                        <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" />
                        <line x1="8.12" y1="8.12" x2="12" y2="12" />
                      </svg>
                    )}
                    {item.iconType === "sparkles" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                        <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z" />
                      </svg>
                    )}
                    {item.iconType === "home" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9,22 9,12 15,12 15,22" />
                      </svg>
                    )}
                    {item.iconType === "wrench" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                      </svg>
                    )}
                  </div>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>
        
        {/* Bottom CTA Section */}
        <section id="book-demo" style={{ padding: "80px 24px", textAlign: "center" }}>
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h2 style={{
              fontSize: "clamp(36px, 5vw, 52px)",
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: "32px",
              fontFamily: "'DM Serif Display', Georgia, serif",
            }}>
              Unlock the <span style={{
                background: "linear-gradient(90deg, #39d5ff, #ff4fd8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>Future of Sales.</span>
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "center" }}>
              <a
                href="#contact"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "16px 36px",
                  borderRadius: "999px",
                  background: "linear-gradient(135deg, rgba(57,213,255,0.2), rgba(255,79,216,0.16))",
                  border: "1px solid rgba(57,213,255,0.45)",
                  color: "var(--text)",
                  fontSize: "16px",
                  fontWeight: 600,
                  textDecoration: "none",
                  boxShadow: "0 0 30px rgba(57,213,255,0.2), 0 10px 40px rgba(0,0,0,0.3)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 0 40px rgba(57,213,255,0.3), 0 14px 50px rgba(0,0,0,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(57,213,255,0.2), 0 10px 40px rgba(0,0,0,0.3)";
                }}
                data-testid="button-book-demo-cta"
              >
                Book a Demo
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              
              <a
                href="#demos"
                onClick={(e) => handleSmoothScroll(e, "#demos")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "14px 32px",
                  borderRadius: "999px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "var(--text)",
                  fontSize: "15px",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                data-testid="button-try-live-demo"
              >
                Try the Live Demo
              </a>
            </div>
          </div>
        </section>
        
        {/* Anchor Sections for Nav Links */}
        <section id="how-it-works" style={{ padding: "60px 24px" }}>
          <div style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "32px",
            borderRadius: "24px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}>
            <h3 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "24px", fontFamily: "'DM Serif Display', Georgia, serif" }}>
              How It Works
            </h3>
            <div style={{ display: "grid", gap: "20px" }}>
              {[
                { step: "01", title: "Add widget to your site", desc: "One line of code. Works on any website builder." },
                { step: "02", title: "AI handles conversations", desc: "Answers FAQs, captures leads, routes to booking 24/7." },
                { step: "03", title: "Track everything in one place", desc: "See leads, conversations, and bookings in your dashboard." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <span style={{
                    padding: "8px 14px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, rgba(57,213,255,0.15), rgba(255,79,216,0.1))",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#39d5ff",
                  }}>{item.step}</span>
                  <div>
                    <h4 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>{item.title}</h4>
                    <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <section id="templates" style={{ padding: "40px 24px" }}>
          <div style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "32px",
            borderRadius: "24px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}>
            <h3 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "16px", fontFamily: "'DM Serif Display', Georgia, serif" }}>
              Industry Templates
            </h3>
            <p style={{ color: "var(--muted)", marginBottom: "24px" }}>Pre-built AI assistants for your industry. Deploy in minutes.</p>
            <div id="demos" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              {[
                { name: "Barbershop", iconType: "scissors" },
                { name: "Hair Salon", iconType: "sparkles" },
                { name: "Sober Living", iconType: "home" },
                { name: "Home Services", iconType: "wrench" },
              ].map((t, i) => (
                <div key={i} style={{
                  padding: "20px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  textAlign: "center",
                }}>
                  <div style={{ width: "32px", height: "32px", margin: "0 auto 8px", color: "#ff4fd8" }}>
                    {t.iconType === "scissors" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
                        <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" />
                        <line x1="8.12" y1="8.12" x2="12" y2="12" />
                      </svg>
                    )}
                    {t.iconType === "sparkles" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                        <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z" />
                      </svg>
                    )}
                    {t.iconType === "home" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9,22 9,12 15,12 15,22" />
                      </svg>
                    )}
                    {t.iconType === "wrench" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <section id="pricing" style={{ padding: "40px 24px 80px" }}>
          <div style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "32px",
            borderRadius: "24px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}>
            <h3 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "16px", fontFamily: "'DM Serif Display', Georgia, serif" }}>
              Simple Pricing
            </h3>
            <p style={{ color: "var(--muted)", marginBottom: "24px" }}>No hidden fees. Cancel anytime.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
              {[
                { name: "Starter", price: "$29", features: ["1 AI Assistant", "500 conversations/mo", "Basic analytics", "Email support"] },
                { name: "Pro", price: "$79", features: ["3 AI Assistants", "Unlimited conversations", "Advanced analytics", "Priority support", "Custom branding"] },
              ].map((plan, i) => (
                <div key={i} style={{
                  padding: "28px",
                  borderRadius: "20px",
                  background: i === 1 ? "linear-gradient(135deg, rgba(57,213,255,0.08), rgba(255,79,216,0.06))" : "rgba(255,255,255,0.04)",
                  border: i === 1 ? "1px solid rgba(57,213,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
                }}>
                  <h4 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>{plan.name}</h4>
                  <div style={{ fontSize: "36px", fontWeight: 700, marginBottom: "20px" }}>
                    {plan.price}<span style={{ fontSize: "16px", color: "var(--muted)" }}>/mo</span>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {plan.features.map((f, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", fontSize: "14px", color: "var(--muted)" }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: "#31f7a5", flexShrink: 0 }}>
                          <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer style={{
          padding: "40px 24px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          textAlign: "center",
        }}>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>
            © 2025 Treasure Coast AI. All rights reserved.
          </p>
        </footer>
      </div>
      
      {/* CSS for animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700;800&display=swap');
        
        html {
          scroll-behavior: smooth;
        }
        
        @keyframes float {
          0%, 100% { transform: rotate(2deg) translateY(0); }
          50% { transform: rotate(2deg) translateY(-8px); }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .chat-card {
            animation: none !important;
          }
        }
        
        @media (max-width: 980px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .hero-grid > div:first-child {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hero-grid > div:first-child > div:last-child {
            max-width: 100% !important;
          }
          .chat-card {
            transform: rotate(0deg) !important;
          }
          .feature-capsule {
            border-radius: 24px !important;
          }
          .nav-links {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
