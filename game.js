(() => {
  "use strict";

  const $ = s => document.querySelector(s);
  const screens = [...document.querySelectorAll(".screen")];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (n,a,b) => Math.max(a, Math.min(b,n));

  const state = {
    round: 0,
    sound: true,
    reaction: [],
    mistakes: 0,
    composure: 0,
    predictability: 0,
    score: 0,
    challengeScore: new URLSearchParams(location.search).get("challenge"),
    startedAt: 0,
    audio: null
  };

  function show(id) {
    screens.forEach(s => s.classList.toggle("active", s.id === id));
  }

  function beep(freq=440, duration=.06, type="sine") {
    if (!state.sound) return;
    try {
      state.audio ??= new (window.AudioContext || window.webkitAudioContext)();
      const ctx = state.audio, osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = type; osc.frequency.value = freq;
      gain.gain.setValueAtTime(.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.045, ctx.currentTime+.01);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime+duration);
      osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+duration+.02);
    } catch {}
  }

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1800);
  }

  function setProgress(n) { $(".progress span").style.width = `${n}%`; }

  async function start() {
    state.round = 0; state.reaction=[]; state.mistakes=0; state.composure=0;
    state.predictability=0; state.startedAt=performance.now();
    show("screen-calibration"); setProgress(0);
    $("#cal-text").textContent = "WAIT…";
    await sleep(700); $("#cal-text").textContent = "MOVE YOUR EYES TO THE DOT";
    await sleep(900); $(".cal-dot").style.transform = "translateX(110px)";
    await sleep(500); $("#cal-text").textContent = "GOOD.";
    setProgress(12); await sleep(650);
    runRound(1);
  }

  function setupRound(n) {
    state.round = n;
    $("#round-label").textContent = `ROUND ${String(n).padStart(2,"0")} / 05`;
    $("#timer-label").textContent = "READY";
    $("#game-content").innerHTML = "";
    setProgress(12 + n * 13);
  }

  async function runRound(n) {
    setupRound(n);
    show("screen-game");
    if (n===1) return round1();
    if (n===2) return round2();
    if (n===3) return round3();
    if (n===4) return round4();
    if (n===5) return round5();
  }

  function round1() {
    const box = document.createElement("div");
    box.innerHTML = `<div class="mini" style="position:absolute;top:42%;left:50%;transform:translate(-50%,-60px)">KEEP IT CENTERED</div><div class="dot" aria-label="target"></div>`;
    $("#game-content").append(box);
    const dot = box.querySelector(".dot");
    let x = 0, y = 0, start = performance.now();
    const move = e => {
      x = (e.clientX - innerWidth/2) / innerWidth;
      y = (e.clientY - innerHeight/2) / innerHeight;
    };
    addEventListener("mousemove", move, {once:false});
    const timer = setInterval(() => {
      const d = Math.sqrt(x*x+y*y);
      if (d < .10) state.composure += 1;
      $("#timer-label").textContent = `${Math.max(0, Math.ceil(5-(performance.now()-start)/1000))}s`;
      if (performance.now()-start > 5000) {
        clearInterval(timer); removeEventListener("mousemove", move);
        beep(660); runRound(2);
      }
    }, 100);
  }

  function round2() {
    const content = $("#game-content");
    content.innerHTML = `<div class="mini">WAIT FOR THE RED SCREEN</div>`;
    const delay = 850 + Math.random()*1700;
    const started = performance.now();
    setTimeout(() => {
      const red = document.createElement("div");
      red.className = "red-stage";
      red.innerHTML = `<div class="click-word">CLICK</div>`;
      content.innerHTML = ""; content.appendChild(red);
      const shown = performance.now();
      $("#timer-label").textContent = "NOW";
      beep(880,.08);
      const finish = () => {
        state.reaction.push(performance.now()-shown);
        red.removeEventListener("click", finish);
        beep(560); runRound(3);
      };
      red.addEventListener("click", finish);
      setTimeout(() => { if (red.isConnected) { state.mistakes++; runRound(3); } }, 1800);
    }, delay);
    const tick = setInterval(() => {
      if (state.round !== 2) clearInterval(tick);
      else $("#timer-label").textContent = `${((performance.now()-started)/1000).toFixed(1)}s`;
    },100);
  }

  async function round3() {
    const c=$("#game-content");
    c.innerHTML=`<div class="timer">5</div>`;
    let n=5;
    await sleep(700);
    for (n=5;n>=0;n--) {
      if (state.round!==3) return;
      c.querySelector(".timer").textContent = n;
      $("#timer-label").textContent = "DO NOT LOOK AWAY";
      await sleep(650);
    }
    c.innerHTML=`<div class="mini">YOU WERE SUPPOSED TO WAIT.</div>`;
    state.composure += 1; beep(320);
    await sleep(1000); runRound(4);
  }

  function round4() {
    const c=$("#game-content");
    c.innerHTML=`<div class="cursor-note">DON'T MOVE YOUR CURSOR.<br><br>Seriously. Leave it exactly where it is.</div>`;
    const handler = () => {
      state.mistakes++; state.predictability += 2;
      c.innerHTML=`<div class="warning"><div class="bar"></div><strong>I KNEW YOU WOULD MOVE.</strong><p>Most people move within the first two seconds after being told not to.</p></div>`;
      beep(180,.1,"square");
      removeEventListener("mousemove",handler);
      setTimeout(()=>runRound(5),1200);
    };
    addEventListener("mousemove", handler, {once:true});
    setTimeout(()=>{
      if(state.round===4){
        removeEventListener("mousemove",handler);
        c.innerHTML=`<div class="mini">INTERESTING.</div>`;
        state.composure+=2;
        setTimeout(()=>runRound(5),1000);
      }
    },3500);
  }

  function round5() {
    const c=$("#game-content");
    c.innerHTML=`<div class="warning"><div class="bar"></div><strong>BEHAVIORAL ANALYSIS</strong><p>Pattern confidence: <b>87%</b></p><p>Next action prediction: <b>CLICK</b></p><p>Recommendation: DO NOT CLICK ANYTHING.</p></div>`;
    const bait=document.createElement("button");
    bait.className="bait"; bait.textContent="CLICK ME";
    bait.style.left="50%"; bait.style.top="68%"; bait.style.transform="translate(-50%,-50%)";
    bait.onclick=()=>{state.mistakes++;state.predictability+=4; bait.textContent="PREDICTABLE."; bait.disabled=true; beep(150,.12,"square");};
    c.appendChild(bait);
    setTimeout(()=>finalTest(),3200);
  }

  async function finalTest() {
    show("screen-game"); state.round=6;
    $("#round-label").textContent="FINAL TEST";
    $("#timer-label").textContent="10s";
    $("#game-content").innerHTML=`<div class="warning"><div class="bar"></div><strong>DON'T CLICK ANYTHING.</strong><p>There is no final button.</p><p class="mini">Just wait.</p></div>`;
    const tempting=document.createElement("button");
    tempting.className="bait"; tempting.textContent="FINISH";
    tempting.style.left="50%"; tempting.style.top="70%"; tempting.style.transform="translate(-50%,-50%)";
    tempting.onclick=()=>{state.mistakes++;state.predictability+=5; tempting.textContent="YOU CLICKED."; tempting.disabled=true; beep(120,.15,"square");};
    $("#game-content").appendChild(tempting);
    for(let i=10;i>=0;i--){
      $("#timer-label").textContent=`${i}s`; await sleep(500);
    }
    showAnalysis();
  }

  async function showAnalysis() {
    show("screen-analysis");
    const lines=[
      "Analyzing response patterns…",
      "Measuring reaction variance…",
      "Comparing behavioral choices…",
      "Estimating predictability…",
      "Building final profile…"
    ];
    for(const line of lines){ $("#analysis-line").textContent=line; await sleep(500); }
    calculate();
  }

  function calculate() {
    const reactions=state.reaction.length ? state.reaction : [999];
    const avg=reactions.reduce((a,b)=>a+b,0)/reactions.length;
    const reactionScore=clamp(Math.round(100-(avg/10)),45,99);
    const compScore=clamp(65+state.composure*7-state.mistakes*8,18,98);
    const predScore=clamp(91-state.mistakes*12-state.predictability*2,12,96);
    state.score=clamp(Math.round(reactionScore*.34+compScore*.33+predScore*.33),1,99);
    $("#score").textContent=state.score;
    $("#stat-reaction").textContent=reactionScore;
    $("#stat-composure").textContent=compScore;
    $("#stat-predict").textContent=predScore;
    const rating=state.score>=90?"VERY HARD TO READ":state.score>=75?"UNPREDICTABLE":state.score>=55?"MOSTLY PREDICTABLE":"EXTREMELY PREDICTABLE";
    $("#rating").textContent=rating;
    const best=Number(localStorage.getItem("dontblink-best")||0);
    if(state.score>best) localStorage.setItem("dontblink-best",state.score);
    const url=new URL(location.href);
    url.searchParams.set("challenge",state.score);
    $("#challenge").textContent=`CHALLENGE LINK: ${url.toString()}`;
    show("screen-result");
  }

  function shareText() {
    const score=state.score;
    return `I scored ${score}% on DON'T BLINK.\n\nHow predictable are you?\n${location.href.split("?")[0]}?challenge=${score}`;
  }

  function getChallengeUrl() {
    const base = location.href.split("?")[0].split("#")[0];
    return `${base}?challenge=${state.score}`;
  }

  async function share() {
    const url = getChallengeUrl();
    const text = `I scored ${state.score}% on DON'T BLINK.\n\nCan you beat me?`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "DON'T BLINK", text, url });
        $("#share-status").textContent = "SHARED SUCCESSFULLY";
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    const xUrl = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(`${text}\n${url}`);
    const popup = window.open(xUrl, "_blank", "noopener,noreferrer");
    if (popup) {
      $("#share-status").textContent = "OPENING X…";
      return;
    }
    $("#share-status").innerHTML = `<a href="${xUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">OPEN X TO SHARE</a>`;
  }

  async function copy() {
    const url = getChallengeUrl();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        toast("CHALLENGE LINK COPIED");
        return;
      }
      const area = document.createElement("textarea");
      area.value = url; area.style.position = "fixed"; area.style.opacity = "0";
      document.body.appendChild(area); area.focus(); area.select();
      const ok = document.execCommand("copy"); area.remove();
      if (ok) toast("CHALLENGE LINK COPIED"); else throw new Error("copy failed");
    } catch {
      $("#share-status").innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);word-break:break-all">${url}</a>`;
    }
  }

  document.addEventListener("click", e => {
    const action=e.target.closest("[data-action]")?.dataset.action;
    if(action==="start") start();
    if(action==="restart") start();
    if(action==="share") share();
    if(action==="copy") copy();
    if(action==="sound"){
      state.sound=!state.sound;
      e.target.textContent=`SOUND: ${state.sound?"ON":"OFF"}`;
    }
  });

  // Respect a challenge score without pretending it is verified.
  if(state.challengeScore){
    const n=Number(state.challengeScore);
    if(Number.isFinite(n)) {
      $("#challenge").textContent=`YOU'VE BEEN CHALLENGED TO BEAT ${clamp(Math.round(n),1,99)}%.`;
    }
  }
})();
