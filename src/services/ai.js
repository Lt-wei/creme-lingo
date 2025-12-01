/**
 * AI 服务层 (CORS 修复版)
 * 使用 /api/proxy 中转请求，解决阿里云/OpenAI 无法在浏览器直接调用的问题
 */

// 🛠️ 核心工具：通过 Vercel 后端代理发送请求
const callAIProxy = async (baseUrl, apiKey, payload) => {
    // 1. 智能处理 URL：防止出现 /v1/v1 的情况
    // 如果用户填写的 URL 结尾已经有 /v1，我们就不要再加 /v1 了
    let cleanBaseUrl = baseUrl.replace(/\/+$/, ""); // 去掉末尾斜杠
    let endpoint = "";
  
    if (cleanBaseUrl.endsWith("/v1")) {
      endpoint = `${cleanBaseUrl}/chat/completions`;
    } else {
      endpoint = `${cleanBaseUrl}/v1/chat/completions`;
    }
  
    // 2. 决定去哪里发请求 (本地环境 vs 线上环境)
    // 如果是本地调试，可能需要全路径；线上则用相对路径
    const proxyUrl = "/api/proxy"; 
  
    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: endpoint, // 告诉后端去请求谁
        apiKey: apiKey,     // 把钥匙给后端
        payload: payload    // 把要问的话给后端
      })
    });
  
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  };
  
  // 🧠 智能模型选择器
  const getModelName = (baseUrl) => {
    if (baseUrl.includes("siliconflow")) return "deepseek-ai/DeepSeek-V3";
    if (baseUrl.includes("aliyuncs")) return "qwen-max"; // 通义千问 MAX
    return "deepseek-chat";
  };
  
  // --- 1. 分析整篇文章 ---
  export const analyzeFrenchText = async (text, apiKey, baseUrl = "https://api.deepseek.com") => {
    const prompt = `
      你是一位法语私教。请将文本拆解为教材。
      文本："${text}"
      任务：
      1. 【拆句】：按语义拆分句子。
      2. 【划重点】：只提取**有学习价值**的“语块”(Chunks)，如固定搭配、时态结构、连诵、难词。不要罗列简单单词。
  
      请严格返回 JSON (纯文本)：
      {
        "title": "标题",
        "summary": "摘要",
        "sentences": [
          {
            "original": "法语原句",
            "trans": "中文翻译",
            "points": [
               { "chunk": "短语", "type": "语法/词汇/发音", "desc": "解释" }
            ]
          }
        ]
      }
    `;
  
    try {
      const payload = {
        model: getModelName(baseUrl),
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      };
  
      // ⚡️ 走代理通道
      const data = await callAIProxy(baseUrl, apiKey, payload);
      
      let content = data.choices[0].message.content;
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
  
      return JSON.parse(content);
    } catch (error) {
      console.error("Analysis Failed:", error);
      throw new Error(error.message || "AI 请求失败");
    }
  };
  
  // --- 2. 单词查询 ---
  export const explainWordInContext = async (word, roughContext, apiKey, baseUrl = "https://api.deepseek.com") => {
    const prompt = `
      语境："...${roughContext}..."
      单词： "${word}"。
      请返回 JSON：
      {
        "meaning": "中文释义",
        "pronunciation": "IPA",
        "grammar_type": "词性",
        "note": "用法提示",
        "perfect_sentence": "标准法语句子"
      }
    `;
  
    try {
      const payload = {
        model: getModelName(baseUrl),
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      };
  
      // ⚡️ 走代理通道
      const data = await callAIProxy(baseUrl, apiKey, payload);
  
      let content = data.choices[0].message.content;
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
  
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  };