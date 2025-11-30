/**
 * AI 服务层
 * 1. analyzeFrenchText: 分析整篇文章 (逐句拆解版)
 * 2. explainWordInContext: 解释单词并重构完美例句
 */

// --- 1. 分析整篇文章 (升级版：逐句精读) ---
export const analyzeFrenchText = async (text, apiKey, baseUrl = "https://api.deepseek.com") => {
    const prompt = `
      你是一位法语私教。请处理这篇法语文本：
      "${text}"
  
      任务要求：
      1. 【自动分句】：文本可能没有标点，请根据语义将其拆分为自然的句子。
      2. 【逐句解析】：对拆分后的每一句话进行分析（翻译+语法）。
      3. 【处理范围】：请尽量处理全文；如果文本过长（超过2000词），请只精读前30个核心句子。
  
      请严格返回以下 JSON 格式（纯文本，不要 Markdown）：
      {
        "title": "给这篇文章起个法语标题",
        "summary": "中文摘要",
        "level": "难度等级 (A1-C2)",
        "sentences": [
          {
            "original": "法语原句 (请修复大小写和标点)",
            "trans": "中文翻译",
            "grammar": "简短的语法点或重点词汇解释 (如果没有特殊点，留空)"
          }
        ]
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
          temperature: 0.2, // 低温更严谨
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
        throw new Error("AI 返回格式有误，请重试");
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
        "perfect_sentence": "修复后的完整法语句子"
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