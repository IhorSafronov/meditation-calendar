const RUNES=[null,
 ["ᚠ","Феху","достаток, енергія, початок"],["ᚢ","Уруз","сила, здоров'я, витривалість"],["ᚦ","Турисаз","захист, прорив, рішучість"],
 ["ᚨ","Ансуз","слово, знання, знаки"],["ᚱ","Райдо","шлях, ритм, рух"],["ᚲ","Кеназ","вогонь, ясність, творчість"],
 ["ᚷ","Гебо","дар, партнерство, рівновага"],["ᚹ","Вуньо","радість, гармонія"],["ᚺ","Хагалаз","руйнування старого, очищення"],
 ["ᚾ","Наутиз","потреба, терпіння, урок"],["ᛁ","Іса","пауза, зосередження"],["ᛃ","Йера","цикл, врожай, результат праці"],
 ["ᛇ","Ейваз","вісь світів, стійкість, перехід"],["ᛈ","Перт","таємниця, доля, приховане"],["ᛉ","Альгіз","захист, зв'язок з вищим"],
 ["ᛊ","Соулу","сонце, перемога, цілісність"],["ᛏ","Тейваз","воля, справедливість, мета"],["ᛒ","Беркана","ріст, турбота, нове життя"],
 ["ᛖ","Еваз","рух уперед, довіра, зміни"],["ᛗ","Манназ","людина, самопізнання"],["ᛚ","Лагуз","вода, інтуїція, потік"],
 ["ᛜ","Інгуз","зерно, завершення, потенціал"],["ᛟ","Отала","рід, дім, спадок"],["ᛞ","Дагаз","світанок, пробудження, прорив"]];
const KEY="pro-runes-meditation-v1";
const $=id=>document.getElementById(id);
let S=null; // {dob:"DDMMYYYY", start:"YYYY-MM-DD", done:number}

