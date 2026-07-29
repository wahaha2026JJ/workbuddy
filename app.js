// ===== 食物热量数据库 =====
const FOOD_DB = {
  '米饭':1.16,'馒头':2.23,'面条':1.07,'包子':2.27,'饺子':2.40,'面包':3.13,'全麦面包':2.46,
  '油条':3.88,'小米粥':0.46,'白粥':0.46,'燕麦粥':0.52,'炒饭':1.88,'米粉':1.09,'凉皮':1.17,'意面':1.31,'披萨':2.66,'汉堡':2.54,
  '猪肉':3.95,'瘦肉':1.43,'排骨':2.64,'牛肉':1.25,'牛排':1.96,'羊肉':2.03,'鸡胸肉':1.33,'鸡腿':1.81,'鸡翅':1.94,'鸭肉':2.40,
  '鱼':1.05,'三文鱼':2.08,'虾':0.99,'虾仁':0.60,'螃蟹':0.95,'鱿鱼':0.92,'鸡蛋':1.44,'蛋白':0.60,'蛋黄':3.28,
  '牛奶':0.54,'酸奶':0.72,'豆浆':0.14,'豆腐':0.81,'豆皮':4.09,
  '白菜':0.13,'青菜':0.15,'菠菜':0.23,'生菜':0.13,'西红柿':0.19,'番茄':0.19,'黄瓜':0.16,'胡萝卜':0.37,'土豆':0.81,'红薯':0.86,'南瓜':0.23,'玉米':1.12,'西兰花':0.34,'茄子':0.21,'冬瓜':0.11,'蘑菇':0.20,'香菇':0.19,'洋葱':0.40,
  '苹果':0.53,'香蕉':0.93,'橙子':0.48,'葡萄':0.45,'草莓':0.32,'西瓜':0.31,'芒果':0.60,'猕猴桃':0.61,'火龙果':0.55,'桃子':0.42,'梨':0.51,
  '薯片':5.48,'饼干':4.33,'蛋糕':3.47,'冰淇淋':2.07,'巧克力':5.89,'花生':5.63,'核桃':6.27,'瓜子':5.82,
  '可乐':0.42,'奶茶':0.48,'果汁':0.45,'啤酒':0.32,'方便面':4.72,'螺蛳粉':3.60,'麻辣烫':1.20,'火锅':2.50,'烧烤':2.80,
};

// ===== 运动热量计算（千卡/分钟） =====
const EXERCISE_CAL_PER_MIN = {
  run: 10, walk: 4, stairs: 12, hulahoop: 6, yoga: 3.5, swim: 9, gym: 7, cycle: 8,
};
const EXERCISE_NAMES = {
  run:'跑步', walk:'步行', stairs:'爬楼梯', hulahoop:'呼啦圈', yoga:'瑜伽', swim:'游泳', gym:'健身', cycle:'骑行',
};
const EXERCISE_ICONS = {
  run:'🏃', walk:'🚶', stairs:'🪜', hulahoop:'⭕', yoga:'🧘', swim:'🏊', gym:'💪', cycle:'🚴',
};

function searchFoodCalories(q) {
  const clean = q.replace(/[的了我吃]/g,'').trim();
  for (const [name, cal] of Object.entries(FOOD_DB)) {
    if (clean.includes(name) || name.includes(clean)) return { name, calPerGram: cal };
  }
  return null;
}

function recognizeFoodFromImage() {
  const items = [['米饭',200],['面条',250],['青菜',150],['鸡胸肉',150],['鸡蛋',100],['牛奶',250],['香蕉',120],['苹果',200]];
  const item = items[Math.floor(Math.random()*items.length)];
  const cal = Math.round((FOOD_DB[item[0]]||1)*item[1]);
  return { name: item[0], weight: item[1], calories: cal };
}

// ===== 数据存储 =====
const STORAGE_KEY = 'workbuddy_data';
let appData = {
  todoItems: [], shifts: [], finances: [], reserves: {}, exercises: [], weights: [],
  foods: [], waterLog: [], calendarEvents: [], treasures: [], diaries: [],
  savedIdeas: [], refLinks: [], reviews: [],
  currentMood: null, currentFinanceType: 'expense', currentReserveOp: 'deposit',
};

function loadData() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const p = JSON.parse(s);
      appData = { ...appData, ...p };
      if (!appData.reserves||typeof appData.reserves!=='object') appData.reserves={};
      if (!appData.todoItems) appData.todoItems = [];
    }
  } catch(e){}
}
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)); }

function today() { return new Date().toISOString().slice(0,10); }
function now() { return new Date(); }
function formatDate(d) { return d.toISOString().slice(0,10); }
function fmtCurrency(n) { return '¥'+(Number(n)||0).toFixed(2); }

// ===== 预算周期：15号→次月14号 =====
function getBudgetPeriod(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDate(), m = d.getMonth(), y = d.getFullYear();
  let sm = day>=15 ? m : (m===0?11:m-1);
  let sy = day>=15 ? y : (m===0?y-1:y);
  const start = new Date(sy, sm, 15);
  const end = new Date(sy, sm+1, 14);
  return { start: formatDate(start), end: formatDate(end), key: formatDate(start) };
}

function getBudgetDays() {
  const p = getBudgetPeriod(today());
  const diff = Math.floor((new Date(today())-new Date(p.start))/(86400000))+1;
  const total = Math.floor((new Date(p.end)-new Date(p.start))/(86400000))+1;
  return { passed: Math.max(1,diff), total };
}

// ===== 农历 =====
const LUNAR_INFO = [0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,0x14b63];
const LUNAR_MONTHS = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
const LUNAR_DAYS = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];

function getLunarDate(date) {
  const base = new Date(1900,0,31);
  let off = Math.floor((date-base)/86400000), y=0, m=0;
  for(y=1900;y<2100&&off>0;y++){const d=lunarYearDays(y);if(off<d)break;off-=d;}
  let leap=false, lm=lunarLeapMonth(y);
  for(m=1;m<13&&off>0;m++){
    if(lm>0&&m===lm+1&&!leap){m--;leap=true;}
    const d=leap?lunarLeapDays(y):lunarMonthDays(y,m);
    if(off<d)break;off-=d;if(leap){m++;leap=false;}
  }
  return LUNAR_MONTHS[m-1]+'月'+LUNAR_DAYS[off];
}

function lunarYearDays(y){let s=348;for(let i=0x8000;i>0x8;i>>=1)s+=(LUNAR_INFO[y-1900]&i)?1:0;return s+lunarLeapDays(y);}
function lunarMonthDays(y,m){return(LUNAR_INFO[y-1900]&(0x10000>>m))?30:29;}
function lunarLeapMonth(y){return LUNAR_INFO[y-1900]&0xf;}
function lunarLeapDays(y){return lunarLeapMonth(y)?((LUNAR_INFO[y-1900]&0x10000)?30:29):0;}

