// === 获取 DOM 元素 ===
const chatWindow = document.getElementById("chat-window");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const memoryList = document.getElementById("memory-list");
const sessionInfo = document.getElementById("session-info");
const silenceInfo = document.getElementById("silence-info");
const greetingSpan = document.getElementById("greeting");
const usernameDisplay = document.getElementById("username-display");
const typingIndicator = document.getElementById("typing-indicator");

// 根节点 & 背景按钮
const appRoot = document.querySelector(".app");
const themeToggleBtn = document.getElementById("theme-toggle");

// 新增：场景模式相关元素
const appRoot = document.querySelector(".app");
const modeButtons = document.querySelectorAll(".mode-btn");


// 呼吸练习相关
const breathingOverlay = document.getElementById("breathing-overlay");
const breathingPhaseText = document.getElementById("breathing-phase");
const breathingCloseBtn = document.getElementById("breathing-close-btn");

// 虚化人影
const qingSilhouette = document.getElementById("qing-silhouette");

// === 全局状态 ===
let username = "";
let startTime = Date.now();
let lastUserTime = Date.now();
let memories = [];
let hasNightReminded = false;

let breathingTimerId = null;
let breathingPhaseIndex = 0;

let chatMessages = []; // 会传给后端（百炼）作为对话历史
let currentMode = "daily"; // 当前场景模式
let currentTheme = "deep"; // 当前背景主题：deep / soft / light


// === 初始化 ===
function initState() {
  const storedName = localStorage.getItem("qing_username");
  const storedMemories = localStorage.getItem("qing_memories");

  if (storedName) {
    username = storedName;
  } else {
    username = prompt("第一次见面，怎么称呼你？（可以写小名）") || "你";
    localStorage.setItem("qing_username", username);
  }

  if (storedMemories) {
    try {
      memories = JSON.parse(storedMemories) || [];
    } catch (e) {
      memories = [];
    }
  }

  usernameDisplay.textContent = username;
  updateGreeting();
  renderMemories();
  updateSessionInfo();
  updateSilenceInfo();



  // 晴的第一句
  addQingMessage(
    `${username}，你的声音……听起来有点累。今天，要不要先从一句话开始说起？`
  );

    setInterval(updateSilenceInfo, 30000);
}

 // ★ 新增：读取上次使用的场景模式
  const storedMode = localStorage.getItem("qing_mode") || "daily";
  applyMode(storedMode, false); 


// 问候语（早上好 / 下午好 / 晚上好）
function updateGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) greetingSpan.textContent = "早上好";
  else if (hour >= 12 && hour < 18) greetingSpan.textContent = "下午好";
  else greetingSpan.textContent = "晚上好";
}

function updateSessionInfo() {
  const minutes = Math.floor((Date.now() - startTime) / 60000);
  if (minutes === 0) {
    sessionInfo.textContent = "我们刚刚才开始聊天。";
  } else {
    sessionInfo.textContent = `今天已经陪你待了大约 ${minutes} 分钟。`;
  }
}

