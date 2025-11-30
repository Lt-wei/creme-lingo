// 这是一个运行在云端的 Serverless 函数
import { YoutubeTranscript } from 'youtube-transcript';

export default async function handler(req, res) {
  // 设置 CORS 头，允许你的网页访问这个 API
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing YouTube URL' });
  }

  try {
    // 抓取字幕
    const transcriptItems = await YoutubeTranscript.fetchTranscript(url, { lang: 'fr' });
    
    // 把碎片字幕拼接成完整的文章
    const fullText = transcriptItems.map(item => item.text).join(' ');
    
    return res.status(200).json({ text: fullText });
  } catch (error) {
    console.error('Transcript Error:', error);
    return res.status(500).json({ error: '无法提取字幕，请确认视频有法语字幕 (CC)' });
  }
}