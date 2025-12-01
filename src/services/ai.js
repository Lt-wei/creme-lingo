/**
 * AI 服务层
 * 1. analyzeFrenchText: 全文逐句逐词精读
 * 2. explainWordInContext: 单词查询 (带超时控制)
 */

// ⚡️ 辅助函数：带超时的 Fetch
const fetchWithTimeout = async (resource, options = {}) => {
    const { timeout = 20000 } = options; // 默认 20 秒超时
    
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
  
  // --- 1. 分析整篇文章 (显微镜模式：逐词解析) ---
  export const analyzeFrenchText = async (text, apiKey, baseUrl = "https://api.deepseek.com") => {
    // 🟢 修复点：移除了 tokens 两边的反引号，防止语法错误
    const prompt = `
      你是一位对细节极其苛刻的法语语言学家。请将下面的文本拆解成“逐词精读教材”。
      
      文本内容：
      "${text}"
  
      任务要求：
      1. 【拆分】：按语义拆分成完整的句子。
      2. 【显微镜式拆解】：对于每一句话，除了翻译，必须提供 tokens 数组，将句中所有**实词**和**短语**拆解出来。
      3. 【拆解标准】：
         - 动词：必须给出原形 (Infinitif) 和时态。
         - 代词/冠词：简单标注即可。
         - 短语：如果是固定搭配 (如 "est-ce que"), 请作为一个整体解释。
  
      请严格返回以下 JSON 格式（纯文本，不要 Markdown）：
      {
        "title": "法语标题",
        "summary": "中文摘要",
        "level": "难度 (A1-C2)",
        "sentences": [
          {
            "original": "法语原句",
            "trans": "中文翻译",
            "tokens": [
               { "w": "bonjour", "m": "你好", "t": "阳性名词" },
               { "w": "les amis", "m": "朋友们", "t": "复数" },
               { "w": "bienvenue", "m": "欢迎", "t": "阴性名词" }
            ],
            "grammar": "这里写整句的特殊语法点或文化背景（可选）"
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
          temperature: 0.1, // 温度降到最低，追求绝对精确
          response_format: { type: "json_object" }
        }),
        timeout: 60000 // 全文分析允许 60 秒
      });
  
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      let content = data.choices[0].message.content;
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
  
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error("JSON 解析失败:", content);
        throw new Error("AI 数据格式错误，请重试");
      }
  
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error("AI 思考超时，请检查网络或重试");
      }
      throw error;
    }
  };
  
  // --- 2. 查询单词 (增加超时保护) ---
  export const explainWordInContext = async (word, roughContext, apiKey, baseUrl = "https://api.deepseek.com") => {
    const prompt = `
      语境："...${roughContext}..."
      单词： "${word}"。
      
      请返回纯 JSON 格式（不要Markdown）：
      {
        "meaning": "简练中文释义",
        "pronunciation": "IPA音标",
        "grammar_type": "词性(如: n.m.)",
        "note": "用法提示",
        "perfect_sentence": "根据语境还原的完整标准法语句子"
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
        timeout: 15000 // 单词查询超过 15 秒就报错，防止无限转圈
      });
  
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
  
      let content = data.choices[0].message.content;
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
  
      return JSON.parse(content);
    } catch (error) {
      console.error("Word Analysis Failed:", error);
      return null;
    }
  };