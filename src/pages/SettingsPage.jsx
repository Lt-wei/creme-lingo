import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import CreamCard from '../components/CreamCard';
import Layout from '../components/Layout';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.deepseek.com');

  useEffect(() => {
    setApiKey(localStorage.getItem('ai_apiKey') || '');
    setBaseUrl(localStorage.getItem('ai_baseUrl') || 'https://api.deepseek.com');
  }, []);

  const handleSave = () => {
    localStorage.setItem('ai_apiKey', apiKey);
    localStorage.setItem('ai_baseUrl', baseUrl);
    alert('设置已保存！大脑已连接 🧠');
    navigate('/');
  };

  return (
    <Layout>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-cream">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">设置大脑</h1>
      </div>

      <CreamCard className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2 text-cream-text/70">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full p-3 bg-cream-bg rounded-xl outline-none border border-transparent focus:border-cream-accent transition-colors"
          />
          <p className="text-xs text-cream-text/40 mt-2">
            推荐使用 DeepSeek (成本极低) 或 OpenAI。Key 仅保存在本地。
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-cream-text/70">API Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.deepseek.com"
            className="w-full p-3 bg-cream-bg rounded-xl outline-none"
          />
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-3 mt-4 bg-cream-text text-white rounded-xl font-bold shadow-cream flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Save size={18} />
          保存配置
        </button>
      </CreamCard>
    </Layout>
  );
};

export default SettingsPage;