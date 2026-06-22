import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

// ── Storage ──
const load = async (key) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; } };
const save = async (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch(e) { console.error(e); } };
const todayKey = () => { const d = new Date(); return `day-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const fmtDate = () => new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" });
const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

// ── Plan Generator ──
const CF_DAYS = [1,3,5];
const isCrossfitDay = n => CF_DAYS.includes(((n-1)%7)+1);
const isRestDay = n => ((n-1)%7)+1 === 7;
const WOD_FORMATS = ["AMRAP","For Time","EMOM","Chipper","Ladder"];
const getWodFormat = n => WOD_FORMATS[n % WOD_FORMATS.length];
const PROTEINS = ["poulet grillé","thon en boîte","saumon","dinde","bœuf haché 5%","crevettes","poisson blanc","œufs entiers","veau","sardines"];
const CARBS = ["riz complet","patate douce","quinoa","flocons d'avoine","pain complet","lentilles","pois chiches","riz basmati","boulgour","haricots rouges"];
const VEGS = ["brocoli + courgette","épinards + tomates","haricots verts + carottes","salade verte + concombre","poivrons + champignons","fenouil + céleri","asperges + courgette","chou-fleur + carottes","roquette + tomates cerises","endives + betterave"];
const getMeals = n => ({ protein:PROTEINS[(n-1)%PROTEINS.length], carb:CARBS[(n-1)%CARBS.length], veg:VEGS[(n-1)%VEGS.length], bfProtein:PROTEINS[(n+4)%PROTEINS.length] });

const getFallbackPlan = (dayNum) => {
  const isCF=isCrossfitDay(dayNum), isRest=isRestDay(dayNum);
  const {protein,carb,veg}=getMeals(dayNum);
  return {
    motiv:{message:"Chaque jour est une nouvelle chance. Lance-toi !",mantra:"Un jour à la fois"},
    repas:{
      matin:{titre:"Petit-déj protéiné",description:`3 œufs brouillés + 40g flocons d'avoine + 1 banane`,calories:isCF?450:350,conseil:"Mange lentement, mâche bien"},
      midi:{titre:"Bowl équilibré",description:`150g ${protein} + 80g ${carb} + ${veg} vapeur`,calories:isCF?600:500,conseil:"Bois 300ml d'eau avant de manger"},
      soir:{titre:"Dîner léger",description:`200g ${protein} grillé + légumes vapeur sans sel`,calories:isCF?500:420,conseil:"Dernier repas avant 20h"},
    },
    sport:{
      type:isCF?"CrossFit WOD":isRest?"Repos actif":"Marche active",
      dureeTotal:isCF?60:isRest?0:45,
      description:isCF?"Séance CrossFit à la box — échauffement + WOD + récup":isRest?"Repos, étirements légers 15 min":"Marche 45 min à rythme soutenu",
      wodFormat:isCF?"AMRAP":null,
      exercices:isCF?[{nom:"Échauffement",details:"5 min cardio léger + mobilité",repos:""},{nom:"WOD du coach",details:"Suivre le programme de la box",repos:""},{nom:"Cool down",details:"Étirements 10 min",repos:""}]:[{nom:isRest?"Étirements":"Marche",details:isRest?"15 min de stretching global":"45 min à 6-7 km/h",repos:""}],
      objectifPas:isCF?12000:isRest?5000:8000,
      conseilBox:isCF?"Arrive 10 min avant, hydrate-toi bien pendant la séance":null,
    },
    antiGonflement:["Zéro sel ajouté dans tous tes repas","Bois 300ml d'eau dès le réveil à jeun","Évite les aliments transformés toute la journée"],
    hydratation:{objectifLitres:isCF?3:2.5,tipDuJour:"Ajoute une rondelle de citron dans ton eau pour faciliter la digestion"},
  };
};

const generatePlan = async (dayNum) => {
  const isCF=isCrossfitDay(dayNum), isRest=isRestDay(dayNum);
  const session=isCF?"CrossFit WOD":isRest?"Repos & Récupération":"Marche Active";
  const wod=isCF?getWodFormat(dayNum):null;
  const phase=dayNum<=14?"débutant CrossFit (technique avant tout)":dayNum<=35?"progression (augmenter intensité)":"confirmé (pousser les limites)";
  const {protein,carb,veg,bfProtein}=getMeals(dayNum);
  const prompt=`Tu es un coach CrossFit et nutrition expert lean/anti-rétention d'eau.
Génère un plan quotidien JSON. Contexte:
- Jour ${dayNum}, phase: ${phase}
- CrossFit box (reprend après 1 an d'arrêt), disponible après 17-18h
- Problèmes: mange trop, grignote, mange tard, pas de structure
- Session: ${session}${isCF?` — WOD format: ${wod}`:""}
- Cuisine halal (pas de porc, pas d'alcool)
- Ingrédients imposés pour la variété: protéine=${protein}, glucide=${carb}, légumes=${veg}, pdj protéine=${bfProtein}
- Règles: 3 repas uniquement, zéro sel ajouté, zéro transformé, dernier repas avant 20h
- ${isCF?"Matin: glucides pour l'énergie. Soir post-WOD: protéines + légumes.":"Journée légère, anti-inflammatoire."}
JSON UNIQUEMENT (pas de markdown ni backtick):
{"motiv":{"message":"phrase courte percutante","mantra":"3-4 mots"},
"repas":{"matin":{"titre":"nom","description":"aliments + quantités précis","calories":${isCF?450:350},"conseil":"astuce"},"midi":{"titre":"nom","description":"aliments + quantités précis","calories":${isCF?600:500},"conseil":"astuce"},"soir":{"titre":"nom","description":"aliments + quantités précis","calories":${isCF?500:420},"conseil":"astuce"}},
"sport":{"type":"${session}","dureeTotal":${isCF?60:isRest?0:45},"description":"description courte","wodFormat":${isCF?`"${wod}"`:"null"},"exercices":[{"nom":"nom","details":"détails","repos":""}],"objectifPas":${isCF?12000:isRest?5000:8000},"conseilBox":${isCF?`"conseil pour la box"`:"null"}},
"antiGonflement":["conseil1","conseil2","conseil3"],
"hydratation":{"objectifLitres":${isCF?3:2.5},"tipDuJour":"conseil"}}`;
  try {
    const res = await fetch("/api/generate", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ prompt }) });
    const data = await res.json();
    if (!data.text) {
      console.error("API error:", data);
      return getFallbackPlan(dayNum);
    }
    return JSON.parse(data.text.replace(/```json|```/g,"").trim());
  } catch(e) { console.error(e); return getFallbackPlan(dayNum); }
};

