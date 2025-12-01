/**
 * AI 服务层 (支持 DeepSeek / 硅基流动 / 通义千问)
 */

// ⚡️ 辅助函数：带超时的 Fetch
const fetchWithTimeout = async (resource, options = {}) => {
    const { timeout = 40000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(resource, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };
  
  // 🧠 智能模型选择器
  const getModelName = (baseUrl) => {
    if (baseUrl.includes("siliconflow")) {
      return "deepseek-ai/DeepSeek-V3"; // 硅基流动
    } else if (baseUrl.includes("aliyuncs")) {
      return "qwen-max"; // 👈 阿里云通义千问 (qwen-max 是最强版，也可以改 qwen-plus)
    } else {
      return "deepseek-chat"; // 默认 DeepSeek 官方
    }
  };
  
  // --- 1. 分析整篇文章 ---
  export const analyzeFrenchText = async (text, apiKey, baseUrl = "https://api.deepseek.com") => {
    const prompt = `
      你是一位法语私教。请将文本拆解为教材。
      文本："${text}"
      任务：
      1. 【拆句】：按语义拆分句子。
      2. 【划重点】：只提取**有学习价值**的“语块”(Chunks)，如固定搭配、时态结构、连诵、难词。
      
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
  
    const modelName = getModelName(baseUrl);
  
    try {
      const response = await fetchWithTimeout(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        }),
        timeout: 60000
      });
  
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      let content = data.choices[0].message.content;
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
  
      return JSON.parse(content);
    } catch (error) {
      if (error.name === 'AbortError') throw new Error("AI 响应超时");
      throw error;
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
  
    const modelName = getModelName(baseUrl);
  
    try {
      const response = await fetchWithTimeout(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          response_format: { type: "json_object" }
        }),
        timeout: 15000 
      });
  
      const data = await response.json();
      let content = data.choices[0].message.content;
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
  
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  };