function reduce(n){return n>24?String(n).split("").reduce((a,b)=>a+ +b,0):n;}
function computeRunes(dob){ // dob "DDMMYYYY"
  const pairs=[dob.slice(0,2),dob.slice(2,4),dob.slice(4,6),dob.slice(6,8)];
  return pairs.map(p=>({raw:p,n:reduce(parseInt(p,10))})).filter(x=>x.n>0);
}
const CYCLES=3;
function buildDays(runes){const d=[];for(let c=0;c<CYCLES;c++)runes.forEach((r,ri)=>{for(let i=1;i<=r.n;i++)d.push({c,ri,i,n:r.n});});return d;}
function parseDob(v){
  const m=v.trim().match(/^(\d{1,2})[.\-\/ ](\d{1,2})[.\-\/ ](\d{4})$/);
  if(!m)return null;
  const dd=+m[1],mm=+m[2],yy=+m[3];
  const dt=new Date(yy,mm-1,dd);
  if(dt.getFullYear()!==yy||dt.getMonth()!==mm-1||dt.getDate()!==dd||yy<1900||dt>new Date())return null;
  return String(dd).padStart(2,"0")+String(mm).padStart(2,"0")+yy;
}
function addDays(iso,n){const [y,m,d]=iso.split("-").map(Number);const t=new Date(y,m-1,d+n);return t;}
function fmt(t){return String(t.getDate()).padStart(2,"0")+"."+String(t.getMonth()+1).padStart(2,"0");}
function ymd(t){return t.getFullYear()+String(t.getMonth()+1).padStart(2,"0")+String(t.getDate()).padStart(2,"0");}
function todayISO(){const t=new Date();return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0");}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function load(){try{const v=JSON.parse(localStorage.getItem(KEY));if(v&&v.dob&&v.start)return v;}catch(e){}return null;}
function makeCode(){return S.dob+"-"+S.start.replace(/-/g,"")+"-"+S.done;}
function parseCode(c){
  const m=c.trim().match(/^(\d{8})-(\d{8})-(\d{1,3})$/);if(!m)return null;
  const dob=m[1];if(!parseDob(dob.slice(0,2)+"."+dob.slice(2,4)+"."+dob.slice(4)))return null;
  return {dob,start:m[2].slice(0,4)+"-"+m[2].slice(4,6)+"-"+m[2].slice(6),done:+m[3]};
}

function dayDiff(a,b){return Math.round((b-a)/864e5);} // b-a in days
function T(){return new Date(todayISO());}
function checkMissed(total){
  // returns notice text or ""
  const today=T(), start=addDays(S.start,0);
  if(S.done===0){ if(today>start){S.start=todayISO();} return ""; }
  if(S.done>=total) return "";
  const nextDue=addDays(S.start,S.done); // date when next mark is due
  if(dayDiff(nextDue,today)>0){ // missed at least one day
    const missed=fmt(nextDue);
    S.done=0; S.start=todayISO(); S.attempt=(S.attempt||1)+1;
    return `Медитацію ${missed} пропущено, тому цикл почався заново з сьогоднішнього дня. Спроба №${S.attempt}. Увімкни нагадування, щоб це не повторилось.`;
  }
  return "";
}
function render(note){
  const runes=computeRunes(S.dob), days=buildDays(runes), total=days.length;
  S.done=Math.max(0,Math.min(S.done,total));
  const miss=checkMissed(total); note=miss||note||"";
  $("notice").hidden=!note; $("notice").textContent=note;
  $("setup").hidden=true; $("plan").hidden=false;
  const per=total/CYCLES, curC=Math.min(CYCLES-1,Math.floor(S.done/per)), pos=S.done>=total?per:S.done-curC*per;
  let acc=0;
  $("runes").innerHTML=runes.map((r,ri)=>{
    const from=acc, to=acc+r.n; acc=to;
    const cls=pos>=to?"complete":(pos>=from?"current":"");
    const R=RUNES[r.n];
    return `<div class="rcard ${cls}"><div class="glyph">${R[0]}</div><div class="rname">${R[1]}</div><div class="rdays">${r.n} ${plural(r.n)}</div></div>`;
  }).join("");
  const p=[S.dob.slice(0,2),S.dob.slice(2,4),S.dob.slice(4,6),S.dob.slice(6,8)];
  $("formula").textContent=`Дата ${p[0]}.${p[1]}.${p[2]}${p[3]} → пари ${p.join(" · ")}. Число більше 24 — складаємо цифри, 0 — руни немає. Одне коло — ${per} ${plural(per)}, кіл — ${CYCLES}, разом ${total} ${plural(total)} без перерви.`;
  const today=T(), nextDue=addDays(S.start,S.done), wait=dayDiff(today,nextDue); // wait>0: next mark in future
  if(S.done>=total){
    $("today").innerHTML=`<div class="glyph">ᛞ</div><div><div class="eyebrow">медитації завершено</div><h2>Ти пройшов усі ${CYCLES} кола</h2><p class="small">${total} ${plural(total)} практики без жодного пропуску.</p></div>`;
  }else{
    const d=days[S.done],R=RUNES[runes[d.ri].n];
    const when=wait<=0?"сьогодні":(wait===1?"завтра":fmt(nextDue));
    $("today").innerHTML=`<div class="glyph">${R[0]}</div><div><div class="eyebrow">медитація ${when} · коло ${d.c+1} з ${CYCLES} · день ${S.done+1} з ${total}</div><h2>${R[1]} — день ${d.i} з ${d.n}</h2><p class="small">Прочитай медитацію руни ${R[1]}</p></div>`;
  }
  $("barFill").style.width=(S.done/total*100)+"%";
  $("statDone").textContent=`Виконано: ${S.done} з ${total}`;
  $("statPlan").textContent=S.done>=total?"":`Завершення: ${fmt(addDays(S.start,total-1))}`;
  const mb=$("markBtn");
  if(S.done>=total){mb.disabled=true;mb.textContent="Цикл завершено";}
  else if(wait>0){mb.disabled=true;mb.textContent=S.done===0?`Старт ${fmt(nextDue)}`:"Сьогодні вже відмічено ✓ Повертайся завтра";}
  else{mb.disabled=false;mb.textContent="Відмітити сьогоднішню медитацію";}
  const lastMarked=S.done>0?addDays(S.start,S.done-1):null;
  $("undoBtn").hidden=!(lastMarked&&dayDiff(lastMarked,today)===0);
  let cal="";
  for(let c=0;c<CYCLES;c++){
    const cStart=c*per, cDone=S.done>=cStart+per, cCur=S.done>=cStart&&!cDone;
    cal+=`<details class="cycle" ${cCur||(c===CYCLES-1&&S.done>=total)?"open":""}><summary><span>Коло ${c+1} з ${CYCLES}</span><span class="small">${fmt(addDays(S.start,cStart))} — ${fmt(addDays(S.start,cStart+per-1))}${cDone?" · ✓":""}</span></summary>`;
    cal+=runes.map((r,ri)=>{
      const R=RUNES[r.n];
      const cells=days.map((d,idx)=>({d,idx})).filter(x=>x.d.c===c&&x.d.ri===ri).map(({d,idx})=>{
        const cls=idx<S.done?"done":(idx===S.done?"next":"");
        return `<div class="day ${cls}" title="${R[1]}, день ${d.i}">${d.i}<small>${fmt(addDays(S.start,idx))}</small></div>`;}).join("");
      return `<div class="group"><h3><span>${R[0]}</span>${R[1]}</h3><div class="days">${cells}</div></div>`;
    }).join("")+"</details>";
  }
  $("calendar").innerHTML=cal;
  $("codeOut").value=makeCode();
  updateGcal(total);
  save();
}
function updateGcal(total){
  total=total||buildDays(computeRunes(S.dob)).length;
  const left=Math.max(1,total-S.done);
  const first=addDays(S.start,S.done); // next due day
  const [h,m]=($("remTime").value||"08:00").split(":");
  const t1=ymd(first)+"T"+h+m+"00";
  const e=new Date(first); e.setHours(+h,+m+15);
  const t2=ymd(e)+"T"+String(e.getHours()).padStart(2,"0")+String(e.getMinutes()).padStart(2,"0")+"00";
  let tz="";try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||"";}catch(err){}
  const txt=encodeURIComponent("Рунна медитація · відміть день");
  const det=encodeURIComponent("Прочитай медитацію і відміть день на сайті. Пропуск — цикл заново.\nКод прогресу: "+makeCode());
  $("gcal").href=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${txt}&details=${det}&dates=${t1}/${t2}${tz?"&ctz="+encodeURIComponent(tz):""}&recur=RRULE:FREQ=DAILY;COUNT=${left}`;
}
function plural(n){const a=n%10,b=n%100;if(a===1&&b!==11)return"день";if(a>=2&&a<=4&&(b<12||b>14))return"дні";return"днів";}

$("start").value=todayISO();
$("form").addEventListener("submit",e=>{
  e.preventDefault();
  const dob=parseDob($("dob").value);
  if(!dob){$("err").hidden=false;$("err").textContent="Введи дату у форматі ДД.ММ.РРРР, наприклад 14.04.1990";return;}
  if(!$("start").value){$("err").hidden=false;$("err").textContent="Обери дату початку";return;}
  $("err").hidden=true;
  S={dob,start:$("start").value,done:0,attempt:1}; render(); $("plan").scrollIntoView({behavior:"smooth"});
});
$("markBtn").onclick=()=>{if(dayDiff(addDays(S.start,S.done),T())===0){S.done++;render();}};
$("undoBtn").onclick=()=>{if(S.done>0){S.done--;render();}};
$("resetBtn").onclick=()=>{if($("resetBtn").dataset.sure){try{localStorage.removeItem(KEY);}catch(e){}S=null;$("plan").hidden=true;$("setup").hidden=false;$("resetBtn").textContent="Почати заново";delete $("resetBtn").dataset.sure;}else{$("resetBtn").dataset.sure=1;$("resetBtn").textContent="Точно? Натисни ще раз";}};
$("copyBtn").onclick=()=>{const v=$("codeOut").value;const ok=()=>{$("copyBtn").textContent="Скопійовано";setTimeout(()=>$("copyBtn").textContent="Копіювати",1500);};
  if(navigator.clipboard)navigator.clipboard.writeText(v).then(ok).catch(()=>{$("codeOut").select();});else $("codeOut").select();};
$("restoreBtn").onclick=()=>{const s=parseCode($("restoreInput").value);if(!s){$("restoreInput").value="";$("restoreInput").placeholder="Код не підходить, перевір";return;}S=s;render();};
$("remTime").addEventListener("input",()=>{if(S)updateGcal();});
S=load(); if(S)render();
