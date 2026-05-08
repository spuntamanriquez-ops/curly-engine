import { useState } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');`;

const KCAL_AA  = 4;
const KCAL_LIP = 9;
const KCAL_DEX_KABIVEN   = 4.5;    // glucosa anhidra — Kabiven Central (Fresenius)
const KCAL_DEX_OMEGAFLEX = 4.147;  // factor real según prospecto: (2215 - 420.4 - 675) / 270
const KCAL_DEX_MAGISTRAL = 3.4;    // dextrosa monohidratada estándar

const KABIVEN   = { aa: 5.07,  lip: 3.8, dex: 12.7  };
const OMEGAFLEX = { aa: 5.605, lip: 4.0, dex: 14.4  };

const RANGES_DIA = {
  kcal: { min: 25,  max: 35  },
  aa:   { min: 1.2, max: 2.0 },
  lip:  { min: 1.0, max: 2.0 },
  dex:  { min: 3.0, max: 7.0 },
};
const VEL_MAX_MGKGMIN = 5.0;

const ALERTAS = {
  dex: {
    y: ["Glucemia cerca del límite · monitorear c/6h", "Riesgo de hiperglucemia por carga de glucosa"],
    r: ["Monitorear glucemia c/4–6h · considerar insulinoterapia", "Exceso de glucosa → lipogénesis, esteatosis hepática, ↑CO₂ (ESPEN)", "Considerar reducir dextrosa o aumentar proporción lipídica"],
  },
  lip: {
    y: ["Lípidos cerca del límite · monitorear triglicéridos", "ESPEN: mantener TG < 400 mg/dL durante infusión"],
    r: ["Monitorear TG séricos · suspender si TG > 1000 mg/dL (ESPEN)", "Exceso lipídico → riesgo de hipertrigliceridemia y disfunción hepática", "Considerar reducir aporte lipídico"],
  },
  aa: {
    y: ["Aminoácidos cerca del límite · controlar urea y función renal"],
    r: ["Monitorear urea, creatinina y transaminasas (ESPEN)", "Exceso de AA → carga nitrogenada elevada · riesgo de azotemia", "Ajustar según función renal y hepática"],
  },
  kcal: {
    y: ["Aporte calórico elevado · vigilar sobrealimentación"],
    r: ["Overfeeding · ESPEN recomienda 25–35 kcal/kg/día", "Monitorear glucemia, triglicéridos y función hepática", "Considerar reducir velocidad de infusión"],
  },
  velD: {
    y: ["Velocidad de glucosa cerca del límite de oxidación · monitorear glucemia"],
    r: ["Velocidad excede capacidad de oxidación (ESPEN: máx 5 mg/kg/min)", "Riesgo de lipogénesis, ↑CO₂ y esteatosis hepática", "Reducir velocidad de infusión o concentración de dextrosa"],
  },
};

function semMax(val, max) {
  if (!val) return "n";
  if (val > max) return "r";
  if (val > max * 0.85) return "y";
  return "g";
}

const C = {
  bg:       "#111214",
  card:     "#1a1c1f",
  cardBord: "#2a2d32",
  input:    "#13151a",
  inputB:   "#2a2d32",
  accent:   "#c8a96e",
  text:     "#e8e4dc",
  muted:    "#666",
  dim:      "#444",
};

const css = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  .r{min-height:100vh;background:${C.bg};font-family:'DM Mono',monospace;padding:28px 16px 52px;color:${C.text}}
  .hdr{text-align:center;margin-bottom:26px}
  .hdr-t{font-family:'Syne',sans-serif;font-weight:800;font-size:24px;color:${C.text};letter-spacing:-.5px}
  .hdr-s{font-size:10px;color:${C.muted};letter-spacing:3px;text-transform:uppercase;margin-top:5px}
  .wrap{max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:13px}
  .card{background:${C.card};border:1px solid ${C.cardBord};border-radius:12px;padding:20px 22px}
  .ct{font-family:'Syne',sans-serif;font-weight:700;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;
      color:${C.muted};margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #222528;
      display:flex;align-items:center;gap:8px}
  .cdot{width:7px;height:7px;border-radius:50%;background:${C.accent};flex-shrink:0}
  .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:start}
  .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;align-items:start}
  .field{display:flex;flex-direction:column;gap:5px}
  .field label{font-size:10px;color:${C.dim};letter-spacing:1px;text-transform:uppercase}
  .iw{position:relative;display:flex;align-items:center}
  input[type=number],select{
    width:100%;background:${C.input};border:1px solid ${C.inputB};border-radius:8px;
    padding:9px 42px 9px 12px;font-family:'DM Mono',monospace;font-size:15px;color:${C.text};
    outline:none;transition:border-color .15s;-moz-appearance:textfield;
    -webkit-appearance:none;appearance:none}
  select{padding-right:12px;cursor:pointer}
  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  input[type=number]:focus,select:focus{border-color:${C.accent}}
  .unit{position:absolute;right:10px;font-size:10px;color:${C.dim};pointer-events:none}
  .btn-c{width:100%;padding:14px;background:${C.accent};color:#111;border:none;border-radius:10px;
         font-family:'Syne',sans-serif;font-weight:800;font-size:12px;letter-spacing:2px;text-transform:uppercase;
         cursor:pointer;transition:opacity .15s,transform .1s}
  .btn-c:hover{opacity:.88}
  .btn-c:active{transform:scale(.98)}
  .btn-x{width:100%;padding:10px;margin-top:6px;background:transparent;color:${C.dim};
         border:1px solid #222528;border-radius:10px;font-family:'DM Mono',monospace;font-size:11px;
         letter-spacing:1px;cursor:pointer;transition:all .15s}
  .btn-x:hover{border-color:${C.muted};color:${C.muted}}
  .sec{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${C.muted};margin-bottom:9px;margin-top:16px}
  .sec:first-child{margin-top:0}
  .sep{height:1px;background:#222528;margin:14px 0}
  .bar-bg{background:#222528;border-radius:4px;height:7px;display:flex;overflow:hidden;gap:2px;margin-top:8px}
  .bar-seg{height:100%;border-radius:2px;transition:width .4s}
  .bar-leg{display:flex;gap:14px;margin-top:7px;flex-wrap:wrap}
  .bleg{display:flex;align-items:center;gap:5px;font-size:10px;color:${C.muted}}
  .bleg-d{width:7px;height:7px;border-radius:2px}
  .foot{font-size:9px;color:#3a3d42;margin-top:14px;padding-top:12px;border-top:1px solid #222528;line-height:1.8}
  @media(max-width:480px){.g2,.g3{grid-template-columns:1fr 1fr}}
`;

const ST  = { g:"✓ En rango", y:"⚠ Cerca del límite", r:"✕ Fuera de rango" };
const BLC = { g:"3px solid #4caf82", y:"3px solid #e8b84a", r:"3px solid #e85555", n:`3px solid #2a2d32` };
const STC = { g:"#4caf82", y:"#e8b84a", r:"#e85555" };

function RC({ label, value, unit, s="n", gold }) {
  if (gold) return (
    <div style={{background:C.accent,borderRadius:"8px",padding:"11px 13px",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:"9px",color:"rgba(17,18,20,.5)",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"4px"}}>{label}</div>
      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"26px",color:"#111",lineHeight:1}}>{value}</div>
      <div style={{fontSize:"10px",color:"rgba(17,18,20,.4)",marginTop:"2px"}}>{unit}</div>
    </div>
  );
  return (
    <div style={{background:"#13151a",borderRadius:"8px",padding:"11px 13px 11px 14px",
        border:"1px solid #2a2d32",borderLeft:BLC[s]||BLC.n,display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:"9px",color:C.muted,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"4px"}}>{label}</div>
      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"22px",color:C.text,lineHeight:1}}>{value}</div>
      <div style={{fontSize:"10px",color:C.dim,marginTop:"2px"}}>{unit}</div>
      {(s==="y"||s==="r") && (
        <div style={{fontSize:"9px",fontWeight:700,letterSpacing:".5px",textTransform:"uppercase",marginTop:"6px",color:STC[s]}}>{ST[s]}</div>
      )}
    </div>
  );
}

