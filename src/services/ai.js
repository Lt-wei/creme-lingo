/**
 * AI 服务层
 * 1. analyzeFrenchText: 分析整篇文章 (逐句精读 - 教授版)
 * 2. explainWordInContext: 解释单词并重构完美例句
 */

// --- 1. 分析整篇文章 (升级版：逐句精讲) ---
export const analyzeFrenchText = async (text, apiKey, baseUrl = "https://api.deepseek.com") => {
    const prompt = `
      你是一位对细节要求极高的法语语言学教授。请将下面的文本拆解成“逐句精读教材”。
      
      文本内容：
      "${text}"
  
      任务要求：
      1. 【拆分】：按语义拆分成完整的句子。
      2. 【深挖】：对于每一句话，不要只给翻译！必须提供以下深度的教学笔记（如果没有值得讲的点，就挖掘动词变位或发音）：
         - 语法分析：时态（如：近将来时）、句式结构（如：est-ce que）、代词用法。
         - 核心词汇：列出句中动词的原形（如：viennent -> venir）、形容词的阴阳性。
         - 发音提示：指出关键的联诵（Liaison，如：vous_allez）或特殊发音。
         - 文化/语体：是口语还是书面语？有什么地道表达？
  
      请严格返回以下 JSON 格式（纯文本）：
      {
        "title": "法语标题",
        "summary": "中文摘要",
        "level": "难度 (A1-C2)",
        "sentences": [
          {
            "original": "法语原句",
            "trans": "中文地道翻译",
            "notes": [
               "语法: 解释这里的时态或结构...",
               "词汇: xxx -> 原形是 yyy",
               "发音: 注意这里的连诵...",
               "文化: 这是非常口语化的说法..."
            ]
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
  
  // --- 2. 查询单词 (保持不变，但为了防止你弄丢，这里也完整贴出) ---
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