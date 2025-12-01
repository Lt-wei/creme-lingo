export default async function handler(req, res) {
    // 1. 设置允许跨域 (CORS)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    try {
      // 2. 接收前端传来的数据
      const { endpoint, apiKey, payload } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  
      if (!endpoint || !apiKey) {
        return res.status(400).json({ error: 'Missing endpoint or apiKey' });
      }
  
      // 3. 服务器代替前端去请求 AI
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });
  
      // 4. 处理错误
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }
  
      // 5. 将结果返回给前端
      const data = await response.json();
      return res.status(200).json(data);
  
    } catch (error) {
      console.error('Proxy Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }