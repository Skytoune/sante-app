import { useState, useEffect, useCallback, createContext, useContext } from "react";

// ═══════════════════════════════════════════════
// AUTH CONTEXT
// ═══════════════════════════════════════════════
const AuthContext = createContext(null);
const AppContext = createContext(null);

function useAuth() { return useContext(AuthContext); }
function useApp() { return useContext(AppContext); }

// ═══════════════════════════════════════════════
// SUPABASE CONFIG — remplacer par vos vraies valeurs
// ═══════════════════════════════════════════════
const SB_URL = "https://VOTRE_URL.supabase.co";  // ← coller ici
const SB_KEY = "eyJ...VOTRE_CLE...";              // ← coller ici

const SB_HEADERS = {
  "apikey": SB_KEY,
  "Authorization": `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
};

async function sbGet(username) {
  const res = await fetch(
    `${SB_URL}/rest/v1/profiles?username=eq.${username}&limit=1`,
    { headers: SB_HEADERS }
  );
  const rows = await res.json();
  return rows[0] || null;
}

async function sbUpsert(username, password, data) {
  await fetch(`${SB_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: { ...SB_HEADERS, "Prefer": "resolution=merge-duplicates" },
    body: JSON.stringify({ username, password, data, updated_at: new Date().toISOString() }),
  });
}

// ═══════════════════════════════════════════════
// STORAGE HELPERS — remplace localStorage
// ═══════════════════════════════════════════════
async function userExists(username) {
  const row = await sbGet(username);
  return !!row;
}
async function checkPassword(username, password) {
  const row = await sbGet(username);
  return row && row.password === password;
}
async function createUser(username, password) {
  if (await userExists(username)) return false;
  await sbUpsert(username, password, defaultProfile());
  return true;
}
async function getUserData(username) {
  const row = await sbGet(username);
  return row?.data || defaultProfile();
}
async function saveUserData(username, password, data) {
  await sbUpsert(username, password, data);
}

// ═══════════════════════════════════════════════
// RECIPES DATA
// ═══════════════════════════════════════════════
const RECIPES = [
  {
    id:1,name:"Omelette aux champignons",emoji:"🍳",cat:"pdej",kcal:280,prot:22,carbs:6,fat:18,fiber:2,vege:true,time:"12 min",diff:"Facile",
    ingr:[{q:"3",n:"œufs entiers"},{q:"120 g",n:"champignons de Paris"},{q:"30 g",n:"emmental râpé"},{q:"10 g",n:"beurre"},{q:"Sel, poivre",n:""}],
    steps:[{t:"🔪 Préparer",d:"Trancher les champignons en lamelles de 3 mm. Ciseler la ciboulette."},{t:"🍳 Sauter",d:"Faire fondre 5 g beurre à feu moyen-vif. Sauter les champignons 3-4 min jusqu'à dorure. Saler, réserver."},{t:"🥚 Battre",d:"Battre les 3 œufs avec sel et poivre 30 secondes, mélange homogène."},{t:"🔥 Cuire",d:"Fondre 5 g beurre à feu moyen. Verser les œufs, laisser 20 sec, puis racler les bords vers le centre à la spatule. Répéter 2 min jusqu'à texture à peine prise."},{t:"🧀 Plier",d:"Déposer champignons et fromage sur la moitié. Plier, glisser sur assiette chaude. Servir immédiatement."}]
  },
  {
    id:2,name:"Bowl poulet-quinoa",emoji:"🥣",cat:"dej",kcal:520,prot:42,carbs:48,fat:14,fiber:7,vege:false,time:"28 min",diff:"Facile",
    ingr:[{q:"150 g",n:"blanc de poulet"},{q:"80 g",n:"quinoa sec"},{q:"160 ml",n:"bouillon"},{q:"80 g",n:"avocat"},{q:"100 g",n:"tomates cerises"},{q:"10 ml",n:"huile d'olive"},{q:"½",n:"citron"}],
    steps:[{t:"🌾 Quinoa",d:"Rincer le quinoa. Cuire dans 160 ml bouillon salé à couvert 12 min à feu doux. Laisser gonfler 5 min. Égrener à la fourchette."},{t:"🔪 Mariner",d:"Couper le poulet en deux dans l'épaisseur. Assaisonner paprika + ail en poudre + sel/poivre."},{t:"🍳 Griller",d:"Huile d'olive dans poêle grill feu vif. Cuire 5-6 min sans bouger, retourner 4-5 min. Laisser reposer 3 min. Trancher en biais."},{t:"🥣 Assembler",d:"Quinoa dans le bol. Ajouter roquette, tomates coupées, avocat en lamelles arrosé de citron, tranches de poulet. Filet d'huile et citron. Servir."}]
  },
  {
    id:3,name:"Salade niçoise",emoji:"🥗",cat:"dej",kcal:380,prot:28,carbs:22,fat:18,fiber:5,vege:false,time:"18 min",diff:"Facile",
    ingr:[{q:"2",n:"œufs"},{q:"160 g",n:"thon au naturel (égoutté)"},{q:"150 g",n:"haricots verts"},{q:"200 g",n:"tomates"},{q:"30 g",n:"olives noires"},{q:"15 ml",n:"huile d'olive"},{q:"10 ml",n:"vinaigre de vin"}],
    steps:[{t:"🥚 Œufs durs",d:"Départ eau froide, ébullition puis 9 min. Bain d'eau glacée 5 min. Écaler, couper en quartiers."},{t:"🫘 Haricots",d:"Eau bouillante salée, cuire 5-6 min (croquants). Eau glacée 2 min pour fixer la couleur. Égoutter."},{t:"🫙 Vinaigrette",d:"Fouetter moutarde + vinaigre + sel/poivre. Ajouter huile en filet en émulsionnant."},{t:"🥗 Dresser",d:"Disposer en sections distinctes : haricots, tomates en quartiers, thon émietté, œufs, olives. Arroser de vinaigrette. Ne pas mélanger !"}]
  },
  {
    id:4,name:"Saumon papillote",emoji:"🐟",cat:"din",kcal:410,prot:38,carbs:18,fat:22,fiber:6,vege:false,time:"32 min",diff:"Facile",
    ingr:[{q:"200 g",n:"pavé de saumon"},{q:"150 g",n:"courgette"},{q:"80 g",n:"poivron rouge"},{q:"80 g",n:"carotte"},{q:"10 ml",n:"huile d'olive"},{q:"½",n:"citron"},{q:"Aneth, sel, poivre",n:""}],
    steps:[{t:"🔥 Préchauffer",d:"Four à 200°C chaleur tournante. Sortir le saumon 10 min avant."},{t:"🔪 Légumes",d:"Courgette en rondelles 5 mm. Poivron en lanières 1 cm. Carotte en rondelles 3 mm. Émincer 1 gousse d'ail."},{t:"📦 Papillote",d:"Feuille alu 40×40 cm. Légumes au centre mélangés avec ail, huile, sel, poivre. Saumon par-dessus. Rondelles citron + aneth + filet de jus."},{t:"⏱️ Cuire",d:"Fermer hermétiquement avec espace intérieur. Enfourner 18-20 min à 200°C. La papillote gonfle : normal. Saumon cuit quand la chair s'effeuille."},{t:"🍽️ Servir",d:"Ouvrir avec précaution (vapeur brûlante !). Glisser dans assiette creuse avec tout le jus."}]
  },
  {
    id:5,name:"Pancakes avoine-banane",emoji:"🥞",cat:"pdej",kcal:340,prot:14,carbs:52,fat:8,fiber:5,vege:true,time:"18 min",diff:"Facile",
    ingr:[{q:"80 g",n:"flocons d'avoine"},{q:"130 g",n:"banane très mûre"},{q:"2",n:"œufs"},{q:"80 ml",n:"lait"},{q:"½ c.à.c.",n:"levure chimique"},{q:"½ c.à.c.",n:"cannelle"}],
    steps:[{t:"🌾 Farine",d:"Mixer 80 g flocons 30 sec à pleine puissance → farine fine."},{t:"🍌 Base",d:"Écraser la banane en purée lisse. Plus mûre = plus sucrée naturellement."},{t:"🥚 Pâte",d:"Ajouter 2 œufs + lait + levure + cannelle + sel à la purée. Incorporer farine d'avoine. Laisser reposer 2 min."},{t:"🍳 Cuire",d:"Beurre dans poêle antiadhésive feu moyen. Louche de 60 ml par pancake (8-10 cm). 2-3 min jusqu'aux bulles en surface, bords secs. Retourner 1-2 min. Donne 5-6 pancakes."}]
  },
  {
    id:6,name:"Wok tofu légumes",emoji:"🥦",cat:"din",kcal:360,prot:24,carbs:32,fat:14,fiber:8,vege:true,time:"22 min",diff:"Moyen",
    ingr:[{q:"200 g",n:"tofu ferme"},{q:"200 g",n:"brocoli"},{q:"120 g",n:"carotte"},{q:"150 g",n:"poivron rouge"},{q:"80 g",n:"nouilles soba"},{q:"30 ml",n:"sauce soja"},{q:"15 ml",n:"huile de sésame"},{q:"Ail, gingembre",n:""}],
    steps:[{t:"🔪 Tofu",d:"Presser le tofu entre papier absorbant 5 min (clé pour le croustillant). Couper en cubes 2 cm."},{t:"💧 Soba",d:"Eau à ébullition (non salée). Cuire 4-5 min. Égoutter et rincer eau froide immédiatement."},{t:"🔥 Dorer tofu",d:"Huile neutre wok feu vif. Tofu en une couche. 3-4 min sans toucher, retourner 2-3 min. Retirer."},{t:"🥦 Légumes",d:"Même wok : ail + gingembre 30 sec. Brocoli + carotte biseaux 5 mm → 3 min feu vif en remuant. Poivron en lanières + 2 min. Légumes croquants."},{t:"🫙 Finition",d:"Remettre tofu. Sauce soja + huile sésame. Mélanger 1 min. Servir sur soba, parsemer sésame grillé."}]
  },
  {
    id:7,name:"Poulet citron-ail grillé",emoji:"🍗",cat:"din",kcal:390,prot:46,carbs:8,fat:18,fiber:1,vege:false,time:"40 min",diff:"Facile",
    ingr:[{q:"2 (300 g)",n:"filets de poulet"},{q:"2",n:"citrons (zeste + jus)"},{q:"3 gousses",n:"ail émincées"},{q:"20 ml",n:"huile d'olive"},{q:"1 c.à.c.",n:"paprika fumé"},{q:"½ c.à.c.",n:"cumin"},{q:"Thym, sel, poivre",n:""}],
    steps:[{t:"🍋 Marinade",d:"Râper zeste 2 citrons. Presser (~60 ml jus). Mélanger avec ail, huile, paprika, cumin, thym, sel, poivre."},{t:"🐔 Mariner",d:"Aplatir filets à 2 cm d'épaisseur. 2-3 entailles côté surface. Immerger dans marinade minimum 20 min (ou 2h au frigo)."},{t:"🔥 Poêle grill",d:"Poêle grill en fonte feu vif 2 min. Très chaude avant d'ajouter le poulet."},{t:"🍳 Griller",d:"Égoutter l'excès de marinade. Poser dans poêle chaude. 5-6 min sans bouger → belles marques. Retourner 4-5 min. Jus clair = cuit."},{t:"⏸️ Repos",d:"Couvrir alu lâchement 5 min. Les fibres se détendent, jus se redistribue → viande juteuse."},{t:"🔪 Trancher",d:"Couper en biais 1 cm. Arroser du jus de cuisson."}]
  },
  {
    id:8,name:"Pasta poulet épinards",emoji:"🍝",cat:"din",kcal:580,prot:40,carbs:62,fat:16,fiber:5,vege:false,time:"26 min",diff:"Facile",
    ingr:[{q:"150 g",n:"pâtes (penne ou fusilli)"},{q:"120 g",n:"blanc de poulet"},{q:"120 g",n:"épinards frais"},{q:"2 gousses",n:"ail"},{q:"80 ml",n:"crème légère 15%"},{q:"20 g",n:"parmesan râpé"},{q:"Muscade, sel, poivre",n:""}],
    steps:[{t:"💧 Pâtes",d:"Grande casserole eau très salée (10 g/L). Cuire pâtes selon paquet -1 min. Prélever 100 ml eau de cuisson avant d'égoutter."},{t:"🔪 Poulet",d:"Dés réguliers 2 cm. Saler et poivrer généreusement des deux côtés."},{t:"🍳 Dorer poulet",d:"Huile d'olive feu moyen-vif. Dés en une couche. 3-4 min sans remuer pour colorer. Retourner 2-3 min. Réserver."},{t:"🧄 Ail",d:"Même sauteuse feu moyen. Ail émincé 30 sec en remuant — surveillez, l'ail brûlé = amer."},{t:"🌿 Épinards",d:"Ajouter 120 g épinards frais. Remuer 1-2 min jusqu'à complet flétrissement. Muscade + sel + poivre."},{t:"🥣 Sauce",d:"Crème + 50 ml eau de cuisson. Ébullition légère 1 min. Remettre poulet + pâtes. Mélanger feu doux 1-2 min."},{t:"🧀 Parmesan",d:"Éteindre le feu. Ajouter 20 g parmesan, mélanger vivement → lie la sauce. Servir immédiatement."}]
  },
];