function AlertaESPEN({ items, tipo }) {
  if (!items || items.length === 0) return null;
  const bg   = tipo==="r" ? "rgba(232,85,85,.08)"  : "rgba(232,184,74,.06)";
  const bord = tipo==="r" ? "1px solid rgba(232,85,85,.22)" : "1px solid rgba(232,184,74,.22)";
  const col  = tipo==="r" ? "#e87070" : "#c8a020";
  return (
    <div style={{background:bg,border:bord,borderRadius:"8px",padding:"11px 14px",marginTop:"8px"}}>
      <div style={{fontSize:"9px",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",color:col,marginBottom:"8px"}}>
        {tipo==="r" ? "⚠ Alerta · ESPEN" : "○ Precaución · ESPEN"}
      </div>
      {items.map((txt,i)=>(
        <div key={i} style={{fontSize:"10px",color:"#999",lineHeight:1.6,paddingLeft:"9px",
          borderLeft:`2px solid ${col}`,marginBottom:i<items.length-1?"7px":0}}>
          {txt}
        </div>
      ))}
    </div>
  );
}

const DEF    = { peso:"", vel:"", horas:"24" };
const DEFM   = { aa:"", lip:"", dex:"" };
const DEFMOD = { tipo:"aa", vel:"", conc:"", horas:"" };
const DEFINT = { mlTotal:"", horasTotal:"" };

// Protocolo 1 escalón: 1h al 50% → plena → 1h al 50%
// Req mínimo: 3h
function calcCurva1(mlTotal, h) {
  if (!mlTotal || !h || h < 3) return null;
  // vol = velPlena*(h-2) + velPlena*0.5*1 + velPlena*0.5*1 = velPlena*(h-1)
  const velPlena = mlTotal / (h - 1);
  const vel50    = velPlena * 0.5;
  const pasos = [
    { label:"↑ Inicio",        tiempo:"0:00",        dur:"1h",       vel:vel50,    vol:vel50*1,          color:"#6a7fc8", h:"25%" },
    { label:"⬛ Plena",         tiempo:"1:00",        dur:`${h-2}h`,  vel:velPlena, vol:velPlena*(h-2),   color:"#9a7fc8", h:"100%" },
    { label:"↓ Fin",           tiempo:`${h-1}:00`,   dur:"1h",       vel:vel50,    vol:vel50*1,          color:"#6a7fc8", h:"25%" },
  ];
  const barras = [
    { flex:1,     bg:"rgba(106,127,200,.35)", h:"50%",  label:`${vel50.toFixed(0)} mL/h` },
    { flex:h-2,   bg:"rgba(154,127,200,.65)", h:"100%", label:`${velPlena.toFixed(0)} mL/h · ${h-2}h` },
    { flex:1,     bg:"rgba(106,127,200,.35)", h:"50%",  label:`${vel50.toFixed(0)} mL/h` },
  ];
  const ticks = [`0:00`, `1:00`, `${h-1}:00`, `${h}:00`];
  const volCheck = pasos.reduce((a,p)=>a+p.vol,0);
  return { pasos, barras, ticks, velPlena, velRampa:vel50, volCheck };
}

// Protocolo 2 escalones: 30min 25% → 30min 50% → plena → 30min 50% → 30min 25%
// Req mínimo: 3h (rampas = 1h total cada extremo)
function calcCurva2(mlTotal, h) {
  if (!mlTotal || !h || h < 3) return null;
  const hCentral = h - 2; // horas en velocidad plena (rampas = 1h inicio + 1h fin)
  // vol = velPlena*0.25*0.5 + velPlena*0.5*0.5 + velPlena*hCentral + velPlena*0.5*0.5 + velPlena*0.25*0.5
  //     = velPlena*(0.125 + 0.25 + hCentral + 0.25 + 0.125)
  //     = velPlena*(hCentral + 0.75)
  const velPlena = mlTotal / (hCentral + 0.75);
  const vel50 = velPlena * 0.5;
  const vel25 = velPlena * 0.25;

  // Construir tiempos HH:MM
  const fmt = (totalMin) => {
    const hh = Math.floor(totalMin/60);
    const mm = totalMin % 60;
    return `${hh}:${mm===0?"00":mm}`;
  };
  const t = [0, 30, 60, 60 + hCentral*60, 60 + hCentral*60 + 30, 60 + hCentral*60 + 60];

  const pasos = [
    { label:"↑ Inicio 25%",   tiempo:`${fmt(t[0])} → ${fmt(t[1])}`, dur:"30min", vel:vel25,    vol:vel25*0.5,        color:"#4a6fc8" },
    { label:"↑ Inicio 50%",   tiempo:`${fmt(t[1])} → ${fmt(t[2])}`, dur:"30min", vel:vel50,    vol:vel50*0.5,        color:"#6a7fc8" },
    { label:"⬛ Plena",        tiempo:`${fmt(t[2])} → ${fmt(t[3])}`, dur:`${hCentral}h`,  vel:velPlena, vol:velPlena*hCentral, color:"#9a7fc8" },
    { label:"↓ Fin 50%",      tiempo:`${fmt(t[3])} → ${fmt(t[4])}`, dur:"30min", vel:vel50,    vol:vel50*0.5,        color:"#6a7fc8" },
    { label:"↓ Fin 25%",      tiempo:`${fmt(t[4])} → ${fmt(t[5])}`, dur:"30min", vel:vel25,    vol:vel25*0.5,        color:"#4a6fc8" },
  ];
  const barras = [
    { flex:0.5,      bg:"rgba(74,111,200,.3)",  h:"25%",  label:`${vel25.toFixed(0)}` },
    { flex:0.5,      bg:"rgba(106,127,200,.4)", h:"50%",  label:`${vel50.toFixed(0)}` },
    { flex:hCentral, bg:"rgba(154,127,200,.65)",h:"100%", label:`${velPlena.toFixed(0)} mL/h · ${hCentral}h` },
    { flex:0.5,      bg:"rgba(106,127,200,.4)", h:"50%",  label:`${vel50.toFixed(0)}` },
    { flex:0.5,      bg:"rgba(74,111,200,.3)",  h:"25%",  label:`${vel25.toFixed(0)}` },
  ];
  const ticks = [`0:00`, `0:30`, `1:00`, `${fmt(t[3])}`, `${fmt(t[4])}`, `${fmt(t[5])}`];
  const volCheck = pasos.reduce((a,p)=>a+p.vol,0);
  return { pasos, barras, ticks, velPlena, vel50, vel25, volCheck };
}

export default function NP() {
  const [f,    setF]    = useState(DEF);
  const [mag,  setMag]  = useState(DEFM);
  const [modo, setModo] = useState("kabiven");
  const [mod,  setMod]  = useState(DEFMOD);
  const [res,  setRes]  = useState(null);
  const [showMod,   setShowMod]   = useState(false);
  const [showInterm, setShowInterm] = useState(false);
  const [interm, setInterm] = useState(DEFINT);
  const [curva,  setCurva]  = useState(null);
  const [proto,  setProto]  = useState("1");

  const set    = k => e => { setF(p=>({...p,[k]:e.target.value})); setRes(null); };
  const setM   = k => e => { setMag(p=>({...p,[k]:e.target.value})); setRes(null); };
  const setMod2 = k => e => { setMod(p=>({...p,[k]:e.target.value})); setRes(null); };

  const comp = modo==="kabiven"   ? KABIVEN
             : modo==="omegaflex" ? OMEGAFLEX
             : { aa:+mag.aa||0, lip:+mag.lip||0, dex:+mag.dex||0 };

  const modVel   = +mod.vel   || 0;
  const modConc  = +mod.conc  || 0;
  const modHoras = +mod.horas || 0;
  const gModTotal = modVel * modHoras * modConc / 100;
  const modLabel  = mod.tipo==="aa" ? "aminoácidos" : mod.tipo==="lip" ? "lípidos" : "dextrosa";
  const kcalMod   = gModTotal * (mod.tipo==="aa" ? KCAL_AA : mod.tipo==="lip" ? KCAL_LIP : KCAL_DEX_MAGISTRAL);

  const calc = () => {
    const peso  = +f.peso  || 0;
    const vel   = +f.vel   || 0;
    const horas = +f.horas || 24;
    const mlTotal = vel * horas;

    let gAA  = mlTotal * comp.aa  / 100;
    let gLip = mlTotal * comp.lip / 100;
    let gDex = mlTotal * comp.dex / 100;

    if (gModTotal > 0) {
      if (mod.tipo === "aa")  gAA  += gModTotal;
      if (mod.tipo === "lip") gLip += gModTotal;
      if (mod.tipo === "dex") gDex += gModTotal;
    }

    const kcalDex = modo === "kabiven"   ? KCAL_DEX_KABIVEN
                  : modo === "omegaflex" ? KCAL_DEX_OMEGAFLEX
                  : KCAL_DEX_MAGISTRAL;

    const kAA  = gAA  * KCAL_AA;
    const kLip = gLip * KCAL_LIP;
    const kDex = gDex * kcalDex;
    const kTot = kAA + kLip + kDex;

    const kKg   = peso > 0 ? kTot / peso : 0;
    const aaKg  = peso > 0 ? gAA  / peso : 0;
    const lipKg = peso > 0 ? gLip / peso : 0;
    const dexKg = peso > 0 ? gDex / peso : 0;

    const velDexMgKgMin = (peso>0&&vel>0) ? (vel * comp.dex / 100) / peso * 1000 / 60 : 0;

    // Extrapolar a 24h para comparar contra rangos diarios
    const frac   = horas / 24;
    const kKg24  = frac > 0 ? kKg   / frac : 0;
    const aaKg24 = frac > 0 ? aaKg  / frac : 0;
    const lipKg24= frac > 0 ? lipKg / frac : 0;
    const dexKg24= frac > 0 ? dexKg / frac : 0;

    // Semáforo solo contra máximo
    const sK   = peso>0 ? semMax(kKg24,  RANGES_DIA.kcal.max) : "n";
    const sAA  = peso>0 ? semMax(aaKg24, RANGES_DIA.aa.max)   : "n";
    const sLip = peso>0 ? semMax(lipKg24,RANGES_DIA.lip.max)  : "n";
    const sDex = peso>0 ? semMax(dexKg24,RANGES_DIA.dex.max)  : "n";
    const sVD  = peso>0 ? semMax(velDexMgKgMin, VEL_MAX_MGKGMIN) : "n";

    const pAA  = kTot>0 ? (kAA/kTot)*100  : 0;
    const pLip = kTot>0 ? (kLip/kTot)*100 : 0;
    const pDex = kTot>0 ? (kDex/kTot)*100 : 0;

    // Rangos: siempre diarios reales
    const rangoKcal = `${RANGES_DIA.kcal.min}–${RANGES_DIA.kcal.max} kcal/kg/día`;
    const rangoAA   = `${RANGES_DIA.aa.min}–${RANGES_DIA.aa.max} g/kg/día`;
    const rangoLip  = `${RANGES_DIA.lip.min}–${RANGES_DIA.lip.max} g/kg/día`;
    const rangoDex  = `${RANGES_DIA.dex.min}–${RANGES_DIA.dex.max} g/kg/día`;

    setRes({ mlTotal, kTot, gAA, gLip, gDex, kAA, kLip, kDex,
             kKg24, aaKg24, lipKg24, dexKg24,
             kKg, aaKg, lipKg, dexKg,
             velDexMgKgMin, frac,
             sK, sAA, sLip, sDex, sVD,
             pAA, pLip, pDex,
             rangoKcal, rangoAA, rangoLip, rangoDex,
             vel, horas, peso, comp,
             modUsado: gModTotal > 0 ? { ...mod, gTotal: gModTotal } : null });
  };

  const clear = () => { setF(DEF); setMag(DEFM); setMod(DEFMOD); setRes(null); };

  const tabStyle = (active) => ({
    flex:1, padding:"9px 8px",
    background: active ? C.accent : C.input,
    color: active ? "#111" : C.muted,
    border: active ? `1px solid ${C.accent}` : `1px solid ${C.inputB}`,
    borderRadius:"8px",
    fontFamily:"'Syne',sans-serif", fontWeight:700,
    fontSize:"11px", letterSpacing:"1px",
    cursor:"pointer", transition:"all .15s",
  });

  return (
    <>
      <style>{FONTS}{css}</style>
      <div className="r">
        <div className="hdr">
          <div className="hdr-t">Nutrición Parenteral</div>
          <div className="hdr-s">Calculadora clínica · v9</div>
        </div>

        <div className="wrap">

          {/* FÓRMULA */}
          <div className="card">
            <div className="ct"><span className="cdot" style={{background:C.muted}}/>Fórmula · por 100 mL</div>
            <div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>
              <button style={tabStyle(modo==="kabiven")}    onClick={()=>{setModo("kabiven");    setRes(null);}}>Kabiven Central</button>
              <button style={tabStyle(modo==="omegaflex")}  onClick={()=>{setModo("omegaflex");  setRes(null);}}>Omegaflex</button>
              <button style={tabStyle(modo==="magistral")}  onClick={()=>{setModo("magistral");  setRes(null);}}>Fórmula magistral</button>
            </div>

            {(modo==="kabiven"||modo==="omegaflex") && (() => {
              const c = modo==="kabiven" ? KABIVEN : OMEGAFLEX;
              return (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
                  {[["Aminoácidos", c.aa],["Lípidos", c.lip],["Dextrosa", c.dex]].map(([lbl,val])=>(
                    <div key={lbl} style={{background:C.input,border:`1px solid ${C.inputB}`,borderRadius:"8px",padding:"10px 12px"}}>
                      <div style={{fontSize:"9px",color:C.dim,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"3px"}}>{lbl}</div>
                      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"18px",color:C.text}}>
                        {val}<span style={{fontSize:"9px",color:C.dim,marginLeft:"2px"}}>g</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            {modo==="magistral" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"}}>
                {[["aa","Aminoácidos"],["lip","Lípidos"],["dex","Dextrosa"]].map(([k,lbl])=>(
                  <div key={k} style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                    <label style={{fontSize:"10px",color:C.dim,letterSpacing:"1px",textTransform:"uppercase"}}>{lbl}</label>
                    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
                      <input type="number" value={mag[k]} onChange={setM(k)} placeholder="0.00" style={{paddingRight:"28px"}}/>
                      <span className="unit">g</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MÓDULO — colapsable */}
          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <button
              onClick={()=>setShowMod(p=>!p)}
              style={{width:"100%",background:"transparent",border:"none",cursor:"pointer",
                padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{width:"7px",height:"7px",borderRadius:"50%",background:"#6a9fc8",flexShrink:0,display:"inline-block"}}/>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"11px",
                  letterSpacing:"2.5px",textTransform:"uppercase",color:C.muted}}>Agregar módulo</span>
                {gModTotal > 0 && !showMod && (
                  <span style={{fontSize:"9px",color:"#6a9fc8",background:"rgba(106,159,200,.12)",
                    border:"1px solid rgba(106,159,200,.25)",borderRadius:"4px",padding:"2px 7px",marginLeft:"4px"}}>
                    {gModTotal.toFixed(1)} g · {kcalMod.toFixed(0)} kcal
                  </span>
                )}
              </div>
              <span style={{fontSize:"14px",color:C.dim,transition:"transform .2s",
                transform: showMod ? "rotate(180deg)" : "rotate(0deg)"}}>▾</span>
            </button>

            {showMod && (
              <div style={{padding:"0 22px 20px"}}>
                <div style={{height:"1px",background:"#222528",marginBottom:"16px"}}/>
                <div className="field" style={{marginBottom:"12px"}}>
                  <label>Nutriente</label>
                  <select value={mod.tipo} onChange={e=>{setMod(p=>({...p,tipo:e.target.value}));setRes(null);}}>
                    <option value="aa">Aminoácidos</option>
                    <option value="lip">Lípidos</option>
                    <option value="dex">Dextrosa</option>
                  </select>
                </div>
                <div className="g3">
                  <div className="field">
                    <label>Velocidad</label>
                    <div className="iw">
                      <input type="number" value={mod.vel}   onChange={setMod2("vel")}   placeholder="0"/>
                      <span className="unit">mL/h</span>
                    </div>
                  </div>
                  <div className="field">
                    <label>Concentración</label>
                    <div className="iw">
                      <input type="number" value={mod.conc}  onChange={setMod2("conc")}  placeholder="0"/>
                      <span className="unit">g/100mL</span>
                    </div>
                  </div>
                  <div className="field">
                    <label>Horas</label>
                    <div className="iw">
                      <input type="number" value={mod.horas} onChange={setMod2("horas")} placeholder="0"/>
                      <span className="unit">h</span>
                    </div>
                  </div>
                </div>
                {gModTotal > 0 && (
                  <div style={{marginTop:"12px",background:"rgba(106,159,200,.08)",border:"1px solid rgba(106,159,200,.2)",
                    borderRadius:"8px",padding:"10px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:"10px",color:"#6a9fc8"}}>{gModTotal.toFixed(1)} g de {modLabel}</div>
                    <div style={{fontSize:"10px",color:C.muted}}>{kcalMod.toFixed(0)} kcal · {modVel} mL/h × {modHoras}h</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PACIENTE */}
          <div className="card">
            <div className="ct"><span className="cdot"/>Paciente e infusión</div>
            <div className="g3">
              <div className="field">
                <label>Peso</label>
                <div className="iw">
                  <input type="number" value={f.peso}  onChange={set("peso")}  placeholder="70"/>
                  <span className="unit">kg</span>
                </div>
              </div>
              <div className="field">
                <label>Velocidad</label>
                <div className="iw">
                  <input type="number" value={f.vel}   onChange={set("vel")}   placeholder="62"/>
                  <span className="unit">mL/h</span>
                </div>
              </div>
              <div className="field">
                <label>Horas</label>
                <div className="iw">
                  <input type="number" value={f.horas} onChange={set("horas")} placeholder="24"/>
                  <span className="unit">h</span>
                </div>
              </div>
            </div>
          </div>

          <button className="btn-c" onClick={calc}>Calcular</button>
          <button className="btn-x" onClick={clear}>Limpiar</button>

          {/* RESULTADOS */}
          {res && (
            <div className="card">

              <div className="sec">Aporte en {res.horas}h · {res.vel} mL/h</div>

              {res.modUsado && (
                <div style={{fontSize:"10px",color:"#6a9fc8",marginBottom:"10px",
                  background:"rgba(106,159,200,.07)",border:"1px solid rgba(106,159,200,.18)",
                  borderRadius:"7px",padding:"8px 12px"}}>
                  + Módulo: {res.modUsado.gTotal.toFixed(1)} g de {modLabel} ({kcalMod.toFixed(0)} kcal)
                </div>
              )}

              <div className="g2" style={{marginBottom:"8px"}}>
                <RC gold label="kcal totales"   value={res.kTot.toFixed(0)}    unit={`kcal en ${res.horas}h`}/>
                <RC      label="mL fórmula"     value={res.mlTotal.toFixed(0)} unit={`mL en ${res.horas}h`} s="n"/>
              </div>
              <div className="g3">
                <RC s="n" label="AA"       value={`${res.gAA.toFixed(1)} g`}  unit={`${res.kAA.toFixed(0)} kcal`}/>
                <RC s="n" label="Lípidos"  value={`${res.gLip.toFixed(1)} g`} unit={`${res.kLip.toFixed(0)} kcal`}/>
                <RC s="n" label="Dextrosa" value={`${res.gDex.toFixed(1)} g`} unit={`${res.kDex.toFixed(0)} kcal`}/>
              </div>

              <div className="sep"/>

              {/* Por kg — valor extrapolado a 24h vs rango diario */}
              <div className="sec">Por kg/día · equiv. 24h{res.peso>0 ? ` · ${res.peso} kg` : ""}</div>
              <div className="g2">
                <RC label="kcal / kg/día"  value={res.kKg24.toFixed(1)}   unit={res.rangoKcal} s={res.sK}/>
                <RC label="Aminoácidos"    value={res.aaKg24.toFixed(2)}  unit={res.rangoAA}   s={res.sAA}/>
                <RC label="Lípidos"        value={res.lipKg24.toFixed(2)} unit={res.rangoLip}  s={res.sLip}/>
                <RC label="Dextrosa"       value={res.dexKg24.toFixed(2)} unit={res.rangoDex}  s={res.sDex}/>
              </div>

              {(res.sDex==="y"||res.sDex==="r") && <AlertaESPEN items={ALERTAS.dex[res.sDex]} tipo={res.sDex}/>}
              {(res.sLip==="y"||res.sLip==="r") && <AlertaESPEN items={ALERTAS.lip[res.sLip]} tipo={res.sLip}/>}
              {(res.sAA==="y" ||res.sAA==="r")  && <AlertaESPEN items={ALERTAS.aa[res.sAA]}   tipo={res.sAA}/>}
              {(res.sK==="y"  ||res.sK==="r")   && <AlertaESPEN items={ALERTAS.kcal[res.sK]}  tipo={res.sK}/>}

              <div className="sep"/>

              <div className="sec">Velocidad oxidación dextrosa · ESPEN</div>
              <div className="g2">
                <RC label="mg/kg/min" value={res.velDexMgKgMin.toFixed(2)} unit="límite: 5 mg/kg/min"      s={res.sVD}/>
                <RC label="g/kg/h"   value={(res.velDexMgKgMin*60/1000).toFixed(3)} unit="equivalente"     s={res.sVD}/>
              </div>
              {(res.sVD==="y"||res.sVD==="r") && <AlertaESPEN items={ALERTAS.velD[res.sVD]} tipo={res.sVD}/>}

              <div className="sep"/>

              <div style={{fontSize:"9px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"4px"}}>Distribución calórica</div>
              <div className="bar-bg">
                <div className="bar-seg" style={{width:`${res.pAA}%`,  background:C.accent}}/>
                <div className="bar-seg" style={{width:`${res.pLip}%`, background:"#6a9fc8"}}/>
                <div className="bar-seg" style={{width:`${res.pDex}%`, background:"#6abf8a"}}/>
              </div>
              <div className="bar-leg">
                <span className="bleg"><span className="bleg-d" style={{background:C.accent}}/>AA {res.pAA.toFixed(0)}%</span>
                <span className="bleg"><span className="bleg-d" style={{background:"#6a9fc8"}}/>Lípidos {res.pLip.toFixed(0)}%</span>
                <span className="bleg"><span className="bleg-d" style={{background:"#6abf8a"}}/>Dextrosa {res.pDex.toFixed(0)}%</span>
              </div>

              <div className="foot">
                * {modo==="kabiven" ? "Kabiven Central" : modo==="omegaflex" ? "Omegaflex" : "Fórmula magistral"} · {res.comp.aa} g AA / {res.comp.lip} g lip / {res.comp.dex} g dex por 100 mL.<br/>
                * Valores por kg extrapolados a 24h · Alertas solo por exceso del límite superior.<br/>
                * Vel. oxidación límite ESPEN 5 mg/kg/min · Basado en guías ESPEN 2009/2019.<br/>
                * Herramienta de apoyo clínico. No reemplaza el criterio profesional.
              </div>
            </div>
          )}
          {/* NPT INTERMITENTE — colapsable */}
          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <button
              onClick={()=>setShowInterm(p=>!p)}
              style={{width:"100%",background:"transparent",border:"none",cursor:"pointer",
                padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{width:"7px",height:"7px",borderRadius:"50%",background:"#9a7fc8",flexShrink:0,display:"inline-block"}}/>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"11px",
                  letterSpacing:"2.5px",textTransform:"uppercase",color:C.muted}}>NPT intermitente · Curva ESPEN</span>
                {curva && !showInterm && (
                  <span style={{fontSize:"9px",color:"#9a7fc8",background:"rgba(154,127,200,.12)",
                    border:"1px solid rgba(154,127,200,.25)",borderRadius:"4px",padding:"2px 7px",marginLeft:"4px"}}>
                    {curva.velPlena.toFixed(0)} mL/h plena
                  </span>
                )}
              </div>
              <span style={{fontSize:"14px",color:C.dim,transition:"transform .2s",
                transform: showInterm ? "rotate(180deg)" : "rotate(0deg)"}}>▾</span>
            </button>

            {showInterm && (
              <div style={{padding:"0 22px 22px"}}>
                <div style={{height:"1px",background:"#222528",marginBottom:"16px"}}/>

                {/* Selector protocolo */}
                <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
                  {[
                    ["1","1 escalón · Hospitalario","1h 50% → plena → 1h 50%"],
                    ["2","2 escalones · NPD / Diabético","30min 25% → 30min 50% → plena → inverso"],
                  ].map(([val,lbl,sub])=>(
                    <button key={val} onClick={()=>{setProto(val);setCurva(null);}} style={{
                      flex:1, padding:"10px 8px", textAlign:"left",
                      background: proto===val ? "rgba(154,127,200,.15)" : C.input,
                      border: proto===val ? "1px solid #9a7fc8" : `1px solid ${C.inputB}`,
                      borderRadius:"8px", cursor:"pointer", transition:"all .15s",
                    }}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"10px",
                        letterSpacing:"1px",color: proto===val ? "#c0a0f0" : C.muted,marginBottom:"3px"}}>{lbl}</div>
                      <div style={{fontSize:"9px",color:C.dim,lineHeight:1.4}}>{sub}</div>
                    </button>
                  ))}
                </div>

                {/* Info protocolo */}
                <div style={{fontSize:"10px",color:C.dim,marginBottom:"14px",lineHeight:1.7,
                  background:"#13151a",borderRadius:"7px",padding:"10px 13px",borderLeft:"3px solid #9a7fc8"}}>
                  {proto==="1"
                    ? <>Protocolo estándar hospitalario. Rampa de <strong style={{color:C.muted}}>1h al 50%</strong> al inicio y fin. Para pacientes estables sin diabetes.</>
                    : <>Protocolo para NPD o pacientes con insulina/diabetes. Doble escalón: <strong style={{color:C.muted}}>30min al 25%</strong> + <strong style={{color:C.muted}}>30min al 50%</strong> → plena → inverso al fin.</>
                  }
                </div>

                <div className="g2">
                  <div className="field">
                    <label>mL totales a infundir</label>
                    <div className="iw">
                      <input type="number" value={interm.mlTotal}
                        onChange={e=>{setInterm(p=>({...p,mlTotal:e.target.value}));setCurva(null);}}
                        placeholder="1500"/>
                      <span className="unit">mL</span>
                    </div>
                  </div>
                  <div className="field">
                    <label>Horas totales</label>
                    <div className="iw">
                      <input type="number" value={interm.horasTotal}
                        onChange={e=>{setInterm(p=>({...p,horasTotal:e.target.value}));setCurva(null);}}
                        placeholder="12"/>
                      <span className="unit">h</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={()=>{ const fn=proto==="1"?calcCurva1:calcCurva2; setCurva(fn(+interm.mlTotal,+interm.horasTotal)); }}
                  style={{marginTop:"12px",width:"100%",padding:"11px",
                    background:"#9a7fc8",color:"#111",border:"none",borderRadius:"8px",
                    fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"11px",
                    letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer"}}>
                  Generar curva
                </button>

                {+interm.horasTotal > 0 && +interm.horasTotal < 3 && (
                  <div style={{marginTop:"10px",fontSize:"10px",color:"#e87070",
                    background:"rgba(232,85,85,.07)",border:"1px solid rgba(232,85,85,.2)",
                    borderRadius:"7px",padding:"9px 12px"}}>
                    ✕ Mínimo 3 horas para aplicar el protocolo ESPEN.
                  </div>
                )}

                {curva && (() => {
                  const hT = +interm.horasTotal;
                  return (
                    <div style={{marginTop:"18px"}}>
                      <div style={{display:"grid",gridTemplateColumns:proto==="2"?"1fr 1fr 1fr":"1fr 1fr",gap:"8px",marginBottom:"14px"}}>
                        {[
                          { lbl:"Vel. plena", val:curva.velPlena.toFixed(1), sub:"mL/h · 100%", c:"#9a7fc8" },
                          { lbl:"Vel. 50%", val:(curva.vel50||curva.velRampa).toFixed(1), sub:"mL/h · escalón", c:"#6a7fc8" },
                          ...(proto==="2"?[{ lbl:"Vel. 25%", val:curva.vel25.toFixed(1), sub:"mL/h · escalón", c:"#4a6fc8" }]:[]),
                        ].map((item,i)=>(
                          <div key={i} style={{background:"#13151a",border:"1px solid #2a2d32",
                            borderLeft:`3px solid ${item.c}`,borderRadius:"8px",padding:"11px 13px"}}>
                            <div style={{fontSize:"9px",color:C.muted,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"4px"}}>{item.lbl}</div>
                            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"20px",color:C.text,lineHeight:1}}>{item.val}</div>
                            <div style={{fontSize:"10px",color:C.dim,marginTop:"2px"}}>{item.sub}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{fontSize:"9px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"8px"}}>Esquema paso a paso</div>
                      <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                        {curva.pasos.map((p,i)=>(
                          <div key={i} style={{background:"#13151a",border:"1px solid #2a2d32",
                            borderLeft:`3px solid ${p.color}`,borderRadius:"8px",
                            padding:"9px 13px 9px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div>
                              <div style={{fontSize:"10px",color:C.text,fontWeight:600,marginBottom:"2px"}}>{p.label}</div>
                              <div style={{fontSize:"9px",color:C.dim}}>{p.tiempo} · {p.dur}</div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"17px",color:p.color}}>
                                {p.vel.toFixed(1)} <span style={{fontSize:"10px",color:C.dim,fontFamily:"'DM Mono',monospace",fontWeight:400}}>mL/h</span>
                              </div>
                              <div style={{fontSize:"9px",color:C.dim,marginTop:"1px"}}>{p.vol.toFixed(0)} mL</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{marginTop:"14px"}}>
                        <div style={{fontSize:"9px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"6px"}}>Perfil de infusión</div>
                        <div style={{display:"flex",height:"48px",gap:"2px",alignItems:"flex-end",
                          borderBottom:"1px solid #2a2d32",paddingBottom:"4px"}}>
                          {curva.barras.map((b,i)=>(
                            <div key={i} style={{flex:b.flex,background:b.bg,borderRadius:"3px 3px 0 0",
                              height:b.h,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                              <span style={{fontSize:"7px",color:"#c0b0f0",textAlign:"center",padding:"0 2px"}}>{b.label}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:"8px",color:C.dim,marginTop:"4px"}}>
                          {curva.ticks.map((t,i)=><span key={i}>{t}</span>)}
                        </div>
                      </div>

                      <div style={{marginTop:"12px",background:"rgba(154,127,200,.07)",
                        border:"1px solid rgba(154,127,200,.2)",borderRadius:"7px",
                        padding:"10px 13px",fontSize:"9px",color:"#a08ad0",lineHeight:1.8}}>
                        ✓ Vol. verificado: {curva.volCheck.toFixed(0)} mL de {interm.mlTotal} mL.<br/>
                        {proto==="1"
                          ? `✓ Protocolo 1 escalón: 1h 50% → plena ${hT-2}h → 1h 50%.`
                          : `✓ Protocolo 2 escalones: 30min 25% → 30min 50% → plena ${hT-2}h → 30min 50% → 30min 25%.`
                        }<br/>
                        ✓ Previene hipoglucemia de rebote e hiperinsulinismo (ESPEN, 2023).
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