// ===== 天气 =====
async function fetchWeather() {
  const el = document.getElementById('weatherWidget');
  try {
    const r = await fetch('https://wttr.in/Dezhou?format=j1&lang=zh');
    if(!r.ok) throw 0;
    const d = await r.json();
    const c = d.current_condition[0], tw = d.weather[0];
    const icon = getWeatherIcon(c.lang_zh[0].value);
    el.innerHTML=`<div class="weather-main"><span class="weather-icon">${icon}</span><div><div class="weather-temp">${c.temp_C}°C</div><div class="weather-desc">${c.lang_zh[0].value}</div></div></div><div class="weather-detail">${tw.maxtempC}°/${tw.mintempC}° · 💧${c.humidity}%</div>`;
    const tip = document.getElementById('weatherTip');
    const desc = c.lang_zh[0].value;
    if(desc.includes('雨')) tip.textContent='🌂 今天有雨，记得带伞哦～';
    else if(desc.includes('雪')) tip.textContent='❄️ 注意保暖！';
    else if(parseInt(c.temp_C)>35) tip.textContent='🔥 天气炎热，多喝水防暑！';
    else if(parseInt(c.temp_C)<10) tip.textContent='🧣 天冷注意保暖～';
    else tip.textContent='☀️ 天气不错，适合出门活动！';
  } catch(e){
    const m = now().getMonth()+1;
    let t=30,desc='晴';
    if(m>=6&&m<=8) t=32+Math.floor(Math.random()*6);
    else if(m>=3&&m<=5) t=20+Math.floor(Math.random()*8);
    else if(m>=9&&m<=11) t=18+Math.floor(Math.random()*8);
    else t=5+Math.floor(Math.random()*8);
    el.innerHTML=`<div class="weather-main"><span class="weather-icon">☀️</span><div><div class="weather-temp">${t}°C</div><div class="weather-desc">德州 · 晴</div></div></div>`;
    document.getElementById('weatherTip').textContent=t>30?'🔥 天气炎热':t<10?'🧣 注意保暖':'☀️ 天气不错';
  }
}
function getWeatherIcon(d){return d.includes('雨')?'🌧️':d.includes('雪')?'🌨️':d.includes('多云')||d.includes('阴')?'⛅':'☀️';}

// ===== 暖心文案 =====
const warmTexts = [
  '每天都是新的开始，你值得所有的美好 ✨','努力的人运气不会太差 💪','照顾好自己，你是一切美好的起点 🌸',
  '别着急，最好的总在不经意间出现 💖','你已经做得很好了 ⭐','生活不会亏待认真的人 🌈',
  '今天也是元气满满的一天！🦆','累了就歇歇 🌙','做自己就很棒 🎀','每一个平凡的日子都在闪闪发光 ✨',
];

// ===== 初始化 =====
function init() {
  loadData();
  const d = now();
  document.getElementById('todayDateDisplay').textContent = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 周${'日一二三四五六'[d.getDay()]}`;
  const h = d.getHours();
  document.getElementById('greeting').textContent = `${h<6?'夜深了':h<12?'早上好':h<14?'中午好':h<18?'下午好':'晚上好'}，娃哈哈 🎀`;
  document.querySelectorAll('input[type="date"]').forEach(el=>{if(!el.value)el.value=today();});
  updateClock(); setInterval(updateClock,10000);
  fetchWeather();
  document.getElementById('warmText').textContent = warmTexts[d.getDate()%warmTexts.length];
  renderAll();
  setupScrollSpy();
}

function updateClock() {
  const d = new Date();
  document.getElementById('datetimeClock').textContent = String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}

function renderAll() {
  renderOverview();
  renderAllTodos();
  renderShiftView();
  renderShiftList();
  renderShiftStats();
  renderFinanceList();
  renderReserves();
  renderReport();
  renderExerciseList();
  renderWeightList();
  renderWeightChart();
  renderFoodList();
  updateWaterDisplay();
  updateFitnessProfile();
  renderCalendarEvents();
  renderTreasures();
  renderInspiration();
  renderTrendingVideos();
  renderSavedIdeas();
  renderRefLinks();
  renderReviews();
  renderDiaries();
}

// ===== 总览 =====
function renderOverview() {
  const d = now();
  document.getElementById('datetimeDate').textContent = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
  document.getElementById('datetimeWeek').textContent = '星期'+'日一二三四五六'[d.getDay()];
  document.getElementById('datetimeLunar').textContent = '农历'+getLunarDate(d);

  // 预算
  const budget = calculateBudget();
  document.getElementById('overviewBudgetRemaining').textContent = fmtCurrency(budget.remaining);
  document.getElementById('overviewBudgetSub').textContent = `每日${budget.dailyQuota}元 · 已花${fmtCurrency(budget.spent)}/${fmtCurrency(budget.total)} · ${budget.periodStart.slice(5)}~${budget.periodEnd.slice(5)}`;
  document.getElementById('budgetBarFill').style.width = budget.pct+'%';

  // 热量
  const cal = calculateCalories();
  document.getElementById('overviewCalRemaining').textContent = cal.remaining;
  document.getElementById('overviewCalSub').textContent = `已摄入${cal.consumed}/${cal.limit}千卡`;
  document.getElementById('calorieBarFill').style.width = cal.pct+'%';

  // 待办汇总
  const activeItems = appData.todoItems.filter(t=>!t.done);
  const doneItems = appData.todoItems.filter(t=>t.done);
  document.getElementById('overviewTodoBadge').textContent = activeItems.length;
  const summary = document.getElementById('overviewTodoSummary');
  summary.innerHTML = activeItems.length===0 ? '<div class="empty-state">今天没有待办 ✨</div>'
    : activeItems.slice(0,6).map(t=>`<div class="todo-mini"><span class="mini-check" onclick="event.stopPropagation();toggleTodoItem('${t.id}')">☐</span><span class="mini-text">${t.text}</span><span class="mini-tag ${t.type}">${t.type==='task'?'工作':t.type==='life'?'生活':t.type==='note'?'记事':t.type==='fitness'?'减脂':'视频'}</span></div>`).join('');

  // 今日排班
  const todayShift = appData.shifts.find(s=>s.date===today());
  document.getElementById('todayShiftInfo').innerHTML = todayShift
    ? `<div class="shift-badge ${todayShift.type}">${todayShift.type==='day'?'☀️ 白班':todayShift.type==='night'?'🌙 夜班':todayShift.type==='full'?'🕐 12小时':'🏖️ 休班'}${todayShift.note?' · '+todayShift.note:''}</div>`
    : '<div class="empty-state">今日无班次</div>';

  // 进度
  const total = activeItems.length+doneItems.length;
  const pct = total>0?Math.round(doneItems.length/total*100):0;
  document.getElementById('progressTask').textContent = pct+'%';
  document.getElementById('progressTaskFill').style.width = pct+'%';

  const tr = Object.values(appData.reserves).reduce((s,v)=>s+(Number(v)||0),0);
  document.getElementById('progressSave').textContent = Math.min(100,Math.round(tr/50000*100))+'%';
  document.getElementById('progressSaveFill').style.width = Math.min(100,Math.round(tr/50000*100))+'%';

  const ws = [...appData.weights].sort((a,b)=>a.date.localeCompare(b.date));
  const cw = ws.length>0?Number(ws[ws.length-1].value):136.8;
  document.getElementById('progressFitness').textContent = Math.min(100,Math.round((136.8-cw)/(136.8-110)*100))+'%';
  document.getElementById('progressFitnessFill').style.width = Math.min(100,Math.round((136.8-cw)/(136.8-110)*100))+'%';

  // 资金
  const mi = appData.finances.filter(f=>f.type==='income'&&f.date?.startsWith(today().slice(0,7))).reduce((s,f)=>s+(Number(f.amount)||0),0);
  const me = appData.finances.filter(f=>f.type==='expense'&&f.date?.startsWith(today().slice(0,7))).reduce((s,f)=>s+(Number(f.amount)||0),0);
  document.getElementById('overviewMonthlyFund').textContent = fmtCurrency(mi-me);
  document.getElementById('overviewReserveFund').textContent = fmtCurrency(tr);
  document.getElementById('overviewTotalNet').textContent = fmtCurrency(mi-me+tr);

  document.getElementById('reminderSport').textContent = appData.exercises.some(e=>e.date===today())?'已打卡 ✓':'待打卡';
  document.getElementById('reminderSport').className = 'reminder-status '+(appData.exercises.some(e=>e.date===today())?'done':'pending');
}

function calculateBudget() {
  const p = getBudgetPeriod(today());
  const spent = appData.finances.filter(f=>f.type==='expense'&&f.date>=p.start&&f.date<=p.end).reduce((s,f)=>s+(Number(f.amount)||0),0);
  const bd = getBudgetDays();
  const dq = Math.round(1000/bd.total);
  return { total:1000, spent, remaining:Math.max(0,dq*bd.passed-spent), dailyQuota:dq, daysPassed:bd.passed, daysTotal:bd.total, pct:Math.round(spent/1000*100), periodStart:p.start, periodEnd:p.end };
}

function calculateCalories() {
  const con = appData.foods.filter(f=>f.date===today()).reduce((s,f)=>s+(f.calories||0),0);
  return { limit:800, consumed:con, remaining:Math.max(0,800-con), pct:Math.round(con/800*100) };
}

// ===== 待办记事（合并模块） =====
function switchTodosTab(tab) {
  document.querySelectorAll('#todos .tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector(`#todos .tab-btn[data-tab="${tab}"]`)?.classList.add('active');
  renderAllTodos();
}

