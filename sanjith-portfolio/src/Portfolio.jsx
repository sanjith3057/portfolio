import { useState, useEffect, useRef, useMemo, useCallback, Children, cloneElement } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";

// Custom logos from asserts folder
import githubLogo from "../../asserts/github-logo.png";
import linkedInLogo from "../../asserts/linked-in.png";
import gmailLogo from "../../asserts/gmail-logo.png";
import pythonLogo from "../../asserts/python.png";
import PixelBlast from "./PixelBlast";
import RAGChat from "./RAGChat";

/* ============================================================
   GLOBAL STYLES — injected into <head>
   ============================================================ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
  @import url('https://api.fontshare.com/v2/css?f[]=clash-display@300,400,500,600,700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #FAFAF7;
    --surface: rgba(255,255,255,0.15);
    --glass-border: rgba(255,255,255,0.4);
    --glass-shine: rgba(255,255,255,0.6);
    --glass-shadow: rgba(124,58,237,0.12);
    --accent1: #7C3AED;
    --accent2: #38BDF8;
    --accent3: #FB7185;
    --accent4: #F59E0B;
    --accent5: #10B981;
    --text: #1A1033;
    --subtext: #64748B;
    --font-display: 'Clash Display', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --radius: 24px;
    --radius-sm: 14px;
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--text);
    overflow-x: hidden;
    cursor: none;
  }

  /* Custom cursor */
  .cursor-dot {
    position: fixed;
    width: 8px; height: 8px;
    background: var(--accent1);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    transform: translate(-50%, -50%);
    transition: transform 0.1s;
  }
  .cursor-ring {
    position: fixed;
    width: 36px; height: 36px;
    border: 1.5px solid rgba(124,58,237,0.4);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9998;
    transform: translate(-50%, -50%);
    transition: all 0.15s ease;
    backdrop-filter: blur(2px);
  }

  /* Core liquid glass recipe */
  .glass {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.6),   /* top specular */
      inset 0 -1px 0 rgba(255, 255, 255, 0.1),  /* bottom inner */
      0 8px 32px rgba(124, 58, 237, 0.12),      /* colored drop shadow */
      0 1px 0 rgba(255, 255, 255, 0.8);         /* outer edge catch */
    border-radius: var(--radius);
  }

  .glass-sm {
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(16px) saturate(160%);
    -webkit-backdrop-filter: blur(16px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.45);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.7),
      0 4px 16px rgba(124, 58, 237, 0.08);
    border-radius: var(--radius-sm);
  }

  section { padding: 100px 24px; }
  .section-inner { max-width: 1100px; margin: 0 auto; }

  .section-label {
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent1);
    margin-bottom: 12px;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 5vw, 3.2rem);
    font-weight: 800;
    color: var(--text);
    line-height: 1.1;
    margin-bottom: 48px;
  }

  /* Typing cursor blink — pure CSS */
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  .type-cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background: var(--accent1);
    margin-left: 3px;
    vertical-align: middle;
    animation: blink 0.6s step-end infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) scale(1); }
    33% { transform: translateY(-28px) scale(1.03); }
    66% { transform: translateY(-14px) scale(0.98); }
  }
  @keyframes floatB {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(8deg); }
  }
  @keyframes shimmer {
    0% { transform: translateX(-100%) rotate(25deg); }
    100% { transform: translateX(400%) rotate(25deg); }
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 3px; }

  /* Dock Panel frosted glass on cream background */
  .dock-panel {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: flex-end;
    width: fit-content;
    gap: 10px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px) saturate(140%);
    -webkit-backdrop-filter: blur(12px) saturate(140%);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      0 8px 32px rgba(124, 58, 237, 0.12);
    padding: 8px 12px;
    z-index: 1000;
  }
  .dock-item {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(255,255,255,0.3);
    border: 1px solid rgba(255,255,255,0.6);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(124,58,237,0.08);
    cursor: pointer;
    outline: none;
    color: var(--text);
    transition: background 0.2s;
  }
  .dock-item:hover { background: rgba(255,255,255,0.5); }
  .dock-icon { display: flex; align-items: center; justify-content: center; }
  .dock-label {
    position: absolute;
    top: -2.2rem;
    left: 50%;
    width: fit-content;
    white-space: pre;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.5);
    background: rgba(255,255,255,0.6);
    backdrop-filter: blur(12px);
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text);
    transform: translateX(-50%);
    pointer-events: none;
  }

  /* Folder */
  .folder { transition: all 0.2s ease-in; cursor: pointer; }
  .folder:not(.open):hover { transform: translateY(-8px); }
  .folder:not(.open):hover .paper { transform: translate(-50%, 0%); }
  .folder:not(.open):hover .folder__front { transform: skew(15deg) scaleY(0.6); }
  .folder:not(.open):hover .right { transform: skew(-15deg) scaleY(0.6); }
  .folder.open { transform: translateY(-8px); }
  .folder.open .paper:nth-child(1) { transform: translate(-120%, -70%) rotateZ(-15deg); }
  .folder.open .paper:nth-child(2) { transform: translate(10%, -70%) rotateZ(15deg); height: 80%; }
  .folder.open .paper:nth-child(3) { transform: translate(-50%, -100%) rotateZ(5deg); height: 80%; }
  .folder.open .folder__front { transform: skew(15deg) scaleY(0.6); }
  .folder.open .right { transform: skew(-15deg) scaleY(0.6); }
  .folder__back {
    position: relative; width: 100px; height: 80px;
    background: var(--folder-back-color);
    border-radius: 0px 10px 10px 10px;
  }
  .folder__back::after {
    position: absolute; z-index: 0; bottom: 98%; left: 0;
    content: ''; width: 30px; height: 10px;
    background: var(--folder-back-color);
    border-radius: 5px 5px 0 0;
  }
  .paper {
    position: absolute; z-index: 2; bottom: 10%; left: 50%;
    transform: translate(-50%, 10%);
    width: 70%; height: 80%;
    background: #f0e8ff;
    border-radius: 10px;
    transition: all 0.3s ease-in-out;
  }
  .paper:nth-child(2) { background: #e8f5ff; width: 80%; height: 70%; }
  .paper:nth-child(3) { background: #fff; width: 90%; height: 60%; }
  .folder__front {
    position: absolute; z-index: 3;
    width: 100%; height: 100%;
    background: var(--folder-color);
    border-radius: 5px 10px 10px 10px;
    transform-origin: bottom;
    transition: all 0.3s ease-in-out;
  }

  /* LogoLoop */
  .logoloop { position: relative; --logoloop-gap: 40px; --logoloop-logoHeight: 32px; }
  .logoloop__track { display: flex; width: max-content; will-change: transform; user-select: none; }
  .logoloop__list { display: flex; align-items: center; }
  .logoloop__item { flex: 0 0 auto; margin-right: var(--logoloop-gap); font-size: var(--logoloop-logoHeight); line-height: 1; display: flex; align-items: center; gap: 8px; }
  .logoloop--fade::before, .logoloop--fade::after {
    content: ''; position: absolute; top: 0; bottom: 0;
    width: 80px; pointer-events: none; z-index: 10;
  }
  .logoloop--fade::before { left: 0; background: linear-gradient(to right, var(--bg) 0%, transparent 100%); }
  .logoloop--fade::after { right: 0; background: linear-gradient(to left, var(--bg) 0%, transparent 100%); }

  /* BorderGlow card with Core Liquid Glass Recipe & Animated Cursor-Following Specular */
  .border-glow-card {
    --mx: 0px;
    --my: 0px;
    position: relative;
    border-radius: var(--radius);
    isolation: isolate;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.6),   /* top specular */
      inset 0 -1px 0 rgba(255, 255, 255, 0.1),  /* bottom inner */
      0 8px 32px rgba(124, 58, 237, 0.12),      /* colored drop shadow */
      0 1px 0 rgba(255, 255, 255, 0.8);         /* outer edge catch */
    overflow: hidden;
    transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease;
  }
  .border-glow-card:hover {
    transform: translateY(-6px) perspective(600px) rotateX(2deg);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.7),
      0 20px 48px rgba(124, 58, 237, 0.18);
  }
  
  /* Dynamic Border Glow */
  .border-glow-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.5px; /* Border thickness */
    background: radial-gradient(
      250px circle at var(--mx) var(--my),
      rgba(255, 255, 255, 0.85) 0%,
      rgba(255, 255, 255, 0.15) 50%,
      transparent 100%
    );
    -webkit-mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
            mask-composite: exclude;
    pointer-events: none;
    z-index: 2;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .border-glow-card:hover::before {
    opacity: 1;
  }

  /* Dynamic Specular Highlights */
  .border-glow-card::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      200px circle at var(--mx) var(--my),
      rgba(255, 255, 255, 0.22) 0%,
      transparent 100%
    );
    pointer-events: none;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .border-glow-card:hover::after {
    opacity: 1;
  }
  
  .border-glow-inner { display: flex; flex-direction: column; position: relative; z-index: 3; padding: 28px; }

  /* Carousel */
  .carousel-wrap { position: relative; overflow: hidden; border-radius: var(--radius); padding: 16px; }
  .carousel-track { display: flex; will-change: transform; perspective: 1200px; }
  .carousel-item {
    position: relative; display: flex; flex-shrink: 0;
    flex-direction: column; justify-content: space-between;
    border-radius: calc(var(--radius) - 8px);
    background: rgba(255,255,255,0.22);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.5);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 16px rgba(124,58,237,0.08);
    overflow: hidden; cursor: grab; padding: 24px;
    will-change: transform, opacity;
  }
  .carousel-item:active { cursor: grabbing; }
  .carousel-indicators { display: flex; justify-content: center; gap: 8px; margin-top: 16px; }
  .carousel-dot { width: 8px; height: 8px; border-radius: 50%; cursor: pointer; transition: all 0.2s; border: none; }
  .carousel-dot.active { background: var(--accent1); transform: scale(1.3); }
  .carousel-dot.inactive { background: rgba(124,58,237,0.25); }

  /* Shimmer overlay on glass cards */
  .glass-shimmer {
    position: absolute; inset: 0; border-radius: inherit;
    pointer-events: none; overflow: hidden; z-index: 2;
  }
  .glass-shimmer::after {
    content: '';
    position: absolute;
    top: -50%; left: -60%;
    width: 40%; height: 200%;
    background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 50%, transparent 80%);
    transform: rotate(25deg);
    animation: shimmer 4s ease-in-out infinite;
    animation-delay: var(--shimmer-delay, 0s);
  }

  /* Tech tags */
  .tag {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    background: rgba(124,58,237,0.08);
    border: 1px solid rgba(124,58,237,0.18);
    color: var(--accent1);
    margin: 3px 3px 0 0;
  }

  /* Stat cards upgraded with Core Liquid Glass Recipe & Animated Cursor-Following Specular */
  .stat-card {
    position: relative;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.6),   /* top specular */
      inset 0 -1px 0 rgba(255, 255, 255, 0.1),  /* bottom inner */
      0 8px 32px rgba(124, 58, 237, 0.12),      /* colored drop shadow */
      0 1px 0 rgba(255, 255, 255, 0.8);         /* outer edge catch */
    border-radius: 18px;
    padding: 20px 24px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    transform-style: preserve-3d;
    overflow: hidden;
  }
  .stat-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.5px;
    background: radial-gradient(
      150px circle at var(--mx, 0px) var(--my, 0px),
      rgba(255, 255, 255, 0.8) 0%,
      rgba(255, 255, 255, 0.15) 50%,
      transparent 100%
    );
    -webkit-mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
            mask-composite: exclude;
    pointer-events: none;
    z-index: 2;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .stat-card:hover::before {
    opacity: 1;
  }
  .stat-card::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      120px circle at var(--mx, 0px) var(--my, 0px),
      rgba(255, 255, 255, 0.2) 0%,
      transparent 100%
    );
    pointer-events: none;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .stat-card:hover::after {
    opacity: 1;
  }

  /* Hero orbs */
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.55;
    pointer-events: none;
  }

  /* Publication item */
  .pub-item {
    padding: 24px 0;
    border-bottom: 1px solid rgba(124,58,237,0.1);
    position: relative;
    padding-left: 80px;
  }
  .pub-num {
    position: absolute;
    left: 0; top: 24px;
    font-family: var(--font-display);
    font-size: 2.5rem;
    font-weight: 800;
    color: rgba(124,58,237,0.12);
    line-height: 1;
  }

  /* Contact Cards Wrapper upgraded with Core Liquid Glass Recipe & Animated Cursor-Following Specular */
  .contact-card-wrap {
    position: relative;
    border-radius: 18px;
    transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .contact-card-wrap:hover {
    transform: translateY(-4px);
  }
  .contact-card-wrap::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.5px;
    background: radial-gradient(
      150px circle at var(--mx, 0px) var(--my, 0px),
      rgba(255, 255, 255, 0.8) 0%,
      rgba(255, 255, 255, 0.15) 50%,
      transparent 100%
    );
    -webkit-mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
            mask-composite: exclude;
    pointer-events: none;
    z-index: 2;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .contact-card-wrap:hover::before {
    opacity: 1;
  }
  .contact-card-wrap::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      150px circle at var(--mx, 0px) var(--my, 0px),
      rgba(255, 255, 255, 0.2) 0%,
      transparent 100%
    );
    pointer-events: none;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .contact-card-wrap:hover::after {
    opacity: 1;
  }

  .contact-link {
    display: flex; align-items: center; gap: 14px;
    text-decoration: none; color: var(--text);
    font-weight: 500;
    padding: 20px 28px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.6),
      inset 0 -1px 0 rgba(255, 255, 255, 0.1),
      0 8px 32px rgba(124, 58, 237, 0.12),
      0 1px 0 rgba(255, 255, 255, 0.8);
    transition: all 0.25s ease;
    position: relative; overflow: hidden;
    z-index: 1;
  }
  .contact-link:hover {
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.7),
      0 16px 36px rgba(124, 58, 237, 0.18);
  }

  /* Background mesh */
  .bg-mesh {
    position: fixed; inset: 0; z-index: -1; pointer-events: none;
    background: var(--bg);
  }
  .bg-mesh::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 600px 500px at 10% 20%, rgba(124,58,237,0.12) 0%, transparent 70%),
      radial-gradient(ellipse 500px 400px at 85% 10%, rgba(56,189,248,0.12) 0%, transparent 70%),
      radial-gradient(ellipse 400px 500px at 70% 80%, rgba(251,113,133,0.10) 0%, transparent 70%),
      radial-gradient(ellipse 350px 300px at 20% 80%, rgba(245,158,11,0.08) 0%, transparent 70%);
  }
  .bg-dots {
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(124,58,237,0.07) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  /* Responsive */
  #hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    position: relative;
    overflow: hidden;
    padding-top: 80px;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .hero-avatar-inner {
    width: 280px;
    height: 280px;
  }
  .hero-buttons-container {
    display: flex;
    flex-wrap: wrap;
  }
  @media (max-width: 768px) {
    section { padding: 72px 16px; }
    .section-title { font-size: 1.8rem; }
    .dock-panel { gap: 6px !important; padding: 6px 8px !important; border-radius: 16px !important; bottom: 12px !important; }
    .dock-item { font-size: 13px !important; border-radius: 8px !important; }
    .cursor-dot, .cursor-ring { display: none !important; }
    body { cursor: auto !important; }
    .projects-grid { grid-template-columns: 1fr 1fr !important; }
    .about-grid { grid-template-columns: 1fr !important; }
    .hero-inner { flex-direction: column !important; text-align: center; align-items: center !important; }
    #hero {
      min-height: auto !important;
      padding-top: 100px !important;
      padding-bottom: 60px !important;
    }
    .hero-avatar-inner {
      width: 200px !important;
      height: 200px !important;
    }
    .hero-buttons-container {
      justify-content: center;
    }
    .stats-grid {
      grid-template-columns: 1fr !important;
    }
  }
  @media (max-width: 480px) {
    .projects-grid { grid-template-columns: 1fr !important; }
  }
  @media (hover: none) {
    .dock-label {
      display: none !important;
    }
    body {
      cursor: auto !important;
    }
    .cursor-dot, .cursor-ring {
      display: none !important;
    }
  }
