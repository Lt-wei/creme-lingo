import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, BookOpen, X, Settings, Loader2, Trash2, GraduationCap } from 'lucide-react';
import CreamCard from '../components/CreamCard';
import Layout from '../components/Layout';
import { analyzeFrenchText } from '../services/ai';

const HomePage = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [vocabCount, setVocabCount] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // 输入状态
  const [newText, setNewText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const savedLessons = JSON.parse(localStorage.getItem('cremeLessons')) || [];
    const savedVocab = JSON.parse(localStorage.getItem('cremeVocab')) || [];
    setLessons(savedLessons);
    setVocabCount(savedVocab.length);
  };

  const handleDelete = (e, id) => {
    e.preventDefault(); // 防止触发 Link 跳转
    if (window.confirm('确定要删除这篇文章吗？')) {
      const updatedLessons = lessons.filter(l => l.id !== id);
      setLessons(updatedLessons);
      localStorage.setItem('cremeLessons', JSON.stringify(updatedLessons));
    }
  };

  const handleSmartSave = async () => {
    if (!newText.trim()) return;
    const apiKey = localStorage.getItem('ai_apiKey');
    
    if (!apiKey) {
      if(window.confirm("你还没有配置 AI 大脑，去设置填一下 Key？")) navigate('/settings');
      return;
    }

    setIsProcessing(true);
    const title = newTitle.trim() || `Lesson ${lessons.length + 1}`;
    
    try {
      const baseUrl = localStorage.getItem('ai_baseUrl');
      const analysis = await analyzeFrenchText(newText, apiKey, baseUrl);
      
      const newLesson = {
        id: Date.now(),
        title: title,
        text: newText,
        analysis: analysis, // 确保 AI 数据存入
        date: new Date().toLocaleDateString('fr-FR')
      };

      const updatedLessons = [newLesson, ...lessons];
      setLessons(updatedLessons);
      localStorage.setItem('cremeLessons', JSON.stringify(updatedLessons));
      
      setNewText('');
      setNewTitle('');
      setShowAddModal(false);
    } catch (error) {
      alert("生成失败: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-end mb-4 px-2">
        <h2 className="text-lg font-bold">学习中心</h2>
        <Link to="/settings">
           <Settings size={20} className="text-cream-text/40 hover:text-cream-text transition-colors"/>
        </Link>
      </div>

      {/* 🟢 新增：生词本入口卡片 */}
      <Link to="/review">
        <CreamCard className="mb-6 !bg-cream-accent/20 border-cream-accent/50 flex justify-between items-center group cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-cream-text">
              <GraduationCap size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">我的生词本</h3>
              <p className="text-xs text-cream-text/60">共积累 {vocabCount} 个单词</p>
            </div>
          </div>
          <div className="text-cream-text/40 group-hover:translate-x-1 transition-transform">
             👉
          </div>
        </CreamCard>
      </Link>
      
      <h2 className="text-lg font-bold mb-4 ml-2">我的课程</h2>
      <div className="space-y-4 pb-20">
        {lessons.length === 0 ? (
           <CreamCard className="text-center py-10 text-cream-text/50">
             点击右下角 "+" <br/>开始你的第一堂课
           </CreamCard>
        ) : (
          lessons.map(lesson => (
            <Link to={`/read/${lesson.id}`} key={lesson.id}>
              <CreamCard className="relative flex items-center gap-4 group hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-cream-bg rounded-2xl flex items-center justify-center text-cream-text/70">
                  <BookOpen size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{lesson.title}</h3>
                  <p className="text-sm text-cream-text/50">
                    {lesson.analysis?.level || 'Raw'} • {lesson.date}
                  </p>
                </div>
                {/* 🔴 新增：删除按钮 */}
                <button 
                  onClick={(e) => handleDelete(e, lesson.id)}
                  className="p-2 text-cream-text/20 hover:text-red-400 transition-colors z-20"
                >
                  <Trash2 size={18} />
                </button>
              </CreamCard>
            </Link>
          ))
        )}
      </div>

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-cream-text text-cream-bg rounded-full shadow-cream-hover flex items-center justify-center transition-transform active:scale-95 z-50"
      >
        <Plus size={32} />
      </button>

      {/* 模态框保持不变 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <CreamCard className="w-full max-w-md !p-6 relative animate-in zoom-in-95 duration-200">
            {isProcessing && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 rounded-xl-card flex flex-col items-center justify-center text-cream-text">
                <Loader2 size={40} className="animate-spin mb-2" />
                <p className="font-bold animate-pulse">AI 正在备课中...</p>
                <p className="text-xs text-cream-text/50 mt-2">分析句型 / 提取生词 / 评估等级</p>
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">新建课程</h3>
              <button onClick={() => setShowAddModal(false)}><X size={20}/></button>
            </div>
            <input
              type="text"
              placeholder="标题 (例如: 小王子第一章)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full mb-4 p-3 bg-cream-bg rounded-xl outline-none focus:ring-2 focus:ring-cream-accent/50"
            />
            <textarea
              placeholder="请粘贴法语文本..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full h-48 p-3 bg-cream-bg rounded-xl outline-none resize-none mb-4 focus:ring-2 focus:ring-cream-accent/50"
            />
            <button 
              onClick={handleSmartSave} 
              disabled={isProcessing}
              className="w-full py-3 bg-cream-text text-white rounded-xl font-bold shadow-cream hover:shadow-cream-hover active:scale-95 transition-all disabled:opacity-50"
            >
              开始生成教材 ✨
            </button>
          </CreamCard>
        </div>
      )}
    </Layout>
  );
};

export default HomePage;