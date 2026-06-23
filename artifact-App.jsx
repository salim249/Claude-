import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ── Storage (Claude Artifacts) ──
const load = async (key) => { try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; } };
const save = async (key, v) => { try { await window.storage.set(key, JSON.stringify(v)); } catch(e) { console.error(e); } };
const todayKey = () => { const d = new Date(); return `day-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const fmtDate = () => new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" });
const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

// ── Plan Generator ──
const CF_DAYS = [1,3,5];
const isCrossfitDay = n => CF_DAYS.includes(((n-1)%7)+1);
const isRestDay = n => ((n-1)%7)+1 === 7;
const WOD_FORMATS = ["AMRAP","For Time","EMOM","Chipper","Ladder"];
const PROTEINS = ["poulet grillé","thon en boîte","saumon","dinde","bœuf haché 5%","crevettes","poisson blanc","œufs entiers","veau","sardines"];
const CARBS = ["riz complet","patate douce","quinoa","flocons d'avoine","pain complet","lentilles","pois chiches","riz basmati","boulgour","haricots rouges"];
const VEGS = ["brocoli + courgette","épinards + tomates","haricots verts + carottes","salade verte + concombre","poivrons + champignons","fenouil + céleri","asperges + courgette","chou-fleur + carottes","roquette + tomates cerises","endives + betterave"];
const MANTRAS = ["Discipline = Liberté","Un rep à la fois","Deviens la version","Pas d'excuses","Fais le boulot","Serre les dents","Chaque jour compte","En avant toujours"];
const MOTIVS = [
  "Aujourd'hui tu poses les fondations de la version que tu veux devenir. Chaque repas propre, chaque verre d'eau compte.",
  "La discipline n'est pas une punition, c'est ta superpower. Les autres dorment, toi tu construis.",
  "Ton corps change quand tu lui donnes ce dont il a besoin. Structure + régularité = résultats.",
  "Pas de perfect, juste du progrès. Un repas propre de plus, un verre d'eau de plus.",
  "Le visage que tu veux, la silhouette que tu veux — c'est une question de jours si tu restes cohérent.",
  "Tu n'as pas besoin de motivation, tu as besoin d'un système. C'est ce plan. Suis-le.",
  "Les petites victoires d'aujourd'hui sont les transformations de demain.",
];
const ANTI_BLOAT = [
  ["Mange lentement, pose les couverts entre chaque bouchée","Bois 500ml d'eau dès le réveil à jeun","Zéro sel ajouté dans tous tes repas"],
  ["Évite de parler en mangeant pour moins avaler d'air","Commence chaque repas par les légumes","Coupe le café et remplace par tisane fenouil matin"],
  ["Mâche chaque bouchée au moins 15 fois","Bois entre les repas, pas pendant","Évite les sodas light — ils gonflent autant"],
  ["Pas de pain blanc ni de pâtes aujourd'hui","Mange à heures fixes, ton corps adore la régularité","Ajoute du gingembre frais dans ton eau"],
  ["Finis de manger avant 20h, ton foie te remerciera","Marche 10 min après chaque repas","Évite les légumineuses ce soir si tu as tendance à gonfler"],
  ["Une cuillère de vinaigre de cidre dans un verre d'eau avant le déjeuner","Herbes fraîches à la place du sel","Limite les crudités en soirée"],
  ["Tisane ortie ou pissenlit ce soir — drainante naturelle","Mange dans un bol, pas une assiette plate — ça réduit la quantité","Pas d'écran pendant les repas, tu manges plus lentement"],
];
const HYDRA_TIPS = [
  "Prépare ta bouteille d'1L le matin et vide-la avant midi",
  "Un verre d'eau chaude avec citron à jeun booste le métabolisme",
  "Mange des aliments riches en eau : concombre, courgette, pastèque",
  "Si tu as faim entre les repas, bois 300ml d'eau d'abord et attends 10 min",
  "L'eau froide brûle légèrement plus de calories — préfère-la nature",
  "Ajoute des feuilles de menthe dans ta bouteille pour varier",
  "Bois un grand verre d'eau 30 min avant chaque repas",
];

const generatePlan = (dayNum) => {
  const isCF = isCrossfitDay(dayNum), isRest = isRestDay(dayNum);
  const session = isCF ? "CrossFit WOD" : isRest ? "Repos & Récupération" : "Marche Active";
  const wod = WOD_FORMATS[(dayNum-1) % WOD_FORMATS.length];
  const p = PROTEINS[(dayNum-1) % PROTEINS.length];
  const c = CARBS[(dayNum-1) % CARBS.length];
  const v = VEGS[(dayNum-1) % VEGS.length];
  const pBf = PROTEINS[(dayNum+4) % PROTEINS.length];
  const cal = { matin: isCF?450:350, midi: isCF?600:500, soir: isCF?500:420 };

  return {
    motiv: {
      message: MOTIVS[(dayNum-1) % MOTIVS.length],
      mantra: MANTRAS[(dayNum-1) % MANTRAS.length],
    },
    repas: {
      matin: {
        titre: isCF ? "Énergie CrossFit" : "Petit-déj léger",
        description: isCF
          ? `3 œufs brouillés + 50g ${c} + 1 banane + café sans sucre`
          : `2 œufs + 30g flocons d'avoine + fruits rouges + thé vert`,
        calories: cal.matin,
        conseil: isCF ? "Mange 1h30 avant la box" : "Pas trop lourd, journée légère",
      },
      midi: {
        titre: "Bowl équilibré",
        description: `150g ${p} + 80g ${c} cuit + ${v} vapeur · zéro sel`,
        calories: cal.midi,
        conseil: "Bois 300ml d'eau 30 min avant",
      },
      soir: {
        titre: isCF ? "Récup post-WOD" : "Dîner anti-rétention",
        description: isCF
          ? `200g ${pBf} grillé + légumes vapeur + 1 yaourt nature`
          : `150g poisson blanc + légumes vapeur + bouillon maison`,
        calories: cal.soir,
        conseil: "Dernier repas avant 20h — aucune exception",
      },
    },
    sport: {
      type: session,
      dureeTotal: isCF ? 60 : isRest ? 0 : 45,
      description: isCF
        ? `Séance CrossFit format ${wod} — échauffement + WOD + récup`
        : isRest ? "Repos actif : marche douce + étirements"
        : "Marche 45 min à rythme soutenu (6-7 km/h)",
      wodFormat: isCF ? wod : null,
      exercices: isCF ? [
        { nom: "Échauffement", details: "5 min cardio léger + mobilité articulaire", repos: "" },
        { nom: `WOD ${wod}`, details: "Suivre le programme du coach à la box", repos: "" },
        { nom: "Cool-down", details: "Étirements 10 min · respiration profonde", repos: "" },
      ] : isRest ? [
        { nom: "Marche douce", details: "20-30 min à rythme tranquille", repos: "" },
        { nom: "Étirements", details: "15 min de stretching global", repos: "" },
      ] : [
        { nom: "Marche active", details: "45 min à 6-7 km/h · respire par le nez", repos: "" },
        { nom: "Sprints courts", details: "5×30s d'accélération sur les 15 dernières min", repos: "90s" },
      ],
      objectifPas: isCF ? 12000 : isRest ? 5000 : 8000,
      conseilBox: isCF ? "Arrive 10 min avant, hydrate-toi bien, dis au coach si tu as mal quelque part" : null,
    },
    antiGonflement: ANTI_BLOAT[(dayNum-1) % ANTI_BLOAT.length],
    hydratation: {
      objectifLitres: isCF ? 3 : 2.5,
      tipDuJour: HYDRA_TIPS[(dayNum-1) % HYDRA_TIPS.length],
    },
  };
};

