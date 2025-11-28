/**
 * AI 服务层
 * 1. analyzeFrenchText: 分析整篇文章
 * 2. explainWordInContext: 解释单词并重构完美例句
 */

// --- 1. 分析整篇文章 ---
export const analyzeFrenchText = async (text, apiKey, baseUrl = "https://api.deepseek.com") => {
    const prompt = `
      你是一位资深的法语语言学家。请深度分析下面的法语文本，为A1水平的法语初学者制作教材。
      
      文本内容：
      "${text}"
  
      请严格按照以下 JSON 格式返回数据（纯文本格式，不要使用 Markdown 代码块，不要带 json 标记）：
      {
        "summary": "中文一句话摘要",
        "level": "CEFR等级 (例如: A2, B1)",
        "keywords": [
          {
            "word": "原型词(带阴阳性,如 le livre)", 
            "meaning": "中文释义", 
            "context": "原文中出现的完整句子",
            "ipa": "IPA音标(可选)"
          }
        ],
        "grammar_notes": [
          {
            "point": "语法点名称 (例如: 虚拟式现在时)",
            "explanation": "简短解释为什么这里用了这个语法",
            "example": "原文例句或自造简单例句"
          }
        ],
        "sentence_patterns": [
          {
            "pattern": "核心句型结构 (例如: Il est nécessaire que + subj)",
            "explanation": "中文解释用法",
            "example": "给出一个典型的例句"
          }
        ]
      }
    `;
  
    // 兼容硅基流动
    const isSiliconFlow = baseUrl.includes("siliconflow");
    const modelName = isSiliconFlow ? "deepseek-ai/DeepSeek-V3" : "deepseek-chat";
  
    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
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
        })
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
      console.error("AI Analysis Failed:", error);
      throw error;
    }
  };
  
  // --- 2. 查询单词 + 智能重构句子 ---
  export const explainWordInContext = async (word, roughContext, apiKey, baseUrl = "https://api.deepseek.com") => {
    const prompt = `
      我有一段没有标点符号的法语文本片段（粗糙语境）："...${roughContext}..."
      用户点击了其中的单词 "${word}"。
      
      请做两件事：
      1. 【还原句子】根据语义，从片段中精准提取包含 "${word}" 的那一句话（完整的句子）。
      2. 【修复标点】为这句话加上正确的标点符号（大小写、句号等），使其成为标准的法语句子。
      3. 【解释单词】解释该单词的含义。
  
      请返回纯 JSON 格式：
      {
        "meaning": "简练的中文释义",
        "pronunciation": "IPA音标",
        "grammar_type": "词性(如: n.m.)",
        "note": "简短用法提示",
        "perfect_sentence": "修复后的完整法语句子 (例如: Je vois une voiture.)"
      }
    `;
  
    const isSiliconFlow = baseUrl.includes("siliconflow");
    const modelName = isSiliconFlow ? "deepseek-ai/DeepSeek-V3" : "deepseek-chat";
  
    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
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
        })
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