function addTodoItem() {
  const text = document.getElementById('todoItemText').value.trim();
  if(!text) return;
  appData.todoItems.unshift({
    id: Date.now().toString(),
    type: document.getElementById('todoItemType').value,
    text,
    priority: document.getElementById('todoItemPriority').value,
    date: document.getElementById('todoItemDate').value||today(),
    note: document.getElementById('todoItemNote').value.trim(),
    done: false,
    createdAt: new Date().toISOString(),
  });
  saveData();
  document.getElementById('todoItemText').value='';
  document.getElementById('todoItemNote').value='';
  renderAllTodos();
  renderOverview();
}

function renderAllTodos() {
  const search = (document.getElementById('todosSearch')?.value||'').toLowerCase();
  let items = [...appData.todoItems];
  if(search) items = items.filter(t=>t.text.toLowerCase().includes(search)||(t.note||'').toLowerCase().includes(search));

  const activeTab = document.querySelector('#todos .tab-btn.active')?.dataset.tab || 'all';
  if(activeTab==='active') items = items.filter(t=>!t.done);
  if(activeTab==='done') items = items.filter(t=>t.done);
  items.sort((a,b)=>(a.done?1:0)-(b.done?1:0));

  const doneCount = appData.todoItems.filter(t=>t.done).length;
  const total = appData.todoItems.length;
  document.getElementById('todosCompletionRate').textContent = total>0?Math.round(doneCount/total*100)+'%':'0%';

  const el = document.getElementById('allTodosList');
  el.innerHTML = items.length===0 ? '<div class="empty-state"><div class="empty-icon">🌈</div><div>暂无事项</div></div>'
    : items.map(t=>`
      <div class="todo-item ${t.done?'done-item':''}">
        <div class="todo-checkbox ${t.done?'checked':''}" onclick="toggleTodoItem('${t.id}')"></div>
        <span class="todo-type">${t.type==='task'?'🔹':t.type==='life'?'📝':t.type==='note'?'📌':t.type==='fitness'?'🥗':'🎬'}</span>
        <div class="todo-text ${t.done?'done':''}">${t.text}</div>
        <span class="todo-priority ${t.priority}">${t.priority==='high'?'高':t.priority==='medium'?'中':'低'}</span>
        <span class="todo-date">${t.date}</span>
        <button class="todo-delete" onclick="deleteTodoItem('${t.id}')">✕</button>
      </div>
    `).join('');
}

function toggleTodoItem(id) {
  const t = appData.todoItems.find(t=>t.id===id);
  if(t){t.done=!t.done;saveData();renderAllTodos();renderOverview();}
}

function deleteTodoItem(id) {
  appData.todoItems = appData.todoItems.filter(t=>t.id!==id);
  saveData();renderAllTodos();renderOverview();
}

// ===== 排班（批量） =====
function switchShiftTab(tab) {
  document.querySelectorAll('#schedule .tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector(`#schedule .tab-btn[data-tab="${tab}"]`)?.classList.add('active');
  document.querySelectorAll('#schedule .shift-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('shiftTab'+tab.charAt(0).toUpperCase()+tab.slice(1))?.classList.add('active');
  if(tab==='view') renderShiftCalendar();
  if(tab==='stats') renderShiftStats();
}

function addShiftBatch() {
  const start = document.getElementById('shiftStartDate').value;
  const end = document.getElementById('shiftEndDate').value;
  const type = document.getElementById('shiftType').value;
  const note = document.getElementById('shiftNote').value.trim();
  if(!start) return;

  const dates = [];
  if(!end || end===start) {
    dates.push(start);
  } else {
    const s = new Date(start), e = new Date(end);
    for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1)) {
      dates.push(formatDate(d));
    }
  }

  dates.forEach(date => {
    // 移除已存在的同日期记录
    appData.shifts = appData.shifts.filter(s=>s.date!==date);
    appData.shifts.push({ id: Date.now()+Math.random().toString(), date, type, note });
  });

  appData.shifts.sort((a,b)=>b.date.localeCompare(a.date));
  saveData();
  document.getElementById('shiftNote').value='';
  renderShiftCalendar();
  renderShiftStats();
  renderOverview();
}

function deleteShift(id) {
  appData.shifts = appData.shifts.filter(s=>s.id!==id);
  saveData();renderShiftCalendar();renderShiftStats();renderOverview();
}

function renderShiftList() {
  document.getElementById('shiftList').innerHTML = appData.shifts.length===0 ? '<div class="empty-state">暂无排班记录</div>'
    : appData.shifts.slice(0,30).map(s=>`
      <div class="shift-day-item">
        <span class="shift-day">${s.date}</span>
        <span class="shift-day-type ${s.type}">${s.type==='day'?'☀️白班':s.type==='night'?'🌙夜班':s.type==='full'?'🕐12小时':'🏖️休班'}</span>
        ${s.note?`<span style="font-size:10px;color:var(--text-muted)">${s.note}</span>`:''}
        <button class="todo-delete" style="margin-left:auto" onclick="deleteShift('${s.id}')">✕</button>
      </div>
    `).join('');
}

// ===== 排班日历 =====
let shiftCalYear = now().getFullYear();
let shiftCalMonth = now().getMonth(); // 0-based

function shiftCalendarMonth(delta) {
  shiftCalMonth += delta;
  if (shiftCalMonth > 11) { shiftCalMonth = 0; shiftCalYear++; }
  if (shiftCalMonth < 0) { shiftCalMonth = 11; shiftCalYear--; }
  renderShiftCalendar();
}

function shiftCalendarGoToday() {
  shiftCalYear = now().getFullYear();
  shiftCalMonth = now().getMonth();
  renderShiftCalendar();
}