function updateSilenceInfo() {
  const diffMin = Math.floor((Date.now() - lastUserTime) / 60000);

  if (diffMin >= 3) {
    silenceInfo.textContent = `刚刚你安静了大约 ${diffMin} 分钟。沉默也没关系，想说的时候再说就好。`;
  } else if (diffMin >= 1) {
    silenceInfo.textContent = `上一次说话是 ${diffMin} 分钟前。`;
  } else {
    silenceInfo.textContent = "";
  }
function applyTheme(theme) {
  currentTheme = theme;

  if (appRoot) {
    appRoot.classList.remove("theme-deep", "theme-soft", "theme-light");
    appRoot.classList.add(`theme-${theme}`);
  }
  updateSessionInfo();
  updateSilenceInfo();

  // ★ 新增：读取上次使用的背景主题
  const storedTheme = localStorage.getItem("qing_theme") || "deep";
  applyTheme(storedTheme);

  // 晴的第一句
  addQingMessage(
    `${username}，你的声音……听起来有点累。今天，要不要先从一句话开始说起？`
  );

  // 按钮文字提示当前风格
  if (themeToggleBtn) {
    if (theme === "deep") {
      themeToggleBtn.textContent = "深色";
    } else if (theme === "soft") {
      themeToggleBtn.textContent = "柔和";
    } else {
      themeToggleBtn.textContent = "浅色";
    }
  }

  // 记住用户选择
  localStorage.setItem("qing_theme", theme);
}

  // 安静超过 2 分钟，人影淡淡出现；你一说话就慢慢退回去
  if (!qingSilhouette) return;
  if (diffMin >= 2) {
    qingSilhouette.classList.add("visible");
  } else {
    qingSilhouette.classList.remove("visible");
  }
}
function applyMode(mode, fromUser = false) {
  currentMode = mode;

  // 1）外层容器切换类名，改变整体背景氛围
  if (appRoot) {
    appRoot.classList.remove("mode-daily", "mode-interview", "mode-lake");
    appRoot.classList.add(`mode-${mode}`);
  }

  // 2）按钮高亮
  if (modeButtons && modeButtons.length) {
    modeButtons.forEach((btn) => {
      const btnMode = btn.dataset.mode || "daily";
      btn.classList.toggle("active", btnMode === mode);
    });
  }

  // 3）本地记住选中的模式
  localStorage.setItem("qing_mode", mode);

  // 4）如果是用户点击切换的，晴给一点回应
  if (fromUser) {
    let text = "";
    if (mode === "daily") {
      text =
        "好，那我们就当作是一个普通的日子。你可以随便从今天的一件小事说起。";
    } else if (mode === "interview") {
      text =
        "好，那就当作是你面试那天的版本。如果哪一句回忆让你不舒服，我们随时可以换个话题。";
    } else if (mode === "lake") {
      text =
        "那我们就当作是在湖边那天，只是慢慢聊一会儿，不用把故事讲得很完整。";
    }
    addQingMessage(text);
  }
}

// === 消息渲染 ===
function addMessage(text, from = "qing") {
  const div = document.createElement("div");
  div.classList.add("message");
  div.classList.add(from === "qing" ? "message-qing" : "message-user");

  const content = document.createElement("div");
  content.classList.add("message-text");
  content.textContent = text;

  const meta = document.createElement("div");
  meta.classList.add("message-meta");
  const timeStr = new Date().toTimeString().slice(0, 5);
  meta.textContent = timeStr;

  div.appendChild(content);
  div.appendChild(meta);
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addUserMessage(text) {
  addMessage(text, "user");
}

function showTyping() {
  if (!typingIndicator) return;
  typingIndicator.classList.add("visible");
}

function hideTyping() {
  if (!typingIndicator) return;
  typingIndicator.classList.remove("visible");
}

// 晴的气泡：带一点点“思考延迟”
function addQingMessage(text) {
  const baseDelay = 300;
  const extraDelay = Math.min(1200, text.length * 25);
  const totalDelay = baseDelay + extraDelay * Math.random();

  setTimeout(() => {
    addMessage(text, "qing");
    updateSessionInfo();
  }, totalDelay);
}

// === 记忆系统 ===
function renderMemories() {
  memoryList.innerHTML = "";
  if (memories.length === 0) {
    const li = document.createElement("li");
    li.textContent = "还没有特别想记的东西。你可以对我说：帮我记 + 某句话。";
    memoryList.appendChild(li);
    return;
  }
  memories.forEach((m) => {
    const li = document.createElement("li");
    li.textContent = m;
    memoryList.appendChild(li);
  });
}

function addMemory(text) {
  memories.push(text);
  localStorage.setItem("qing_memories", JSON.stringify(memories));
  renderMemories();
}

// === 呼吸练习逻辑 ===
const breathingSequence = [
  { text: "吸气…… 在心里慢慢数到四。", duration: 4000 },
  { text: "停一下…… 感受一下胸腔鼓起来。", duration: 3000 },
  { text: "呼气…… 慢慢吐掉，数到六。", duration: 5000 },
  { text: "什么都不用做，就待在这里就好。", duration: 4000 },
];

function scheduleNextBreathingPhase() {
  if (!breathingOverlay || !breathingPhaseText) return;
  const phase = breathingSequence[breathingPhaseIndex];
  breathingPhaseText.textContent = phase.text;
  breathingPhaseIndex = (breathingPhaseIndex + 1) % breathingSequence.length;

  breathingTimerId = setTimeout(scheduleNextBreathingPhase, phase.duration);
}

function startBreathingGuide() {
  breathingPhaseIndex = 0;
  scheduleNextBreathingPhase();
}

function stopBreathingGuide() {
  if (breathingTimerId) {
    clearTimeout(breathingTimerId);
    breathingTimerId = null;
  }
}

function showBreathingOverlay() {
  if (!breathingOverlay) return;
  breathingOverlay.classList.add("visible");
  startBreathingGuide();
}

function hideBreathingOverlay() {
  if (!breathingOverlay) return;
  breathingOverlay.classList.remove("visible");
  stopBreathingGuide();
}

if (breathingCloseBtn) {
  breathingCloseBtn.addEventListener("click", () => {
    hideBreathingOverlay();
    addQingMessage("好，我们先到这里。以后你想练的时候，跟我说一声就行。");
  });
}

// === 核心：处理用户输入 & 调用后端（阿里云百炼） ===
async function handleUserInput() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  addUserMessage(text);
  lastUserTime = Date.now();
  updateSilenceInfo();

  // 1）“帮我记”在前端本地处理，不走模型
  if (text.startsWith("帮我记")) {
    const toRemember = text.replace("帮我记", "").trim();
    if (toRemember) {
      addMemory(toRemember);
      addQingMessage("好，这一句我已经记下来了。哪天你不想记的时候，我还能帮你记着。");
    } else {
      addQingMessage("你想让我记住什么呢？可以说：“帮我记 今天看到的夕阳”。");
    }
    return;
  }

  // 2）情绪词：顺便打开呼吸练习
  if (
    text.includes("好累") ||
    text.includes("很累") ||
    text.includes("焦虑") ||
    text.includes("紧张")
  ) {
    showBreathingOverlay();
  }

  // 3）把这句用户的话记录进对话历史
  chatMessages.push({ role: "user", content: text });

  // 4）发给后端，让“晴”（通义千问）来回答
  await sendToQingAI();
}

