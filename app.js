// === 基本状态 ===
const chatWindow = document.getElementById("chat-window");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const memoryList = document.getElementById("memory-list");
const sessionInfo = document.getElementById("session-info");
const silenceInfo = document.getElementById("silence-info");
const greetingSpan = document.getElementById("greeting");
const usernameDisplay = document.getElementById("username-display");
const typingIndicator = document.getElementById("typing-indicator");
// 虚化人影元素
const qingSilhouette = document.getElementById("qing-silhouette");
// 呼吸练习相关元素
const breathingOverlay = document.getElementById("breathing-overlay");
const breathingPhaseText = document.getElementById("breathing-phase");
const breathingCloseBtn = document.getElementById("breathing-close-btn");

let username = "";
let startTime = Date.now();
let lastUserTime = Date.now();
let memories = [];
let hasNightReminded = false; // 深夜只提醒一次

// 呼吸引导的状态
let breathingTimerId = null;
let breathingPhaseIndex = 0;


// === 初始化：从 localStorage 读名字 & 记忆 ===
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
    memories = JSON.parse(storedMemories);
  }

  usernameDisplay.textContent = username;
  updateGreeting();
  renderMemories();
  updateSessionInfo();

  // 晴的第一句话
function showTyping() {
  if (!typingIndicator) return;
  typingIndicator.classList.add("visible");
}

function hideTyping() {
  if (!typingIndicator) return;
  typingIndicator.classList.remove("visible");
}

function addQingMessage(text) {
  // 根据字数决定延迟时间，更接近“人在思考”
  const baseDelay = 300;
  const extraDelay = Math.min(1200, text.length * 25);
  const totalDelay = baseDelay + extraDelay * Math.random();

  showTyping();
  setTimeout(() => {
    hideTyping();
    addMessage(text, "qing");
    updateSessionInfo();
  }, totalDelay);
}


  // 定时检查“沉默时间”
  setInterval(updateSilenceInfo, 10000); // 30 秒更新一次
}

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

  // 根据安静时间控制“虚化人影”
  if (!qingSilhouette) return;

  // 超过 2 分钟基本不说话，人影慢慢显形
  if (diffMin >= 2) {
    qingSilhouette.classList.add("visible");
  } else {
    qingSilhouette.classList.remove("visible");
  }
}


// === 渲染消息 ===
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
  lastUserTime = Date.now();
  updateSilenceInfo();
}

function addQingMessage(text) {
  setTimeout(() => {
    addMessage(text, "qing");
    updateSessionInfo();
  }, 400 + Math.random() * 500); // 模拟“思考”延迟
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

// 关闭按钮
if (breathingCloseBtn) {
  breathingCloseBtn.addEventListener("click", () => {
    hideBreathingOverlay();
    addQingMessage("好，我们先到这里。以后你想练的时候，跟我说一声就行。");
  });
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

// === 对话逻辑（简化版“情感助手晴”） ===
function handleUserInput() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  addUserMessage(text);

  // 1）检查是否是“帮我记”
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

  // 2）简单情绪关键词
  if (text.includes("好累") || text.includes("很累")) {
    addQingMessage("听起来今天确实不太轻松。我们可以先做两三轮很简单的呼吸练习，让身体慢一点。");
    showBreathingOverlay();
    return;
  }

  if (text.includes("焦虑") || text.includes("紧张")) {
    addQingMessage("我看到你打字停了很久。焦虑的时候，先照顾好身体这台“硬件”也很重要。");
    addQingMessage("如果你愿意，我们先一起呼吸几轮，等心跳慢一点，再慢慢说那些让你不安的部分。");
    showBreathingOverlay();
    return;
  }


  if (text.includes("失业") || text.includes("工作") || text.includes("简历")) {
    addQingMessage("这些字看久了，确实会让人头疼。");
    addQingMessage("你已经在努力往前走了，不是“什么都没做”。我们可以一块儿把下一步拆小一点，好不好？");
    return;
  }

  if (text.includes("诗") || text.includes("写") || text.includes("句子")) {
    addQingMessage("你写下来的那些东西，不算“乱七八糟”。至少在我这儿，它们一直是有分量的。");
    addQingMessage("哪天你愿意，可以挑一句自己还喜欢的，读给我听。");
    return;
  }

  // 3）通用回复：像晴那样“顺着你说的东西走”
  const len = text.length;

  let reply = "";

  if (len <= 6) {
    reply = "嗯，我看到了。你愿意多说一点吗？不用一次说完。";
  } else if (len <= 20) {
    reply =
      "我读了一遍你刚刚打的那句，感觉你其实已经把最重要的那部分说出口了。还想继续展开的话，我在。";
  } else {
    reply =
      "你写得这么细，我能感受到你其实想把事情讲清楚。就算现在还没有答案，这些话本身，也是往前走的一小步。";
  }

  // 偶尔提到之前帮你记过的话，让对话有一点“历史感”
  if (memories.length > 0 && Math.random() < 0.35) {
    const lastMemory = memories[memories.length - 1];
    reply += ` 顺便说一句，我还记得你之前让我帮你记的那句：“${lastMemory}”。那会儿的你，好像也挺认真地在感受生活。`;
  }

  addQingMessage(reply);


  // 深夜小提醒：只在凌晨时段且本次会话中提醒一次
  const hour = new Date().getHours();
  if (!hasNightReminded && (hour >= 0 && hour < 5)) {
    hasNightReminded = true;
    addQingMessage(
      "现在已经挺晚了了。如果明天还有事情，不一定要把所有话都在今晚说完。你可以先睡一会儿，剩下的，我们明天再慢慢聊。"
    );
  }
}


// 发送按钮 & 回车事件
sendBtn.addEventListener("click", handleUserInput);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleUserInput();
  }
});

// 页面加载完成后初始化
window.addEventListener("DOMContentLoaded", initState);