// ── DEBLOAT PRACTICES ──
const DEBLOAT_PRACTICES = [
  { id:"cold_water", icon:"🧊", title:"Eau froide visage", desc:"Rinçage 30s eau très froide le matin", category:"skin", points:2 },
  { id:"ice_cube", icon:"🧊", title:"Glaçons contour", desc:"1 glaçon enroulé le long de la mâchoire, 1 min chaque côté", category:"skin", points:3 },
  { id:"lymph_massage", icon:"👐", title:"Massage lymphatique", desc:"Du centre du visage vers les oreilles, puis cou vers clavicules, 3 min", category:"massage", points:3 },
  { id:"gua_sha", icon:"🪨", title:"Gua Sha", desc:"Mouvements ascendants sur cou et visage, 5 min", category:"massage", points:4 },
  { id:"spoon_eye", icon:"🥄", title:"Cuillères froides", desc:"2 cuillères au frigo, presser sous les yeux 1 min", category:"skin", points:2 },
  { id:"no_salt", icon:"🧂", title:"Zéro sel ajouté", desc:"Aucun sel dans les repas aujourd'hui", category:"nutrition", points:3 },
  { id:"no_sugar", icon:"🚫", title:"Zéro sucre raffiné", desc:"Pas de sucre transformé de la journée", category:"nutrition", points:3 },
  { id:"herbal_tea", icon:"🍵", title:"Tisane drainante", desc:"Fenouil, pissenlit ou ortie — 1 tasse matin à jeun", category:"nutrition", points:2 },
  { id:"sleep_elevation", icon:"🛏️", title:"Tête surélevée", desc:"Dormir avec 2 oreillers cette nuit", category:"sleep", points:2 },
  { id:"potassium", icon:"🍌", title:"Potassium", desc:"Banane, avocat ou patate douce dans la journée", category:"nutrition", points:2 },
  { id:"face_yoga", icon:"🧘", title:"Face yoga", desc:"Gonfler les joues, sourire forcé, 5 reps de chaque", category:"massage", points:2 },
  { id:"sleep_8h", icon:"😴", title:"8h de sommeil", desc:"Coucher à l'heure pour 8h de récup", category:"sleep", points:4 },
  { id:"no_phone", icon:"📵", title:"Pas d'écran -1h", desc:"Pas d'écran 1h avant de dormir", category:"sleep", points:2 },
  { id:"water_morning", icon:"💧", title:"500ml à jeun", desc:"Boire 500ml d'eau dès le réveil", category:"hydration", points:2 },
  { id:"no_alcohol", icon:"🚫", title:"Zéro alcool", desc:"Aucune boisson alcoolisée", category:"nutrition", points:2 },
];

const CAT_COLORS = { skin:"#06B6D4", massage:"#8B5CF6", nutrition:"#10B981", sleep:"#F97316", hydration:"#3B82F6" };
const CAT_LABELS = { skin:"Peau", massage:"Massage", nutrition:"Nutrition", sleep:"Sommeil", hydration:"Hydratation" };

// ── COLORS ──
const C = {
  bg:"#070A12", card:"rgba(255,255,255,0.04)", cardBorder:"rgba(255,255,255,0.07)",
  em:"#00E5A0", cy:"#06B6D4", or:"#F97316", pu:"#8B5CF6",
  text:"#F1F5F9", sec:"#64748B",
  grad:"linear-gradient(135deg,#00E5A0,#06B6D4)",
  glassEm:"rgba(0,229,160,0.07)", glassEmBorder:"rgba(0,229,160,0.2)",
  glassOr:"rgba(249,115,22,0.07)", glassOrBorder:"rgba(249,115,22,0.2)",
  glassPu:"rgba(139,92,246,0.07)", glassPuBorder:"rgba(139,92,246,0.2)",
};

const pill = (col, label) => (
  <span style={{background:`${col}18`,color:col,borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700}}>{label}</span>
);

// ── RING ──
const Ring = ({ pct=0, size=160, stroke=12, children }) => {
  const r=(size-stroke)/2, circ=2*Math.PI*r, dash=circ*Math.min(pct,1);
  const id=`rg${size}`;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5A0"/><stop offset="100%" stopColor="#06B6D4"/>
          </linearGradient>
          <filter id={`g${id}`}><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          filter={pct>0?`url(#g${id})`:undefined}
          style={{transition:"stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>{children}</div>
    </div>
  );
};

const MiniRing = ({ pct=0, size=48, stroke=5, color="#00E5A0" }) => {
  const r=(size-stroke)/2, circ=2*Math.PI*r, dash=circ*Math.min(pct,1);
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:"stroke-dasharray 0.8s ease"}}/>
    </svg>
  );
};

const GS = () => (
  <>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
    <style>{`
      *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
      body,html{background:#070A12}
      ::-webkit-scrollbar{display:none}
      input,button{outline:none;font-family:'Inter',sans-serif}
      button:active{transform:scale(0.94)!important}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
      .fu{animation:fadeUp 0.35s ease both}
    `}</style>
  </>
);

const Card = ({ children, style={}, onClick, em, or, pu, noPad }) => {
  const bg = em?C.glassEm:or?C.glassOr:pu?C.glassPu:C.card;
  const border = em?C.glassEmBorder:or?C.glassOrBorder:pu?C.glassPuBorder:C.cardBorder;
  return <div onClick={onClick} style={{background:bg,backdropFilter:"blur(16px)",border:`1px solid ${border}`,borderRadius:20,padding:noPad?0:18,marginBottom:12,cursor:onClick?"pointer":"default",...style}}>{children}</div>;
};