async function sendToQingAI() {
  try {
    showTyping();

    const res = await fetch("/api/qing", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username,
    memories,
    mode: currentMode, // ★ 把当前场景模式也发给后端
    messages: chatMessages,
  }),
});


    const data = await res.json();
    hideTyping();

if (!res.ok) {
  console.error("API error:", data);
  const msg =
    (data && (data.error?.message || data.error || JSON.stringify(data))) ||
    "未知错误";
  addQingMessage("后端报错：" + msg);
  return;
}


    const reply = (data.reply || "").trim() || "嗯，我在。";
    chatMessages.push({ role: "assistant", content: reply });
    addQingMessage(reply);

    // 深夜小提醒：在模型回复之后轻轻说一次
    const hour = new Date().getHours();
    if (!hasNightReminded && hour >= 0 && hour < 5) {
      hasNightReminded = true;
      addQingMessage(
        "现在已经挺晚了。如果明天还有事情，不一定要把所有话都在今晚说完。你可以先睡一会儿，剩下的，我们明天再慢慢聊。"
      );
    }
  } catch (err) {
    console.error("Network error:", err);
    hideTyping();
    addQingMessage("网络好像有点不太稳定，我先在这里等你一会儿。");
  }
}

// === 事件绑定 ===
sendBtn.addEventListener("click", () => {
  handleUserInput();
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleUserInput();
  }
});
// 场景模式按钮点击
if (modeButtons && modeButtons.length) {
  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode || "daily";
      applyMode(mode, true);
    });
  });
}

// 背景风格切换按钮：在 深色 / 柔和 / 浅色 之间轮换
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const order = ["deep", "soft", "light"];
    const currentIndex = order.indexOf(currentTheme);
    const nextTheme = order[(currentIndex + 1) % order.length];
    applyTheme(nextTheme);
  });
}

window.addEventListener("DOMContentLoaded", initState);
