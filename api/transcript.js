import { YoutubeTranscript } from 'youtube-transcript';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!url) return res.status(400).json({ error: '缺少 YouTube URL' });

    let transcriptItems = [];

    // 🕵️‍♀️ 智能抓取策略：三步走
    try {
      // 1. 优先尝试找“标准法语”
      transcriptItems = await YoutubeTranscript.fetchTranscript(url, { lang: 'fr' });
    } catch (e1) {
      try {
        // 2. 如果没找到，尝试找“法国法语” (fr-FR)
        transcriptItems = await YoutubeTranscript.fetchTranscript(url, { lang: 'fr-FR' });
      } catch (e2) {
        try {
           // 3. 还没找到？那就抓“默认字幕”（通常是自动生成的法语，或者是发布者设置的主语言）
           // 这一步是兜底，能解决绝大多数“报错”问题
           const list = await YoutubeTranscript.fetchTranscript(url);
           transcriptItems = list;
        } catch (e3) {
           throw new Error("无法提取字幕");
        }
      }
    }

    // 拼接文本
    const fullText = transcriptItems.map(item => item.text).join(' ');
    
    return res.status(200).json({ text: fullText });

  } catch (error) {
    console.error('Transcript Error:', error);
    return res.status(500).json({ 
      error: '无法提取 CC 字幕。请注意：APP 无法读取视频画面上的硬字幕，只能读取 YouTube 自带的 CC 字幕。' 
    });
  }
}