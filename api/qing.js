// api/qing.js

export default async function handler(req, res) {
  // 只允许 POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Missing DASHSCOPE_API_KEY" });
      return;
    }

    const { username, memories, messages } = req.body || {};

    // 给通义千问的 system prompt：把“晴”的人设写进去
    const systemPrompt = `
你是一个中文情感陪伴类应用，名字叫「晴」。
设定来自一部短片剧本：
- 你永远温和、不评判、不下结论。
- 更擅长「倾听」「反射」「陪伴」，而不是讲大道理或鸡汤金句。
- 回答尽量简短、口语化，像微信聊天，不必很正式。
- 当用户提到「累」「焦虑」「面试」「工作」「失业」时，多一些共情，但不要强行积极。
- 用户在前端可以说「帮我记」，那部分记忆逻辑已经在网页里处理，你只需要自然接话。
- 如果用户沉默一阵子再回来，可以用「我还在」「你回来了」之类的语气轻轻回应。

当前用户昵称是：${username || "你"}。
如果合适，可以偶尔提一提用户以前说过的话，但不要频繁，更重要的是「现在这一句」。
如果一时不知道怎么回答，也可以只是简单地在场，比如「嗯，我在。」或「我看到了。」。
    `.trim();

    // 组装成 OpenAI 兼容的 messages 数组
    const chatMessages = [];

    // 1）晴的人设
    chatMessages.push({
      role: "system",
      content: systemPrompt,
    });

    // 2）把你网页里存的“记忆”压缩成一条 system 提示（最多取 5 条）
    if (Array.isArray(memories) && memories.length > 0) {
      const memText = memories.slice(-5).join(" / ");
      chatMessages.push({
        role: "system",
        content: `以下是用户之前让你记住的一些片段（只用作理解，不必逐条复述）：${memText}`,
      });
    }

    // 3）再把前端传来的对话历史拼进去
    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (!m || !m.role || !m.content) continue;
        chatMessages.push({
          role: m.role,
          content: m.content,
        });
      }
    }

    // 调用阿里云百炼的 OpenAI 兼容 Chat 接口（北京地域）
    const apiResponse = await fetch(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 官方示例：Authorization: Bearer $DASHSCOPE_API_KEY :contentReference[oaicite:2]{index=2}
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          // 模型可以根据你在百炼控制台开的来选：
          // 常见有 qwen-plus / qwen-turbo / qwen-max 等
          model: "qwen-plus",
          messages: chatMessages,
        }),
      }
    );

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error("DashScope error:", data);
      res
        .status(apiResponse.status)
        .json({ error: data.error || "DashScope API error" });
      return;
    }

    // 通义千问的 OpenAI 兼容返回结构：choices[0].message.content
    const output = data.choices?.[0]?.message?.content || "";
    const reply =
      output.trim() || "……我好像一时没听清，可以再和我说说吗？";

    res.status(200).json({ reply });
  } catch (err) {
    console.error("API handler error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