// ═══════════════════════════════════════════════
// STYLES (CSS-in-JS via style tag)
// ═══════════════════════════════════════════════
const GLOBAL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0f0f0f; --surface: #1a1a1a; --surface2: #222; --surface3: #2c2c2c;
    --border: rgba(255,255,255,0.08); --border-h: rgba(255,255,255,0.15);
    --text: #f0f0f0; --sec: #999; --muted: #555;
    --accent: #3ecf8e; --accent-d: rgba(62,207,142,0.13);
    --red: #f66; --red-d: rgba(255,102,102,0.13);
    --amber: #f9a825; --amber-d: rgba(249,168,37,0.13);
    --blue: #5b9cf6; --blue-d: rgba(91,156,246,0.13);
    --purple: #a78bfa;
    --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --safe-bottom: env(safe-area-inset-bottom, 0px);
  }
  html, body, #root { height: 100%; width: 100%; overflow: hidden; }
  body { background: var(--bg); color: var(--text); font-family: var(--font); font-size: 14px; -webkit-tap-highlight-color: transparent; }
  input, select, textarea, button { font-family: var(--font); }
  input[type=range] { accent-color: var(--accent); }
  input[type=checkbox] { accent-color: var(--accent); }
  ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 2px; }
  .scroll { overflow-y: auto; -webkit-overflow-scrolling: touch; }
