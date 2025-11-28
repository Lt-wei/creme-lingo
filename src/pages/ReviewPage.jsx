import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Volume2, Trash2, Layers, Shuffle, CheckCircle } from 'lucide-react';
import CreamCard from '../components/CreamCard';
import Layout from '../components/Layout';

const ReviewPage = () => {
  const navigate = useNavigate();
  const [fullList, setFullList] = useState([]);
  
  // 状态管理：'menu' = 菜单页, 'session' = 复习中
  const [mode, setMode] = useState('menu'); 
  const [sessionList, setSessionList] = useState([]); // 当前复习队列
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem('cremeVocab')) || [];
    setFullList(list);
  }, []);

  // --- 功能函数 ---

  // 开始复习模式
  const startSession = (type) => {
    let list = [];
    if (type === 'all') {
      list = [...fullList];
    } else if (type === 'random10') {
      list = [...fullList].sort(() => 0.5 - Math.random()).slice(0, 10);
    }
    
    if (list.length === 0) return;
    
    setSessionList(list);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMode('session');
  };

  const handleNext = () => {
    setIsFlipped(false);
    // 延迟一点点翻页，让翻转动画复位
    setTimeout(() => {
      if (currentIndex < sessionList.length - 1) {
        setCurrentIndex(curr => curr + 1);
      } else {
        if(window.confirm("太棒了！本组单词复习完毕。回到菜单？")) {
          setMode('menu');
        }
      }
    }, 200);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if(!window.confirm("确定移除这个生词吗？")) return;

    // 更新总表
    const newFullList = fullList.filter(c => c.id !== id);
    setFullList(newFullList);
    localStorage.setItem('cremeVocab', JSON.stringify(newFullList));

    // 更新当前会话
    const newSessionList = sessionList.filter(c => c.id !== id);
    setSessionList(newSessionList);

    // 如果删完了
    if (newSessionList.length === 0) {
      setMode('menu');
      return;
    }

    // 调整索引
    setIsFlipped(false);
    if (currentIndex >= newSessionList.length) {
      setCurrentIndex(0);
    }
  };

  const playAudio = (e, text) => {
    e.stopPropagation();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    window.speechSynthesis.speak(u);
  };

  // --- 渲染部分 ---

  // 1. 空状态
  if (fullList.length === 0) {
    return (
      <Layout>
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-cream"><ArrowLeft size={20}/></button>
          <h1 className="text-xl font-bold">生词本</h1>
        </div>
        <CreamCard className="text-center py-20">
          <p className="text-6xl mb-4">😶</p>
          <p className="text-cream-text/60 font-bold">还没有生词哦</p>
          <p className="text-sm mt-2">阅读文章时点击单词即可收藏</p>
        </CreamCard>
      </Layout>
    );
  }

  // 2. 菜单模式 (Dashboard)
  if (mode === 'menu') {
    return (
      <Layout>
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-cream"><ArrowLeft size={20}/></button>
          <h1 className="text-xl font-bold">生词本</h1>
        </div>

        <div className="mb-8 text-center">
          <h2 className="text-5xl font-bold text-cream-text mb-2">{fullList.length}</h2>
          <p className="text-cream-text/50 uppercase tracking-widest text-xs">Total Words</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => startSession('random10')}
            className="w-full p-6 bg-white rounded-xl-card shadow-cream flex items-center justify-between group hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cream-accent/30 rounded-full flex items-center justify-center text-cream-text">
                <Shuffle size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg">随机复习 10 个</h3>
                <p className="text-xs text-cream-text/50">碎片时间，快速巩固</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => startSession('all')}
            className="w-full p-6 bg-cream-text text-white rounded-xl-card shadow-cream flex items-center justify-between group hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white">
                <Layers size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg">全部复习</h3>
                <p className="text-xs text-white/50">挑战所有库存</p>
              </div>
            </div>
          </button>
        </div>
      </Layout>
    );
  }

  // 3. 复习模式 (Session)
  const currentCard = sessionList[currentIndex];
  
  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setMode('menu')} className="p-2 bg-white rounded-full shadow-cream"><ArrowLeft size={20}/></button>
        <span className="text-xs font-mono bg-white px-3 py-1 rounded-full shadow-inner-light">
          {currentIndex + 1} / {sessionList.length}
        </span>
      </div>

      <div className="perspective-1000 w-full h-[60vh] relative cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* 正面 (Front) */}
          <div className="absolute w-full h-full backface-hidden">
            <CreamCard className="h-full flex flex-col items-center justify-center !p-8 border-2 border-white shadow-xl">
              <span className="text-xs bg-cream-accent/30 text-cream-text px-3 py-1 rounded-full mb-12">点击翻转查看</span>
              <h2 className="text-4xl font-bold text-cream-text mb-6 text-center">{currentCard.word}</h2>
              <button onClick={(e) => playAudio(e, currentCard.word)} className="p-4 bg-cream-bg rounded-full text-cream-text hover:bg-cream-accent transition-colors">
                <Volume2 size={28} />
              </button>
            </CreamCard>
          </div>

          {/* 背面 (Back) */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180">
            <CreamCard className="h-full flex flex-col items-center justify-between !p-6 bg-cream-text text-cream-bg relative shadow-xl">
              <div className="w-full text-center mt-8">
                <h3 className="text-3xl font-bold mb-2">{currentCard.meaning}</h3>
                <p className="text-white/50 font-mono text-lg">[{currentCard.pronunciation}]</p>
              </div>
              
              <div className="bg-white/10 p-4 rounded-xl w-full text-center italic text-sm text-white/80 leading-relaxed">
                "{currentCard.contextSentence}"
              </div>

              <div className="flex gap-4 w-full pt-4">
                <button 
                  onClick={(e) => handleDelete(e, currentCard.id)}
                  className="p-4 rounded-xl bg-white/10 text-red-300 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={24}/>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="flex-1 bg-cream-accent text-cream-text font-bold rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20}/> 记住了
                </button>
              </div>
            </CreamCard>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default ReviewPage;