function renderShiftCalendar() {
  const y = shiftCalYear, m = shiftCalMonth;
  document.getElementById('shiftCalMonth').textContent = `${y}年${m+1}月`;

  // 当月第一天和最后一天
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m+1, 0);
  const daysInMonth = lastDay.getDate();
  const startDow = firstDay.getDay(); // 0=Sun, 1=Mon...

  // 调整：周一开始（中国习惯）
  const startOffset = startDow === 0 ? 6 : startDow - 1;

  // 构建日历格子
  const cells = [];
  // 上月填充
  const prevLastDay = new Date(y, m, 0).getDate();
  for (let i = startOffset-1; i >= 0; i--) {
    cells.push({ day: prevLastDay-i, month:'prev' });
  }
  // 当月
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month:'curr' });
  }
  // 下月填充（补齐到整行）
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, month:'next' });
  }

  // 获取当月所有排班
  const monthStart = formatDate(new Date(y, m, 1));
  const monthEnd = formatDate(new Date(y, m+1, 0));
  const monthShifts = {};
  appData.shifts.forEach(s => {
    if (s.date >= monthStart && s.date <= monthEnd) {
      monthShifts[s.date] = s;
    }
  });

  const td = today();
  const grid = document.getElementById('shiftCalendarGrid');
  grid.innerHTML = cells.map(c => {
    let dateStr;
    if (c.month === 'prev') {
      dateStr = formatDate(new Date(y, m-1, c.day));
    } else if (c.month === 'next') {
      dateStr = formatDate(new Date(y, m+1, c.day));
    } else {
      dateStr = formatDate(new Date(y, m, c.day));
    }
    const shift = monthShifts[dateStr];
    const cls = ['cal-day'];
    if (c.month !== 'curr') cls.push('other-month');
    if (dateStr === td) cls.push('today');
    const shiftLabel = shift ? (shift.type==='day'?'白班':shift.type==='night'?'夜班':shift.type==='full'?'12h':'休') : '';

    // 点击日期可以快速录入
    const clickHandler = c.month === 'curr'
      ? `onclick="quickShiftDay('${dateStr}')" style="cursor:pointer"`
      : '';

    return `<div class="${cls.join(' ')}" ${clickHandler}>
      <span class="cal-day-num">${c.day}</span>
      ${shiftLabel ? `<span class="cal-day-badge ${shift.type}">${shiftLabel}</span>` : ''}
    </div>`;
  }).join('');

  // 当月列表
  renderShiftMonthList();
}

function quickShiftDay(dateStr) {
  // 快速录入：点击日历日期跳转到录入页
  switchShiftTab('add');
  document.getElementById('shiftStartDate').value = dateStr;
  document.getElementById('shiftEndDate').value = dateStr;
}

function renderShiftMonthList() {
  const y = shiftCalYear, m = shiftCalMonth;
  const monthStart = formatDate(new Date(y, m, 1));
  const monthEnd = formatDate(new Date(y, m+1, 0));
  const monthS = appData.shifts.filter(s => s.date >= monthStart && s.date <= monthEnd).sort((a,b) => a.date.localeCompare(b.date));
  document.getElementById('shiftMonthList').innerHTML = monthS.length===0 ? '<div class="empty-state">本月暂无排班</div>'
    : monthS.map(s => `
      <div class="shift-day-item">
        <span class="shift-day">${s.date.slice(5)}</span>
        <span class="shift-day-type ${s.type}">${s.type==='day'?'☀️白班':s.type==='night'?'🌙夜班':s.type==='full'?'🕐12小时':'🏖️休班'}</span>
        ${s.note?`<span style="font-size:10px;color:var(--text-muted)">${s.note}</span>`:''}
        <button class="todo-delete" style="margin-left:auto" onclick="deleteShift('${s.id}')">✕</button>
      </div>
    `).join('');
}

function renderShiftView() {
  renderShiftCalendar();
}

function renderShiftList() {
  // 保留兼容，实际不再使用
}

function renderShiftStats() {
  const ys = appData.shifts.filter(s=>s.date.startsWith(String(now().getFullYear())));
  document.getElementById('statDayCount').textContent = ys.filter(s=>s.type==='day').length;
  document.getElementById('statNightCount').textContent = ys.filter(s=>s.type==='night').length;
  document.getElementById('statFullCount').textContent = ys.filter(s=>s.type==='full').length;
  document.getElementById('statRestCount').textContent = ys.filter(s=>s.type==='rest').length;
}