const Btn = ({ children, onClick, disabled, secondary }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background:disabled?"rgba(255,255,255,0.05)":secondary?"rgba(255,255,255,0.07)":"linear-gradient(135deg,#00E5A0,#00B87A)",
    color:disabled?C.sec:secondary?C.text:C.bg, border:`1px solid ${disabled?"rgba(255,255,255,0.06)":secondary?"rgba(255,255,255,0.1)":"transparent"}`,
    borderRadius:16, padding:"15px 20px", fontWeight:700, fontSize:15, cursor:disabled?"not-allowed":"pointer",
    width:"100%", fontFamily:"'Space Grotesk',sans-serif",
    boxShadow:(!disabled&&!secondary)?"0 8px 24px rgba(0,229,160,0.25)":"none", letterSpacing:0.3,
  }}>{children}</button>
);

// ════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("loading");
  const [tab, setTab] = useState("home");
  const [profile, setProfile] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [history, setHistory] = useState([]);
  const [debloatDone, setDebloatDone] = useState({});
  const [checkIn, setCheckIn] = useState({ poids:"", bloat:0, energie:0 });

  useEffect(() => {
    (async () => {
      const p = await load("lean-profile");
      const h = await load("lean-history") || [];
      const dd = await load("debloat-"+todayKey()) || {};
      setHistory(h); setDebloatDone(dd);
      if (!p) { setScreen("setup"); return; }
      setProfile(p);
      const key = todayKey();
      let td = await load(key);
      if (!td) {
        td = { key, date:todayStr(), plan:null, completions:{sport:false,matin:false,midi:false,soir:false,eau:0} };
        await save(key, td);
      }
      if (!td.plan) {
        const diff = new Date() - new Date(p.startDate);
        const dn = Math.max(1, Math.floor(diff/86400000)+1);
        const plan = generatePlan(dn);
        td = {...td, plan}; await save(key, td);
      }
      setTodayData(td);
      setScreen("main");
    })();
  }, []);

  const getDayNum = () => !profile?.startDate ? 1 : Math.max(1, Math.floor((new Date()-new Date(profile.startDate))/86400000)+1);
  const getWaterGoal = () => isCrossfitDay(getDayNum()) ? 3 : 2.5;
  const updateToday = async (patch) => { const u={...todayData,...patch}; setTodayData(u); await save(u.key||todayKey(), u); };
  const toggle = async (k) => updateToday({completions:{...todayData.completions,[k]:!todayData.completions[k]}});
  const addWater = async (amt=0.25) => {
    const next = Math.min(getWaterGoal(), (todayData.completions.eau||0)+amt);
    updateToday({completions:{...todayData.completions,eau:Math.round(next*100)/100}});
  };
  const getScore = () => {
    if (!todayData) return 0;
    const c = todayData.completions, wg = getWaterGoal();
    return [c.matin,c.midi,c.soir,c.sport,(c.eau||0)>=wg].filter(Boolean).length;
  };
  const getDebloatPts = () => DEBLOAT_PRACTICES.filter(p=>debloatDone[p.id]).reduce((s,p)=>s+p.points,0);
  const maxPts = DEBLOAT_PRACTICES.reduce((s,p)=>s+p.points,0);

  const handleSetup = async (poids) => {
    const p = {poids:parseFloat(poids), startDate:new Date().toISOString()};
    await save("lean-profile", p); setProfile(p);
    const key = todayKey();
    const plan = generatePlan(1);
    const td = {key, date:todayStr(), plan, completions:{sport:false,matin:false,midi:false,soir:false,eau:0}};
    await save(key, td); setTodayData(td); setScreen("main");
  };

  const handleCheckIn = async () => {
    if (!checkIn.poids) return;
    const entry = {date:todayStr(), poids:parseFloat(checkIn.poids), bloat:checkIn.bloat, energie:checkIn.energie, score:getScore()};
    const h = [...history.filter(x=>x.date!==entry.date), entry].sort((a,b)=>a.date.localeCompare(b.date));
    setHistory(h); await save("lean-history", h); await updateToday({checkIn:entry});
  };

  const toggleDebloat = async (id) => {
    const u = {...debloatDone,[id]:!debloatDone[id]};
    setDebloatDone(u); await save("debloat-"+todayKey(), u);
  };

  const regen = async () => {
    const plan = generatePlan(getDayNum());
    await updateToday({plan});
  };

  if (screen==="loading") return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <GS/><div style={{width:48,height:48,border:"3px solid rgba(255,255,255,0.06)",borderTopColor:C.em,borderRadius:"50%",animation:"spin 0.9s linear infinite"}}/>
    </div>
  );

  if (screen==="setup") return <Setup onDone={handleSetup}/>;

  const dayNum=getDayNum(), score=getScore(), plan=todayData?.plan, comp=todayData?.completions||{};
  const isCF=isCrossfitDay(dayNum), isRest=isRestDay(dayNum);
  const wg=getWaterGoal(), eauPct=Math.min(1,(comp.eau||0)/wg);
  const debloatPts=getDebloatPts();

  const tabs=[{id:"home",icon:"⚡",label:"Accueil"},{id:"debloat",icon:"🧊",label:"Debloat"},{id:"sport",icon:"🏋️",label:"Sport"},{id:"nutrition",icon:"🥗",label:"Repas"},{id:"suivi",icon:"📊",label:"Suivi"}];

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'Inter',sans-serif",paddingBottom:88}}>
      <GS/>
      {tab==="home"      && <Home plan={plan} score={score} comp={comp} dayNum={dayNum} isCF={isCF} isRest={isRest} wg={wg} eauPct={eauPct} debloatPts={debloatPts} maxPts={maxPts} debloatDone={debloatDone} setTab={setTab} toggle={toggle} addWater={addWater} regen={regen} profile={profile} history={history}/>}
      {tab==="debloat"   && <Debloat debloatDone={debloatDone} toggleDebloat={toggleDebloat} debloatPts={debloatPts} maxPts={maxPts} history={history}/>}
      {tab==="sport"     && <Sport plan={plan} comp={comp} isCF={isCF} isRest={isRest} wg={wg} eauPct={eauPct} toggle={toggle} addWater={addWater}/>}
      {tab==="nutrition" && <Nutrition plan={plan} comp={comp} toggle={toggle}/>}
      {tab==="suivi"     && <Suivi history={history} profile={profile} checkIn={checkIn} setCheckIn={setCheckIn} handleCheckIn={handleCheckIn} todayData={todayData} score={score}/>}

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(7,10,18,0.92)",backdropFilter:"blur(24px)",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",padding:"6px 8px 18px",zIndex:200}}>
        {tabs.map(({id,icon,label})=>{
          const on=tab===id;
          return (
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 0",position:"relative"}}>
              {on&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:28,height:2.5,borderRadius:2,background:C.grad}}/>}
              <span style={{fontSize:20,filter:on?`drop-shadow(0 0 8px ${C.em}90)`:"none"}}>{icon}</span>
              <span style={{fontSize:9,fontWeight:on?700:500,color:on?C.em:C.sec,fontFamily:"'Space Grotesk',sans-serif"}}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── HOME ──
function Home({ plan, score, comp, dayNum, isCF, isRest, wg, eauPct, debloatPts, maxPts, debloatDone, setTab, toggle, addWater, regen, profile, history }) {
  const last=history.slice(-1)[0], prev=history.slice(-2)[0];
  const delta=last&&prev?(last.poids-prev.poids).toFixed(1):null;
  return (
    <div className="fu">
      <div style={{background:"linear-gradient(180deg,rgba(0,229,160,0.06) 0%,transparent 100%)",padding:"40px 20px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <p style={{color:C.sec,fontSize:12,textTransform:"capitalize",marginBottom:4}}>{capitalize(fmtDate())}</p>
            <h1 style={{fontSize:30,fontWeight:800,fontFamily:"'Space Grotesk',sans-serif",lineHeight:1.1}}>
              Jour&nbsp;<span style={{background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>#{dayNum}</span>
            </h1>
          </div>
          {last?.poids&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"10px 16px",textAlign:"right"}}>
            <p style={{fontSize:18,fontWeight:800,fontFamily:"'Space Grotesk',sans-serif"}}>{last.poids}<span style={{fontSize:11,color:C.sec}}> kg</span></p>
            {delta&&<p style={{fontSize:11,color:parseFloat(delta)<0?C.em:"#EF4444",fontWeight:700}}>{parseFloat(delta)<0?"↓":"↑"} {Math.abs(delta)}kg</p>}
          </div>}
        </div>
        <p style={{color:C.sec,fontSize:13,marginTop:8}}>{isCF?"💪 CrossFit box ce soir":isRest?"😴 Repos & récupération":"🚶 Marche active aujourd'hui"}</p>
      </div>

      <div style={{padding:"0 16px"}}>
        <Card style={{padding:24}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-around"}}>
            <Ring pct={score/5} size={100} stroke={9}>
              <span style={{fontSize:26,fontWeight:900,fontFamily:"'Space Grotesk',sans-serif",background:score>0?C.grad:"none",WebkitBackgroundClip:score>0?"text":"unset",WebkitTextFillColor:score>0?"transparent":C.text}}>{score}</span>
              <span style={{fontSize:9,color:C.sec}}>/ 5</span>
            </Ring>
            <div style={{flex:1,paddingLeft:20}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <div style={{position:"relative",width:44,height:44}}>
                  <MiniRing pct={debloatPts/maxPts} size={44} stroke={4} color={C.cy}/>
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🧊</div>
                </div>
                <div><p style={{fontWeight:700,fontSize:12}}>Debloat</p><p style={{color:C.cy,fontSize:11,fontWeight:600}}>{debloatPts}/{maxPts} pts</p></div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{position:"relative",width:44,height:44}}>
                  <MiniRing pct={eauPct} size={44} stroke={4} color="#3B82F6"/>
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>💧</div>
                </div>
                <div><p style={{fontWeight:700,fontSize:12}}>Hydratation</p><p style={{color:"#3B82F6",fontSize:11,fontWeight:600}}>{(comp.eau||0).toFixed(2)}L / {wg}L</p></div>
              </div>
            </div>
          </div>
          <div style={{marginTop:16,padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:14}}>
            <p style={{fontSize:13,fontWeight:600,color:score===5?C.em:C.text}}>
              {score===0?"C'est parti 🚀":score<3?"Continue l'élan 💪":score<5?"Presque parfait !":"Journée parfaite 🌟"}
            </p>
            {plan?.motiv?.mantra&&<p style={{fontSize:11,fontStyle:"italic",color:C.em,opacity:0.8,marginTop:4}}>{plan.motiv.mantra}</p>}
          </div>
        </Card>

        {plan?.motiv?.message&&<Card em style={{padding:"14px 18px"}}><p style={{color:C.em,fontSize:13,lineHeight:1.65}}>💬 {plan.motiv.message}</p></Card>}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <Card style={{padding:16,cursor:"pointer",background:comp.sport?C.glassEm:C.card,border:comp.sport?`1px solid ${C.glassEmBorder}`:undefined}} onClick={()=>setTab("sport")}>
            <span style={{fontSize:26}}>{comp.sport?"✅":"🏋️"}</span>
            <p style={{fontWeight:700,fontSize:13,marginTop:8,marginBottom:2}}>Sport</p>
            <p style={{color:comp.sport?C.em:C.sec,fontSize:11,fontWeight:600}}>{comp.sport?"Complété !":isCF?"Box ce soir 🔥":"Marche à faire"}</p>
          </Card>
          <Card style={{padding:16,cursor:"pointer"}} onClick={()=>setTab("debloat")}>
            <span style={{fontSize:26}}>🧊</span>
            <p style={{fontWeight:700,fontSize:13,marginTop:8,marginBottom:4}}>Debloat</p>
            <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:4}}>
              {DEBLOAT_PRACTICES.slice(0,8).map(p=><div key={p.id} style={{width:7,height:7,borderRadius:"50%",background:debloatDone[p.id]?C.cy:"rgba(255,255,255,0.08)"}}/>)}
            </div>
            <p style={{color:C.cy,fontSize:11,fontWeight:600}}>{Object.values(debloatDone).filter(Boolean).length}/{DEBLOAT_PRACTICES.length} pratiques</p>
          </Card>
        </div>

        <Card style={{padding:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <span style={{fontWeight:700,fontSize:14}}>💧 Eau</span>
            <span style={{fontWeight:800,fontSize:15,color:eauPct>=1?C.cy:C.text}}>{(comp.eau||0).toFixed(2)} <span style={{color:C.sec,fontWeight:500,fontSize:12}}>/ {wg}L</span></span>
          </div>
          <div style={{height:5,background:"rgba(255,255,255,0.06)",borderRadius:10,overflow:"hidden",marginBottom:12}}>
            <div style={{height:"100%",width:`${eauPct*100}%`,background:"linear-gradient(90deg,#3B82F6,#06B6D4)",borderRadius:10,transition:"width 0.6s ease"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[["+ 250ml",0.25],["+ 500ml",0.5],["+ 1L",1]].map(([l,a])=>(
              <button key={l} onClick={()=>addWater(a)} style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)",color:"#3B82F6",borderRadius:12,padding:"10px 4px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{l}</button>
            ))}
          </div>
        </Card>

        {plan&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <p style={{fontWeight:700,fontSize:15,fontFamily:"'Space Grotesk',sans-serif"}}>Repas du jour</p>
            <button onClick={regen} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:C.sec,borderRadius:10,padding:"5px 12px",fontSize:11,cursor:"pointer",fontWeight:600}}>🔄</button>
          </div>
          {[["matin","🌅","Petit-déj"],["midi","☀️","Déjeuner"],["soir","🌙","Dîner"]].map(([k,e,l])=>(
            <Card key={k} noPad style={{cursor:"pointer",background:comp[k]?C.glassEm:C.card,border:comp[k]?`1px solid ${C.glassEmBorder}`:undefined}} onClick={()=>setTab("nutrition")}>
              <div style={{height:2.5,background:comp[k]?"linear-gradient(90deg,#00E5A0,#06B6D4)":"transparent",borderRadius:"20px 20px 0 0"}}/>
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:42,height:42,borderRadius:13,background:comp[k]?"linear-gradient(135deg,#00E5A0,#06B6D4)":"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{comp[k]?"✓":e}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <p style={{fontWeight:700,fontSize:13}}>{l}</p>{pill(C.pu,`${plan.repas[k]?.calories} kcal`)}
                  </div>
                  <p style={{color:C.sec,fontSize:12,marginTop:2}}>{plan.repas[k]?.titre}</p>
                </div>
              </div>
            </Card>
          ))}
          <Card or style={{padding:16}}>
            <p style={{color:C.or,fontWeight:700,marginBottom:10,fontSize:13}}>⚡ Anti-gonflement du jour</p>
            {plan.antiGonflement?.map((t,i)=><p key={i} style={{color:C.sec,fontSize:12,marginBottom:6,lineHeight:1.6}}>• {t}</p>)}
            {plan.hydratation?.tipDuJour&&<p style={{color:C.cy,fontSize:12,marginTop:10,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:10}}>💧 {plan.hydratation.tipDuJour}</p>}
          </Card>
        </>}
      </div>
    </div>
  );
}

// ── DEBLOAT ──
function Debloat({ debloatDone, toggleDebloat, debloatPts, maxPts, history }) {
  const [filter, setFilter] = useState("all");
  const cats = ["all","skin","massage","nutrition","sleep","hydration"];
  const catLabel = {all:"Tout",skin:"🧴 Peau",massage:"👐 Massage",nutrition:"🥗 Nutrition",sleep:"😴 Sommeil",hydration:"💧 Hydratation"};
  const bloatHistory = history.filter(h=>h.bloat>0).slice(-7);
  const pct = debloatPts/maxPts;
  const practices = filter==="all"?DEBLOAT_PRACTICES:DEBLOAT_PRACTICES.filter(p=>p.category===filter);

  return (
    <div className="fu">
      <div style={{background:"linear-gradient(180deg,rgba(6,182,212,0.07) 0%,transparent 100%)",padding:"40px 20px 20px"}}>
        <p style={{color:C.sec,fontSize:12,marginBottom:4}}>Routine quotidienne</p>
        <h1 style={{fontSize:28,fontWeight:800,fontFamily:"'Space Grotesk',sans-serif"}}>
          <span style={{background:"linear-gradient(135deg,#06B6D4,#8B5CF6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Debloat</span> Protocol
        </h1>
      </div>
      <div style={{padding:"0 16px"}}>
        <Card style={{display:"flex",alignItems:"center",gap:20,padding:22}}>
          <Ring pct={pct} size={90} stroke={8}>
            <span style={{fontSize:20,fontWeight:900,fontFamily:"'Space Grotesk',sans-serif",background:"linear-gradient(135deg,#06B6D4,#8B5CF6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{debloatPts}</span>
            <span style={{fontSize:9,color:C.sec}}>pts</span>
          </Ring>
          <div style={{flex:1}}>
            <p style={{fontWeight:800,fontSize:15,fontFamily:"'Space Grotesk',sans-serif",marginBottom:4}}>{pct===0?"Commence ta routine":pct<0.5?"En route 🧊":pct<1?"Presque complet 🔥":"Routine complète 🌟"}</p>
            <p style={{color:C.sec,fontSize:12}}>{Object.values(debloatDone).filter(Boolean).length} / {DEBLOAT_PRACTICES.length} pratiques · {debloatPts}/{maxPts} pts</p>
          </div>
        </Card>

        {bloatHistory.length>=2&&<Card style={{padding:18}}>
          <p style={{fontWeight:700,fontSize:14,marginBottom:4,fontFamily:"'Space Grotesk',sans-serif"}}>📈 Visage sur 7j</p>
          <p style={{color:C.sec,fontSize:11,marginBottom:14}}>1 = gonflé · 5 = défini</p>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={bloatHistory} margin={{top:4,right:4,left:-24,bottom:0}}>
              <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/><stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="date" tick={{fill:C.sec,fontSize:8}} tickFormatter={d=>d.slice(5)} axisLine={false} tickLine={false}/>
              <YAxis domain={[1,5]} tick={{fill:C.sec,fontSize:9}} axisLine={false} tickLine={false} ticks={[1,3,5]}/>
              <Tooltip contentStyle={{background:"rgba(7,10,18,0.95)",border:"1px solid rgba(255,255,255,0.07)",color:C.text,borderRadius:10,fontSize:11}}/>
              <Area type="monotone" dataKey="bloat" stroke={C.cy} strokeWidth={2} fill="url(#bg)" dot={{fill:C.cy,r:3,strokeWidth:0}}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>}

        <Card pu style={{padding:14}}>
          <p style={{color:C.pu,fontWeight:700,fontSize:12,marginBottom:6}}>🔬 Pourquoi ce protocole ?</p>
          <p style={{color:C.sec,fontSize:12,lineHeight:1.7}}>La rétention d'eau au visage vient du sel, sucre, manque de sommeil et mauvaise circulation lymphatique. Ces pratiques combinées réduisent l'inflammation visible en 24-72h.</p>
        </Card>

        <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14,paddingBottom:2}}>
          {cats.map(cat=>(
            <button key={cat} onClick={()=>setFilter(cat)} style={{background:filter===cat?"linear-gradient(135deg,#06B6D4,#8B5CF6)":"rgba(255,255,255,0.05)",color:filter===cat?C.bg:C.sec,border:`1px solid ${filter===cat?"transparent":"rgba(255,255,255,0.07)"}`,borderRadius:20,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>{catLabel[cat]}</button>
          ))}
        </div>

        {practices.map((p,i)=>{
          const done=!!debloatDone[p.id], col=CAT_COLORS[p.category];
          return (
            <div key={p.id} onClick={()=>toggleDebloat(p.id)} style={{background:done?`${col}10`:"rgba(255,255,255,0.03)",border:`1px solid ${done?col+"30":"rgba(255,255,255,0.06)"}`,borderRadius:18,padding:"14px 16px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:14,animation:`fadeUp 0.25s ease ${i*0.03}s both`}}>
              <div style={{width:28,height:28,borderRadius:9,background:done?col:"rgba(255,255,255,0.05)",border:`1.5px solid ${done?col:"rgba(255,255,255,0.12)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:done?`0 4px 12px ${col}40`:"none"}}>
                {done&&<span style={{fontSize:13,color:"#fff"}}>✓</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                  <span style={{fontSize:15}}>{p.icon}</span>
                  <p style={{fontWeight:700,fontSize:13,color:done?col:C.text}}>{p.title}</p>
                  <span style={{marginLeft:"auto",background:`${col}15`,color:col,borderRadius:10,padding:"2px 8px",fontSize:10,fontWeight:700}}>+{p.points}pts</span>
                </div>
                <p style={{color:C.sec,fontSize:12,lineHeight:1.5}}>{p.desc}</p>
                <span style={{display:"inline-block",marginTop:4,background:`${col}12`,color:col,borderRadius:8,padding:"1px 8px",fontSize:9,fontWeight:700,textTransform:"uppercase"}}>{CAT_LABELS[p.category]}</span>
              </div>
            </div>
          );
        })}

        <Card style={{padding:18,marginTop:4}}>
          <p style={{fontWeight:700,fontSize:14,fontFamily:"'Space Grotesk',sans-serif",marginBottom:14}}>⏰ Ordre idéal</p>
          {[{t:"Réveil",a:["💧 500ml eau à jeun","🍵 Tisane drainante"]},{t:"Matin",a:["🧊 Eau froide visage 30s","🥄 Cuillères froides yeux","👐 Massage lymphatique 3 min"]},{t:"Journée",a:["🧂 Zéro sel","🚫 Zéro sucre","💧 Hydratation continue"]},{t:"Soir",a:["🪨 Gua Sha 5 min","🧘 Face yoga","🛏️ Tête surélevée"]}].map(({t,a},i)=>(
            <div key={t} style={{display:"flex",gap:12,paddingBottom:i<3?14:0,borderBottom:i<3?"1px solid rgba(255,255,255,0.04)":undefined,marginBottom:i<3?14:0}}>
              <p style={{fontSize:10,fontWeight:700,color:C.cy,width:52,flexShrink:0,textTransform:"uppercase"}}>{t}</p>
              <div>{a.map((x,j)=><p key={j} style={{color:C.sec,fontSize:12,lineHeight:1.7}}>{x}</p>)}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── SPORT ──
function Sport({ plan, comp, isCF, isRest, wg, eauPct, toggle, addWater }) {
  if (!plan) return <div style={{padding:40,textAlign:"center",color:C.sec}}>Chargement...</div>;
  return (
    <div className="fu">
      <div style={{background:"linear-gradient(180deg,rgba(0,229,160,0.06) 0%,transparent 100%)",padding:"40px 20px 20px"}}>
        <p style={{color:C.sec,fontSize:12,marginBottom:4}}>Session du jour</p>
        <h1 style={{fontSize:26,fontWeight:800,fontFamily:"'Space Grotesk',sans-serif"}}>{isCF?"🏋️ CrossFit":isRest?"😴 Récupération":"🚶 Marche Active"}</h1>
      </div>
      <div style={{padding:"0 16px"}}>
        <Card em style={{padding:22}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div style={{flex:1}}>
              <p style={{color:C.em,fontWeight:800,fontSize:17,fontFamily:"'Space Grotesk',sans-serif",marginBottom:4}}>{plan.sport.type}</p>
              <p style={{color:C.sec,fontSize:13,lineHeight:1.5}}>{plan.sport.description}</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",marginLeft:12}}>
              {plan.sport.dureeTotal>0&&pill(C.em,`⏱ ${plan.sport.dureeTotal}min`)}
              {plan.sport.wodFormat&&pill(C.pu,`🎯 ${plan.sport.wodFormat}`)}
            </div>
          </div>
          <div style={{background:"rgba(0,229,160,0.08)",borderRadius:12,padding:"10px 14px",display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:12,color:C.em,fontWeight:600}}>👟 Objectif pas</span>
            <span style={{fontWeight:800,fontFamily:"'Space Grotesk',sans-serif"}}>{plan.sport.objectifPas?.toLocaleString()}</span>
          </div>
        </Card>

        {isCF&&plan.sport.conseilBox&&<Card or style={{padding:16}}>
          <p style={{color:C.or,fontWeight:700,fontSize:12,marginBottom:4}}>💬 Coach tip</p>
          <p style={{color:C.sec,fontSize:13}}>{plan.sport.conseilBox}</p>
        </Card>}

        <Card style={{padding:18}}>
          <p style={{fontWeight:700,marginBottom:16,fontFamily:"'Space Grotesk',sans-serif"}}>Structure</p>
          {plan.sport.exercices?.map((ex,i)=>(
            <div key={i} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:i<plan.sport.exercices.length-1?"1px solid rgba(255,255,255,0.04)":undefined,alignItems:"flex-start"}}>
              <div style={{width:28,height:28,borderRadius:8,background:C.grad,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,fontWeight:800,color:C.bg}}>{i+1}</div>
              <div style={{flex:1}}>
                <p style={{fontWeight:700,fontSize:14,marginBottom:2}}>{ex.nom}</p>
                <p style={{color:C.sec,fontSize:12,lineHeight:1.4}}>{ex.details}</p>
              </div>
              {ex.repos&&pill(C.or,ex.repos)}
            </div>
          ))}
        </Card>

        <Card style={{padding:18}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <p style={{fontWeight:700}}>💧 Hydratation</p>
            <p style={{fontWeight:800,color:eauPct>=1?C.cy:C.text}}>{(comp.eau||0).toFixed(2)} / {wg}L</p>
          </div>
          <div style={{height:5,background:"rgba(255,255,255,0.06)",borderRadius:10,overflow:"hidden",marginBottom:14}}>
            <div style={{height:"100%",width:`${eauPct*100}%`,background:"linear-gradient(90deg,#3B82F6,#06B6D4)",borderRadius:10,transition:"width 0.6s ease"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[["+ 250ml",0.25],["+ 500ml",0.5],["+ 1L",1]].map(([l,a])=>(
              <button key={l} onClick={()=>addWater(a)} style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)",color:"#3B82F6",borderRadius:12,padding:"10px 4px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{l}</button>
            ))}
          </div>
        </Card>

        <div onClick={()=>toggle("sport")} style={{background:comp.sport?C.glassEm:C.card,border:`1px solid ${comp.sport?C.glassEmBorder:C.cardBorder}`,borderRadius:20,padding:"18px 20px",display:"flex",alignItems:"center",gap:16,cursor:"pointer"}}>
          <div style={{width:48,height:48,borderRadius:14,background:comp.sport?"linear-gradient(135deg,#00E5A0,#00B87A)":"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,boxShadow:comp.sport?"0 4px 16px rgba(0,229,160,0.3)":"none"}}>
            {comp.sport?"✓":"🏁"}
          </div>
          <div>
            <p style={{fontWeight:700,fontSize:15}}>{isCF?"WOD terminé ✊":"Session terminée"}</p>
            <p style={{color:C.sec,fontSize:12,marginTop:2}}>{comp.sport?"Bien joué !":"Tape ici après ta séance"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── NUTRITION ──
function Nutrition({ plan, comp, toggle }) {
  if (!plan) return <div style={{padding:40,textAlign:"center",color:C.sec}}>Chargement...</div>;
  const total=(plan.repas.matin?.calories||0)+(plan.repas.midi?.calories||0)+(plan.repas.soir?.calories||0);
  return (
    <div className="fu">
      <div style={{background:"linear-gradient(180deg,rgba(16,185,129,0.06) 0%,transparent 100%)",padding:"40px 20px 20px"}}>
        <p style={{color:C.sec,fontSize:12,marginBottom:4}}>Plan du jour</p>
        <h1 style={{fontSize:26,fontWeight:800,fontFamily:"'Space Grotesk',sans-serif"}}>🥗 Nutrition</h1>
      </div>
      <div style={{padding:"0 16px"}}>
        <Card style={{padding:20,background:"linear-gradient(135deg,rgba(0,229,160,0.06),rgba(6,182,212,0.06))",border:"1px solid rgba(0,229,160,0.15)"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",textAlign:"center",gap:8}}>
            {[["🌅",plan.repas.matin?.calories,"Matin"],["☀️",plan.repas.midi?.calories,"Midi"],["🌙",plan.repas.soir?.calories,"Soir"],["🔥",total,"Total"]].map(([e,cal,l],i)=>(
              <div key={i}><p style={{fontSize:18}}>{e}</p><p style={{fontSize:18,fontWeight:900,fontFamily:"'Space Grotesk',sans-serif",marginTop:4,color:i===3?C.or:C.text}}>{cal}</p><p style={{fontSize:10,color:C.sec}}>kcal</p></div>
            ))}
          </div>
        </Card>

        {[["matin","🌅","Petit-déjeuner"],["midi","☀️","Déjeuner"],["soir","🌙","Dîner"]].map(([k,e,l])=>(
          <Card key={k} noPad style={{cursor:"pointer",background:comp[k]?C.glassEm:C.card,border:comp[k]?`1px solid ${C.glassEmBorder}`:undefined}} onClick={()=>toggle(k)}>
            <div style={{height:3,background:comp[k]?"linear-gradient(90deg,#00E5A0,#06B6D4)":"transparent",borderRadius:"20px 20px 0 0"}}/>
            <div style={{padding:"16px 18px",display:"flex",alignItems:"flex-start",gap:14}}>
              <div style={{width:44,height:44,borderRadius:14,background:comp[k]?"linear-gradient(135deg,#00E5A0,#06B6D4)":"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{comp[k]?"✓":e}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <p style={{fontWeight:800,fontSize:14,fontFamily:"'Space Grotesk',sans-serif"}}>{l}</p>{pill(C.pu,`${plan.repas[k]?.calories} kcal`)}
                </div>
                <p style={{fontWeight:600,fontSize:13,color:comp[k]?C.em:C.text,marginBottom:4}}>{plan.repas[k]?.titre}</p>
                <p style={{color:C.sec,fontSize:12,lineHeight:1.5}}>{plan.repas[k]?.description}</p>
                {plan.repas[k]?.conseil&&<p style={{color:C.or,fontSize:11,marginTop:8}}>💡 {plan.repas[k].conseil}</p>}
              </div>
            </div>
          </Card>
        ))}

        <Card or style={{padding:18}}>
          <p style={{color:C.or,fontWeight:700,marginBottom:12,fontSize:13}}>⚡ Règles non-négociables</p>
          {["Zéro grignotage entre les repas","Dernier repas avant 20h","Zéro sel ajouté, zéro transformé","Faim = bois 300ml d'eau d'abord","Mange lentement, pose les couverts"].map((r,i,a)=>(
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:i<a.length-1?8:0}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:C.or,flexShrink:0,marginTop:5}}/>
              <p style={{color:C.sec,fontSize:12,lineHeight:1.5}}>{r}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── SUIVI ──
function Suivi({ history, profile, checkIn, setCheckIn, handleCheckIn, todayData, score }) {
  const wd=history.filter(h=>h.poids).slice(-14);
  const bh=history.filter(h=>h.bloat>0).slice(-14);
  const start=profile?.poids, last=history.slice(-1)[0];
  const totalLost=start&&last?.poids?(start-last.poids).toFixed(1):null;
  const streak=(()=>{let s=0;for(const h of [...history].sort((a,b)=>b.date.localeCompare(a.date))){if(h.score>=3)s++;else break;}return s;})();

  return (
    <div className="fu">
      <div style={{background:"linear-gradient(180deg,rgba(139,92,246,0.07) 0%,transparent 100%)",padding:"40px 20px 20px"}}>
        <p style={{color:C.sec,fontSize:12,marginBottom:4}}>Ta progression</p>
        <h1 style={{fontSize:26,fontWeight:800,fontFamily:"'Space Grotesk',sans-serif"}}>📊 Suivi</h1>
      </div>
      <div style={{padding:"0 16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
          {[[streak,"🔥","Streak",C.or],[`${score}/5`,"⚡","Score",C.em],[totalLost?`-${totalLost}kg`:"—","📉","Perdu",C.cy]].map(([v,e,l,col])=>(
            <Card key={l} style={{padding:14,textAlign:"center"}}>
              <p style={{fontSize:18}}>{e}</p>
              <p style={{fontSize:17,fontWeight:900,fontFamily:"'Space Grotesk',sans-serif",color:col,marginTop:4}}>{v}</p>
              <p style={{fontSize:9,color:C.sec,marginTop:2}}>{l}</p>
            </Card>
          ))}
        </div>

        <Card style={{padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
            <p style={{fontWeight:700,fontFamily:"'Space Grotesk',sans-serif",fontSize:16}}>Check-in du jour</p>
            {todayData?.checkIn&&pill(C.em,"✓ Enregistré")}
          </div>

          <p style={{color:C.sec,fontSize:11,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5,fontWeight:600}}>Poids (kg)</p>
          <input style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:14,color:C.text,fontSize:24,textAlign:"center",fontWeight:900,fontFamily:"'Space Grotesk',sans-serif",marginBottom:20,boxSizing:"border-box"}}
            type="number" step="0.1" placeholder={profile?.poids?.toString()||"82.5"}
            value={checkIn.poids} onChange={e=>setCheckIn({...checkIn,poids:e.target.value})}/>

          <p style={{color:C.sec,fontSize:11,marginBottom:10,textTransform:"uppercase",letterSpacing:0.5,fontWeight:600}}>Gonflement visage</p>
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            {[["😣",1],["😟",2],["😐",3],["🙂",4],["😎",5]].map(([e,n])=>(
              <button key={n} onClick={()=>setCheckIn({...checkIn,bloat:n})} style={{flex:1,padding:"12px 4px",borderRadius:14,border:`1.5px solid ${checkIn.bloat===n?C.cy:"rgba(255,255,255,0.07)"}`,background:checkIn.bloat===n?"rgba(6,182,212,0.12)":"rgba(255,255,255,0.03)",color:C.text,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <span style={{fontSize:22}}>{e}</span><span style={{fontSize:10,fontWeight:700,color:checkIn.bloat===n?C.cy:C.sec}}>{n}</span>
              </button>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
            <span style={{fontSize:10,color:C.sec}}>Très gonflé</span><span style={{fontSize:10,color:C.sec}}>Défini</span>
          </div>

          <p style={{color:C.sec,fontSize:11,marginBottom:10,textTransform:"uppercase",letterSpacing:0.5,fontWeight:600}}>Énergie</p>
          <div style={{display:"flex",gap:6,marginBottom:20}}>
            {[["💀","Nulle"],["😴","Basse"],["😐","Ok"],["⚡","Bien"],["🔥","Top"]].map(([e,l],i)=>(
              <button key={i} onClick={()=>setCheckIn({...checkIn,energie:i+1})} style={{flex:1,padding:"10px 2px",borderRadius:14,border:`1.5px solid ${checkIn.energie===i+1?C.or:"rgba(255,255,255,0.07)"}`,background:checkIn.energie===i+1?"rgba(249,115,22,0.12)":"rgba(255,255,255,0.03)",color:C.text,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                <span style={{fontSize:20}}>{e}</span><span style={{fontSize:9,fontWeight:600,color:checkIn.energie===i+1?C.or:C.sec}}>{l}</span>
              </button>
            ))}
          </div>
          <Btn onClick={handleCheckIn} disabled={!checkIn.poids}>Enregistrer le check-in</Btn>
        </Card>

        {wd.length>=2&&<Card style={{padding:18}}>
          <p style={{fontWeight:700,marginBottom:4,fontFamily:"'Space Grotesk',sans-serif"}}>📉 Poids</p>
          <p style={{color:C.sec,fontSize:11,marginBottom:14}}>{wd.length} entrées</p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={wd} margin={{top:4,right:4,left:-20,bottom:0}}>
              <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00E5A0" stopOpacity={0.3}/><stop offset="95%" stopColor="#00E5A0" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="date" tick={{fill:C.sec,fontSize:8}} tickFormatter={d=>d.slice(5)} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.sec,fontSize:9}} domain={["auto","auto"]} width={32} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:"rgba(7,10,18,0.95)",border:`1px solid ${C.cardBorder}`,color:C.text,borderRadius:10,fontSize:11}}/>
              <Area type="monotone" dataKey="poids" stroke={C.em} strokeWidth={2.5} fill="url(#wg)" dot={{fill:C.em,r:3,strokeWidth:0}}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>}

        {history.length>0?<Card style={{padding:18}}>
          <p style={{fontWeight:700,marginBottom:16,fontFamily:"'Space Grotesk',sans-serif"}}>Historique récent</p>
          {history.slice(-7).reverse().map((h,i,a)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<a.length-1?"1px solid rgba(255,255,255,0.04)":undefined}}>
              <div><p style={{fontWeight:600,fontSize:13}}>{h.date}</p><p style={{color:C.sec,fontSize:11,marginTop:2}}>Score {h.score}/5</p></div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                {h.poids&&pill(C.pu,`${h.poids}kg`)}
                {h.bloat>0&&<span style={{fontSize:18}}>{["😣","😟","😐","🙂","😎"][h.bloat-1]}</span>}
              </div>
            </div>
          ))}
        </Card>:<Card style={{textAlign:"center",padding:48}}>
          <p style={{fontSize:36,marginBottom:12}}>🌱</p>
          <p style={{color:C.sec,fontSize:13}}>Ton historique apparaîtra ici</p>
        </Card>}
      </div>
    </div>
  );
}

// ── SETUP ──
function Setup({ onDone }) {
  const [poids, setPoids] = useState("");
  return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:24}}>
      <GS/>
      <div style={{position:"fixed",top:-80,left:"50%",transform:"translateX(-50%)",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,229,160,0.07) 0%,transparent 65%)",pointerEvents:"none"}}/>
      <div style={{textAlign:"center",marginBottom:40}} className="fu">
        <div style={{width:80,height:80,borderRadius:24,background:"linear-gradient(135deg,#00E5A0,#06B6D4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 24px",boxShadow:"0 20px 60px rgba(0,229,160,0.25)"}}>⚡</div>
        <h1 style={{fontSize:30,fontWeight:800,fontFamily:"'Space Grotesk',sans-serif",lineHeight:1.2,marginBottom:12,color:C.text}}>
          Ta transformation<br/>
          <span style={{background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>commence maintenant</span>
        </h1>
        <p style={{color:C.sec,lineHeight:1.8,fontSize:13}}>CrossFit 3×/sem · Marche active · Nutrition anti-bloat<br/>Debloat protocol · Suivi quotidien</p>
      </div>
      <Card style={{marginBottom:14}} className="fu">
        <p style={{fontWeight:700,marginBottom:4,fontFamily:"'Space Grotesk',sans-serif",fontSize:15}}>Ton poids actuel (kg)</p>
        <p style={{color:C.sec,fontSize:12,marginBottom:16}}>Pour calibrer tes objectifs et suivre ta progression</p>
        <input type="number" step="0.5" placeholder="ex: 85.0" value={poids} onChange={e=>setPoids(e.target.value)}
          style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:18,color:C.text,fontSize:28,textAlign:"center",marginBottom:16,fontWeight:900,fontFamily:"'Space Grotesk',sans-serif",boxSizing:"border-box"}}/>
        <Btn onClick={()=>poids&&onDone(poids)} disabled={!poids}>Démarrer ma transformation →</Btn>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}} className="fu">
        {[["🏋️","CrossFit","3×/sem"],["🚶","Marche","Active"],["🥗","Anti","Bloat"],["🧊","Debloat","Visage"]].map(([icon,l1,l2])=>(
          <Card key={l1} style={{padding:14,textAlign:"center"}}>
            <span style={{fontSize:22}}>{icon}</span>
            <p style={{fontSize:11,fontWeight:700,marginTop:8,color:C.text}}>{l1}</p>
            <p style={{fontSize:9,color:C.sec}}>{l2}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