`;

// ═══════════════════════════════════════════════
// SMALL REUSABLE COMPONENTS
// ═══════════════════════════════════════════════
function Notif({ msg }) {
  return msg ? (
    <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)",
      background:"var(--accent)", color:"#000", padding:"10px 20px", borderRadius:10,
      fontWeight:600, fontSize:13, zIndex:999, whiteSpace:"nowrap", boxShadow:"0 4px 20px rgba(0,0,0,.4)" }}>
      {msg}
    </div>
  ) : null;
}

function Card({ children, onClick, style }) {
  return (
    <div onClick={onClick} style={{ background:"var(--surface)", border:"1px solid var(--border)",
      borderRadius:12, padding:14, ...(onClick ? { cursor:"pointer" } : {}), ...style }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, unit, sub, color, onClick }) {
  return (
    <Card onClick={onClick} style={{ flex:1 }}>
      <div style={{ fontSize:10.5, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".05em", marginBottom:6 }}>{label}</div>
      <div><span style={{ fontSize:24, fontWeight:700, color: color||"var(--text)" }}>{value}</span>
        {unit && <span style={{ fontSize:12, color:"var(--sec)", marginLeft:3 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize:11, color:"var(--muted)", marginTop:4 }}>{sub}</div>}
    </Card>
  );
}

function Btn({ children, onClick, variant="primary", size="md", style, disabled }) {
  const base = { border:"none", borderRadius:8, fontWeight:500, cursor: disabled?"not-allowed":"pointer",
    opacity: disabled ? 0.5 : 1, transition:"opacity .15s", fontFamily:"var(--font)", ...style };
  const variants = {
    primary: { background:"var(--accent)", color:"#000" },
    ghost:   { background:"var(--surface2)", color:"var(--text)", border:"1px solid var(--border)" },
    danger:  { background:"var(--red-d)", color:"var(--red)", border:"1px solid transparent" },
    amber:   { background:"var(--amber-d)", color:"var(--amber)", border:"1px solid transparent" },
  };
  const sizes = { sm: { padding:"5px 11px", fontSize:12 }, md: { padding:"9px 16px", fontSize:13 }, lg: { padding:"12px 20px", fontSize:14 } };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...sizes[size] }}>{children}</button>;
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ fontSize:12, color:"var(--sec)", display:"block", marginBottom:5 }}>{label}</label>}
      <input style={{ width:"100%", background:"var(--surface2)", border:"1px solid var(--border)",
        borderRadius:8, padding:"9px 12px", color:"var(--text)", fontSize:13, outline:"none" }} {...props} />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom:12, flex:1 }}>
      {label && <label style={{ fontSize:12, color:"var(--sec)", display:"block", marginBottom:5 }}>{label}</label>}
      <select style={{ width:"100%", background:"var(--surface2)", border:"1px solid var(--border)",
        borderRadius:8, padding:"9px 12px", color:"var(--text)", fontSize:13, outline:"none" }} {...props}>
        {children}
      </select>
    </div>
  );
}

function ProgressBar({ value, color="var(--accent)" }) {
  return (
    <div style={{ background:"var(--surface3)", borderRadius:4, height:5, marginTop:8, overflow:"hidden" }}>
      <div style={{ width: Math.min(100,value||0)+"%", height:"100%", borderRadius:4, background:color, transition:"width .4s" }} />
    </div>
  );
}

function Panel({ open, children, style }) {
  if (!open) return null;
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12,
      padding:16, marginBottom:14, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
      <div style={{ fontSize:14, fontWeight:600 }}>{children}</div>
      {right}
    </div>
  );
}

function Row({ children, gap=8 }) {
  return <div style={{ display:"flex", gap, marginBottom:12 }}>{children}</div>;
}

function Tag({ ok }) {
  return <span style={{ fontSize:10, padding:"3px 7px", borderRadius:20, fontWeight:600,
    background: ok ? "var(--accent-d)" : "var(--red-d)", color: ok ? "var(--accent)" : "var(--red)" }}>
    {ok ? "✓" : "✗"}
  </span>;
}

function Ev({ dot, name, val, tag, right }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 11px",
      borderRadius:8, background:"var(--surface2)", marginBottom:7 }}>
      {dot && <div style={{ width:7, height:7, borderRadius:"50%", background:dot, flexShrink:0 }} />}
      <div style={{ flex:1, fontSize:13 }}>{name}</div>
      {val && <div style={{ fontSize:12, color:"var(--sec)" }}>{val}</div>}
      {tag !== undefined && <Tag ok={tag} />}
      {right}
    </div>
  );
}

// ═══════════════════════════════════════════════
// LOGIN / REGISTER PAGE
// ═══════════════════════════════════════════════
function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

async function handleSubmit() {
  setError("");
  const u = username.trim().toLowerCase();
  if (!u || !password) { setError("Remplissez tous les champs."); return; }
  setLoading(true);
  try {
    if (mode === "login") {
      if (!(await userExists(u))) { setError("Aucun compte trouvé avec ce pseudo."); return; }
      if (!(await checkPassword(u, password))) { setError("Mot de passe incorrect."); return; }
      login(u, remember);
    } else {
      if (u.length < 3) { setError("Le pseudo doit faire au moins 3 caractères."); return; }
      if (password.length < 4) { setError("Le mot de passe doit faire au moins 4 caractères."); return; }
      if (!(await createUser(u, password))) { setError("Ce pseudo est déjà utilisé."); return; }
      login(u, remember);
    }
  } catch {
    setError("Erreur réseau. Vérifiez votre connexion.");
  } finally {
    setLoading(false);
  }
}
  const switchMode = (m) => { setMode(m); setError(""); setUsername(""); setPassword(""); };

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 20px", background: "var(--bg)",
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: "var(--accent-d)",
            border: "1px solid var(--accent)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 36, margin: "0 auto 16px",
          }}>💚</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" }}>Santé+</div>
          <div style={{ fontSize: 13, color: "var(--sec)", marginTop: 6 }}>
            Votre suivi santé personnel
          </div>
        </div>

        {/* Mode switcher */}
        <div style={{
          display: "flex", background: "var(--surface2)", borderRadius: 12,
          padding: 4, marginBottom: 20, border: "1px solid var(--border)",
        }}>
          {[{ k: "login", l: "Connexion" }, { k: "register", l: "Créer un compte" }].map(({ k, l }) => (
            <div key={k} onClick={() => switchMode(k)} style={{
              flex: 1, textAlign: "center", padding: "9px 8px",
              borderRadius: 9, fontSize: 13, cursor: "pointer", fontWeight: 500,
              transition: "all .2s",
              background: mode === k ? "var(--surface)" : "transparent",
              color: mode === k ? "var(--text)" : "var(--muted)",
              boxShadow: mode === k ? "0 1px 4px rgba(0,0,0,.3)" : "none",
            }}>{l}</div>
          ))}
        </div>

        {/* Form card */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 16, padding: 20,
        }}>

          {/* Username */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "var(--sec)", display: "block", marginBottom: 6 }}>
              Pseudo
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>👤</span>
              <input
                value={username} onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="ex : thomas"
                autoCapitalize="none" autoCorrect="off" autoComplete="username"
                style={{
                  width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "10px 12px 10px 38px", color: "var(--text)",
                  fontSize: 14, outline: "none",
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: mode === "login" ? 14 : 18 }}>
            <label style={{ fontSize: 12, color: "var(--sec)", display: "block", marginBottom: 6 }}>
              Mot de passe
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔒</span>
              <input
                type={showPwd ? "text" : "password"}
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                style={{
                  width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "10px 42px 10px 38px", color: "var(--text)",
                  fontSize: 14, outline: "none",
                }}
              />
              <span onClick={() => setShowPwd(!showPwd)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  fontSize: 16, cursor: "pointer", opacity: 0.6 }}>
                {showPwd ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          {/* Remember me — login only */}
          {mode === "login" && (
            <label style={{
              display: "flex", alignItems: "center", gap: 9, fontSize: 13,
              color: "var(--sec)", cursor: "pointer", marginBottom: 16,
            }}>
              <div onClick={() => setRemember(!remember)} style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                border: remember ? "none" : "2px solid var(--border-h)",
                background: remember ? "var(--accent)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, color: "#000", transition: "all .15s",
              }}>{remember ? "✓" : ""}</div>
              Rester connecté
            </label>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: "var(--red-d)", color: "var(--red)", borderRadius: 9,
              padding: "10px 13px", fontSize: 13, marginBottom: 14,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit} disabled={loading}
            style={{
              width: "100%", padding: "13px", borderRadius: 10, border: "none",
              background: loading ? "var(--surface3)" : "var(--accent)",
              color: loading ? "var(--muted)" : "#000",
              fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              transition: "all .2s", fontFamily: "var(--font)",
            }}>
            {loading ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>

          {/* New account hint */}
          {mode === "login" && (
            <div style={{ textAlign: "center", marginTop: 14, fontSize: 12.5, color: "var(--muted)" }}>
              Pas encore de compte ?{" "}
              <span onClick={() => switchMode("register")}
                style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 500 }}>
                Créer un compte
              </span>
            </div>
          )}
          {mode === "register" && (
            <div style={{ textAlign: "center", marginTop: 14, fontSize: 12.5, color: "var(--muted)" }}>
              Déjà un compte ?{" "}
              <span onClick={() => switchMode("login")}
                style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 500 }}>
                Se connecter
              </span>
            </div>
          )}
        </div>

        {/* Footer note */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11.5, color: "var(--muted)", lineHeight: 1.6 }}>
          🔒 Vos données restent sur votre appareil.<br />
          Chaque compte commence avec un profil vierge.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// BOTTOM NAV
// ═══════════════════════════════════════════════
const TABS = [
  { id:"dashboard", icon:"🏠", label:"Accueil" },
  { id:"calories",  icon:"🍽️", label:"Calories" },
  { id:"habitudes", icon:"✅", label:"Habitudes" },
  { id:"sport",     icon:"🏋️", label:"Sport" },
  { id:"more",      icon:"⋯",  label:"Plus" },
];

function BottomNav({ tab, setTab }) {
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0,
      background:"var(--surface)", borderTop:"1px solid var(--border)",
      display:"flex", paddingBottom:"var(--safe-bottom)", zIndex:50 }}>
      {TABS.map(t => (
        <div key={t.id} onClick={() => setTab(t.id)}
          style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
            padding:"10px 0 8px", cursor:"pointer",
            color: tab===t.id ? "var(--accent)" : "var(--muted)" }}>
          <span style={{ fontSize:20 }}>{t.icon}</span>
          <span style={{ fontSize:10, marginTop:2, fontWeight: tab===t.id ? 600 : 400 }}>{t.label}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// MORE MENU (slide-up)
// ═══════════════════════════════════════════════
function MoreMenu({ setTab, onClose }) {
  const { logout, username } = useAuth();
  const items = [
    { id:"recettes", icon:"👨‍🍳", label:"Recettes" },
    { id:"poids",    icon:"⚖️", label:"Suivi du poids" },
    { id:"calendrier", icon:"📅", label:"Calendrier" },
    { id:"objectifs",  icon:"🎯", label:"Objectifs" },
  ];
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200 }} onClick={onClose}>
      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        background:"var(--surface)", borderRadius:"18px 18px 0 0", padding:"16px 16px 32px" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:"var(--border-h)", borderRadius:2,
          margin:"0 auto 16px" }} />
        <div style={{ fontSize:12, color:"var(--muted)", marginBottom:10, paddingLeft:4 }}>
          Connecté en tant que <strong style={{ color:"var(--accent)" }}>@{username}</strong>
        </div>
        {items.map(it => (
          <div key={it.id} onClick={() => { setTab(it.id); onClose(); }}
            style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 12px",
              borderRadius:10, cursor:"pointer", fontSize:14, marginBottom:4,
              background:"var(--surface2)" }}>
            <span style={{ fontSize:20 }}>{it.icon}</span>
            <span>{it.label}</span>
            <span style={{ marginLeft:"auto", color:"var(--muted)" }}>›</span>
          </div>
        ))}
        <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid var(--border)" }}>
          <div onClick={() => { logout(); onClose(); }}
            style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 12px",
              borderRadius:10, cursor:"pointer", fontSize:14,
              background:"var(--red-d)", color:"var(--red)" }}>
            <span style={{ fontSize:20 }}>🚪</span>
            <div>
              <div style={{ fontWeight:500 }}>Se déconnecter</div>
              <div style={{ fontSize:11, color:"var(--red)", opacity:0.7, marginTop:2 }}>
                Vos données restent sauvegardées
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════
function Dashboard({ setTab }) {
  const { profile, updateProfile } = useApp();
  const today = new Date();
  const dateStr = today.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})
    .replace(/^./,s=>s.toUpperCase());

  const totalCal = profile.meals.reduce((a,m)=>a+m.kcal,0);
  const donHab = profile.habits.filter(h=>h.done).length;
  const totHab = profile.habits.length;
  const lastWeight = profile.weightLog.length ? profile.weightLog[profile.weightLog.length-1].val : null;
  const todaySport = profile.sports.find(s=>s.isToday);

  function toggleHabit(i) {
    const habits = [...profile.habits];
    habits[i] = { ...habits[i], done: !habits[i].done };
    if (habits[i].done) habits[i].streak = (habits[i].streak||0) + 1;
    else if (habits[i].streak > 0) habits[i].streak--;
    updateProfile({ habits });
  }

  const weekData = [1920,2100,1750,2400,2250,totalCal,0];
  const weekLabels = ["L","M","M","J","V","S","D"];
  const weekMax = Math.max(...weekData, 1);

  return (
    <div className="scroll" style={{ paddingBottom:80 }}>
      <div style={{ padding:"20px 16px 0" }}>
        <div style={{ fontSize:12, color:"var(--sec)", marginBottom:2 }}>{dateStr}</div>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:16 }}>Bonjour 👋</div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
          <StatCard label="Calories" value={totalCal.toLocaleString("fr-FR")} unit="kcal"
            color="var(--amber)" sub={`Obj. : ${profile.goals.cal.toLocaleString("fr-FR")} kcal`}
            onClick={()=>setTab("calories")} />
          <StatCard label="Habitudes" value={donHab} unit={`/ ${totHab}`}
            color="var(--accent)" sub={totHab ? Math.round(donHab/totHab*100)+"% complétées" : ""}
            onClick={()=>setTab("habitudes")} />
          <StatCard label="Sport" value={todaySport ? todaySport.dur : "—"}
            unit={todaySport ? "min" : ""}
            color="var(--blue)"
            sub={todaySport ? todaySport.type.replace(/^\S+\s/,"") : "Aucune séance"}
            onClick={()=>setTab("sport")} />
          <StatCard label="Poids" value={lastWeight||"—"} unit={lastWeight?"kg":""}
            color="var(--purple)" sub={`Cible : ${profile.goals.target} kg`}
            onClick={()=>setTab("poids")} />
        </div>

        <Card style={{ marginBottom:12 }}>
          <SectionTitle>Calories cette semaine</SectionTitle>
          <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:72 }}>
            {weekData.map((v,i) => (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                <div style={{ width:"100%", borderRadius:"4px 4px 0 0", minHeight:3,
                  height: Math.round(v/weekMax*56), background: i===5?"var(--accent)":"var(--surface3)" }} />
                <div style={{ fontSize:10, color:"var(--muted)" }}>{weekLabels[i]}</div>
              </div>
            ))}
          </div>
        </Card>

        {profile.habits.length > 0 && (
          <Card>
            <SectionTitle right={
              <Btn variant="ghost" size="sm" onClick={()=>setTab("habitudes")}>Tout voir →</Btn>
            }>Habitudes du jour</SectionTitle>
            {profile.habits.slice(0,4).map((h,i) => (
              <div key={i} onClick={()=>toggleHabit(i)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0",
                  borderBottom: i < Math.min(3, profile.habits.length-1) ? "1px solid var(--border)" : "none",
                  cursor:"pointer" }}>
                <div style={{ width:22, height:22, borderRadius:"50%",
                  border: h.done ? "none" : "2px solid var(--border-h)",
                  background: h.done ? "var(--accent)" : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12, color:"#000", flexShrink:0 }}>{h.done?"✓":""}</div>
                <span style={{ fontSize:17 }}>{h.icon}</span>
                <div style={{ flex:1, fontSize:13.5, fontWeight:500 }}>{h.name}</div>
                {h.streak > 0 && <div style={{ fontSize:12, color:"var(--amber)" }}>🔥 {h.streak}j</div>}
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// CALORIES PAGE
// ═══════════════════════════════════════════════
function CaloriesPage() {
  const { profile, updateProfile, notify } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ name:"", kcal:"", type:"🌅 Petit-déjeuner", prot:"", carbs:"", fat:"", fiber:"" });
  const [editId, setEditId] = useState(null);

  const types = ["🌅 Petit-déjeuner","☀️ Déjeuner","🌙 Dîner","🍎 Collation"];
  const meals = filter === "all" ? profile.meals : profile.meals.filter(m=>m.type===filter);
  const total = profile.meals.reduce((a,m)=>a+m.kcal,0);
  const burned = profile.sports.filter(s=>s.isToday).reduce((a,s)=>a+s.cal,0);

  function saveMeal() {
    if (!form.name.trim() || !form.kcal) { notify("⚠️ Nom et calories requis"); return; }
    const now = new Date().toTimeString().slice(0,5);
    if (editId !== null) {
      const meals = profile.meals.map(m => m.id===editId
        ? { ...m, name:form.name, kcal:+form.kcal, type:form.type, prot:+form.prot||0, carbs:+form.carbs||0, fat:+form.fat||0, fiber:+form.fiber||0 }
        : m);
      updateProfile({ meals });
      setEditId(null);
      notify("Repas mis à jour ✓");
    } else {
      const meal = { id: Date.now(), name:form.name, kcal:+form.kcal, type:form.type,
        time:now, prot:+form.prot||0, carbs:+form.carbs||0, fat:+form.fat||0, fiber:+form.fiber||0 };
      updateProfile({ meals: [...profile.meals, meal] });
      notify("Repas ajouté ✓");
    }
    setForm({ name:"", kcal:"", type:"🌅 Petit-déjeuner", prot:"", carbs:"", fat:"", fiber:"" });
    setShowAdd(false);
  }

  function deleteMeal(id) {
    updateProfile({ meals: profile.meals.filter(m=>m.id!==id) });
    notify("Repas supprimé");
  }

  function startEdit(m) {
    setForm({ name:m.name, kcal:String(m.kcal), type:m.type, prot:String(m.prot||""), carbs:String(m.carbs||""), fat:String(m.fat||""), fiber:String(m.fiber||"") });
    setEditId(m.id);
    setShowAdd(true);
  }

  const ico = {"🌅 Petit-déjeuner":"🌅","☀️ Déjeuner":"☀️","🌙 Dîner":"🌙","🍎 Collation":"🍎"};

  return (
    <div className="scroll" style={{ paddingBottom:80 }}>
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontSize:20, fontWeight:700 }}>🍽️ Calories</div>
          <Btn size="sm" onClick={()=>{ setShowAdd(!showAdd); setEditId(null); setForm({ name:"", kcal:"", type:"🌅 Petit-déjeuner", prot:"", carbs:"", fat:"", fiber:"" }); }}>
            {showAdd ? "✕" : "+ Repas"}
          </Btn>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
          <Card><div style={{ fontSize:10, color:"var(--muted)", marginBottom:4 }}>CONSOMMÉ</div>
            <div style={{ fontSize:20, fontWeight:700, color:"var(--amber)" }}>{total.toLocaleString("fr-FR")}</div>
            <div style={{ fontSize:10, color:"var(--muted)" }}>kcal</div></Card>
          <Card><div style={{ fontSize:10, color:"var(--muted)", marginBottom:4 }}>RESTANT</div>
            <div style={{ fontSize:20, fontWeight:700, color:"var(--accent)" }}>{Math.max(0,profile.goals.cal-total+burned).toLocaleString("fr-FR")}</div>
            <div style={{ fontSize:10, color:"var(--muted)" }}>kcal</div></Card>
          <Card><div style={{ fontSize:10, color:"var(--muted)", marginBottom:4 }}>OBJECTIF</div>
            <div style={{ fontSize:20, fontWeight:700 }}>{profile.goals.cal.toLocaleString("fr-FR")}</div>
            <div style={{ fontSize:10, color:"var(--muted)" }}>kcal</div></Card>
        </div>

        <div style={{ display:"flex", gap:6, marginBottom:12 }}>
          {[{l:"Prot.",v:profile.meals.reduce((a,m)=>a+(m.prot||0),0),c:"var(--amber)"},
            {l:"Glucides",v:profile.meals.reduce((a,m)=>a+(m.carbs||0),0),c:"var(--blue)"},
            {l:"Lipides",v:profile.meals.reduce((a,m)=>a+(m.fat||0),0),c:"var(--red)"},
            {l:"Fibres",v:profile.meals.reduce((a,m)=>a+(m.fiber||0),0),c:"var(--sec)"}
          ].map(x => (
            <div key={x.l} style={{ flex:1, background:"var(--surface)", border:"1px solid var(--border)",
              borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
              <div style={{ fontSize:16, fontWeight:700, color:x.c }}>{x.v}g</div>
              <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>{x.l}</div>
            </div>
          ))}
        </div>

        <Panel open={showAdd}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>
            {editId !== null ? "Modifier le repas" : "Nouveau repas"}
          </div>
          <Input label="Nom *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="ex: Blanc de poulet + riz" />
          <Row><div style={{ flex:1 }}><Input label="Calories *" type="number" value={form.kcal} onChange={e=>setForm({...form,kcal:e.target.value})} placeholder="450" /></div>
            <Select label="Type" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
              {types.map(t=><option key={t}>{t}</option>)}
            </Select>
          </Row>
          <Row>
            <div style={{ flex:1 }}><Input label="Prot. (g)" type="number" value={form.prot} onChange={e=>setForm({...form,prot:e.target.value})} placeholder="30" /></div>
            <div style={{ flex:1 }}><Input label="Glucides (g)" type="number" value={form.carbs} onChange={e=>setForm({...form,carbs:e.target.value})} placeholder="60" /></div>
            <div style={{ flex:1 }}><Input label="Lipides (g)" type="number" value={form.fat} onChange={e=>setForm({...form,fat:e.target.value})} placeholder="12" /></div>
          </Row>
          <Row gap={8}>
            <Btn onClick={saveMeal}>{editId !== null ? "Mettre à jour" : "Ajouter"}</Btn>
            <Btn variant="ghost" onClick={()=>{ setShowAdd(false); setEditId(null); }}>Annuler</Btn>
          </Row>
        </Panel>

        <div style={{ display:"flex", gap:4, marginBottom:12, overflowX:"auto", paddingBottom:4 }}>
          {[{k:"all",l:"Tous"},...types.map(t=>({k:t,l:t.replace(/^\S+\s/,"").split(" ")[0]}))].map(({k,l})=>(
            <div key={k} onClick={()=>setFilter(k)}
              style={{ padding:"6px 12px", borderRadius:20, fontSize:12, whiteSpace:"nowrap", cursor:"pointer",
                background: filter===k ? "var(--accent-d)" : "var(--surface2)",
                color: filter===k ? "var(--accent)" : "var(--sec)",
                border: filter===k ? "1px solid var(--accent)" : "1px solid var(--border)", flexShrink:0 }}>
              {l}
            </div>
          ))}
        </div>

        {meals.length === 0 ? (
          <div style={{ textAlign:"center", padding:"30px 0", color:"var(--muted)", fontSize:13 }}>
            Aucun repas enregistré.
          </div>
        ) : meals.map(m => (
          <div key={m.id} style={{ display:"flex", alignItems:"center", gap:10, background:"var(--surface)",
            border:"1px solid var(--border)", borderRadius:10, padding:"11px 12px", marginBottom:8 }}>
            <span style={{ fontSize:20 }}>{ico[m.type]||"🍽️"}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:500, fontSize:13.5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</div>
              <div style={{ fontSize:11.5, color:"var(--muted)", marginTop:2 }}>{m.time} · {m.prot||0}P {m.carbs||0}G {m.fat||0}L</div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontWeight:700, color:"var(--amber)", fontSize:14 }}>{m.kcal} kcal</div>
              <div style={{ display:"flex", gap:4, marginTop:4, justifyContent:"flex-end" }}>
                <Btn variant="ghost" size="sm" onClick={()=>startEdit(m)}>✏️</Btn>
                <Btn variant="danger" size="sm" onClick={()=>deleteMeal(m.id)}>🗑️</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// HABITUDES PAGE
// ═══════════════════════════════════════════════
function HabitudesPage() {
  const { profile, updateProfile, notify } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:"", icon:"⭐", cat:"Santé", freq:"daily" });
  const [editId, setEditId] = useState(null);

  const done = profile.habits.filter(h=>h.done).length;
  const total = profile.habits.length;

  function toggle(id) {
    const habits = profile.habits.map(h => h.id===id
      ? { ...h, done:!h.done, streak: !h.done ? (h.streak||0)+1 : Math.max(0,(h.streak||1)-1) }
      : h);
    updateProfile({ habits });
  }

  function saveHabit() {
    if (!form.name.trim()) { notify("⚠️ Nom requis"); return; }
    if (editId !== null) {
      const habits = profile.habits.map(h => h.id===editId ? { ...h, ...form } : h);
      updateProfile({ habits });
      notify("Habitude mise à jour ✓");
      setEditId(null);
    } else {
      updateProfile({ habits: [...profile.habits, { id:Date.now(), ...form, done:false, streak:0 }] });
      notify("Habitude créée ✓");
    }
    setForm({ name:"", icon:"⭐", cat:"Santé", freq:"daily" });
    setShowAdd(false);
  }

  function deleteHabit(id) {
    updateProfile({ habits: profile.habits.filter(h=>h.id!==id) });
    notify("Habitude supprimée");
  }

  const freqLabel = { daily:"Chaque jour", weekdays:"Jours ouvrés", weekend:"Week-end" };

  return (
    <div className="scroll" style={{ paddingBottom:80 }}>
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontSize:20, fontWeight:700 }}>✅ Habitudes</div>
          <Btn size="sm" onClick={()=>{ setShowAdd(!showAdd); setEditId(null); setForm({ name:"", icon:"⭐", cat:"Santé", freq:"daily" }); }}>
            {showAdd ? "✕" : "+ Nouvelle"}
          </Btn>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
          <StatCard label="Aujourd'hui" value={done} unit={`/ ${total}`} color="var(--accent)" />
          <StatCard label="Meilleure série" value={profile.habits.reduce((a,h)=>Math.max(a,h.streak||0),0)} unit="j" color="var(--amber)" />
          <StatCard label="Taux" value={total ? Math.round(done/total*100) : 0} unit="%" color="var(--blue)" />
        </div>

        <Panel open={showAdd}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>
            {editId !== null ? "Modifier l'habitude" : "Nouvelle habitude"}
          </div>
          <Input label="Nom *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="ex: Boire 2L d'eau" />
          <Row>
            <div style={{ width:80 }}><Input label="Icône" value={form.icon} onChange={e=>setForm({...form,icon:e.target.value})} maxLength={2} /></div>
            <Select label="Catégorie" value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})}>
              {["Santé","Sport","Mental","Sommeil","Nutrition","Social"].map(c=><option key={c}>{c}</option>)}
            </Select>
          </Row>
          <Select label="Fréquence" value={form.freq} onChange={e=>setForm({...form,freq:e.target.value})}>
            <option value="daily">Chaque jour</option>
            <option value="weekdays">Jours ouvrés</option>
            <option value="weekend">Week-end</option>
          </Select>
          <Row gap={8}>
            <Btn onClick={saveHabit}>{editId !== null ? "Mettre à jour" : "Créer"}</Btn>
            <Btn variant="ghost" onClick={()=>{ setShowAdd(false); setEditId(null); }}>Annuler</Btn>
          </Row>
        </Panel>

        {profile.habits.length === 0 ? (
          <div style={{ textAlign:"center", padding:"30px 0", color:"var(--muted)", fontSize:13 }}>
            Aucune habitude. Créez-en une !
          </div>
        ) : profile.habits.map(h => (
          <div key={h.id} style={{ display:"flex", alignItems:"center", gap:10,
            background: h.done ? "var(--accent-d)" : "var(--surface)",
            border: `1px solid ${h.done ? "var(--accent)" : "var(--border)"}`,
            borderRadius:10, padding:"11px 12px", marginBottom:8 }}>
            <div onClick={()=>toggle(h.id)} style={{ width:24, height:24, borderRadius:"50%",
              border: h.done ? "none" : "2px solid var(--border-h)",
              background: h.done ? "var(--accent)" : "transparent",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, color:"#000", flexShrink:0, cursor:"pointer" }}>{h.done?"✓":""}</div>
            <span style={{ fontSize:19 }}>{h.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:500, fontSize:13.5 }}>{h.name}</div>
              <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{h.cat} · {freqLabel[h.freq]||h.freq}</div>
            </div>
            {(h.streak||0) > 0 && <div style={{ fontSize:12, color:"var(--amber)", flexShrink:0 }}>🔥 {h.streak}j</div>}
            <div style={{ display:"flex", gap:4 }}>
              <Btn variant="ghost" size="sm" onClick={()=>{ setEditId(h.id); setForm({ name:h.name, icon:h.icon, cat:h.cat, freq:h.freq }); setShowAdd(true); }}>✏️</Btn>
              <Btn variant="danger" size="sm" onClick={()=>deleteHabit(h.id)}>🗑️</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SPORT PAGE
// ═══════════════════════════════════════════════
function SportPage() {
  const { profile, updateProfile, notify } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type:"🏋️ Musculation", dur:"", cal:"", intensity:"Modérée", notes:"" });
  const [editId, setEditId] = useState(null);

  const sportTypes = ["🏋️ Musculation","🏃 Course à pied","🚴 Vélo","🏊 Natation","🧘 Yoga","⚽ Football","🥊 Boxe / MMA","🎾 Tennis","🚶 Marche","🏸 Badminton","💪 CrossFit"];
  const totalMin = profile.sports.reduce((a,s)=>a+s.dur,0);
  const totalCal = profile.sports.reduce((a,s)=>a+s.cal,0);
  const intColor = { Faible:"var(--accent)", Modérée:"var(--blue)", Élevée:"var(--amber)", Maximale:"var(--red)" };

  function saveSport() {
    if (!form.dur) { notify("⚠️ Durée requise"); return; }
    if (editId !== null) {
      const sports = profile.sports.map(s => s.id===editId
        ? { ...s, type:form.type, dur:+form.dur, cal:+form.cal||0, intensity:form.intensity, notes:form.notes }
        : s);
      updateProfile({ sports });
      notify("Séance mise à jour ✓");
      setEditId(null);
    } else {
      const sport = { id:Date.now(), type:form.type, dur:+form.dur, cal:+form.cal||0,
        intensity:form.intensity, notes:form.notes, isToday:true, dateLabel:"Aujourd'hui" };
      updateProfile({ sports: [sport, ...profile.sports] });
      notify("Séance enregistrée ✓");
    }
    setForm({ type:"🏋️ Musculation", dur:"", cal:"", intensity:"Modérée", notes:"" });
    setShowAdd(false);
  }

  function deleteSport(id) {
    updateProfile({ sports: profile.sports.filter(s=>s.id!==id) });
    notify("Séance supprimée");
  }

  return (
    <div className="scroll" style={{ paddingBottom:80 }}>
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontSize:20, fontWeight:700 }}>🏋️ Sport</div>
          <Btn size="sm" onClick={()=>{ setShowAdd(!showAdd); setEditId(null); setForm({ type:"🏋️ Musculation", dur:"", cal:"", intensity:"Modérée", notes:"" }); }}>
            {showAdd ? "✕" : "+ Séance"}
          </Btn>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
          <StatCard label="Séances" value={profile.sports.length} color="var(--blue)" />
          <StatCard label="Temps total" value={totalMin} unit="min" color="var(--accent)" />
          <StatCard label="Calories brûlées" value={totalCal.toLocaleString("fr-FR")} unit="kcal" color="var(--red)" />
          <StatCard label="Série actuelle" value={4} unit="jours" color="var(--amber)" />
        </div>

        <Panel open={showAdd}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>
            {editId !== null ? "Modifier la séance" : "Nouvelle séance"}
          </div>
          <Select label="Activité *" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
            {sportTypes.map(t=><option key={t}>{t}</option>)}
          </Select>
          <Row>
            <div style={{ flex:1 }}><Input label="Durée (min) *" type="number" value={form.dur} onChange={e=>setForm({...form,dur:e.target.value})} placeholder="45" /></div>
            <div style={{ flex:1 }}><Input label="Calories brûlées" type="number" value={form.cal} onChange={e=>setForm({...form,cal:e.target.value})} placeholder="320" /></div>
          </Row>
          <Select label="Intensité" value={form.intensity} onChange={e=>setForm({...form,intensity:e.target.value})}>
            {["Faible","Modérée","Élevée","Maximale"].map(i=><option key={i}>{i}</option>)}
          </Select>
          <Input label="Notes (optionnel)" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="ex: PR squat 120kg" />
          <Row gap={8}>
            <Btn onClick={saveSport}>{editId !== null ? "Mettre à jour" : "Enregistrer"}</Btn>
            <Btn variant="ghost" onClick={()=>{ setShowAdd(false); setEditId(null); }}>Annuler</Btn>
          </Row>
        </Panel>

        {profile.sports.length === 0 ? (
          <div style={{ textAlign:"center", padding:"30px 0", color:"var(--muted)", fontSize:13 }}>Aucune séance enregistrée.</div>
        ) : profile.sports.map(s => (
          <div key={s.id} style={{ display:"flex", gap:12, background:"var(--surface)",
            border:"1px solid var(--border)", borderRadius:10, padding:"12px", marginBottom:8 }}>
            <div style={{ fontSize:28, lineHeight:1 }}>{s.type.split(" ")[0]}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:14 }}>{s.type.replace(/^\S+\s/,"")}</div>
              <div style={{ fontSize:12, color:"var(--sec)", marginTop:2 }}>
                {s.dateLabel} · <span style={{ color:intColor[s.intensity]||"var(--sec)" }}>Intensité {s.intensity}</span>
              </div>
              {s.notes && <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>{s.notes}</div>}
              <div style={{ display:"flex", gap:12, marginTop:8 }}>
                <span style={{ fontSize:12, color:"var(--muted)" }}><strong style={{ color:"var(--text)" }}>{s.dur}</strong> min</span>
                <span style={{ fontSize:12, color:"var(--muted)" }}><strong style={{ color:"var(--text)" }}>{s.cal}</strong> kcal</span>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              <Btn variant="ghost" size="sm" onClick={()=>{ setEditId(s.id); setForm({ type:s.type, dur:String(s.dur), cal:String(s.cal), intensity:s.intensity, notes:s.notes||"" }); setShowAdd(true); }}>✏️</Btn>
              <Btn variant="danger" size="sm" onClick={()=>deleteSport(s.id)}>🗑️</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// RECETTES PAGE
// ═══════════════════════════════════════════════
function RecettesPage() {
  const { profile, updateProfile, notify } = useApp();
  const [calMax, setCalMax] = useState(700);
  const [highProt, setHighProt] = useState(false);
  const [lowCarb, setLowCarb] = useState(false);
  const [light, setLight] = useState(false);
  const [vege, setVege] = useState(false);
  const [cat, setCat] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const cats = [{k:"all",l:"Toutes"},{k:"pdej",l:"Petit-déj."},{k:"dej",l:"Déjeuner"},{k:"din",l:"Dîner"},{k:"col",l:"Collation"}];
  const catLabel = {pdej:"Petit-déj.",dej:"Déjeuner",din:"Dîner",col:"Collation"};

  const filtered = RECIPES.filter(r => {
    if (r.kcal > calMax) return false;
    if (highProt && r.prot < 25) return false;
    if (lowCarb && r.carbs >= 30) return false;
    if (light && r.fat >= 15) return false;
    if (vege && !r.vege) return false;
    if (cat !== "all" && r.cat !== cat) return false;
    return true;
  });

  function addToMeals(r) {
    const now = new Date().toTimeString().slice(0,5);
    updateProfile({ meals: [...profile.meals, { id:Date.now(), name:r.name, kcal:r.kcal,
      type:"☀️ Déjeuner", time:now, prot:r.prot, carbs:r.carbs, fat:r.fat, fiber:r.fiber }] });
    notify(`"${r.name}" ajouté à vos repas ✓`);
  }

  return (
    <div className="scroll" style={{ paddingBottom:80 }}>
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ fontSize:20, fontWeight:700, marginBottom:14 }}>👨‍🍳 Recettes</div>

        <Card style={{ marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <span style={{ fontSize:12, color:"var(--sec)", whiteSpace:"nowrap" }}>Calories max</span>
            <input type="range" min={100} max={1200} step={50} value={calMax}
              onChange={e=>setCalMax(+e.target.value)} style={{ flex:1 }} />
            <span style={{ fontSize:13, fontWeight:700, color:"var(--amber)", minWidth:60, textAlign:"right" }}>≤ {calMax} kcal</span>
          </div>
          <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
            {[{s:highProt,set:setHighProt,l:"🥩 Protéiné"},{s:lowCarb,set:setLowCarb,l:"🥑 Low-carb"},
              {s:light,set:setLight,l:"✨ Light"},{s:vege,set:setVege,l:"🌱 Végé"}].map(x=>(
              <label key={x.l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, cursor:"pointer", color:"var(--sec)" }}>
                <input type="checkbox" checked={x.s} onChange={e=>x.set(e.target.checked)} />
                {x.l}
              </label>
            ))}
          </div>
        </Card>

        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:8, marginBottom:12 }}>
          {cats.map(c=>(
            <div key={c.k} onClick={()=>setCat(c.k)}
              style={{ padding:"6px 12px", borderRadius:20, fontSize:12, whiteSpace:"nowrap", cursor:"pointer", flexShrink:0,
                background: cat===c.k ? "var(--accent-d)" : "var(--surface2)",
                color: cat===c.k ? "var(--accent)" : "var(--sec)",
                border: cat===c.k ? "1px solid var(--accent)" : "1px solid var(--border)" }}>
              {c.l}
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:30, color:"var(--muted)", fontSize:13 }}>
            Aucune recette pour ces filtres.
          </div>
        ) : filtered.map(r => (
          <Card key={r.id} style={{ marginBottom:10 }}>
            <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{ fontSize:28, lineHeight:1, flexShrink:0 }}>{r.emoji}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{r.name}</div>
                <div style={{ fontSize:12, color:"var(--sec)", marginTop:2 }}>⏱ {r.time} · {r.diff}{r.vege?" · 🌱":""}</div>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:6 }}>
                  <span style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:"var(--surface2)", color:"var(--sec)", border:"1px solid var(--border)" }}>{catLabel[r.cat]}</span>
                  {r.prot>=25&&<span style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:"var(--amber-d)", color:"var(--amber)" }}>🥩 Protéiné</span>}
                  {r.carbs<30&&<span style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:"var(--accent-d)", color:"var(--accent)" }}>🥑 Low-carb</span>}
                  {r.fat<15&&<span style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:"var(--blue-d)", color:"var(--blue)" }}>✨ Light</span>}
                </div>
              </div>
              <Btn variant="ghost" size="sm" onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
                {expanded===r.id?"✕":"📖"}
              </Btn>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6, marginTop:10,
              paddingTop:10, borderTop:"1px solid var(--border)" }}>
              {[{v:r.kcal,l:"kcal",c:"var(--amber)"},{v:r.prot+"g",l:"Prot.",c:"var(--amber)"},
                {v:r.carbs+"g",l:"Glucides",c:"var(--blue)"},{v:r.fat+"g",l:"Lipides",c:"var(--red)"},
                {v:r.fiber+"g",l:"Fibres",c:"var(--sec)"}].map(x=>(
                <div key={x.l} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:14, fontWeight:700, color:x.c }}>{x.v}</div>
                  <div style={{ fontSize:10, color:"var(--muted)", marginTop:1 }}>{x.l}</div>
                </div>
              ))}
            </div>

            {expanded === r.id && (
              <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid var(--border)" }}>
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>🛒 Ingrédients</div>
                  {r.ingr.map((ig,i) => (
                    <div key={i} style={{ display:"flex", gap:8, padding:"4px 0",
                      borderBottom:"1px solid var(--border)", fontSize:12.5 }}>
                      <span style={{ color:"var(--accent)", fontWeight:600, minWidth:80, flexShrink:0 }}>{ig.q}</span>
                      <span style={{ color:"var(--sec)" }}>{ig.n}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", marginBottom:10 }}>👨‍🍳 Préparation</div>
                  {r.steps.map((s,i) => (
                    <div key={i} style={{ display:"flex", gap:10, marginBottom:12 }}>
                      <div style={{ width:22, height:22, borderRadius:"50%", background:"var(--accent-d)",
                        border:"1px solid var(--accent)", display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:11, fontWeight:700, color:"var(--accent)", flexShrink:0, marginTop:1 }}>{i+1}</div>
                      <div>
                        <div style={{ fontSize:12.5, fontWeight:600, marginBottom:3 }}>{s.t}</div>
                        <div style={{ fontSize:12, color:"var(--sec)", lineHeight:1.6 }}>{s.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Btn onClick={()=>addToMeals(r)} style={{ width:"100%" }}>+ Ajouter à mes repas du jour</Btn>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// POIDS PAGE
// ═══════════════════════════════════════════════
function PoidsPage() {
  const { profile, updateProfile, notify } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [wDate, setWDate] = useState(new Date().toISOString().slice(0,10));
  const [wVal, setWVal] = useState("");
  const [wNote, setWNote] = useState("");

  const today = new Date();
  const isMonday = today.getDay() === 1;
  const last = profile.weightLog.length ? profile.weightLog[profile.weightLog.length-1] : null;
  const daysSince = last ? Math.round((today - new Date(last.date)) / 86400000) : 999;
  const diff = profile.weightLog.length > 1
    ? (profile.weightLog[profile.weightLog.length-1].val - profile.weightLog[0].val).toFixed(1)
    : null;

  function saveWeight() {
    if (!wVal) { notify("⚠️ Entrez votre poids"); return; }
    const log = profile.weightLog.filter(w=>w.date!==wDate);
    log.push({ date:wDate, val:+wVal, note:wNote });
    log.sort((a,b)=>new Date(a.date)-new Date(b.date));
    updateProfile({ weightLog:log, goals:{ ...profile.goals, weight:+wVal } });
    setWVal(""); setWNote(""); setShowAdd(false);
    notify("Poids enregistré ✓");
  }

  const fmtDate = str => new Date(str).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});

  return (
    <div className="scroll" style={{ paddingBottom:80 }}>
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontSize:20, fontWeight:700 }}>⚖️ Poids</div>
          <Btn size="sm" onClick={()=>setShowAdd(!showAdd)}>{showAdd?"✕":"+ Pesée"}</Btn>
        </div>

        {isMonday && daysSince >= 6 && (
          <div style={{ background:"var(--amber-d)", border:"1px solid rgba(249,168,37,.3)",
            borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
            <span style={{ fontSize:24 }}>⚖️</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:13 }}>C'est lundi — pesez-vous !</div>
              <div style={{ fontSize:12, color:"var(--sec)", marginTop:2 }}>Entrez votre poids de ce matin.</div>
            </div>
            <Btn size="sm" onClick={()=>setShowAdd(true)}>Saisir</Btn>
          </div>
        )}
        {daysSince >= 8 && !(isMonday && daysSince >= 6) && (
          <div style={{ background:"var(--red-d)", border:"1px solid rgba(255,102,102,.3)",
            borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
            <span style={{ fontSize:24 }}>⚠️</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:13 }}>Pesée manquante</div>
              <div style={{ fontSize:12, color:"var(--sec)", marginTop:2 }}>Pas de pesée depuis {daysSince} jours.</div>
            </div>
            <Btn variant="danger" size="sm" onClick={()=>setShowAdd(true)}>Rattraper</Btn>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
          <StatCard label="Actuel" value={last?.val||"—"} unit={last?"kg":""} color="var(--purple)" />
          <StatCard label="Objectif" value={profile.goals.target} unit="kg" color="var(--accent)" />
          <StatCard label="Évolution" value={diff !== null ? (diff>0?"+":"")+diff : "—"} unit={diff!==null?"kg":""}
            color={diff!==null && +diff<=0 ? "var(--accent)" : "var(--red)"} />
        </div>

        <Panel open={showAdd}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Nouvelle pesée</div>
          <Input label="Date (lundi de préférence)" type="date" value={wDate} onChange={e=>setWDate(e.target.value)} />
          <Input label="Poids (kg) *" type="number" step="0.1" value={wVal} onChange={e=>setWVal(e.target.value)} placeholder="74.5" />
          <Input label="Note (optionnel)" value={wNote} onChange={e=>setWNote(e.target.value)} placeholder="après petit-déj..." />
          <Row gap={8}><Btn onClick={saveWeight}>Enregistrer</Btn><Btn variant="ghost" onClick={()=>setShowAdd(false)}>Annuler</Btn></Row>
        </Panel>

        {profile.weightLog.length > 1 && (
          <Card style={{ marginBottom:12 }}>
            <SectionTitle>Courbe de poids</SectionTitle>
            <WeightChart data={profile.weightLog} target={profile.goals.target} />
            <div style={{ display:"flex", gap:12, marginTop:10, flexWrap:"wrap" }}>
              {[{c:"var(--purple)",l:"Poids mesuré"},{c:"var(--accent)",l:"Objectif"},{c:"rgba(249,168,37,.5)",l:"Tendance"}].map(x=>(
                <div key={x.l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"var(--sec)" }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:x.c }} />{x.l}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <SectionTitle>Historique</SectionTitle>
          {[...profile.weightLog].reverse().map((w,i) => (
            <Ev key={i} dot="var(--purple)" name={fmtDate(w.date)}
              val={w.note ? <span style={{ fontSize:11, color:"var(--muted)", marginRight:6 }}>{w.note}</span> : null}
              right={<span style={{ fontWeight:700, color:"var(--purple)", fontSize:14 }}>{w.val} kg</span>} />
          ))}
          {profile.weightLog.length === 0 && (
            <div style={{ textAlign:"center", padding:"20px 0", color:"var(--muted)", fontSize:13 }}>Aucune pesée.</div>
          )}
        </Card>
      </div>
    </div>
  );
}

function WeightChart({ data, target }) {
  const ref = useCallback(canvas => {
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.parentElement.offsetWidth || 300, H = 160;
    canvas.width = W*dpr; canvas.height = H*dpr;
    canvas.style.width = W+"px"; canvas.style.height = H+"px";
    ctx.scale(dpr, dpr);
    const vals = data.map(d=>d.val);
    const minV = Math.min(...vals, target) - 0.8, maxV = Math.max(...vals, target) + 0.8;
    const pad = {l:38,r:14,t:12,b:28};
    const cw = W-pad.l-pad.r, ch = H-pad.t-pad.b;
    const toX = i => pad.l + (i/(Math.max(data.length-1,1)))*cw;
    const toY = v => pad.t + ch - (v-minV)/(maxV-minV)*ch;
    ctx.strokeStyle="rgba(255,255,255,0.05)"; ctx.lineWidth=1;
    for(let i=0;i<=4;i++){const y=pad.t+i*(ch/4);ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(pad.l+cw,y);ctx.stroke();}
    ctx.fillStyle="#555"; ctx.font="10px system-ui"; ctx.textAlign="right";
    for(let i=0;i<=4;i++){const v=maxV-i*(maxV-minV)/4;ctx.fillText(v.toFixed(1),pad.l-4,pad.t+i*(ch/4)+4);}
    ctx.textAlign="center";
    data.forEach((d,i)=>{if(i%Math.ceil(data.length/5)===0||i===data.length-1){const dt=new Date(d.date);ctx.fillText(`${dt.getDate()}/${dt.getMonth()+1}`,toX(i),H-pad.b+14);}});
    const ty=toY(target);
    ctx.setLineDash([4,4]); ctx.strokeStyle="rgba(62,207,142,0.5)"; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(pad.l,ty); ctx.lineTo(pad.l+cw,ty); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle="rgba(62,207,142,0.7)"; ctx.font="10px system-ui"; ctx.textAlign="left";
    ctx.fillText(`Cible ${target}kg`, pad.l+4, ty-4);
    if(data.length>=3){
      ctx.strokeStyle="rgba(249,168,37,0.45)"; ctx.lineWidth=2;
      ctx.beginPath();
      data.forEach((d,i)=>{const w=data.slice(Math.max(0,i-1),i+2);const avg=w.reduce((a,x)=>a+x.val,0)/w.length;if(i===0)ctx.moveTo(toX(i),toY(avg));else ctx.lineTo(toX(i),toY(avg));});
      ctx.stroke();
    }
    const grad=ctx.createLinearGradient(0,pad.t,0,pad.t+ch);
    grad.addColorStop(0,"rgba(167,139,250,0.2)"); grad.addColorStop(1,"rgba(167,139,250,0)");
    ctx.beginPath(); data.forEach((d,i)=>{if(i===0)ctx.moveTo(toX(i),toY(d.val));else ctx.lineTo(toX(i),toY(d.val));});
    ctx.lineTo(toX(data.length-1),pad.t+ch); ctx.lineTo(toX(0),pad.t+ch); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
    ctx.strokeStyle="#a78bfa"; ctx.lineWidth=2.5;
    ctx.beginPath(); data.forEach((d,i)=>{if(i===0)ctx.moveTo(toX(i),toY(d.val));else ctx.lineTo(toX(i),toY(d.val));});
    ctx.stroke();
    data.forEach((d,i)=>{ctx.beginPath();ctx.arc(toX(i),toY(d.val),4,0,Math.PI*2);ctx.fillStyle="#a78bfa";ctx.fill();ctx.strokeStyle="#0f0f0f";ctx.lineWidth=1.5;ctx.stroke();});
  }, [data, target]);
  return <div style={{ width:"100%", height:160 }}><canvas ref={ref} /></div>;
}

// ═══════════════════════════════════════════════
// CALENDRIER PAGE
// ═══════════════════════════════════════════════
function CalendrierPage() {
  const { profile, updateProfile, notify } = useApp();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selKey, setSelKey] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ hDone:0, hTotal:0, sport:"", meals:[] });
  const [newMealName, setNewMealName] = useState("");
  const [newMealKcal, setNewMealKcal] = useState("");

  const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const DAYS_SHORT = ["L","M","M","J","V","S","D"];

  function chMonth(dir) {
    if (dir===0) { setMonth(today.getMonth()); setYear(today.getFullYear()); return; }
    let m=month+dir, y=year;
    if(m>11){m=0;y++;} if(m<0){m=11;y--;}
    setMonth(m); setYear(y);
  }

  function selectDay(d) {
    const key = `${year}-${month}-${d}`;
    setSelKey(key); setShowEdit(false);
    const data = profile.calData[key];
    if (data) setEditForm({ hDone:data.habits?.done||0, hTotal:data.habits?.total||profile.habits.length, sport:data.sport||"", meals:[...(data.meals||[])] });
    else setEditForm({ hDone:0, hTotal:profile.habits.length, sport:"", meals:[] });
  }

  function isFuture(d) { return new Date(year,month,d) > today; }
  function isToday(d) { return d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear(); }

  const first=(new Date(year,month,1).getDay()+6)%7;
  const days=new Date(year,month+1,0).getDate();
  const prev=new Date(year,month,0).getDate();

  function addDayMeal() {
    if (!newMealName.trim() || !newMealKcal) return;
    setEditForm(f=>({ ...f, meals:[...f.meals, { name:newMealName, kcal:+newMealKcal }] }));
    setNewMealName(""); setNewMealKcal("");
  }

  function saveDayEdit() {
    const calData = { ...profile.calData };
    const meals = [...editForm.meals];
    calData[selKey] = { habits:{ done:+editForm.hDone, total:+editForm.hTotal }, sport:editForm.sport, meals, cal:meals.reduce((a,m)=>a+m.kcal,0) };
    updateProfile({ calData });
    setShowEdit(false);
    notify("Jour mis à jour ✓");
  }

  const selData = selKey ? profile.calData[selKey] : null;
  const selD = selKey ? +selKey.split("-")[2] : null;

  return (
    <div className="scroll" style={{ paddingBottom:80 }}>
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ fontSize:20, fontWeight:700, marginBottom:14 }}>📅 Calendrier</div>
        <Card style={{ marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ fontWeight:600, fontSize:15 }}>{MONTHS[month]} {year}</div>
            <div style={{ display:"flex", gap:6 }}>
              <Btn variant="ghost" size="sm" onClick={()=>chMonth(-1)}>←</Btn>
              <Btn variant="ghost" size="sm" onClick={()=>chMonth(0)}>Auj.</Btn>
              <Btn variant="ghost" size="sm" onClick={()=>chMonth(1)}>→</Btn>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
            {DAYS_SHORT.map((d,i)=><div key={i} style={{ textAlign:"center", fontSize:10.5, color:"var(--muted)", padding:"4px 0" }}>{d}</div>)}
            {Array.from({length:first}).map((_,i)=>(
              <div key={"p"+i} style={{ aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"var(--muted)" }}>{prev-first+1+i}</div>
            ))}
            {Array.from({length:days}).map((_,i)=>{
              const d=i+1, key=`${year}-${month}-${d}`, data=profile.calData[key];
              const isTd=isToday(d), isSel=selKey===key;
              return (
                <div key={d} onClick={()=>selectDay(d)}
                  style={{ aspectRatio:"1", display:"flex", flexDirection:"column", alignItems:"center",
                    justifyContent:"center", borderRadius:8, cursor:"pointer", fontSize:12.5, gap:2,
                    background: isSel ? "var(--accent)" : data ? "var(--surface2)" : "transparent",
                    border: isTd && !isSel ? "1px solid var(--accent)" : "1px solid transparent",
                    color: isSel ? "#000" : isTd ? "var(--accent)" : "var(--text)",
                    fontWeight: (isTd||isSel) ? 600 : 400 }}>
                  {d}
                  {data && <div style={{ display:"flex", gap:2 }}>
                    {data.habits?.done && <div style={{ width:4,height:4,borderRadius:"50%",background:isSel?"rgba(0,0,0,.4)":"var(--accent)" }} />}
                    {data.sport && <div style={{ width:4,height:4,borderRadius:"50%",background:isSel?"rgba(0,0,0,.4)":"var(--blue)" }} />}
                    {data.cal && <div style={{ width:4,height:4,borderRadius:"50%",background:isSel?"rgba(0,0,0,.4)":"var(--amber)" }} />}
                  </div>}
                </div>
              );
            })}
          </div>
        </Card>

        {selKey && (
          <Card>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div style={{ fontWeight:600, fontSize:14 }}>{selD} {MONTHS[month]} {year}</div>
              {!isFuture(selD) && (
                <Btn variant="amber" size="sm" onClick={()=>setShowEdit(!showEdit)}>
                  {showEdit ? "✕" : "✏️ Modifier"}
                </Btn>
              )}
            </div>

            {selData ? (
              <>
                <Ev dot="var(--accent)" name="Habitudes" val={`${selData.habits?.done||0}/${selData.habits?.total||0}`} tag={true} />
                {selData.sport && <Ev dot="var(--blue)" name="Sport" val={selData.sport} tag={true} />}
                <Ev dot="var(--amber)" name="Calories" val={selData.cal ? `${(selData.cal).toLocaleString("fr-FR")} kcal` : "—"} tag={selData.cal <= profile.goals.cal} />
                {selData.meals?.length > 0 && <div style={{ fontSize:11.5, color:"var(--muted)", marginTop:4 }}>🍽️ {selData.meals.map(m=>m.name).join(", ")}</div>}
              </>
            ) : isFuture(selD) ? (
              <p style={{ color:"var(--muted)", fontSize:13 }}>Jour à venir.</p>
            ) : isToday(selD) ? (
              <>
                <Ev dot="var(--accent)" name="Habitudes" val={`${profile.habits.filter(h=>h.done).length}/${profile.habits.length}`} />
                <Ev dot="var(--amber)" name="Calories" val={`${profile.meals.reduce((a,m)=>a+m.kcal,0).toLocaleString("fr-FR")} kcal`} />
              </>
            ) : (
              <Ev dot="var(--muted)" name="Aucune donnée" tag={false} />
            )}

            {showEdit && (
              <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid var(--border)" }}>
                <div style={{ fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:".04em", color:"var(--sec)", marginBottom:10 }}>✏️ Modifier ce jour</div>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:12, color:"var(--sec)", marginBottom:8 }}>🍽️ Repas</div>
                  {editForm.meals.map((m,i)=>(
                    <Ev key={i} dot="var(--amber)" name={m.name} val={`${m.kcal} kcal`}
                      right={<Btn variant="danger" size="sm" onClick={()=>setEditForm(f=>({...f,meals:f.meals.filter((_,j)=>j!==i)}))}>🗑️</Btn>} />
                  ))}
                  <div style={{ display:"flex", gap:6 }}>
                    <input className="fi" value={newMealName} onChange={e=>setNewMealName(e.target.value)} placeholder="Repas"
                      style={{ flex:2, background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"7px 10px", color:"var(--text)", fontSize:12, outline:"none" }} />
                    <input value={newMealKcal} onChange={e=>setNewMealKcal(e.target.value)} type="number" placeholder="kcal"
                      style={{ flex:1, background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"7px 10px", color:"var(--text)", fontSize:12, outline:"none" }} />
                    <Btn variant="amber" size="sm" onClick={addDayMeal}>+</Btn>
                  </div>
                </div>
                <Row>
                  <div style={{ flex:1 }}><Input label="Habitudes faites" type="number" value={editForm.hDone} onChange={e=>setEditForm(f=>({...f,hDone:+e.target.value}))} /></div>
                  <div style={{ flex:1 }}><Input label="Total" type="number" value={editForm.hTotal} onChange={e=>setEditForm(f=>({...f,hTotal:+e.target.value}))} /></div>
                </Row>
                <Input label="Sport" value={editForm.sport} onChange={e=>setEditForm(f=>({...f,sport:e.target.value}))} placeholder="ex: Course 30min" />
                <Row gap={8}><Btn onClick={saveDayEdit}>Enregistrer</Btn><Btn variant="ghost" onClick={()=>setShowEdit(false)}>Annuler</Btn></Row>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// OBJECTIFS PAGE
// ═══════════════════════════════════════════════
function ObjectifsPage() {
  const { profile, updateProfile, notify } = useApp();
  const [form, setForm] = useState({ ...profile.goals });
  function save() { updateProfile({ goals: form }); notify("Objectifs enregistrés ✓"); }
  const f = (k) => ({ value: form[k], onChange: e=>setForm({...form,[k]:+e.target.value}), type:"number" });
  return (
    <div className="scroll" style={{ paddingBottom:80 }}>
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ fontSize:20, fontWeight:700, marginBottom:14 }}>🎯 Objectifs</div>
        <Card style={{ marginBottom:12 }}>
          <SectionTitle>Nutrition</SectionTitle>
          <Input label="Calories / jour (kcal)" {...f("cal")} />
          <Row><div style={{ flex:1 }}><Input label="Protéines (g)" {...f("prot")} /></div>
            <div style={{ flex:1 }}><Input label="Glucides (g)" {...f("carbs")} /></div>
            <div style={{ flex:1 }}><Input label="Lipides (g)" {...f("fat")} /></div></Row>
          <Input label="Eau (L/jour)" {...f("water")} step="0.5" />
        </Card>
        <Card style={{ marginBottom:12 }}>
          <SectionTitle>Activité physique</SectionTitle>
          <Input label="Pas / jour" {...f("steps")} />
          <Input label="Séances / semaine" {...f("sessions")} />
          <Row><div style={{ flex:1 }}><Input label="Poids actuel (kg)" {...f("weight")} step="0.1" /></div>
            <div style={{ flex:1 }}><Input label="Poids cible (kg)" {...f("target")} step="0.1" /></div></Row>
          <Input label="Taille (cm)" {...f("height")} />
        </Card>
        <Btn onClick={save} style={{ width:"100%", padding:12 }}>Enregistrer les objectifs</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// APP PROVIDER & MAIN APP
// ═══════════════════════════════════════════════
function AppProvider({ username, children }) {
  const [profile, setProfile] = useState(() => {
    const u = getUserData(username);
    return u?.profile || defaultProfile();
  });
  const [notifMsg, setNotifMsg] = useState(null);

  const notify = useCallback((msg) => {
    setNotifMsg(msg);
    setTimeout(() => setNotifMsg(null), 2200);
  }, []);

  const updateProfile = useCallback((partial) => {
    setProfile(prev => {
      const next = { ...prev, ...partial };
      const u = getUserData(username);
      setUserData(username, { ...u, profile: next });
      return next;
    });
  }, [username]);

  return (
    <AppContext.Provider value={{ profile, updateProfile, notify }}>
      {children}
      <Notif msg={notifMsg} />
    </AppContext.Provider>
  );
}

function AuthProvider({ children }) {
  const [username, setUsername] = useState(() => {
    return sessionStorage.getItem("sante_user") || localStorage.getItem("sante_remember") || null;
  });

  const login = useCallback((u, remember) => {
    sessionStorage.setItem("sante_user", u);
    if (remember) localStorage.setItem("sante_remember", u);
    setUsername(u);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("sante_user");
    localStorage.removeItem("sante_remember");
    setUsername(null);
  }, []);

  return (
    <AuthContext.Provider value={{ username, login, logout }}>
      {username ? (
        <AppProvider username={username}>{children}</AppProvider>
      ) : (
        <LoginPage />
      )}
    </AuthContext.Provider>
  );
}

function MainApp() {
  const [tab, setTab] = useState("dashboard");
  const [showMore, setShowMore] = useState(false);

  const handleSetTab = useCallback((t) => {
    if (t === "more") { setShowMore(true); return; }
    setTab(t);
  }, []);

  const pageStyle = { position:"absolute", inset:0, overflow:"hidden" };

  const pages = {
    dashboard: <Dashboard setTab={setTab} />,
    calories:  <CaloriesPage />,
    habitudes: <HabitudesPage />,
    sport:     <SportPage />,
    recettes:  <RecettesPage />,
    poids:     <PoidsPage />,
    calendrier:<CalendrierPage />,
    objectifs: <ObjectifsPage />,
  };

  return (
    <div style={{ ...pageStyle, display:"flex", flexDirection:"column", background:"var(--bg)" }}>
      <div style={{ flex:1, overflow:"hidden", position:"relative" }}>
        {pages[tab] || pages.dashboard}
      </div>
      <BottomNav tab={TABS.find(t=>t.id===tab)?.id||tab} setTab={handleSetTab} />
      {showMore && <MoreMenu setTab={setTab} onClose={()=>setShowMore(false)} />}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