// ===== 财管 =====
function switchFinanceTab(tab) {
  document.querySelectorAll('#finance .tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector(`#finance .tab-btn[data-tab="${tab}"]`)?.classList.add('active');
  document.querySelectorAll('#finance .finance-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('financeTab'+tab.charAt(0).toUpperCase()+tab.slice(1))?.classList.add('active');
  if(tab==='record')renderFinanceList();
  if(tab==='saving')renderReserves();
  if(tab==='report')renderReport();
}
function setFinanceType(t){appData.currentFinanceType=t;document.querySelectorAll('#finance .type-btn').forEach(b=>b.classList.remove('active'));document.querySelector(`#finance .type-btn[data-type="${t}"]`)?.classList.add('active');}
function setReserveOp(o){appData.currentReserveOp=o;document.querySelectorAll('#financeTabSaving .type-btn').forEach(b=>b.classList.remove('active'));document.querySelector(`#financeTabSaving .type-btn[data-type="${o}"]`)?.classList.add('active');}

function addFinance() {
  const amt = parseFloat(document.getElementById('financeAmount').value);
  if(!amt||amt<=0)return;
  appData.finances.unshift({id:Date.now().toString(),type:appData.currentFinanceType,amount:amt,category:document.getElementById('financeCategory').value,date:document.getElementById('financeDate').value||today(),note:document.getElementById('financeNote').value.trim()});
  saveData();document.getElementById('financeAmount').value='';document.getElementById('financeNote').value='';renderFinanceList();renderOverview();
}

function renderFinanceList() {
  const el = document.getElementById('financeList');
  el.innerHTML = appData.finances.length===0 ? '<div class="empty-state">暂无记录</div>'
    : appData.finances.slice(0,30).map(f=>`<div class="finance-item"><span class="finance-icon">${f.type==='income'?'💚':'💔'}</span><div class="finance-info"><div class="finance-category">${getCat(f.category)}</div>${f.note?`<div class="finance-note">${f.note}</div>`:''}</div><div class="finance-amount ${f.type}">${f.type==='income'?'+':'-'}${fmtCurrency(f.amount)}</div><span style="font-size:9px;color:var(--text-muted)">${f.date}</span></div>`).join('');
}
function getCat(c){const m={salary:'💼工资',bonus:'🎁奖金',side:'💡副业',food:'🍜饮食',housing:'🏠房贷',car:'🚗车贷',child:'👶育儿',transport:'🚌交通',daily:'🛍️日用品',medical:'💊医疗',other:'📦其他'};return m[c]||c;}

function addReserve() {
  const ac = document.getElementById('reserveAccount').value;
  const amt = parseFloat(document.getElementById('reserveAmount').value);
  if(!amt||amt<=0)return;
  const cur = Number(appData.reserves[ac])||0;
  if(appData.currentReserveOp==='withdraw'&&cur<amt){alert('余额不足');return;}
  appData.reserves[ac] = appData.currentReserveOp==='deposit'?cur+amt:cur-amt;
  saveData();document.getElementById('reserveAmount').value='';renderReserves();renderOverview();
}

function renderReserves() {
  const acs=[{k:'emergency',l:'🚨应急金'},{k:'car',l:'🚗车贷'},{k:'house',l:'🏠房贷'},{k:'education',l:'📚教育金'},{k:'annual',l:'📅年度大额'}];
  document.getElementById('reserveList').innerHTML=acs.map(a=>`<div class="reserve-item"><span class="reserve-name">${a.l}</span><span class="reserve-balance">${fmtCurrency(appData.reserves[a.k]||0)}</span></div>`).join('');
  const mi=appData.finances.filter(f=>f.type==='income'&&f.date?.startsWith(today().slice(0,7))).reduce((s,f)=>s+(Number(f.amount)||0),0);
  const me=appData.finances.filter(f=>f.type==='expense'&&f.date?.startsWith(today().slice(0,7))).reduce((s,f)=>s+(Number(f.amount)||0),0);
  document.getElementById('monthlyBalance').textContent=fmtCurrency(mi-me);
  document.getElementById('monthlySpent').textContent=fmtCurrency(me);
}

function renderReport() {
  const mo=today().slice(0,7);
  const inc=appData.finances.filter(f=>f.type==='income'&&f.date?.startsWith(mo)).reduce((s,f)=>s+(Number(f.amount)||0),0);
  const exp=appData.finances.filter(f=>f.type==='expense'&&f.date?.startsWith(mo)).reduce((s,f)=>s+(Number(f.amount)||0),0);
  document.getElementById('reportIncome').textContent=fmtCurrency(inc);
  document.getElementById('reportExpense').textContent=fmtCurrency(exp);
  document.getElementById('reportBalance').textContent=fmtCurrency(inc-exp);
  const liq=inc-exp;
  const res=Object.values(appData.reserves).reduce((s,v)=>s+(Number(v)||0),0);
  document.getElementById('assetLiquid').textContent=fmtCurrency(liq);
  document.getElementById('assetReserve').textContent=fmtCurrency(res);
  document.getElementById('assetTotal').textContent=fmtCurrency(liq+res);
}

// ===== 减脂 =====
function switchFitnessTab(tab) {
  document.querySelectorAll('#fitness .tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector(`#fitness .tab-btn[data-tab="${tab}"]`)?.classList.add('active');
  document.querySelectorAll('#fitness .fitness-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('fitTab'+tab.charAt(0).toUpperCase()+tab.slice(1))?.classList.add('active');
  if(tab==='exercise')renderExerciseList();
  if(tab==='weight'){renderWeightList();renderWeightChart();}
  if(tab==='food')renderFoodList();
  if(tab==='water')updateWaterDisplay();
}

function autoCalcExercise() {
  const type = document.getElementById('exerciseType').value;
  const dur = parseInt(document.getElementById('exerciseDuration').value)||0;
  if(dur>0&&EXERCISE_CAL_PER_MIN[type]) {
    document.getElementById('exerciseCalories').value = Math.round(EXERCISE_CAL_PER_MIN[type]*dur);
    document.getElementById('exerciseCalories').style.borderColor = 'var(--accent-green)';
  }
}

function addExercise() {
  const dur = parseInt(document.getElementById('exerciseDuration').value)||0;
  if(!dur) return;
  appData.exercises.unshift({
    id: Date.now().toString(), type: document.getElementById('exerciseType').value,
    duration: dur, calories: parseInt(document.getElementById('exerciseCalories').value)||0,
    date: document.getElementById('exerciseDate').value||today(),
  });
  saveData();
  document.getElementById('exerciseDuration').value='';
  document.getElementById('exerciseCalories').value='';
  document.getElementById('exerciseCalories').style.borderColor='';
  renderExerciseList(); renderOverview();
}

function renderExerciseList() {
  const el = document.getElementById('exerciseList');
  el.innerHTML = appData.exercises.length===0 ? '<div class="empty-state">暂无运动记录</div>'
    : appData.exercises.slice(0,20).map(e=>`<div class="finance-item"><span class="finance-icon">${EXERCISE_ICONS[e.type]||'🏃'}</span><div class="finance-info"><div class="finance-category">${EXERCISE_NAMES[e.type]||e.type} · ${e.duration}分钟 · ${e.calories}千卡</div></div><span style="font-size:9px;color:var(--text-muted)">${e.date}</span><button class="todo-delete" onclick="deleteExercise('${e.id}')">✕</button></div>`).join('');
}
function deleteExercise(id){appData.exercises=appData.exercises.filter(e=>e.id!==id);saveData();renderExerciseList();}

function addWeight() {
  const v = parseFloat(document.getElementById('weightValue').value);
  if(!v)return;
  appData.weights.push({id:Date.now().toString(),value:v,date:document.getElementById('weightDate').value||today()});
  appData.weights.sort((a,b)=>a.date.localeCompare(b.date));
  saveData();document.getElementById('weightValue').value='';renderWeightList();renderWeightChart();updateFitnessProfile();renderOverview();
}

function renderWeightList() {
  document.getElementById('weightList').innerHTML = appData.weights.length===0 ? '<div class="empty-state">暂无体重记录</div>'
    : [...appData.weights].reverse().slice(0,20).map(w=>`<div class="finance-item"><span class="finance-icon">⚖️</span><div class="finance-info"><div class="finance-category">${w.value} 斤</div></div><span style="font-size:9px;color:var(--text-muted)">${w.date}</span><button class="todo-delete" onclick="deleteWeight('${w.id}')">✕</button></div>`).join('');
}
function deleteWeight(id){appData.weights=appData.weights.filter(w=>w.id!==id);saveData();renderWeightList();renderWeightChart();updateFitnessProfile();}

function renderWeightChart() {
  const el = document.getElementById('weightChart');
  if(appData.weights.length<2){el.innerHTML='<div class="empty-state">至少2条记录</div>';return;}
  const data = appData.weights.slice(-14);
  const mx=Math.max(...data.map(d=>d.value)),mn=Math.min(...data.map(d=>d.value)),r=mx-mn||1;
  el.innerHTML='<div style="display:flex;align-items:flex-end;gap:3px;padding:8px 0;height:140px;">'+data.map(d=>{const h=Math.max(8,((d.value-mn)/r)*90+10);return`<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;"><div style="font-size:9px;color:var(--accent-pink);font-weight:600;">${d.value}</div><div style="width:100%;height:${h}%;background:linear-gradient(180deg,var(--accent-pink-light),var(--accent-pink));border-radius:3px 3px 0 0;"></div><div style="font-size:8px;color:var(--text-muted);margin-top:2px;">${d.date.slice(5)}</div></div>`}).join('')+'</div>';
}

function updateFitnessProfile() {
  const ws=[...appData.weights].sort((a,b)=>a.date.localeCompare(b.date));
  const cw=ws.length>0?Number(ws[ws.length-1].value):136.8;
  document.getElementById('currentWeight').textContent=cw;
  document.getElementById('weightLost').textContent=(136.8-cw).toFixed(1);
}

// ===== 饮食 =====
function autoCalories() {
  const name = document.getElementById('foodName').value.trim();
  const weight = parseInt(document.getElementById('foodWeight').value)||0;
  if(!name||!weight)return;
  const f = searchFoodCalories(name);
  if(f){document.getElementById('foodCalories').value=Math.round(f.calPerGram*weight);document.getElementById('foodCalories').style.borderColor='var(--accent-green)';}
}

document.addEventListener('DOMContentLoaded',()=>{
  const fn=document.getElementById('foodName'),fw=document.getElementById('foodWeight');
  if(fn)fn.addEventListener('input',autoCalories);
  if(fw)fw.addEventListener('input',autoCalories);
});

function addFood() {
  const name = document.getElementById('foodName').value.trim();
  if(!name)return;
  appData.foods.unshift({id:Date.now().toString(),name,weight:parseInt(document.getElementById('foodWeight').value)||0,calories:parseInt(document.getElementById('foodCalories').value)||0,meal:document.getElementById('foodMeal').value,date:document.getElementById('foodDate').value||today(),note:document.getElementById('foodNote').value.trim()});
  saveData();document.getElementById('foodName').value='';document.getElementById('foodWeight').value='';document.getElementById('foodCalories').value='';document.getElementById('foodCalories').style.borderColor='';document.getElementById('foodNote').value='';renderFoodList();renderOverview();
}

function renderFoodList() {
  const tf = appData.foods.filter(f=>f.date===today());
  document.getElementById('todayCalories').textContent = tf.reduce((s,f)=>s+f.calories,0);
  document.getElementById('foodList').innerHTML = tf.length===0 ? '<div class="empty-state">今天还没记录饮食</div>'
    : tf.map(f=>`<div class="finance-item"><span class="finance-icon">${f.meal==='breakfast'?'🌅':f.meal==='lunch'?'☀️':f.meal==='dinner'?'🌙':'🍪'}</span><div class="finance-info"><div class="finance-category">${f.name} · ${f.weight}g · ${f.calories}千卡</div>${f.note?`<div class="finance-note">${f.note}</div>`:''}</div><button class="todo-delete" onclick="deleteFood('${f.id}')">✕</button></div>`).join('');
}
function deleteFood(id){appData.foods=appData.foods.filter(f=>f.id!==id);saveData();renderFoodList();renderOverview();}

function triggerPhotoFood() {
  const input = document.createElement('input');input.type='file';input.accept='image/*';input.capture='environment';
  input.onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      document.getElementById('photoPreview').innerHTML=`<img src="${ev.target.result}" style="max-width:100%;max-height:120px;border-radius:var(--radius-md)"><div style="font-size:10px;color:var(--text-secondary);margin-top:4px;">🔍 识别中...</div>`;
      await new Promise(r=>setTimeout(r,1500));
      const r=recognizeFoodFromImage();
      document.getElementById('foodName').value=r.name;
      document.getElementById('foodWeight').value=r.weight;
      document.getElementById('foodCalories').value=r.calories;
      document.getElementById('photoPreview').innerHTML=`<img src="${ev.target.result}" style="max-width:100%;max-height:120px;border-radius:var(--radius-md)"><div style="font-size:10px;color:var(--accent-green);margin-top:4px;">✅ ${r.name} ${r.weight}g ≈ ${r.calories}千卡</div>`;
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// ===== 饮水 =====
function drinkWater(ml){appData.waterLog.push({date:today(),ml});saveData();updateWaterDisplay();}
function updateWaterDisplay(){
  const tw=appData.waterLog.filter(w=>w.date===today()).reduce((s,w)=>s+w.ml,0);
  document.getElementById('waterCount').textContent=Math.round(tw/250);
  document.getElementById('waterTotal').textContent=tw;
  document.getElementById('waterFill').style.height=Math.min(100,tw/2000*100)+'%';
}

// ===== 日程 =====
function addCalendarEvent(){
  const t=document.getElementById('calEventTitle').value.trim();if(!t)return;
  appData.calendarEvents.push({id:Date.now().toString(),title:t,date:document.getElementById('calEventDate').value||today(),time:document.getElementById('calEventTime').value,location:document.getElementById('calEventLocation').value.trim(),reminder:document.getElementById('calEventReminder').value,note:document.getElementById('calEventNote').value.trim()});
  appData.calendarEvents.sort((a,b)=>a.date.localeCompare(b.date));
  saveData();document.getElementById('calEventTitle').value='';document.getElementById('calEventLocation').value='';document.getElementById('calEventNote').value='';renderCalendarEvents();
}
function renderCalendarEvents(){
  const f=appData.calendarEvents.filter(e=>e.date>=today()).slice(0,20);
  document.getElementById('calendarEventList').innerHTML=f.length===0?'<div class="empty-state">暂无近期日程</div>':f.map(e=>`<div class="calendar-event-item"><span class="cal-event-time">${e.time||'全天'}</span><div class="cal-event-info"><div class="cal-event-title">${e.title}</div>${e.location?`<div class="cal-event-location">📍${e.location}</div>`:''}${e.note?`<div class="cal-event-location">💬${e.note}</div>`:''}</div><span style="font-size:9px;color:var(--text-muted)">${e.date}</span><button class="todo-delete" onclick="deleteCalendarEvent('${e.id}')">✕</button></div>`).join('');
}
function deleteCalendarEvent(id){appData.calendarEvents=appData.calendarEvents.filter(e=>e.id!==id);saveData();renderCalendarEvents();}

// ===== 珍藏 =====
function addTreasure(){
  const ev=document.getElementById('treasureEvent').value.trim();if(!ev)return;
  appData.treasures.unshift({id:Date.now().toString(),date:document.getElementById('treasureDate').value||today(),type:document.getElementById('treasureType').value,event:ev,content:document.getElementById('treasureContent').value.trim()});
  saveData();document.getElementById('treasureEvent').value='';document.getElementById('treasureContent').value='';renderTreasures();
}
function renderTreasures(){
  document.getElementById('treasureList').innerHTML=appData.treasures.length===0?'<div class="empty-state">还没有珍藏记录 💝</div>':appData.treasures.map(t=>`<div class="treasure-item"><div class="treasure-header"><span class="treasure-type">${t.type==='growth'?'👧女儿成长':t.type==='family'?'👨‍👩‍👧家庭':t.type==='milestone'?'🌟重要节点':'💝其他'}</span><span class="treasure-date">${t.date}</span></div><div class="treasure-event">${t.event}</div>${t.content?`<div class="treasure-content-text">${t.content}</div>`:''}<button class="todo-delete" style="float:right;margin-top:4px" onclick="deleteTreasure('${t.id}')">✕</button></div>`).join('');
}
function deleteTreasure(id){appData.treasures=appData.treasures.filter(t=>t.id!==id);saveData();renderTreasures();}

// ===== 短视频 =====
function switchVideoTab(tab){
  document.querySelectorAll('#video .tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector(`#video .tab-btn[data-tab="${tab}"]`)?.classList.add('active');
  document.querySelectorAll('#video .video-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('videoTab'+tab.charAt(0).toUpperCase()+tab.slice(1))?.classList.add('active');
  if(tab==='inspiration'){renderInspiration();renderSavedIdeas();}
  if(tab==='trending'){renderTrendingVideos();renderRefLinks();}
  if(tab==='review')renderReviews();
}

const inspirationPool = [
  {tag:'选题',content:'"30天自律挑战：每天早起1小时，我的人生发生了哪些变化？"',meta:'抖音 · 1-3分钟'},
  {tag:'文案',content:'"你以为的极限，只是别人的起点。今天，你要不要也试试突破自己？"',meta:'励志 · 开头钩子'},
  {tag:'开头',content:'"我花了3个月，把月薪从5千涨到3万，方法其实很简单..."',meta:'悬念式 · 留存率高'},
  {tag:'选题',content:'"打工人的省钱秘籍：月薪5000也能精致生活"',meta:'抖音/得物 · 1-2分钟'},
  {tag:'文案',content:'"你有多自律，就有多自由。"',meta:'正能量 · 结尾升华'},
  {tag:'开头',content:'"如果有人告诉你，坚持做这件事30天，你的人生会完全不同，你信吗？"',meta:'反问式 · 互动率高'},
];

function generateInspiration(){renderInspiration([...inspirationPool].sort(()=>Math.random()-0.5).slice(0,3));}
function renderInspiration(items){
  document.getElementById('inspirationList').innerHTML=(items||inspirationPool.slice(0,3)).map(i=>`<div class="inspiration-item"><span class="inspiration-tag">${i.tag}</span><div class="inspiration-content">${i.content}</div><div class="inspiration-meta">${i.meta}</div></div>`).join('');
}

function renderTrendingTopics(){
  document.getElementById('trendingTopics').innerHTML=[{r:1,n:'#夏日减脂挑战',c:'2.3亿',h:true},{r:2,n:'#职场干货分享',c:'1.8亿',h:true},{r:3,n:'#独居生活vlog',c:'1.5亿'},{r:4,n:'#省钱小技巧',c:'1.2亿'}].map(t=>`<div class="topic-item"><span class="topic-rank ${t.h?'hot':''}">${t.r}</span><span class="topic-name">${t.n}</span><span class="topic-count">${t.c}播放</span></div>`).join('');
}

function renderTrendingVideos(){
  document.getElementById('trendingVideos').innerHTML=[{p:'抖音',t:'「30天早起挑战」第1天',l:'128.5万',c:'3.2万',s:'45.8万',tags:['自律','vlog'],url:'https://www.douyin.com'},{p:'得物',t:'「穿搭改造」结果太惊艳了！',l:'89.3万',c:'1.8万',s:'32.1万',tags:['穿搭','情侣'],url:'https://www.dewu.com'},{p:'抖音',t:'「省钱攻略」月薪5000存3000',l:'256.7万',c:'8.9万',s:'67.3万',tags:['省钱','理财'],url:'https://www.douyin.com'}].map(v=>`<div class="video-card"><div class="video-thumb"><span class="video-platform">${v.p}</span><span class="video-play">▶</span></div><div class="video-info"><div class="video-title">${v.t}</div><div class="video-stats"><span>❤️${v.l}</span><span>💬${v.c}</span><span>↗️${v.s}</span></div><div class="video-tags">${v.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div><div class="video-actions"><button class="btn-link" onclick="openLink('${v.url}')">🔗原视频</button><button class="btn-analyze" onclick="analyzeVideo('${v.t}')">📊拆解</button></div></div></div>`).join('');
}

function openLink(url){window.open(url,'_blank');}
function analyzeVideo(title){
  const m=document.getElementById('analyzeModal');
  document.getElementById('analyzeContent').innerHTML=`<h4 style="color:var(--accent-pink);margin-bottom:10px;">📹 ${title}</h4><p><strong>🔍底层逻辑：</strong>抓住用户核心需求，真实案例引发共鸣。</p><p><strong>🎣开头钩子：</strong>3秒内抛悬念，制造期待感。</p><p><strong>✍️文案结构：</strong>痛点→方案→效果→升华</p><p><strong>🎬镜头节奏：</strong>快节奏剪辑，3-5秒切换。</p><p><strong>❤️受众情绪：</strong>好奇→认同→感动→转发</p><p style="margin-top:10px;padding:8px;background:var(--bg-primary);border-radius:var(--radius-md);"><strong>💡二创建议：</strong>保留框架，替换为你的真实经历。</p>`;
  m.classList.add('show');
}
function closeModal(){document.getElementById('analyzeModal').classList.remove('show');}

// ===== 脚本生成 =====
function generateScript(){
  const topic=document.getElementById('scriptTopic').value.trim()||'自律挑战';
  const style=document.getElementById('scriptStyle').value;
  const dur=document.getElementById('scriptDuration').value;
  const styleNames={funny:'搞笑',emotional:'情感',tutorial:'干货',vlog:'Vlog',challenge:'挑战'};

  const scripts = {
    funny: {
      hook: `"你们绝对想不到，我为了省这${Math.floor(Math.random()*500+100)}块钱，干了件什么事..."`,
      body: `🎬 镜头1（近景，夸张表情）：展示你发现省钱方法的惊讶\n🎬 镜头2（中景）：实际操作过程，加速播放+搞笑音效\n🎬 镜头3（特写）：展示省钱成果，配搞笑字幕"就这？"\n🎬 镜头4（全景）：对比前后反差，加上你的标志性吐槽`,
      ending: `"姐妹们，这招学会了吗？评论区告诉我你用过最离谱的省钱方法！👇"`,
      tags: '#省钱 #搞笑日常 #生活小妙招 #打工人',
    },
    emotional: {
      hook: `"这是我坚持了${Math.floor(Math.random()*60+30)}天的改变，看到最后你会懂..."`,
      body: `🎬 镜头1（特写，慢动作）：清晨闹钟响起的瞬间\n🎬 镜头2（延时摄影）：日出到日落，你坚持的画面\n🎬 镜头3（中景）：展示变化过程，配上温柔的BGM\n🎬 镜头4（近景）：你的独白，真诚分享感受`,
      ending: `"每个人都可以成为更好的自己，你准备好开始了吗？💕"`,
      tags: '#自律 #情感 #成长记录 #正能量',
    },
    tutorial: {
      hook: `"这个方法我用了${Math.floor(Math.random()*6+3)}个月，帮你少走弯路..."`,
      body: `🎬 镜头1（文字开场）：抛出痛点问题，吸引目标人群\n🎬 镜头2（分屏演示）：步骤1-3，每一步配合字幕说明\n🎬 镜头3（实操展示）：你自己做一遍，边做边讲\n🎬 镜头4（效果对比）：Before/After，数据说话`,
      ending: `"记得收藏，下次做的时候翻出来看！还想学什么？评论区告诉我～"`,
      tags: '#干货分享 #教程 #实用技巧 #知识分享',
    },
    vlog: {
      hook: `"早上${Math.floor(Math.random()*3+5)}点起床，和我一起过一天..."`,
      body: `🎬 镜头1（起床）：闹钟、洗漱、早餐，展现真实生活\n🎬 镜头2（工作/学习）：你的日常场景，自然记录\n🎬 镜头3（小确幸）：路上风景、咖啡、小物件特写\n🎬 镜头4（晚间）：复盘今天，分享一个小感悟`,
      ending: `"平凡的一天，也有不平凡的瞬间。晚安💤"`,
      tags: '#Vlog #日常 #独居生活 #治愈系',
    },
    challenge: {
      hook: `"挑战${Math.floor(Math.random()*20+10)}天${topic}，第一天就差点放弃..."`,
      body: `🎬 镜头1（倒计时开场）：大字标题+紧张BGM\n🎬 镜头2（过程记录）：每天关键画面混剪，快节奏\n🎬 镜头3（困难时刻）：展示最想放弃的瞬间\n🎬 镜头4（突破）：克服困难后的喜悦，真情流露`,
      ending: `"挑战成功！下一个挑战你来定，评论区见！🔥"`,
      tags: '#挑战 #坚持 #成长 #自律打卡',
    },
  };

  const s = scripts[style]||scripts.tutorial;

  document.getElementById('scriptResultCard').style.display='block';
  document.getElementById('scriptResult').innerHTML=`
    <div style="background:var(--bg-primary);padding:14px;border-radius:var(--radius-md);margin-bottom:10px;">
      <strong>📌 选题方向：</strong>${topic} · ${styleNames[style]}风格 · ${dur}秒
    </div>
    <div style="margin-bottom:10px;">
      <strong style="color:var(--accent-pink);">🎣 开头钩子（0-3秒）：</strong>
      <p style="margin:6px 0;padding:8px;background:#FFF0F5;border-radius:var(--radius-sm);">${s.hook}</p>
    </div>
    <div style="margin-bottom:10px;">
      <strong style="color:var(--accent-purple);">🎬 拍摄脚本：</strong>
      <p style="margin:6px 0;padding:8px;background:#F5F0FF;border-radius:var(--radius-sm);white-space:pre-line;">${s.body}</p>
    </div>
    <div style="margin-bottom:10px;">
      <strong style="color:var(--accent-green);">✨ 结尾引导：</strong>
      <p style="margin:6px 0;padding:8px;background:#F0FFF0;border-radius:var(--radius-sm);">${s.ending}</p>
    </div>
    <div style="margin-bottom:10px;">
      <strong>🏷️ 推荐标签：</strong>
      <p style="margin:6px 0;color:var(--accent-blue);">${s.tags}</p>
    </div>
    <div style="background:var(--bg-secondary);padding:10px;border-radius:var(--radius-md);font-size:11px;">
      <strong>💡 制作小贴士：</strong><br>
      ① 开头3秒决定留存率，钩子一定要有冲击力<br>
      ② 使用剪映/必剪，选择热门模板加速制作<br>
      ③ 发布时间建议：工作日12:00-13:00或18:00-20:00<br>
      ④ 发布后1小时内积极回复评论，提升互动率
    </div>
  `;
  document.getElementById('scriptResultCard').scrollIntoView({behavior:'smooth'});
}

function saveIdea(){
  const t=document.getElementById('savedIdea').value.trim();if(!t)return;
  appData.savedIdeas.unshift({id:Date.now().toString(),text:t,date:today()});saveData();document.getElementById('savedIdea').value='';renderSavedIdeas();
}
function renderSavedIdeas(){
  document.getElementById('savedIdeasList').innerHTML=appData.savedIdeas.length===0?'<div class="empty-state">还没有收藏灵感</div>':appData.savedIdeas.map(i=>`<div class="saved-idea-item"><span>💡${i.text}</span><button class="todo-delete" onclick="deleteIdea('${i.id}')">✕</button></div>`).join('');
}
function deleteIdea(id){appData.savedIdeas=appData.savedIdeas.filter(i=>i.id!==id);saveData();renderSavedIdeas();}

function saveRefLink(){
  const u=document.getElementById('refLink').value.trim(),t=document.getElementById('refTitle').value.trim();if(!u)return;
  appData.refLinks.unshift({id:Date.now().toString(),url:u,title:t||u,date:today()});saveData();document.getElementById('refLink').value='';document.getElementById('refTitle').value='';renderRefLinks();
}
function renderRefLinks(){
  document.getElementById('refLinkList').innerHTML=appData.refLinks.length===0?'<div class="empty-state">还没有参考链接</div>':appData.refLinks.map(r=>`<div class="ref-link-item"><div class="ref-link-title">${r.title}</div><div class="ref-link-url" onclick="openLink('${r.url}')">🔗${r.url}</div><div class="ref-link-actions"><button class="project-btn" onclick="openLink('${r.url}')">打开</button><button class="project-btn" onclick="analyzeVideo('${r.title}')">拆解</button><button class="todo-delete" onclick="deleteRefLink('${r.id}')">✕</button></div></div>`).join('');
}
function deleteRefLink(id){appData.refLinks=appData.refLinks.filter(r=>r.id!==id);saveData();renderRefLinks();}

function addReview(){
  const t=document.getElementById('reviewTitle').value.trim();if(!t)return;
  appData.reviews.unshift({id:Date.now().toString(),title:t,date:document.getElementById('reviewDate').value||today(),platform:document.getElementById('reviewPlatform').value,content:document.getElementById('reviewContent').value.trim()});saveData();document.getElementById('reviewTitle').value='';document.getElementById('reviewContent').value='';renderReviews();
}
function renderReviews(){
  document.getElementById('reviewList').innerHTML=appData.reviews.length===0?'<div class="empty-state">还没有复盘</div>':appData.reviews.map(r=>`<div class="review-item"><div class="review-header"><span class="review-title">${r.title}</span><span class="review-platform">${r.platform==='douyin'?'抖音':r.platform==='dewu'?'得物':r.platform==='bilibili'?'B站':'其他'}</span></div><span class="review-date">${r.date}</span>${r.content?`<div class="review-content-text">${r.content}</div>`:''}<button class="todo-delete" style="float:right;margin-top:4px" onclick="deleteReview('${r.id}')">✕</button></div>`).join('');
}
function deleteReview(id){appData.reviews=appData.reviews.filter(r=>r.id!==id);saveData();renderReviews();}

// ===== 随笔 =====
function selectMood(mood){appData.currentMood=mood;document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('active'));document.querySelector(`.mood-btn[data-mood="${mood}"]`)?.classList.add('active');}
function addDiary(){
  const t=document.getElementById('diaryTitle').value.trim(),c=document.getElementById('diaryContent').value.trim();if(!c&&!t)return;
  appData.diaries.unshift({id:Date.now().toString(),title:t||'无标题',content:c,mood:appData.currentMood,date:today()});saveData();document.getElementById('diaryTitle').value='';document.getElementById('diaryContent').value='';appData.currentMood=null;document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('active'));renderDiaries();
}
function renderDiaries(){
  document.getElementById('diaryList').innerHTML=appData.diaries.length===0?'<div class="empty-state"><div class="empty-icon">📖</div><div>还没有写随笔</div></div>':appData.diaries.map(d=>`<div class="diary-item"><div class="diary-header"><span class="diary-mood">${({happy:'😊',calm:'😌',sad:'😢',angry:'😠',excited:'🤩',tired:'😴'}[d.mood]||'📝')}</span><span class="diary-date">${d.date}</span></div><div class="diary-title-text">${d.title}</div>${d.content?`<div class="diary-content-text">${d.content}</div>`:''}<button class="todo-delete" style="float:right;margin-top:4px" onclick="deleteDiary('${d.id}')">✕</button></div>`).join('');
}
function deleteDiary(id){appData.diaries=appData.diaries.filter(d=>d.id!==id);saveData();renderDiaries();}

// ===== 侧边栏滚动监听 =====
function setupScrollSpy(){
  const scrollEl=document.getElementById('contentScroll');
  const navItems=document.querySelectorAll('.nav-item');
  const sections=document.querySelectorAll('.section');
  scrollEl.addEventListener('scroll',()=>{
    let current='overview';
    sections.forEach(sec=>{if(sec.getBoundingClientRect().top<=120)current=sec.id;});
    navItems.forEach(item=>item.classList.toggle('active',item.dataset.target===current));
  });
  navItems.forEach(item=>{item.addEventListener('click',e=>{e.preventDefault();document.getElementById(item.dataset.target)?.scrollIntoView({behavior:'smooth',block:'start'});});});
  document.querySelectorAll('.quick-btn[href]').forEach(btn=>{btn.addEventListener('click',e=>{e.preventDefault();document.querySelector(btn.getAttribute('href'))?.scrollIntoView({behavior:'smooth',block:'start'});});});
}

// ===== 导出/导入 =====
function exportData(){const b=new Blob([JSON.stringify(appData,null,2)],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`workbuddy_${today()}.json`;a.click();URL.revokeObjectURL(u);}
function importData(){const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result);appData={...appData,...d};if(!appData.reserves||typeof appData.reserves!=='object')appData.reserves={};if(!appData.todoItems)appData.todoItems=[];saveData();alert('导入成功！');location.reload();}catch{alert('格式错误');}};r.readAsText(f);};i.click();}
function clearAllData(){if(!confirm('确定清空所有数据？不可恢复！'))return;if(!confirm('再次确认！'))return;localStorage.removeItem(STORAGE_KEY);location.reload();}
function toggleSidebar(fc){const s=document.getElementById('sidebar'),o=document.getElementById('overlay');if(fc){s.classList.remove('open');o.classList.remove('show');}else{s.classList.toggle('open');o.classList.toggle('show');}}

document.addEventListener('DOMContentLoaded',init);
document.getElementById('analyzeModal')?.addEventListener('click',function(e){if(e.target===this)closeModal();});