`;

/* ============================================================
   DATA (Aligning Repository URLs strictly with PORTFOLIO_PLAN.md)
   ============================================================ */
const DATA = {
  meta: {
    name: "Sanjith G",
    roles: ["AI/ML Engineer", "RAG Pipeline Builder ", "Data Scientist", "Data Analyst", "Machine Learning Engineer", "Model Merging Enthusiast", "Open Source Contributor"],
    tagline: "Building intelligent systems.",
    bio: "Fresh BSc CS grad with 8 months of production AI experience. I build RAG pipelines, fine-tune LLMs on 4GB VRAM, and merge models at midnight. Currently seeking AI/ML roles in Chennai and beyond.",
    github: "https://github.com/sanjith3057",
    linkedin: "https://www.linkedin.com/in/sanjith-g-9a2283249",
    email: "sajith3057e@gmail.com",
    resumeUrl: "https://drive.google.com/file/d/1gL_Rqgs8xS44h-Mw8nQzLo3AHlghVQMr/view?usp=sharing",
  },
  stats: [
    { label: "Internship XP", value: "8 Months", icon: "💼", color: "#7C3AED" },
    { label: "Certifications", value: "18+", icon: "☁️", color: "#38BDF8" },
    { label: "Publications", value: "2 Papers", icon: "📄", color: "#10B981" },
  ],
  projects: [
    { id: "prism", name: "PRISM-RAG", tagline: "5-layer anti-lost-in-middle RAG with hybrid ChromaDB + BM25 retrieval & cross-encoder reranking", tech: ["LangChain", "ChromaDB", "BM25", "FastAPI"], color: "#7C3AED", github: "https://github.com/sanjith3057/PRISM-RAG" },
    { id: "guardian", name: "GUARDIAN-AGENT", tagline: "Self-healing ReAct agent with BudgetGuard, tool observability and automatic recovery loops", tech: ["ReAct", "LangChain", "MLflow", "Python"], color: "#38BDF8", github: "https://github.com/sanjith3057/GUARDIAN-AGENT" },
    { id: "lens", name: "LENS", tagline: "Multimodal document intelligence pipeline using CLIP embeddings and Llama 4 Scout", tech: ["CLIP", "Llama 4", "FastAPI", "Python"], color: "#FB7185", github: "https://github.com/sanjith3057/LENS" },
    { id: "forge", name: "FORGE", tagline: "QLoRA fine-tuning for Llama-3.1-8B on 4GB VRAM — 19/20 format consistency vs 6/20 baseline", tech: ["QLoRA", "PEFT", "HuggingFace", "PyTorch"], color: "#F59E0B", github: "https://github.com/sanjith3057/FORGE" },
    { id: "phantom", name: "PHANTOM-3B", tagline: "Custom model via SLERP + TIES+DARE merging of Qwen2.5-3B and Phi-3.5-mini using MergeKit", tech: ["MergeKit", "Qwen2.5", "Phi-3.5", "GGUF"], color: "#6366F1", github: "https://github.com/sanjith3057/PHANTOM-3B" },
    { id: "nexus", name: "NEXUS", tagline: "FastAPI + Docker + MLflow production deployment stack — from notebook to monitored endpoint", tech: ["FastAPI", "Docker", "MLflow", "Python"], color: "#10B981", github: "https://github.com/sanjith3057/NEXUS" },
  ],
  skills: [
    { label: "Python", color: "#3776AB" },
    { label: "PyTorch", color: "#EE4C2C" },
    { label: "FastAPI", color: "#009688" },
    { label: "Docker", color: "#2496ED" },
    { label: "MLflow", color: "#0194E2" },
    { label: "HuggingFace", color: "#FFD21E" },
    { label: "Azure", color: "#0078D4" },
    { label: "Streamlit", color: "#FF4B4B" },
    { label: "LangChain", color: "#1C3C3C" },
    { label: "Groq", color: "#F55036" },
    { label: "NumPy", color: "#013243" },
    { label: "Git", color: "#F05032" },
    { label: "ChromaDB", color: "#7C3AED" },
    { label: "Scikit-learn", color: "#F7931E" },
  ],
  certs: [
    { title: "ICAC 2024 — Satellite Image Dehazing", issuer: "Bharathiar University", date: "Sep 2024", icon: "🎓", color: "#7C3AED", url: "/Certificate/ICAC24-186.pdf" },
    { title: "What Is Generative AI?", issuer: "LinkedIn Learning", date: "Apr 2025", icon: "🤖", color: "#0077B5", url: "/Certificate/What Is Generative AI.pdf" },
    { title: "Microsoft Azure AI Essentials", issuer: "LinkedIn Learning", date: "Apr 2025", icon: "☁️", color: "#0078D4", url: "/Certificate/Microsoft Azure AI Essentials.pdf" },
    { title: "Ethics in the Age of Generative AI", issuer: "LinkedIn Learning", date: "Apr 2025", icon: "⚖️", color: "#38BDF8", url: "/Certificate/Ethics in the Age of Generative AI .pdf" },
    { title: "Introduction to DevOps", issuer: "Great Learning Academy", date: "Oct 2024", icon: "🔄", color: "#10B981", url: "/Certificate/Devops.pdf" },
    { title: "Machine Learning Concepts", issuer: "Online Course", date: "2024", icon: "🧠", color: "#FB7185", url: "/Certificate/Machine learning.pdf" },
    { title: "Machine Learning Level 2", issuer: "Online Course", date: "2024", icon: "🤖", color: "#F59E0B", url: "/Certificate/Machine learning 2.pdf" },
    { title: "Biopython Basics", issuer: "Online Course", date: "2024", icon: "🧬", color: "#10B981", url: "/Certificate/Biopython.pdf" },
    { title: "Data Structures & Algorithms in C", issuer: "Online Course", date: "2023", icon: "💻", color: "#38BDF8", url: "/Certificate/Data structure and algorithm in c.pdf" },
    { title: "Python Certificate", issuer: "Online Course", date: "2024", icon: <img src={pythonLogo} alt="Python" style={{ width: 32, height: 32, objectFit: 'contain' }} />, color: "#3776AB", url: "/Certificate/Python certificate .pdf" },
    { title: "Introduction to Prompt Engineering", issuer: "Online Course", date: "2024", icon: "✍️", color: "#7C3AED", url: "/Certificate/Introduction to Prompt Engineering.pdf" },
    { title: "TCS Big Data Analytics — Advanced", issuer: "TCS iON", date: "2025", icon: "📊", color: "#F59E0B", url: "/Certificate/TCS Big Data Analytics - Advanced.pdf" },
    { title: "TCS Data Modeling & Visualization", issuer: "TCS iON", date: "2025", icon: "📈", color: "#6366F1", url: "/Certificate/TCS Data Modeling and Visualization.pdf" },
    { title: "TCS Data Analytics and Reporting", issuer: "TCS iON", date: "2025", icon: "📋", color: "#0ea5e9", url: "/Certificate/TCS Data Analytics and Reporting.pdf" },
    { title: "TCS Data Mining and Warehousing", issuer: "TCS iON", date: "2025", icon: "🗄️", color: "#8b5cf6", url: "/Certificate/TCS Data mining and Warehousing.pdf" },
    { title: "Relational Database Management Systems", issuer: "Online Course", date: "2024", icon: "🛢️", color: "#059669", url: "/Certificate/RDBMS.pdf" },
    { title: "Introduction to Computers", issuer: "Online Course", date: "2023", icon: "🖥️", color: "#475569", url: "/Certificate/Introduction to Computers .pdf" },
    { title: "Introduction to Excel", issuer: "Online Course", date: "2023", icon: "📊", color: "#16a34a", url: "/Certificate/Introduction to excel.pdf" },
  ],
  publications: [
    { index: "01", title: "An Analysis of Haze Removal Methods for Dehazing Satellite Images", venue: "ICAC 2024 — Bharathiar University", year: "Sep 2024", tags: ["Computer Vision", "Image Processing", "Deep Learning"] },
    { index: "02", title: "Content Detection System using BERT for Hate Speech & Cyberbullying Detection", venue: "IRJMETS", year: "2024", tags: ["NLP", "BERT", "Safety AI"] },
  ],
};

/* ============================================================
   UTILITY — darken hex
   ============================================================ */
function darkenColor(hex, pct) {
  let c = hex.startsWith("#") ? hex.slice(1) : hex;
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const n = parseInt(c, 16);
  const r = Math.max(0, Math.min(255, Math.floor(((n >> 16) & 0xff) * (1 - pct))));
  const g = Math.max(0, Math.min(255, Math.floor(((n >> 8) & 0xff) * (1 - pct))));
  const b = Math.max(0, Math.min(255, Math.floor((n & 0xff) * (1 - pct))));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  useEffect(() => {
    const move = (e) => {
      if (dotRef.current) { dotRef.current.style.left = e.clientX + "px"; dotRef.current.style.top = e.clientY + "px"; }
      if (ringRef.current) { ringRef.current.style.left = e.clientX + "px"; ringRef.current.style.top = e.clientY + "px"; }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return (<><div ref={dotRef} className="cursor-dot" /><div ref={ringRef} className="cursor-ring" /></>);
}

/* ============================================================
   DOCK NAV — High Magnification & Frosted Sizing Alignment
   ============================================================ */
function DockItem({ children, onClick, mouseX, spring, distance, magnification, baseItemSize }) {
  const ref = useRef(null);
  const isHovered = useMotionValue(0);
  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
    return val - rect.x - baseItemSize / 2;
  });
  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  const size = useSpring(targetSize, spring);
  const [labelVisible, setLabelVisible] = useState(false);
  useEffect(() => { const u = isHovered.on("change", (v) => setLabelVisible(v === 1)); return u; }, [isHovered]);
  return (
    <motion.div ref={ref} style={{ width: size, height: size }} onHoverStart={() => isHovered.set(1)} onHoverEnd={() => isHovered.set(0)} onClick={onClick} className="dock-item" tabIndex={0} role="button">
      {Children.map(children, (child) => cloneElement(child, { labelVisible }))}
    </motion.div>
  );
}
function DockIcon({ children }) { return <div className="dock-icon">{children}</div>; }
function DockLabel({ children, labelVisible }) {
  return (
    <AnimatePresence>
      {labelVisible && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: -4 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }} className="dock-label">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
function DockNav({ items }) {
  const mouseX = useMotionValue(Infinity);
  const spring = { mass: 0.1, stiffness: 150, damping: 12 };
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || window.matchMedia("(hover: none)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const baseSize = isMobile ? 34 : 48;
  const magnifySize = isMobile ? 34 : 80;
  const dist = isMobile ? 0 : 160;

  return (
    <div className="dock-panel" onMouseMove={({ pageX }) => mouseX.set(pageX)} onMouseLeave={() => mouseX.set(Infinity)}>
      {items.map((item, i) => (
        <DockItem key={i} onClick={item.onClick} mouseX={mouseX} spring={spring} distance={dist} magnification={magnifySize} baseItemSize={baseSize}>
          <DockIcon>{item.icon}</DockIcon>
          <DockLabel>{item.label}</DockLabel>
        </DockItem>
      ))}
    </div>
  );
}

/* ============================================================
   BLUR TEXT
   ============================================================ */
function BlurText({ text = "", delay = 120, animateBy = "words", className = "" }) {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <p ref={ref} className={className} style={{ display: "flex", flexWrap: "wrap" }}>
      {elements.map((seg, i) => (
        <motion.span key={i} initial={{ filter: "blur(10px)", opacity: 0, y: -20 }} animate={inView ? { filter: "blur(0px)", opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: (i * delay) / 1000, ease: "easeOut" }} style={{ display: "inline-block", marginRight: animateBy === "words" ? "0.3em" : 0 }}>
          {seg}
        </motion.span>
      ))}
    </p>
  );
}

/* ============================================================
   TEXT TYPE — React + CSS cursor blink
   ============================================================ */
function TextType({ texts = [], typingSpeed = 60, pauseDuration = 1800, deletingSpeed = 35 }) {
  const [displayed, setDisplayed] = useState("");
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [charIdx, setCharIdx] = useState(0);
  useEffect(() => {
    const current = texts[idx] || "";
    let timer;
    if (!deleting) {
      if (charIdx < current.length) {
        timer = setTimeout(() => { setDisplayed(current.slice(0, charIdx + 1)); setCharIdx((c) => c + 1); }, typingSpeed);
      } else {
        timer = setTimeout(() => setDeleting(true), pauseDuration);
      }
    } else {
      if (displayed.length > 0) {
        timer = setTimeout(() => setDisplayed((d) => d.slice(0, -1)), deletingSpeed);
      } else {
        setDeleting(false); setCharIdx(0);
        setIdx((i) => (i + 1) % texts.length);
      }
    }
    return () => clearTimeout(timer);
  }, [displayed, charIdx, deleting, idx, texts, typingSpeed, pauseDuration, deletingSpeed]);
  return <span>{displayed}<span className="type-cursor" /></span>;
}

/* ============================================================
   FOLDER
   ============================================================ */
function Folder({ color = "#7C3AED", size = 1, onClick, isOpen }) {
  const back = darkenColor(color, 0.08);
  return (
    <div style={{ transform: `scale(${size})`, transformOrigin: "bottom center" }} onClick={onClick}>
      <div className={`folder ${isOpen ? "open" : ""}`} style={{ "--folder-color": color, "--folder-back-color": back }}>
        <div className="folder__back">
          <div className="paper" />
          <div className="paper" />
          <div className="paper" />
          <div className="folder__front" />
          <div className="folder__front right" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   BORDER GLOW CARD — JS coordinate tracking for specular gradient shifts
   ============================================================ */
function GlassCard({ children, className = "", style = {} }) {
  const ref = useRef(null);
  const handleMove = useCallback((e) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // JS updates --mx --my → radial-gradient shifts
    card.style.setProperty("--mx", `${x}px`);
    card.style.setProperty("--my", `${y}px`);

    const cx = rect.width / 2, cy = rect.height / 2;
    const rx = ((y - cy) / cy) * 6;
    const ry = ((x - cx) / cx) * -6;
    card.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
  }, []);
  const handleLeave = useCallback(() => {
    const card = ref.current;
    if (!card) return;
    card.style.transform = "";
  }, []);
  return (
    <div ref={ref} className={`border-glow-card ${className}`} style={style} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      <div className="border-glow-inner">{children}</div>
    </div>
  );
}

/* ============================================================
   LOGO LOOP
   ============================================================ */
function LogoLoop({ items, speed = 80, reverse = false }) {
  const trackRef = useRef(null);
  const seqRef = useRef(null);
  const [seqWidth, setSeqWidth] = useState(0);
  const offsetRef = useRef(0);
  const rafRef = useRef(null);
  const lastTRef = useRef(null);
  useEffect(() => {
    if (seqRef.current) setSeqWidth(seqRef.current.getBoundingClientRect().width);
  }, [items]);
  useEffect(() => {
    if (!seqWidth) return;
    const dir = reverse ? -1 : 1;
    const animate = (ts) => {
      if (!lastTRef.current) lastTRef.current = ts;
      const dt = (ts - lastTRef.current) / 1000;
      lastTRef.current = ts;
      offsetRef.current = ((offsetRef.current + dir * speed * dt) % seqWidth + seqWidth) % seqWidth;
      if (trackRef.current) trackRef.current.style.transform = `translateX(${-offsetRef.current}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); lastTRef.current = null; };
  }, [seqWidth, speed, reverse]);
  const copies = 4;
  return (
    <div className="logoloop logoloop--fade" style={{ overflow: "hidden", width: "100%", position: "relative" }}>
      <div ref={trackRef} className="logoloop__track">
        {Array.from({ length: copies }, (_, ci) => (
          <ul key={ci} ref={ci === 0 ? seqRef : undefined} className="logoloop__list" style={{ listStyle: "none" }}>
            {items.map((item, ii) => (
              <li key={ii} className="logoloop__item">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 40, background: "rgba(255,255,255,0.3)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18 }}>{item.icon}</span>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   CAROUSEL
   ============================================================ */
const SPRING = { type: "spring", stiffness: 300, damping: 30 };
const GAP = 16;
function Carousel({ items }) {
  const [width, setWidth] = useState(320);
  useEffect(() => {
    const handleResize = () => {
      setWidth(Math.min(500, window.innerWidth - 32));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const pad = 16;
  const itemWidth = width - pad * 2;
  const trackOffset = itemWidth + GAP;
  const loop = useMemo(() => [items[items.length - 1], ...items, items[0]], [items]);
  const [pos, setPos] = useState(1);
  const [jumping, setJumping] = useState(false);
  const x = useMotionValue(-(1 * trackOffset));

  useEffect(() => {
    x.set(-(pos * trackOffset));
  }, [trackOffset, pos, x]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPos((p) => Math.max(0, Math.min(p + 1, loop.length - 1)));
    }, 4000);
    return () => clearInterval(timer);
  }, [loop.length]);

  const handleDragEnd = (_, info) => {
    const dir = info.offset.x < -30 || info.velocity.x < -400 ? 1 : info.offset.x > 30 || info.velocity.x > 400 ? -1 : 0;
    if (dir) setPos((p) => Math.max(0, Math.min(p + dir, loop.length - 1)));
  };
  const handleAnimEnd = () => {
    if (pos === loop.length - 1) { setJumping(true); const t = 1; setPos(t); x.set(-t * trackOffset); requestAnimationFrame(() => setJumping(false)); }
    if (pos === 0) { setJumping(true); const t = items.length; setPos(t); x.set(-t * trackOffset); requestAnimationFrame(() => setJumping(false)); }
  };
  const activeIdx = (pos - 1 + items.length) % items.length;
  return (
    <div style={{ width: width }}>
      <div className="carousel-wrap glass" style={{ padding: pad }}>
        <motion.div className="carousel-track" drag="x" dragConstraints={{ left: -trackOffset * (loop.length - 1), right: 0 }} style={{ width: "max-content", gap: GAP, perspective: 1000, x }} animate={{ x: -(pos * trackOffset) }} transition={jumping ? { duration: 0 } : SPRING} onDragEnd={handleDragEnd} onAnimationComplete={handleAnimEnd}>
          {loop.map((item, i) => {
            const range = [-(i + 1) * trackOffset, -i * trackOffset, -(i - 1) * trackOffset];
            const scale = useTransform(x, range, [0.85, 1, 0.85], { clamp: false });
            const opacity = useTransform(x, range, [0.4, 1, 0.4], { clamp: false });
            return (
              <motion.div key={i} className="carousel-item" style={{ width: itemWidth, minHeight: 180, scale, opacity }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: "14px",
                  background: `linear-gradient(135deg, ${item.color}15, ${item.color}35)`,
                  border: `1px solid ${item.color}80`,
                  boxShadow: `inset 0 1px 1px rgba(255,255,255,0.2), 0 8px 20px ${item.color}15`,
                  fontSize: 28,
                  marginBottom: 16
                }}>
                  {item.icon}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, marginBottom: 6, color: "var(--text)" }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "var(--subtext)", marginBottom: 8 }}>{item.issuer} · {item.date}</div>
                <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: item.url === "#" ? "var(--subtext)" : "var(--accent1)", fontWeight: 600, textDecoration: "none", borderBottom: item.url !== "#" ? "1px solid var(--accent1)" : "none" }}>
                  {item.url !== "#" ? "View Certificate →" : "Badge pending"}
                </a>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      <div className="carousel-indicators">
        {items.map((_, i) => (
          <button key={i} className={`carousel-dot ${i === activeIdx ? "active" : "inactive"}`} onClick={() => setPos(i + 1)} />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   SECTIONS
   ============================================================ */

/* --- HERO (Avatar Integration with exact avatar.png path) --- */
function HeroSection() {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <section id="hero">
      {/* Background PixelBlast */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.35 }}>
        <PixelBlast
          variant="circle"
          pixelSize={12}
          color="#770ef79e"
          patternScale={2.5}
          patternDensity={0.9}
          pixelSizeJitter={0.3}
          enableRipples={true}
          rippleSpeed={0.3}
          rippleThickness={0.12}
          rippleIntensityScale={1.2}
          liquid={false}
          speed={0.4}
          edgeFade={0.4}
          transparent={true}
        />
      </div>

      <div className="section-inner" style={{ width: "100%", zIndex: 1, pointerEvents: "none" }}>
        <div className="hero-inner" style={{ display: "flex", alignItems: "center", gap: 64, flexWrap: "wrap", pointerEvents: "auto" }}>
          {/* Text */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="section-label" style={{ marginBottom: 20 }}>👋 Hello World</div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.8rem,7vw,5rem)", fontWeight: 800, lineHeight: 1.05, marginBottom: 20, color: "var(--text)" }}>
                Sanjith G
              </h1>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.2rem,3vw,1.8rem)", fontWeight: 600, color: "var(--accent1)", marginBottom: 20, minHeight: "2.2em" }}>
                <TextType texts={DATA.meta.roles} typingSpeed={65} pauseDuration={1800} deletingSpeed={35} />
              </h2>
              <div style={{ marginBottom: 28, fontSize: "1.1rem", lineHeight: 1.6, color: "var(--subtext)" }}>
                <BlurText text={DATA.meta.tagline} delay={80} animateBy="words" className="" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.5 }} className="hero-buttons-container" style={{ gap: 14, marginTop: 36 }}>
              <a href={DATA.meta.resumeUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "12px 28px", borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: "none", color: "#fff", background: "linear-gradient(135deg, var(--accent1), #9333EA)", boxShadow: "0 4px 20px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", transition: "all 0.25s ease" }} onMouseEnter={(e) => { e.target.style.transform = "translateY(-3px) rotateX(5deg)"; e.target.style.boxShadow = "0 12px 32px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.3)"; }} onMouseLeave={(e) => { e.target.style.transform = ""; e.target.style.boxShadow = "0 4px 20px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"; }}>
                Download Resume
              </a>
              <button onClick={() => scrollTo("projects")} style={{ display: "inline-block", padding: "12px 28px", borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: "pointer", border: "none", background: "rgba(255,255,255,0.35)", backdropFilter: "blur(12px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 16px rgba(124,58,237,0.08)", color: "var(--text)", transition: "all 0.25s ease" }} onMouseEnter={(e) => { e.target.style.background = "rgba(255,255,255,0.55)"; e.target.style.transform = "translateY(-3px)"; }} onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.35)"; e.target.style.transform = ""; }}>
                View Projects
              </button>
            </motion.div>
          </div>

          {/* Avatar Integration */}
          <motion.div initial={{ opacity: 0, scale: 0.8, rotate: -5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: 0.4, duration: 0.8, type: "spring" }} style={{ position: "relative", flexShrink: 0 }}>
            <div className="hero-avatar-inner" style={{ display: "flex", alignItems: "center", justifyContent: "center", animation: "float 6s ease-in-out infinite", position: "relative" }}>
              <img
                src="/avatar.png"
                alt="Sanjith G"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            {/* Floating badges */}
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} style={{ position: "absolute", bottom: 10, left: -30, background: "rgba(255,255,255,0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 12, padding: "6px 12px", fontSize: 12, fontWeight: 700, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)" }}>
              ☁️
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* --- ABOUT (3D Tilting Stat Cards with Specular tracking) --- */
function AboutSection() {
  const tiltRef = useRef([]);
  const handleTilt = (e, i) => {
    const el = tiltRef.current[i];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const rx = ((y - r.height / 2) / r.height) * 14;
    const ry = ((x - r.width / 2) / r.width) * -14;
    el.style.transform = `perspective(500px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.03)`;

    // Dynamically set --mx and --my coordinates for the radial-gradient specular glow
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
  };
  const resetTilt = (i) => {
    const el = tiltRef.current[i];
    if (el) {
      el.style.transform = "";
    }
  };
  return (
    <section id="about">
      <div className="section-inner">
        <div className="section-label">About Me</div>
        <div className="section-title">The Builder Behind<br />the Models</div>
        <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
          <div>
            <BlurText text="I'm Sanjith — an AI/ML engineer with a deep obsession for building production-grade intelligent systems." delay={40} animateBy="words" className="" />
            <br />
            <BlurText text="From RAG pipelines that don't lose context, to fine-tuning LLMs on consumer GPUs, to merging models at midnight — I build things that actually work in the real world." delay={30} animateBy="words" className="" />
            <br />
            <BlurText text="8 months of internship experience at Peopleclick Techno Solutions (production RAG, drift monitoring) and Yaane Technologies (NLP pipelines). 2 research publications. Now looking for my next challenge." delay={25} animateBy="words" className="" />
          </div>
          <div className="stats-grid">
            {DATA.stats.map((s, i) => (
              <motion.div key={i} ref={(el) => (tiltRef.current[i] = el)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ delay: i * 0.1 }} className="stat-card" onMouseMove={(e) => handleTilt(e, i)} onMouseLeave={() => resetTilt(i)} style={{ "--shimmer-delay": `${i * 0.8}s` }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "var(--subtext)", fontWeight: 500, marginTop: 4 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* --- PROJECTS --- */
function ProjectsSection() {
  const [openId, setOpenId] = useState(null);
  return (
    <section id="projects">
      <div className="section-inner">
        <div className="section-label">Work</div>
        <div className="section-title">Six Projects.<br />One Mission.</div>
        <div className="projects-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", rowGap: 80, columnGap: 40, padding: "20px 0" }}>
          {DATA.projects.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ delay: i * 0.08 }} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Folder wrapper designed to prevent overlaps */}
              <div style={{ height: 110, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 16, position: "relative" }}>
                <Folder color={p.color} size={1.3} isOpen={openId === p.id} onClick={() => setOpenId(openId === p.id ? null : p.id)} />
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--text)", textAlign: "center", marginBottom: 8 }}>{p.name}</div>
              <div style={{ width: "100%", minHeight: 0 }}>
                <AnimatePresence>
                  {openId === p.id && (
                    <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.25 }} style={{ width: "100%", marginTop: 12 }}>
                      <GlassCard style={{ "--shimmer-delay": `${i * 0.4}s` }}>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, color: p.color, marginBottom: 6 }}>{p.name}</div>
                        <p style={{ fontSize: 13, color: "var(--subtext)", lineHeight: 1.6, marginBottom: 12 }}>{p.tagline}</p>
                        <div style={{ marginBottom: 14 }}>
                          {p.tech.map((t) => <span key={t} className="tag">{t}</span>)}
                        </div>
                        <a href={p.github} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: p.color, textDecoration: "none", borderBottom: `1px solid ${p.color}` }}>
                          GitHub →
                        </a>
                      </GlassCard>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --- SKILLS --- */
const SKILL_ICONS = { "Python": <img src={pythonLogo} alt="Python" style={{ width: 18, height: 18, objectFit: "contain" }} />, "PyTorch": "🔥", "FastAPI": "⚡", "Docker": "🐳", "MLflow": "📊", "HuggingFace": "🤗", "Azure": "☁️", "Streamlit": "🎈", "LangChain": "🔗", "Groq": "🚀", "NumPy": "🔢", "Git": "🌿", "ChromaDB": "💜", "Scikit-learn": "🧠" };
function SkillsSection() {
  const allSkills = DATA.skills.map((s) => ({ ...s, icon: SKILL_ICONS[s.label] || "⚙️" }));
  return (
    <section id="skills">
      <div className="section-inner">
        <div className="section-label">Toolbox</div>
        <div className="section-title">Tools I Build With</div>
        <div>
          <LogoLoop items={allSkills} speed={65} />
        </div>
      </div>
    </section>
  );
}

/* --- CERTIFICATES --- */
function CertificatesSection() {
  return (
    <section id="certs">
      <div className="section-inner">
        <div className="section-label">Credentials</div>
        <div className="section-title">Certified &<br />Verified</div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Carousel items={DATA.certs} />
        </div>
      </div>
    </section>
  );
}

/* --- PUBLICATIONS --- */
function PublicationsSection() {
  return (
    <section id="publications">
      <div className="section-inner">
        <div className="section-label">Research</div>
        <div className="section-title">Published Work</div>
        <div>
          {DATA.publications.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ delay: i * 0.15 }} className="pub-item">
              <div className="pub-num">{p.index}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1rem,2vw,1.2rem)", fontWeight: 700, color: "var(--text)", marginBottom: 6, lineHeight: 1.35 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: "var(--accent1)", fontWeight: 600, marginBottom: 10 }}>{p.venue} · {p.year}</div>
              <div>{p.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --- CONTACT (Dynamic Specular glow coordinates tracking) --- */
function ContactSection() {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(DATA.meta.email); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const cardRef = useRef([]);
  const handleCardMove = (e, i) => {
    const el = cardRef.current[i];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;

    // Set relative coordinates for hover glass shine radial gradient shift
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
  };

  return (
    <section id="contact" style={{ paddingBottom: 160 }}>
      <div className="section-inner" style={{ textAlign: "center" }}>
        <div className="section-label">Get In Touch</div>
        <div className="section-title" style={{ marginBottom: 16 }}>Let's Build<br />Something.</div>
        <div style={{ display: "flex", justifyContent: "center", maxWidth: 520, margin: "0 auto" }}>
          <BlurText text="Open to AI/ML roles, research collaborations, and interesting problems." delay={50} animateBy="words" className="" />
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", marginTop: 48 }}>
          {[
            { label: "Email", icon: <img src={gmailLogo} alt="Email" style={{ width: 24, height: 24, objectFit: "contain" }} />, href: "#", sub: copied ? "Copied to clipboard!" : DATA.meta.email, onClick: (e) => { e.preventDefault(); copy(); } },
            { label: "LinkedIn", icon: <img src={linkedInLogo} alt="LinkedIn" style={{ width: 24, height: 24, objectFit: "contain" }} />, href: DATA.meta.linkedin, sub: "sanjith-g" },
            { label: "GitHub", icon: <img src={githubLogo} alt="GitHub" style={{ width: 24, height: 24, objectFit: "contain" }} />, href: DATA.meta.github, sub: "sanjith3057" },
          ].map((c, i) => (
            <motion.div key={i} ref={(el) => (cardRef.current[i] = el)} onMouseMove={(e) => handleCardMove(e, i)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ delay: i * 0.1 }} style={{ "--shimmer-delay": `${i * 1}s`, position: "relative", overflow: "hidden", borderRadius: 18 }} className="contact-card-wrap">
              <a href={c.href} target={c.href === "#" ? "_self" : "_blank"} rel="noreferrer" className="contact-link" style={{ minWidth: 200, cursor: c.onClick ? "pointer" : "auto" }} onClick={c.onClick}>
                <span style={{ fontSize: 28 }}>{c.icon}</span>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: copied && c.label === "Email" ? "var(--accent1)" : "var(--text)", transition: "color 0.2s" }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: copied && c.label === "Email" ? "var(--accent1)" : "var(--subtext)", transition: "color 0.2s" }}>{c.sub}</div>
                </div>
              </a>
            </motion.div>
          ))}
        </div>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: false, amount: 0.1 }} transition={{ delay: 0.5 }} style={{ marginTop: 64, fontSize: 12, color: "var(--subtext)" }}>
          Designed & built by Sanjith G · {new Date().getFullYear()} ·
        </motion.p>
      </div>
    </section>
  );
}

/* ============================================================
   ROOT APP
   ============================================================ */
export default function Portfolio() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Inject global CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const dockItems = [
    { label: "Home", icon: "⌂", onClick: () => scrollTo("hero") },
    { label: "About", icon: "◉", onClick: () => scrollTo("about") },
    { label: "Projects", icon: "◈", onClick: () => scrollTo("projects") },
    { label: "Skills", icon: "◇", onClick: () => scrollTo("skills") },
    { label: "Certs", icon: "✦", onClick: () => scrollTo("certs") },
    { label: "Papers", icon: "◻", onClick: () => scrollTo("publications") },
    { label: "Contact", icon: "◎", onClick: () => scrollTo("contact") },
    { label: "AI Chat", icon: <img src="/images/robot-icon.png" alt="AI" style={{ width: 20, height: 20, objectFit: 'contain' }} />, onClick: () => setIsChatOpen(prev => !prev) },
  ];

  return (
    <>
      <CustomCursor />
      <div className="bg-mesh"><div className="bg-dots" /></div>
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <SkillsSection />
      <CertificatesSection />
      <PublicationsSection />
      <ContactSection />
      <DockNav items={dockItems} />
      <RAGChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
