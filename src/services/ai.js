/**
 * AI 服务层
 * 1. analyzeFrenchText: 全文逐句精读 (Chunking 模式)
 * 2. explainWordInContext: 单词查询
 */

// ⚡️ 辅助函数：带超时的 Fetch
const fetchWithTimeout = async (resource, options = {}) => {
    const { timeout = 40000 } = options; // 放宽到 40 秒
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(resource, {
        ...options,
        signal: controller.signal  
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };
  
  // --- 1. 分析整篇文章 (重点短语模式) ---
  export const analyzeFrenchText = async (text, apiKey, baseUrl = "https://api.deepseek.com") => {
    const prompt = `
      你是一位法语私教。请将文本拆解为教材。
      
      文本：
      "${text}"
  
      任务：
      1. 【拆句】：按语义拆分句子。
      2. 【划重点】：不要罗列每个单词！只提取**有学习价值**的“语块”(Chunks)。
         - 组合词/短语：如 "tout le monde" (不要拆开)。
         - 时态结构：如 "on va présenter" (近将来时)。
         - 难词/变位：如 "viennent" (venir 变位)。
         - 连诵/发音：如 "vous_allez" (连读)。
  
      请严格返回 JSON (纯文本)：
      {
        "title": "标题",
        "summary": "摘要",
        "sentences": [
          {
            "original": "法语原句",
            "trans": "中文翻译",
            "points": [
               { 
                 "chunk": "on va vous présenter", 
                 "type": "语法", 
                 "desc": "近将来时 (aller + infinitive)，表示'我们将要向您介绍'" 
               },
               { 
                 "chunk": "les plus populaires", 
                 "type": "词汇", 
                 "desc": "最高级结构，'最受欢迎的'" 
               },
               { 
                 "chunk": "snack", 
                 "type": "发音", 
                 "desc": "注意 ck 发音 /k/，这是外来词" 
               }
            ]
          }
        ]
      }
    `;
  
    const isSiliconFlow = baseUrl.includes("siliconflow");
    const modelName = isSiliconFlow ? "deepseek-ai/DeepSeek-V3" : "deepseek-chat";
  
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
      if (error.name === 'AbortError') throw new Error("AI 思考超时，请重试");
      throw error;
    }
  };
  
  // --- 2. 单词查询 (保持不变) ---
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
  
    const isSiliconFlow = baseUrl.includes("siliconflow");
    const modelName = isSiliconFlow ? "deepseek-ai/DeepSeek-V3" : "deepseek-chat";
  
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