// ── DEBLOAT PRACTICES ──
const DEBLOAT_PRACTICES = [
  { id:"cold_water", icon:"🧊", title:"Eau froide visage", desc:"Rinçage 30s eau très froide matin", category:"skin", points:2 },
  { id:"ice_cube", icon:"🧊", title:"Glaçons contour", desc:"Passer 1 glaçon enroulé le long de la mâchoire, 1 min", category:"skin", points:3 },
  { id:"lymph_massage", icon:"👐", title:"Massage lymphatique", desc:"Du centre du visage vers les oreilles, puis cou vers clavicules, 3 min", category:"massage", points:3 },
  { id:"gua_sha", icon:"🪨", title:"Gua Sha", desc:"Mouvements ascendants sur le cou et visage, 5 min", category:"massage", points:4 },
  { id:"spoon_eye", icon:"🥄", title:"Cuillères froides", desc:"2 cuillères au frigo, appuyer sous les yeux 1 min", category:"skin", points:2 },
  { id:"no_salt", icon:"🧂", title:"Zéro sel ajouté", desc:"Aucun sel dans les repas aujourd'hui", category:"nutrition", points:3 },
  { id:"no_sugar", icon:"🚫", title:"Zéro sucre raffiné", desc:"Pas de sucre transformé de la journée", category:"nutrition", points:3 },
  { id:"herbal_tea", icon:"🍵", title:"Tisane drainante", desc:"Fenouil, pissenlit ou ortie — 1 tasse matin à jeun", category:"nutrition", points:2 },
  { id:"sleep_elevation", icon:"🛏️", title:"Tête surélevée", desc:"Dormir avec 2 oreillers cette nuit", category:"sleep", points:2 },
  { id:"no_alcohol", icon:"🚫", title:"Zéro alcool", desc:"Aucune boisson alcoolisée", category:"nutrition", points:2 },
  { id:"potassium", icon:"🍌", title:"Aliment riche potassium", desc:"Banane, avocat ou patate douce dans la journée", category:"nutrition", points:2 },
  { id:"face_yoga", icon:"🧘", title:"Face yoga", desc:"Gonfler les joues, sourire forcé, 5 répétitions chaque", category:"massage", points:2 },
  { id:"sleep_8h", icon:"😴", title:"8h de sommeil", desc:"Coucher à l'heure pour 8h de récup", category:"sleep", points:4 },
  { id:"no_phone", icon:"📵", title:"Pas d'écran -1h", desc:"Pas d'écran 1h avant de dormir", category:"sleep", points:2 },
  { id:"water_morning", icon:"💧", title:"500ml à jeun", desc:"Boire 500ml d'eau dès le réveil", category:"hydration", points:2 },
];

const CATEGORY_COLORS = { skin:"#06B6D4", massage:"#8B5CF6", nutrition:"#10B981", sleep:"#F97316", hydration:"#3B82F6" };
const CATEGORY_LABELS = { skin:"Peau", massage:"Massage", nutrition:"Nutrition", sleep:"Sommeil", hydration:"Hydratation" };

// ── COLORS & STYLES ──
const C = {
  bg:"#070A12", card:"rgba(255,255,255,0.04)", cardBorder:"rgba(255,255,255,0.07)",
  em:"#00E5A0", emDark:"#00B87A", cy:"#06B6D4", or:"#F97316", pu:"#8B5CF6", re:"#EF4444",
  text:"#F1F5F9", sec:"#64748B", muted:"#1E293B",
  grad:"linear-gradient(135deg,#00E5A0,#06B6D4)",
  gradWarm:"linear-gradient(135deg,#F97316,#EF4444)",
  gradPu:"linear-gradient(135deg,#8B5CF6,#06B6D4)",
  glassEm:"rgba(0,229,160,0.07)", glassEmBorder:"rgba(0,229,160,0.2)",
  glassOr:"rgba(249,115,22,0.07)", glassOrBorder:"rgba(249,115,22,0.2)",
  glassPu:"rgba(139,92,246,0.07)", glassPuBorder:"rgba(139,92,246,0.2)",
};

const pill = (col, label, bg) => (
  <span style={{background:bg||`${col}18`,color:col,borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,letterSpacing:0.3}}>{label}</span>
);

// ── ANIMATED RING ──
const Ring = ({ pct=0, size=160, stroke=12, color=C.grad, bg="rgba(255,255,255,0.05)", children, glow=true }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct, 1);
  const id = `rg_${size}_${stroke}`;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5A0"/>
            <stop offset="100%" stopColor="#06B6D4"/>
          </linearGradient>
          {glow && <filter id={`glow_${id}`}><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>}
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={typeof color==="string"&&color.startsWith("linear")?`url(#${id})`:color}
          strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          filter={glow&&pct>0?`url(#glow_${id})`:undefined}
          style={{transition:"stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)"}}
        />
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        {children}
      </div>
    </div>
  );
};

// ── MINI RING ──
const MiniRing = ({ pct=0, size=52, stroke=5, color="#00E5A0" }) => {
  const r = (size-stroke)/2, circ = 2*Math.PI*r, dash = circ * Math.min(pct,1);
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{transition:"stroke-dasharray 0.8s ease"}}/>
    </svg>
  );
};

// ── GLOBAL STYLES ──
const GlobalStyles = () => (
  <>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
    <style>{`
      *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
      body,html{background:#070A12;overflow-x:hidden}
      input,button{outline:none;font-family:'Inter',sans-serif}
      input:focus{border-color:#00E5A0!important;box-shadow:0 0 0 3px rgba(0,229,160,0.12)!important}
      button:active{transform:scale(0.95)!important;opacity:0.85}
      ::-webkit-scrollbar{display:none}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      @keyframes slideInRight{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
      @keyframes ping{0%{transform:scale(1);opacity:0.8}75%,100%{transform:scale(1.8);opacity:0}}
      .fadeUp{animation:fadeUp 0.35s ease both}
      .fadeIn{animation:fadeIn 0.3s ease both}
      .slideRight{animation:slideInRight 0.3s ease both}
    `}</style>
  </>
);

// ── CARD COMPONENT ──
const Card = ({ children, style={}, onClick, em=false, or=false, pu=false, noPad=false }) => {
  const bg = em ? C.glassEm : or ? C.glassOr : pu ? C.glassPu : C.card;
  const border = em ? C.glassEmBorder : or ? C.glassOrBorder : pu ? C.glassPuBorder : C.cardBorder;
  return (
    <div onClick={onClick} style={{
      background:bg, backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
      border:`1px solid ${border}`, borderRadius:20, padding:noPad?0:18,
      marginBottom:12, cursor:onClick?"pointer":"default",
      transition:"transform 0.15s,box-shadow 0.15s",
      ...style
    }}>{children}</div>
  );
};

// ── BUTTON ──
const Btn = ({ children, onClick, disabled=false, secondary=false, style={} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background:disabled?"rgba(255,255,255,0.05)":secondary?"rgba(255,255,255,0.07)":"linear-gradient(135deg,#00E5A0,#00B87A)",
    color:disabled?C.sec:secondary?C.text:C.bg,
    border:`1px solid ${disabled?"rgba(255,255,255,0.06)":secondary?"rgba(255,255,255,0.1)":"transparent"}`,
    borderRadius:16, padding:"15px 20px", fontWeight:700, fontSize:15,
    cursor:disabled?"not-allowed":"pointer", width:"100%",
    fontFamily:"'Space Grotesk',sans-serif",
    boxShadow:(!disabled&&!secondary)?"0 8px 24px rgba(0,229,160,0.25)":"none",
    letterSpacing:0.3, transition:"all 0.2s", ...style
  }}>{children}</button>
);

// ═══════════════════════════════════════
// ── MAIN APP ──
// ═══════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("loading");
  const [tab, setTab] = useState("home");
  const [profile, setProfile] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [history, setHistory] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [checkIn, setCheckIn] = useState({ poids:"", bloat:0, energie:0 });
  const [debloatDone, setDebloatDone] = useState({});
  const [animScore, setAnimScore] = useState(0);

  useEffect(() => {
    (async () => {
      const p = await load("lean-profile");
      const h = await load("lean-history") || [];
      const dd = await load("debloat-" + todayKey()) || {};
      setHistory(h);
      setDebloatDone(dd);
      if (!p) { setScreen("setup"); return; }
      setProfile(p);
      const key = todayKey();
      let td = await load(key);
      if (!td) {
        td = { key, date:todayStr(), plan:null, completions:{sport:false,matin:false,midi:false,soir:false,eau:0} };
        await save(key, td);
      }
      setTodayData(td);
      if (!td.plan) {
        setScreen("generating");
        const diff = new Date() - new Date(p.startDate);
        const dn = Math.max(1, Math.floor(diff/86400000)+1);
        const plan = await generatePlan(dn);
        if (plan) { const upd={...td,plan}; setTodayData(upd); await save(upd.key,upd); }
      }
      setScreen("main");
    })();
  }, []);

  const getDayNum = () => {
    if (!profile?.startDate) return 1;
    return Math.max(1, Math.floor((new Date()-new Date(profile.startDate))/86400000)+1);
  };

  const updateToday = async (patch) => {
    const upd = {...todayData,...patch};
    setTodayData(upd);
    await save(upd.key||todayKey(), upd);
  };

  const toggle = async (k) => {
    await updateToday({completions:{...todayData.completions,[k]:!todayData.completions[k]}});
  };

  const getWaterGoal = () => isCrossfitDay(getDayNum()) ? 3 : 2.5;

  const addWater = async (amt=0.25) => {
    const cur = todayData.completions.eau || 0;
    const next = Math.min(getWaterGoal(), cur + amt);
    await updateToday({completions:{...todayData.completions,eau:Math.round(next*100)/100}});
  };

  const getScore = () => {
    if (!todayData) return 0;
    const c = todayData.completions;
    return [c.matin,c.midi,c.soir,c.sport,(c.eau||0)>=getWaterGoal()].filter(Boolean).length;
  };

  const getDebloatScore = () => {
    return Object.keys(debloatDone).filter(k=>debloatDone[k]).length;
  };

  const getDebloatPoints = () => {
    return DEBLOAT_PRACTICES.filter(p=>debloatDone[p.id]).reduce((s,p)=>s+p.points,0);
  };

  const toggleDebloat = async (id) => {
    const upd = {...debloatDone, [id]:!debloatDone[id]};
    setDebloatDone(upd);
    await save("debloat-"+todayKey(), upd);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const plan = await generatePlan(getDayNum());
    if (plan) await updateToday({plan});
    setGenerating(false);
  };

  const handleSetup = async (poids) => {
    const p = {poids:parseFloat(poids), startDate:new Date().toISOString()};
    await save("lean-profile", p);
    setProfile(p);
    const key = todayKey();
    const td = {key, date:todayStr(), plan:null, completions:{sport:false,matin:false,midi:false,soir:false,eau:0}};
    await save(key, td);
    setTodayData(td);
    setScreen("generating");
    const plan = await generatePlan(1);
    if (plan) {
      const upd = {...td, plan};
      setTodayData(upd);
      await save(key, upd);
    }
    setScreen("main");
  };

  const handleCheckIn = async () => {
    if (!checkIn.poids) return;
    const entry = {date:todayStr(), poids:parseFloat(checkIn.poids), bloat:checkIn.bloat, energie:checkIn.energie, score:getScore(), debloatScore:getDebloatScore()};
    const h = [...history.filter(x=>x.date!==entry.date), entry].sort((a,b)=>a.date.localeCompare(b.date));
    setHistory(h);
    await save("lean-history", h);
    await updateToday({checkIn:entry});
  };

  // ── SCREENS ──
  if (screen==="loading") return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20}}>
      <GlobalStyles/>
      <div style={{position:"relative",width:80,height:80}}>
        <div style={{width:80,height:80,border:"3px solid rgba(255,255,255,0.06)",borderTopColor:C.em,borderRadius:"50%",animation:"spin 0.9s linear infinite"}}/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>⚡</div>
      </div>
      <p style={{color:C.sec,fontSize:13,fontFamily:"'Inter',sans-serif"}}>Chargement...</p>
    </div>
  );

  if (screen==="generating") return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:28,padding:32,textAlign:"center"}}>
      <GlobalStyles/>
      <Ring pct={0.65} size={140} stroke={10}>
        <span style={{fontSize:36,animation:"pulse 1.5s ease-in-out infinite"}}>🤖</span>
      </Ring>
      <div>
        <p style={{fontWeight:800,fontSize:22,fontFamily:"'Space Grotesk',sans-serif",marginBottom:10,color:C.text}}>
          Ton IA coach prépare<br/>
          <span style={{background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>ta journée parfaite</span>
        </p>
        <p style={{color:C.sec,fontSize:13,lineHeight:1.8}}>Plan repas · CrossFit · Debloat · Hydratation</p>
      </div>
    </div>
  );

  if (screen==="setup") return <Setup onDone={handleSetup}/>;

  const dayNum = getDayNum();
  const score = getScore();
  const plan = todayData?.plan;
  const comp = todayData?.completions || {};
  const isCF = isCrossfitDay(dayNum);
  const isRest = isRestDay(dayNum);
  const waterGoal = isCF ? 3 : 2.5;
  const eauPct = Math.min(1, (comp.eau||0)/waterGoal);
  const debloatPts = getDebloatPoints();
  const maxDebloatPts = DEBLOAT_PRACTICES.reduce((s,p)=>s+p.points,0);

  // ── TABS ──
  const tabs = [
    {id:"home",icon:"⚡",label:"Accueil"},
    {id:"debloat",icon:"🧊",label:"Debloat"},
    {id:"sport",icon:"🏋️",label:"Sport"},
    {id:"nutrition",icon:"🥗","label":"Repas"},
    {id:"suivi",icon:"📊",label:"Suivi"},
  ];

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'Inter',sans-serif",paddingBottom:88}}>
      <GlobalStyles/>

      {tab==="home"      && <Home      plan={plan} score={score} comp={comp} dayNum={dayNum} isCF={isCF} isRest={isRest} waterGoal={waterGoal} eauPct={eauPct} debloatPts={debloatPts} maxDebloatPts={maxDebloatPts} debloatDone={debloatDone} setTab={setTab} toggle={toggle} addWater={addWater} handleGenerate={handleGenerate} generating={generating} profile={profile} history={history}/>}
      {tab==="debloat"   && <Debloat   debloatDone={debloatDone} toggleDebloat={toggleDebloat} debloatPts={debloatPts} maxDebloatPts={maxDebloatPts} history={history}/>}
      {tab==="sport"     && <Sport     plan={plan} comp={comp} isCF={isCF} isRest={isRest} waterGoal={waterGoal} eauPct={eauPct} toggle={toggle} addWater={addWater}/>}
      {tab==="nutrition" && <Nutrition plan={plan} comp={comp} toggle={toggle}/>}
      {tab==="suivi"     && <Suivi     history={history} profile={profile} checkIn={checkIn} setCheckIn={setCheckIn} handleCheckIn={handleCheckIn} todayData={todayData} score={score} debloatDone={debloatDone}/>}

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(7,10,18,0.92)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",padding:"6px 8px 18px",zIndex:200}}>
        {tabs.map(({id,icon,label})=>{
          const active = tab===id;
          return (
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 2px",position:"relative",transition:"all 0.2s"}}>
              {active && (
                <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:32,height:2.5,borderRadius:2,background:C.grad,boxShadow:`0 0 8px ${C.em}80`}}/>
              )}
              <span style={{fontSize:20,filter:active?`drop-shadow(0 0 8px ${C.em}90)`:"none",transition:"filter 0.2s"}}>{icon}</span>
              <span style={{fontSize:9,fontWeight:active?700:500,color:active?C.em:C.sec,fontFamily:"'Space Grotesk',sans-serif",letterSpacing:0.3,transition:"color 0.2s"}}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// ── HOME ──
// ═══════════════════════════════════════
function Home({ plan, score, comp, dayNum, isCF, isRest, waterGoal, eauPct, debloatPts, maxDebloatPts, debloatDone, setTab, toggle, addWater, handleGenerate, generating, profile, history }) {
  const lastEntry = history.slice(-1)[0];
  const prevEntry = history.slice(-2)[0];
  const weightDelta = lastEntry && prevEntry ? (lastEntry.poids - prevEntry.poids).toFixed(1) : null;

  return (
    <div className="fadeUp">
      {/* Top header gradient */}
      <div style={{background:"linear-gradient(180deg,rgba(0,229,160,0.06) 0%,transparent 100%)",padding:"40px 20px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <p style={{color:C.sec,fontSize:12,textTransform:"capitalize",marginBottom:4}}>{capitalize(fmtDate())}</p>
            <h1 style={{fontSize:30,fontWeight:800,fontFamily:"'Space Grotesk',sans-serif",lineHeight:1.1}}>
              Jour&nbsp;
              <span style={{background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>#{dayNum}</span>
            </h1>
          </div>
          {lastEntry?.poids && (
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"10px 16px",textAlign:"right"}}>
              <p style={{fontSize:18,fontWeight:800,fontFamily:"'Space Grotesk',sans-serif"}}>{lastEntry.poids}<span style={{fontSize:11,color:C.sec,fontWeight:500}}>kg</span></p>
              {weightDelta && <p style={{fontSize:11,color:parseFloat(weightDelta)<0?C.em:C.re,fontWeight:700}}>{parseFloat(weightDelta)<0?"↓":"↑"} {Math.abs(weightDelta)}kg</p>}
            </div>
          )}
        </div>
        <p style={{color:C.sec,fontSize:13,marginTop:8}}>{isCF?"💪 CrossFit box ce soir":isRest?"😴 Repos & récupération":"🚶 Marche active aujourd'hui"}</p>
      </div>

      <div style={{padding:"0 16px"}}>

        {/* Triple Rings Score Card */}
        <Card style={{padding:24}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-around"}}>
            {/* Main score ring */}
            <Ring pct={score/5} size={100} stroke={9}>
              <span style={{fontSize:26,fontWeight:900,fontFamily:"'Space Grotesk',sans-serif",background:score>0?C.grad:"none",WebkitBackgroundClip:score>0?"text":"unset",WebkitTextFillColor:score>0?"transparent":"#F1F5F9",backgroundClip:"text"}}>{score}</span>
              <span style={{fontSize:9,color:C.sec,marginTop:-2}}>/ 5</span>
            </Ring>

            <div style={{flex:1,paddingLeft:20}}>
              {/* Debloat mini */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <div style={{position:"relative",width:44,height:44}}>
                  <MiniRing pct={debloatPts/maxDebloatPts} size={44} stroke={4} color={C.cy}/>
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🧊</div>
                </div>
                <div>
                  <p style={{fontWeight:700,fontSize:12,color:C.text}}>Debloat</p>
                  <p style={{color:C.cy,fontSize:11,fontWeight:600}}>{debloatPts}/{maxDebloatPts} pts</p>
                </div>
              </div>
              {/* Water mini */}
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{position:"relative",width:44,height:44}}>
                  <MiniRing pct={eauPct} size={44} stroke={4} color="#3B82F6"/>
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>💧</div>
                </div>
                <div>
                  <p style={{fontWeight:700,fontSize:12,color:C.text}}>Hydratation</p>
                  <p style={{color:"#3B82F6",fontSize:11,fontWeight:600}}>{(comp.eau||0).toFixed(2)}L / {waterGoal}L</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{marginTop:18,padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <p style={{fontSize:13,fontWeight:600,color:score===5?C.em:C.text}}>
              {score===0?"C'est parti — commence ta journée 🚀":score<3?"Continue l'élan 💪":score<5?"Presque parfait !":"Journée parfaite 🌟"}
            </p>
            {plan?.motiv?.mantra && <span style={{fontSize:11,fontWeight:700,fontStyle:"italic",color:C.em,opacity:0.8}}>{plan.motiv.mantra}</span>}
          </div>
        </Card>

        {/* Motiv banner */}
        {plan?.motiv?.message && (
          <Card em style={{padding:"14px 18px"}}>
            <p style={{color:C.em,fontSize:13,lineHeight:1.65}}>💬 {plan.motiv.message}</p>
          </Card>
        )}

        {/* Quick action row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <Card style={{padding:16,cursor:"pointer",border:comp.sport?`1px solid ${C.glassEmBorder}`:undefined,background:comp.sport?C.glassEm:C.card}} onClick={()=>setTab("sport")}>
            <span style={{fontSize:26}}>{comp.sport?"✅":"🏋️"}</span>
            <p style={{fontWeight:700,fontSize:13,marginTop:8,marginBottom:2}}>Sport</p>
            <p style={{color:comp.sport?C.em:C.sec,fontSize:11,fontWeight:600}}>{comp.sport?"Complété !":isCF?"Box ce soir 🔥":"Marche à faire"}</p>
          </Card>

          <Card style={{padding:16,cursor:"pointer"}} onClick={()=>setTab("debloat")}>
            <span style={{fontSize:26}}>🧊</span>
            <p style={{fontWeight:700,fontSize:13,marginTop:8,marginBottom:2}}>Debloat</p>
            <div style={{display:"flex",gap:3,marginTop:4,flexWrap:"wrap"}}>
              {DEBLOAT_PRACTICES.slice(0,6).map(p=>(
                <div key={p.id} style={{width:8,height:8,borderRadius:"50%",background:debloatDone[p.id]?C.cy:"rgba(255,255,255,0.08)"}}/>
              ))}
            </div>
            <p style={{color:C.cy,fontSize:11,fontWeight:600,marginTop:4}}>{Object.values(debloatDone).filter(Boolean).length} / {DEBLOAT_PRACTICES.length} pratiques</p>
          </Card>
        </div>

        {/* Water quick add */}
        <Card style={{padding:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>💧</span>
              <span style={{fontWeight:700,fontSize:14}}>Eau</span>
            </div>
            <span style={{fontWeight:800,fontSize:15,color:eauPct>=1?C.cy:C.text}}>{(comp.eau||0).toFixed(2)} <span style={{color:C.sec,fontWeight:500,fontSize:12}}>/ {waterGoal}L</span></span>
          </div>
          <div style={{height:5,background:"rgba(255,255,255,0.06)",borderRadius:10,overflow:"hidden",marginBottom:12}}>
            <div style={{height:"100%",width:`${eauPct*100}%`,background:"linear-gradient(90deg,#3B82F6,#06B6D4)",borderRadius:10,transition:"width 0.6s ease",boxShadow:"0 0 8px rgba(59,130,246,0.4)"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[["+ 250ml",0.25],["+ 500ml",0.5],["+ 1L",1]].map(([label,amt])=>(
              <button key={label} onClick={()=>addWater(amt)} style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)",color:"#3B82F6",borderRadius:12,padding:"10px 4px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{label}</button>
            ))}
          </div>
        </Card>

        {/* Meals preview */}
        {plan ? (
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,paddingHorizontal:2}}>
              <p style={{fontWeight:700,fontSize:15,fontFamily:"'Space Grotesk',sans-serif"}}>Repas du jour</p>
              <button onClick={handleGenerate} disabled={generating} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:C.sec,borderRadius:10,padding:"5px 12px",fontSize:11,cursor:"pointer",fontWeight:600}}>
                {generating?"⏳ ...":"🔄 Regénérer"}
              </button>
            </div>
            {[["matin","🌅","Petit-déj"],["midi","☀️","Déjeuner"],["soir","🌙","Dîner"]].map(([k,emoji,label])=>(
              <Card key={k} noPad style={{cursor:"pointer",border:comp[k]?`1px solid ${C.glassEmBorder}`:undefined,background:comp[k]?C.glassEm:C.card}} onClick={()=>setTab("nutrition")}>
                <div style={{height:2.5,background:comp[k]?"linear-gradient(90deg,#00E5A0,#06B6D4)":"transparent",borderRadius:"20px 20px 0 0"}}/>
                <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:42,height:42,borderRadius:13,background:comp[k]?"linear-gradient(135deg,#00E5A0,#06B6D4)":"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                    {comp[k]?"✓":emoji}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <p style={{fontWeight:700,fontSize:13}}>{label}</p>
                      {pill(C.pu,`${plan.repas[k]?.calories} kcal`)}
                    </div>
                    <p style={{color:C.sec,fontSize:12,marginTop:2}}>{plan.repas[k]?.titre}</p>
                  </div>
                </div>
              </Card>
            ))}

            {/* Anti-bloat strip */}
            <Card or style={{padding:16}}>
              <p style={{color:C.or,fontWeight:700,marginBottom:10,fontSize:13}}>⚡ Anti-gonflement du jour</p>
              {plan.antiGonflement?.map((t,i)=>(
                <p key={i} style={{color:C.sec,fontSize:12,marginBottom:i<2?6:0,lineHeight:1.6}}>• {t}</p>
              ))}
              {plan.hydratation?.tipDuJour && (
                <p style={{color:C.cy,fontSize:12,marginTop:10,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:10}}>💧 {plan.hydratation.tipDuJour}</p>
              )}
            </Card>
          </>
        ) : (
          <Card style={{textAlign:"center",padding:36}}>
            <div style={{width:32,height:32,border:`3px solid rgba(255,255,255,0.08)`,borderTopColor:C.em,borderRadius:"50%",animation:"spin 0.9s linear infinite",margin:"0 auto 12px"}}/>
            <p style={{color:C.sec,fontSize:13,marginBottom:16}}>Génération du plan IA...</p>
            <button onClick={handleGenerate} disabled={generating} style={{background:"rgba(0,229,160,0.1)",border:"1px solid rgba(0,229,160,0.25)",color:C.em,borderRadius:12,padding:"10px 20px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
              {generating?"⏳ En cours...":"🔄 Réessayer"}
            </button>
          </Card>
        )}

      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// ── DEBLOAT ──
// ═══════════════════════════════════════
function Debloat({ debloatDone, toggleDebloat, debloatPts, maxDebloatPts, history }) {
  const [filter, setFilter] = useState("all");
  const categories = ["all","skin","massage","nutrition","sleep","hydration"];
  const catLabel = {all:"Tout",skin:"🧴 Peau",massage:"👐 Massage",nutrition:"🥗 Nutrition",sleep:"😴 Sommeil",hydration:"💧 Hydratation"};

  const practices = filter==="all" ? DEBLOAT_PRACTICES : DEBLOAT_PRACTICES.filter(p=>p.category===filter);
  const pct = maxDebloatPts > 0 ? debloatPts/maxDebloatPts : 0;

  const bloatHistory = history.filter(h=>h.bloat>0).slice(-7);

  const getBloatColor = (score) => {
    if (score>=4) return C.em;
    if (score>=3) return C.cy;
    if (score>=2) return C.or;
    return C.re;
  };

  const getBloatLabel = (score) => {
    if (score===5) return "Visage défini 😎";
    if (score===4) return "Quasi défini 🙂";
    if (score===3) return "Neutre 😐";
    if (score===2) return "Un peu gonflé 😟";
    return "Très gonflé 😣";
  };

  const lastBloat = bloatHistory[bloatHistory.length-1];
  const prevBloat = bloatHistory[bloatHistory.length-2];
  const bloatDelta = lastBloat && prevBloat ? lastBloat.bloat - prevBloat.bloat : null;

  return (
    <div className="fadeUp">
      <div style={{background:"linear-gradient(180deg,rgba(6,182,212,0.07) 0%,transparent 100%)",padding:"40px 20px 20px"}}>
        <p style={{color:C.sec,fontSize:12,marginBottom:4}}>Routine quotidienne</p>
        <h1 style={{fontSize:28,fontWeight:800,fontFamily:"'Space Grotesk',sans-serif",marginBottom:6}}>
          <span style={{background:"linear-gradient(135deg,#06B6D4,#8B5CF6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>Debloat</span> Protocol
        </h1>
        <p style={{color:C.sec,fontSize:13}}>Rituel visage anti-rétention d'eau</p>
      </div>

      <div style={{padding:"0 16px"}}>

        {/* Main score */}
        <Card style={{display:"flex",alignItems:"center",gap:20,padding:22}}>
          <Ring pct={pct} size={96} stroke={8} color="linear-gradient(135deg,#06B6D4,#8B5CF6)">
            <span style={{fontSize:22,fontWeight:900,fontFamily:"'Space Grotesk',sans-serif",background:"linear-gradient(135deg,#06B6D4,#8B5CF6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>{debloatPts}</span>
            <span style={{fontSize:9,color:C.sec}}>pts</span>
          </Ring>
          <div style={{flex:1}}>
            <p style={{fontWeight:800,fontSize:16,fontFamily:"'Space Grotesk',sans-serif",marginBottom:4,color:C.text}}>
              {pct===0?"Commence ta routine":pct<0.4?"Bon début 💧":pct<0.7?"En route 🧊":pct<1?"Presque complet 🔥":"Routine complète 🌟"}
            </p>
            <p style={{color:C.sec,fontSize:12,marginBottom:10}}>{Object.values(debloatDone).filter(Boolean).length} / {DEBLOAT_PRACTICES.length} pratiques · {debloatPts}/{maxDebloatPts} pts</p>
            {lastBloat && (
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:getBloatColor(lastBloat.bloat)}}/>
                <p style={{fontSize:11,color:getBloatColor(lastBloat.bloat),fontWeight:700}}>{getBloatLabel(lastBloat.bloat)}</p>
                {bloatDelta!==null && <span style={{fontSize:10,color:bloatDelta>0?C.em:bloatDelta<0?C.re:C.sec}}>{bloatDelta>0?"↑ +":bloatDelta<0?"↓ ":""}{bloatDelta!==0?Math.abs(bloatDelta):""}</span>}
              </div>
            )}
          </div>
        </Card>

        {/* Bloat trend chart */}
        {bloatHistory.length >= 2 && (
          <Card style={{padding:18}}>
            <p style={{fontWeight:700,fontSize:14,fontFamily:"'Space Grotesk',sans-serif",marginBottom:4}}>📈 Évolution visage (7j)</p>
            <p style={{color:C.sec,fontSize:11,marginBottom:14}}>1 = gonflé · 5 = défini</p>
            <ResponsiveContainer width="100%" height={90}>
              <AreaChart data={bloatHistory} margin={{top:4,right:4,left:-20,bottom:0}}>
                <defs>
                  <linearGradient id="bloatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{fill:C.sec,fontSize:8}} tickFormatter={d=>d.slice(5)} axisLine={false} tickLine={false}/>
                <YAxis domain={[1,5]} tick={{fill:C.sec,fontSize:9}} axisLine={false} tickLine={false} ticks={[1,2,3,4,5]}/>
                <Tooltip contentStyle={{background:"rgba(7,10,18,0.95)",border:`1px solid ${C.cardBorder}`,color:C.text,borderRadius:10,fontSize:11}} labelStyle={{color:C.sec}}/>
                <Area type="monotone" dataKey="bloat" stroke={C.cy} strokeWidth={2} fill="url(#bloatGrad)" dot={{fill:C.cy,r:3,strokeWidth:0}}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Info banner */}
        <Card pu style={{padding:14}}>
          <p style={{color:C.pu,fontWeight:700,fontSize:12,marginBottom:6}}>🔬 Pourquoi ce protocole ?</p>
          <p style={{color:C.sec,fontSize:12,lineHeight:1.7}}>La rétention d'eau au visage est causée par le sel, le sucre, le manque de sommeil et une mauvaise circulation lymphatique. Ces pratiques combinées réduisent l'inflammation visible en 24-72h.</p>
        </Card>

        {/* Category filter */}
        <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14,paddingBottom:2}}>
          {categories.map(cat=>(
            <button key={cat} onClick={()=>setFilter(cat)} style={{
              background:filter===cat?"linear-gradient(135deg,#06B6D4,#8B5CF6)":"rgba(255,255,255,0.05)",
              color:filter===cat?C.bg:C.sec, border:`1px solid ${filter===cat?"transparent":"rgba(255,255,255,0.07)"}`,
              borderRadius:20, padding:"6px 14px", fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap"
            }}>{catLabel[cat]}</button>
          ))}
        </div>

        {/* Practices list */}
        {practices.map((p,i)=>{
          const done = !!debloatDone[p.id];
          const catColor = CATEGORY_COLORS[p.category];
          return (
            <div key={p.id} onClick={()=>toggleDebloat(p.id)} style={{
              background:done?`${catColor}10`:"rgba(255,255,255,0.03)",
              border:`1px solid ${done?catColor+"30":"rgba(255,255,255,0.06)"}`,
              borderRadius:18, padding:"14px 16px", marginBottom:8, cursor:"pointer",
              transition:"all 0.2s", display:"flex", alignItems:"center", gap:14,
              animation:`fadeUp 0.25s ease ${i*0.04}s both`
            }}>
              {/* Checkbox */}
              <div style={{width:28,height:28,borderRadius:9,background:done?catColor:"rgba(255,255,255,0.05)",border:`1.5px solid ${done?catColor:"rgba(255,255,255,0.12)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s",boxShadow:done?`0 4px 12px ${catColor}40`:"none"}}>
                {done && <span style={{fontSize:14,color:p.category==="skin"||p.category==="hydration"?"#fff":C.bg}}>✓</span>}
              </div>

              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                  <span style={{fontSize:16}}>{p.icon}</span>
                  <p style={{fontWeight:700,fontSize:13,color:done?catColor:C.text}}>{p.title}</p>
                  <span style={{marginLeft:"auto",background:`${catColor}15`,color:catColor,borderRadius:10,padding:"2px 8px",fontSize:10,fontWeight:700}}>+{p.points}pts</span>
                </div>
                <p style={{color:C.sec,fontSize:12,lineHeight:1.5}}>{p.desc}</p>
                <span style={{display:"inline-block",marginTop:5,background:`${catColor}12`,color:catColor,borderRadius:8,padding:"1px 8px",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>{CATEGORY_LABELS[p.category]}</span>
              </div>
            </div>
          );
        })}

        {/* Daily routine order */}
        <Card style={{padding:18,marginTop:4}}>
          <p style={{fontWeight:700,fontSize:14,fontFamily:"'Space Grotesk',sans-serif",marginBottom:14}}>⏰ Ordre idéal de la routine</p>
          {[
            {time:"Réveil",acts:["💧 500ml eau à jeun","🍵 Tisane drainante"]},
            {time:"Matin",acts:["🧊 Eau froide visage 30s","🥄 Cuillères froides sous yeux","👐 Massage lymphatique 3 min"]},
            {time:"Journée",acts:["🧂 Zéro sel","🚫 Zéro sucre raffiné","💧 Continuer hydratation"]},
            {time:"Soir",acts:["🪨 Gua Sha 5 min","🧘 Face yoga 5 min","🛏️ Tête surélevée cette nuit"]},
          ].map(({time,acts},i)=>(
            <div key={time} style={{display:"flex",gap:12,paddingBottom:i<3?14:0,borderBottom:i<3?"1px solid rgba(255,255,255,0.04)":undefined,marginBottom:i<3?14:0}}>
              <div style={{width:52,flexShrink:0}}>
                <p style={{fontSize:10,fontWeight:700,color:C.cy,textTransform:"uppercase",letterSpacing:0.5}}>{time}</p>
              </div>
              <div>{acts.map((a,j)=><p key={j} style={{color:C.sec,fontSize:12,lineHeight:1.7}}>{a}</p>)}</div>
            </div>
          ))}
        </Card>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// ── SPORT ──
// ═══════════════════════════════════════
function Sport({ plan, comp, isCF, isRest, waterGoal, eauPct, toggle, addWater }) {
  return (
    <div className="fadeUp">
      <div style={{background:"linear-gradient(180deg,rgba(0,229,160,0.06) 0%,transparent 100%)",padding:"40px 20px 20px"}}>
        <p style={{color:C.sec,fontSize:12,marginBottom:4}}>Session du jour</p>
        <h1 style={{fontSize:26,fontWeight:800,fontFamily:"'Space Grotesk',sans-serif"}}>
          {isCF?"🏋️ CrossFit":isRest?"😴 Récupération":"🚶 Marche Active"}
        </h1>
      </div>

      <div style={{padding:"0 16px"}}>
        {!plan ? (
          <Card style={{textAlign:"center",padding:48}}>
            <div style={{width:32,height:32,border:`3px solid rgba(255,255,255,0.08)`,borderTopColor:C.em,borderRadius:"50%",animation:"spin 0.9s linear infinite",margin:"0 auto 12px"}}/>
            <p style={{color:C.sec}}>Plan en génération...</p>
          </Card>
        ) : (
          <>
            <Card em style={{padding:22}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div style={{flex:1}}>
                  <p style={{color:C.em,fontWeight:800,fontSize:17,fontFamily:"'Space Grotesk',sans-serif",marginBottom:4}}>{plan.sport.type}</p>
                  <p style={{color:C.sec,fontSize:13,lineHeight:1.5}}>{plan.sport.description}</p>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",flexShrink:0,marginLeft:12}}>
                  {plan.sport.dureeTotal>0 && pill(C.em,`⏱ ${plan.sport.dureeTotal}min`)}
                  {plan.sport.wodFormat && pill(C.pu,`🎯 ${plan.sport.wodFormat}`)}
                </div>
              </div>
              <div style={{background:"rgba(0,229,160,0.08)",borderRadius:12,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,color:C.em,fontWeight:600}}>👟 Objectif pas</span>
                <span style={{fontWeight:800,fontFamily:"'Space Grotesk',sans-serif"}}>{plan.sport.objectifPas?.toLocaleString()}</span>
              </div>
            </Card>

            {isCF && plan.sport.conseilBox && (
              <Card or style={{padding:16}}>
                <p style={{color:C.or,fontWeight:700,fontSize:12,marginBottom:4}}>💬 Coach tip</p>
                <p style={{color:C.sec,fontSize:13,lineHeight:1.5}}>{plan.sport.conseilBox}</p>
              </Card>
            )}

            {plan.sport.exercices?.length>0 && (
              <Card style={{padding:18}}>
                <p style={{fontWeight:700,marginBottom:16,fontFamily:"'Space Grotesk',sans-serif"}}>Structure de séance</p>
                {plan.sport.exercices.map((ex,i)=>(
                  <div key={i} style={{display:"flex",gap:14,padding:"14px 0",borderBottom:i<plan.sport.exercices.length-1?`1px solid rgba(255,255,255,0.04)`:"none",alignItems:"flex-start"}}>
                    <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#00E5A0,#06B6D4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,fontWeight:800,color:C.bg}}>{i+1}</div>
                    <div style={{flex:1}}>
                      <p style={{fontWeight:700,fontSize:14,marginBottom:2}}>{ex.nom}</p>
                      <p style={{color:C.sec,fontSize:12,lineHeight:1.4}}>{ex.details}</p>
                    </div>
                    {ex.repos && pill(C.or,ex.repos)}
                  </div>
                ))}
                {isCF && <p style={{color:C.pu,fontSize:12,marginTop:12,padding:"10px 14px",background:"rgba(139,92,246,0.08)",borderRadius:10}}>ℹ️ Le WOD réel est donné par le coach à la box.</p>}
              </Card>
            )}

            {/* Water */}
            <Card style={{padding:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <p style={{fontWeight:700}}>💧 Hydratation</p>
                <p style={{fontWeight:800,color:eauPct>=1?C.cy:C.text}}>{(comp.eau||0).toFixed(2)} / {waterGoal}L</p>
              </div>
              <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:10,overflow:"hidden",marginBottom:14}}>
                <div style={{height:"100%",width:`${eauPct*100}%`,background:"linear-gradient(90deg,#3B82F6,#06B6D4)",borderRadius:10,transition:"width 0.6s ease"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[["+ 250ml",0.25],["+ 500ml",0.5],["+ 1L",1]].map(([label,amt])=>(
                  <button key={label} onClick={()=>addWater(amt)} style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)",color:"#3B82F6",borderRadius:12,padding:"10px 4px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{label}</button>
                ))}
              </div>
            </Card>

            {/* Mark done */}
            <div onClick={()=>toggle("sport")} style={{background:comp.sport?C.glassEm:C.card,border:`1px solid ${comp.sport?C.glassEmBorder:C.cardBorder}`,borderRadius:20,padding:"18px 20px",display:"flex",alignItems:"center",gap:16,cursor:"pointer",transition:"all 0.2s"}}>
              <div style={{width:48,height:48,borderRadius:14,background:comp.sport?"linear-gradient(135deg,#00E5A0,#00B87A)":"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,boxShadow:comp.sport?"0 4px 16px rgba(0,229,160,0.3)":"none",transition:"all 0.3s"}}>
                {comp.sport?"✓":"🏁"}
              </div>
              <div>
                <p style={{fontWeight:700,fontSize:15}}>{isCF?"WOD terminé ✊":"Session terminée"}</p>
                <p style={{color:C.sec,fontSize:12,marginTop:2}}>{comp.sport?"Bien joué, champion !":"Tape ici après ta séance"}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// ── NUTRITION ──
// ═══════════════════════════════════════
function Nutrition({ plan, comp, toggle }) {
  const total = plan ? (plan.repas.matin?.calories||0)+(plan.repas.midi?.calories||0)+(plan.repas.soir?.calories||0) : 0;

  return (
    <div className="fadeUp">
      <div style={{background:"linear-gradient(180deg,rgba(16,185,129,0.06) 0%,transparent 100%)",padding:"40px 20px 20px"}}>
        <p style={{color:C.sec,fontSize:12,marginBottom:4}}>Plan personnalisé</p>
        <h1 style={{fontSize:26,fontWeight:800,fontFamily:"'Space Grotesk',sans-serif"}}>🥗 Nutrition du jour</h1>
      </div>

      <div style={{padding:"0 16px"}}>
        {!plan ? (
          <Card style={{textAlign:"center",padding:48}}><p style={{color:C.sec}}>Plan en génération...</p></Card>
        ) : (
          <>
            {/* Calorie overview */}
            <Card style={{padding:20,background:"linear-gradient(135deg,rgba(0,229,160,0.06),rgba(6,182,212,0.06))",border:"1px solid rgba(0,229,160,0.15)"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",textAlign:"center",gap:8}}>
                {[["🌅",plan.repas.matin?.calories,"Matin"],["☀️",plan.repas.midi?.calories,"Midi"],["🌙",plan.repas.soir?.calories,"Soir"],["🔥",total,"Total"]].map(([e,cal,label],i)=>(
                  <div key={i}>
                    <p style={{fontSize:20}}>{e}</p>
                    <p style={{fontSize:20,fontWeight:900,fontFamily:"'Space Grotesk',sans-serif",marginTop:4,color:i===3?C.or:C.text}}>{cal}</p>
                    <p style={{fontSize:10,color:C.sec}}>kcal</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Meal cards */}
            {[["matin","🌅","Petit-déjeuner"],["midi","☀️","Déjeuner"],["soir","🌙","Dîner"]].map(([k,emoji,label])=>(
              <Card key={k} noPad style={{cursor:"pointer",border:comp[k]?`1px solid ${C.glassEmBorder}`:undefined,background:comp[k]?C.glassEm:C.card}} onClick={()=>toggle(k)}>
                <div style={{height:3,background:comp[k]?"linear-gradient(90deg,#00E5A0,#06B6D4)":"transparent",borderRadius:"20px 20px 0 0"}}/>
                <div style={{padding:"16px 18px"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                    <div style={{width:46,height:46,borderRadius:14,background:comp[k]?"linear-gradient(135deg,#00E5A0,#06B6D4)":"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,transition:"all 0.3s"}}>
                      {comp[k]?"✓":emoji}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <p style={{fontWeight:800,fontSize:14,fontFamily:"'Space Grotesk',sans-serif"}}>{label}</p>
                        {pill(C.pu,`${plan.repas[k]?.calories} kcal`)}
                      </div>
                      <p style={{fontWeight:600,fontSize:13,color:comp[k]?C.em:C.text,marginBottom:4}}>{plan.repas[k]?.titre}</p>
                      <p style={{color:C.sec,fontSize:12,lineHeight:1.5}}>{plan.repas[k]?.description}</p>
                      {plan.repas[k]?.conseil && <p style={{color:C.or,fontSize:11,marginTop:8,lineHeight:1.5}}>💡 {plan.repas[k].conseil}</p>}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <Card or style={{padding:18}}>
              <p style={{color:C.or,fontWeight:700,marginBottom:12,fontSize:13}}>⚡ Règles non-négociables</p>
              {["Zéro grignotage entre les repas","Dernier repas avant 20h","Zéro sel ajouté, zéro transformé","Faim = bois 300ml d'eau d'abord","Manger lentement, poser les couverts entre chaque bouchée"].map((r,i,arr)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:i<arr.length-1?8:0}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:C.or,flexShrink:0,marginTop:5}}/>
                  <p style={{color:C.sec,fontSize:12,lineHeight:1.5}}>{r}</p>
                </div>
              ))}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// ── SUIVI ──
// ═══════════════════════════════════════
function Suivi({ history, profile, checkIn, setCheckIn, handleCheckIn, todayData, score, debloatDone }) {
  const weightData = history.filter(h=>h.poids).slice(-14);
  const debloatHistory = history.filter(h=>h.bloat>0).slice(-14);

  const startWeight = profile?.poids;
  const lastEntry = history.slice(-1)[0];
  const totalLost = startWeight && lastEntry?.poids ? (startWeight - lastEntry.poids).toFixed(1) : null;
  const streak = (() => {
    let s = 0;
    const sorted = [...history].sort((a,b)=>b.date.localeCompare(a.date));
    for (const h of sorted) { if (h.score>=3) s++; else break; }
    return s;
  })();

  return (
    <div className="fadeUp">
      <div style={{background:"linear-gradient(180deg,rgba(139,92,246,0.07) 0%,transparent 100%)",padding:"40px 20px 20px"}}>
        <p style={{color:C.sec,fontSize:12,marginBottom:4}}>Ta progression</p>
        <h1 style={{fontSize:26,fontWeight:800,fontFamily:"'Space Grotesk',sans-serif"}}>📊 Suivi & Progrès</h1>
      </div>

      <div style={{padding:"0 16px"}}>

        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
          {[
            [streak,"🔥","Jours de suite",C.or],
            [score+"/5","⚡","Score today",C.em],
            [totalLost?`-${totalLost}kg`:"—","📉","Perdu depuis",C.cy],
          ].map(([val,icon,label,color])=>(
            <Card key={label} style={{padding:14,textAlign:"center"}}>
              <p style={{fontSize:18}}>{icon}</p>
              <p style={{fontSize:18,fontWeight:900,fontFamily:"'Space Grotesk',sans-serif",color,marginTop:4}}>{val}</p>
              <p style={{fontSize:9,color:C.sec,marginTop:2,lineHeight:1.4}}>{label}</p>
            </Card>
          ))}
        </div>

        {/* Check-in */}
        <Card style={{padding:20}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <p style={{fontWeight:700,fontFamily:"'Space Grotesk',sans-serif",fontSize:16}}>Check-in du jour</p>
            {todayData?.checkIn && pill(C.em,"✓ Enregistré")}
          </div>

          <p style={{color:C.sec,fontSize:11,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5,fontWeight:600}}>Poids (kg)</p>
          <input style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:"14px",color:C.text,fontSize:24,textAlign:"center",fontWeight:900,fontFamily:"'Space Grotesk',sans-serif",marginBottom:20,boxSizing:"border-box"}}
            type="number" step="0.1" placeholder={profile?.poids?.toString()||"82.5"}
            value={checkIn.poids} onChange={e=>setCheckIn({...checkIn,poids:e.target.value})}/>

          <p style={{color:C.sec,fontSize:11,marginBottom:10,textTransform:"uppercase",letterSpacing:0.5,fontWeight:600}}>Gonflement du visage</p>
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            {[["😣",1],["😟",2],["😐",3],["🙂",4],["😎",5]].map(([emoji,n])=>(
              <button key={n} onClick={()=>setCheckIn({...checkIn,bloat:n})} style={{
                flex:1,padding:"12px 4px",borderRadius:14,
                border:`1.5px solid ${checkIn.bloat===n?C.cy:"rgba(255,255,255,0.07)"}`,
                background:checkIn.bloat===n?"rgba(6,182,212,0.12)":"rgba(255,255,255,0.03)",
                color:C.text,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4
              }}>
                <span style={{fontSize:22}}>{emoji}</span>
                <span style={{fontSize:10,fontWeight:700,color:checkIn.bloat===n?C.cy:C.sec}}>{n}</span>
              </button>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
            <span style={{fontSize:10,color:C.muted}}>Très gonflé</span>
            <span style={{fontSize:10,color:C.muted}}>Visage défini</span>
          </div>

          <p style={{color:C.sec,fontSize:11,marginBottom:10,textTransform:"uppercase",letterSpacing:0.5,fontWeight:600}}>Énergie</p>
          <div style={{display:"flex",gap:6,marginBottom:20}}>
            {[["💀","Nulle"],["😴","Basse"],["😐","Ok"],["⚡","Bien"],["🔥","Top"]].map(([emoji,label],i)=>(
              <button key={i} onClick={()=>setCheckIn({...checkIn,energie:i+1})} style={{
                flex:1,padding:"10px 2px",borderRadius:14,
                border:`1.5px solid ${checkIn.energie===i+1?C.or:"rgba(255,255,255,0.07)"}`,
                background:checkIn.energie===i+1?"rgba(249,115,22,0.12)":"rgba(255,255,255,0.03)",
                color:C.text,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2
              }}>
                <span style={{fontSize:20}}>{emoji}</span>
                <span style={{fontSize:9,fontWeight:600,color:checkIn.energie===i+1?C.or:C.sec}}>{label}</span>
              </button>
            ))}
          </div>

          <Btn onClick={handleCheckIn} disabled={!checkIn.poids}>Enregistrer le check-in</Btn>
        </Card>

        {/* Weight chart */}
        {weightData.length>=2 && (
          <Card style={{padding:18}}>
            <p style={{fontWeight:700,marginBottom:4,fontFamily:"'Space Grotesk',sans-serif"}}>📉 Évolution du poids</p>
            <p style={{color:C.sec,fontSize:11,marginBottom:16}}>{weightData.length} entrées</p>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={weightData} margin={{top:4,right:4,left:-20,bottom:0}}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5A0" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00E5A0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{fill:C.sec,fontSize:8}} tickFormatter={d=>d.slice(5)} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.sec,fontSize:9}} domain={["auto","auto"]} width={32} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:"rgba(7,10,18,0.95)",border:`1px solid ${C.cardBorder}`,color:C.text,borderRadius:10,fontSize:11}} labelStyle={{color:C.sec}}/>
                <Area type="monotone" dataKey="poids" stroke={C.em} strokeWidth={2.5} fill="url(#weightGrad)" dot={{fill:C.em,r:4,strokeWidth:0}} activeDot={{r:6,fill:C.cy}}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* History */}
        {history.length>0 ? (
          <Card style={{padding:18}}>
            <p style={{fontWeight:700,marginBottom:16,fontFamily:"'Space Grotesk',sans-serif"}}>Historique récent</p>
            {history.slice(-7).reverse().map((h,i,arr)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<arr.length-1?`1px solid rgba(255,255,255,0.04)`:"none"}}>
                <div>
                  <p style={{fontWeight:600,fontSize:13}}>{h.date}</p>
                  <div style={{display:"flex",gap:6,marginTop:3}}>
                    {pill("#64748B",`Score ${h.score}/5`)}
                    {h.energie>0 && pill(C.or,"⚡".repeat(h.energie))}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {h.poids && pill(C.pu,`${h.poids}kg`)}
                  {h.bloat>0 && (
                    <span style={{fontSize:18}}>
                      {["😣","😟","😐","🙂","😎"][h.bloat-1]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </Card>
        ) : (
          <Card style={{textAlign:"center",padding:48}}>
            <p style={{fontSize:40,marginBottom:12}}>🌱</p>
            <p style={{color:C.sec,fontSize:13}}>Ton historique apparaîtra ici</p>
            <p style={{color:C.muted,fontSize:11,marginTop:6}}>Commence par un check-in</p>
          </Card>
        )}

      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// ── SETUP ──
// ═══════════════════════════════════════
function Setup({ onDone }) {
  const [poids, setPoids] = useState("");

  return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:24}}>
      <GlobalStyles/>
      <div style={{position:"fixed",top:-80,left:"50%",transform:"translateX(-50%)",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,229,160,0.07) 0%,transparent 65%)",pointerEvents:"none"}}/>

      <div style={{textAlign:"center",marginBottom:40}} className="fadeUp">
        <div style={{width:80,height:80,borderRadius:24,background:"linear-gradient(135deg,#00E5A0,#06B6D4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 24px",boxShadow:"0 20px 60px rgba(0,229,160,0.25)"}}>⚡</div>
        <h1 style={{fontSize:30,fontWeight:800,fontFamily:"'Space Grotesk',sans-serif",lineHeight:1.2,marginBottom:12,color:C.text}}>
          Ta transformation<br/>
          <span style={{background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>commence maintenant</span>
        </h1>
        <p style={{color:C.sec,lineHeight:1.8,fontSize:13}}>CrossFit 3×/sem · Marche active · Nutrition anti-bloat<br/>Debloat protocol · Plan IA personnalisé chaque jour</p>
      </div>

      <Card style={{marginBottom:14}} className="fadeUp">
        <p style={{fontWeight:700,marginBottom:4,fontFamily:"'Space Grotesk',sans-serif",fontSize:15}}>Ton poids actuel (kg)</p>
        <p style={{color:C.sec,fontSize:12,marginBottom:16}}>Pour calibrer tes calories et suivre ta progression</p>
        <input type="number" step="0.5" placeholder="ex: 85.0" value={poids} onChange={e=>setPoids(e.target.value)}
          style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:"18px",color:C.text,fontSize:28,textAlign:"center",marginBottom:20,fontWeight:900,fontFamily:"'Space Grotesk',sans-serif",boxSizing:"border-box"}}/>

        <Btn onClick={()=>poids&&onDone(poids)} disabled={!poids}>Démarrer ma transformation →</Btn>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}} className="fadeUp">
        {[["🏋️","CrossFit","3×/sem"],["🚶","Marche","Active"],["🥗","Anti","Bloat"],["🧊","Debloat","Visage"]].map(([icon,l1,l2])=>(
          <Card key={l1} style={{padding:14,textAlign:"center"}}>
            <span style={{fontSize:24}}>{icon}</span>
            <p style={{fontSize:11,fontWeight:700,marginTop:8,color:C.text}}>{l1}</p>
            <p style={{fontSize:9,color:C.sec}}>{l2}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
