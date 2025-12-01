import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, PlusCircle, CheckCircle, Loader2, BookOpen, Sparkles, RefreshCw } from 'lucide-react';
import CreamCard from '../components/CreamCard';
import Layout from '../components/Layout';
import { explainWordInContext, analyzeFrenchText } from '../services/ai';

const ReaderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  
  // 查词相关
  const [selectedWordObj, setSelectedWordObj] = useState(null); 
  const [wordData, setWordData] = useState(null);
  const [isLoadingWord, setIsLoadingWord] = useState(false);
  const [savedVocab, setSavedVocab] = useState([]);
  
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = () => {
    const savedLessons = JSON.parse(localStorage.getItem('cremeLessons')) || [];
    const currentLesson = savedLessons.find(l => l.id.toString() === id);
    setLesson(currentLesson);
    
    const vocab = JSON.parse(localStorage.getItem('cremeVocab')) || [];
    setSavedVocab(vocab);
  };

  const getRoughContext = (allWords, targetIndex) => {
    const start = Math.max(0, targetIndex - 40);
    const end = Math.min(allWords.length, targetIndex + 40);
    return allWords.slice(start, end).join(" ");
  };

  const handleWordClick = async (word, index, fullTextArray) => {
    const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").trim();
    if (!cleanWord || /^\d+$/.test(cleanWord)) return;

    const roughContext = getRoughContext(fullTextArray, index);

    setSelectedWordObj({ word: cleanWord, index });
    setWordData(null);
    setIsLoadingWord(true);

    const apiKey = localStorage.getItem('ai_apiKey');
    
    if (apiKey) {
      const result = await explainWordInContext(cleanWord, roughContext, apiKey, localStorage.getItem('ai_baseUrl'));
      if (result) {
        setWordData({ ...result, contextSentence: result.perfect_sentence });
      } else {
        setWordData({ meaning: "查询超时", contextSentence: "请重试" });
      }
    } else {
      setWordData({ meaning: "请配置 API Key", contextSentence: "..." });
    }
    
    setIsLoadingWord(false);
  };

  const addToVocab = () => {
    if (!wordData || !selectedWordObj) return;
    const newCard = {
      id: Date.now(),
      word: selectedWordObj.word,
      ...wordData, 
      lessonId: lesson.id,
      timestamp: Date.now(),
      reviewStage: 0 
    };
    const newVocab = [newCard, ...savedVocab];
    setSavedVocab(newVocab);
    localStorage.setItem('cremeVocab', JSON.stringify(newVocab));
  };

  const handleRegenerate = async () => {
    const apiKey = localStorage.getItem('ai_apiKey');
    if (!apiKey) return alert("请先配置 API Key");
    if(!window.confirm("确定重新生成精读笔记吗？")) return;

    setIsRegenerating(true);
    try {
      const baseUrl = localStorage.getItem('ai_baseUrl');
      const analysis = await analyzeFrenchText(lesson.text, apiKey, baseUrl);
      
      const updatedLesson = { ...lesson, analysis };
      setLesson(updatedLesson);

      const savedLessons = JSON.parse(localStorage.getItem('cremeLessons')) || [];
      const newLessonsList = savedLessons.map(l => l.id === lesson.id ? updatedLesson : l);
      localStorage.setItem('cremeLessons', JSON.stringify(newLessonsList));
    } catch (error) {
      alert("失败: " + error.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const playWordAudio = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    window.speechSynthesis.speak(u);
  };

  // 🎨 辅助颜色函数
  const getTypeColor = (type) => {
    if (!type) return "bg-gray-400";
    if (type.includes("语法")) return "bg-blue-400";
    if (type.includes("词汇") || type.includes("短语")) return "bg-green-500";
    if (type.includes("发音")) return "bg-purple-400";
    return "bg-cream-text";
  };

  if (!lesson) return <Layout>Loading...</Layout>;

  const isCollected = savedVocab.some(v => v.word === selectedWordObj?.word);
  const isSmartMode = lesson.analysis && lesson.analysis.sentences;

  return (
    <Layout>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-cream"><ArrowLeft size={20}/></button>
        <h1 className="text-lg font-bold truncate flex-1">{lesson.title}</h1>
        <button onClick={() => navigate('/review')} className="p-2 bg-white rounded-full shadow-cream text-cream-accent hover:text-cream-text">
          <BookOpen size={20} />
        </button>
      </div>

      {isSmartMode ? (
        <div className="space-y-8 pb-24">
          
          <CreamCard className="bg-cream-accent/10 border-cream-accent/30 relative group">
            <div className="flex items-center gap-2 mb-2 font-bold text-sm text-cream-text">
              <Sparkles size={16}/> 全文摘要
            </div>
            <p className="text-sm leading-relaxed">{lesson.analysis.summary}</p>
            <button 
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="absolute top-2 right-2 p-2 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
             {isRegenerating ? <Loader2 className="animate-spin" size={14}/> : <RefreshCw size={14}/>}
            </button>
          </CreamCard>

          {/* 逐句精读区 */}
          {lesson.analysis.sentences.map((sent, idx) => (
            <div key={idx} className="relative">
              
              {/* 1. 法语原句 */}
              <div className="text-xl leading-relaxed text-justify mb-2 font-serif text-cream-text pl-4 border-l-4 border-cream-accent/50">
                {sent.original.split(/\s+/).map((word, wIdx) => (
                  <span key={wIdx}>
                    <span 
                      onClick={() => handleWordClick(word, idx, sent.original.split(/\s+/))} 
                      className="cursor-pointer hover:bg-cream-accent/30 rounded px-0.5 transition-colors"
                    >
                      {word}
                    </span>
                    {' '} 
                  </span>
                ))}
                <button 
                  onClick={() => playWordAudio(sent.original)}
                  className="inline-block ml-2 text-cream-text/20 hover:text-cream-accent"
                >
                  <Volume2 size={18}/>
                </button>
              </div>

              {/* 2. 翻译 */}
              <p className="text-sm text-cream-text/60 mb-4 pl-5">
                {sent.trans}
              </p>

              {/* 3. 知识点精讲 (Knowledge Points) */}
              {sent.points && sent.points.length > 0 && (
                <div className="bg-white/60 rounded-xl p-3 space-y-3 shadow-sm ml-2">
                  {sent.points.map((pt, pIdx) => (
                    <div key={pIdx} className="flex gap-3 text-sm">
                      {/* 颜色条 */}
                      <div className={`w-1 shrink-0 rounded-full ${getTypeColor(pt.type)} opacity-60`}></div>
                      
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between mb-0.5">
                          {/* 重点短语 */}
                          <span className="font-bold text-cream-text">{pt.chunk}</span>
                          {/* 类型标签 */}
                          <span className="text-[10px] uppercase tracking-wider opacity-40 font-bold">{pt.type}</span>
                        </div>
                        {/* 解释 */}
                        <p className="text-cream-text/70 text-xs leading-relaxed">
                          {pt.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <CreamCard className="!p-6 mb-8 text-center">
           <button 
             onClick={handleRegenerate}
             disabled={isRegenerating}
             className="px-4 py-2 bg-cream-accent text-cream-text rounded-lg font-bold flex items-center gap-2 mx-auto"
           >
             {isRegenerating ? <Loader2 className="animate-spin" size={16}/> : <RefreshCw size={16}/>}
             生成精读笔记
           </button>
           <div className="mt-4 text-left opacity-50">{lesson.text}</div>
        </CreamCard>
      )}

      {/* 底部查词浮层 (保持不变) */}
      {selectedWordObj && (
        <div className="fixed bottom-0 left-0 w-full z-50 p-4 animate-in slide-in-from-bottom duration-300">
          <CreamCard className="!p-0 overflow-hidden shadow-2xl border-t border-white/50">
            <div className="bg-cream-bg p-3 flex justify-between items-center border-b border-white">
               <h3 className="text-xl font-bold text-cream-text ml-2">{selectedWordObj.word}</h3>
               <button onClick={() => setSelectedWordObj(null)} className="p-2 text-cream-text/50">关闭</button>
            </div>
            <div className="p-4 bg-white/90 backdrop-blur-xl min-h-[100px]">
              {isLoadingWord ? (
                <div className="flex items-center justify-center py-4 text-cream-text/50 gap-2">
                  <Loader2 className="animate-spin"/> 深度解析中...
                </div>
              ) : wordData ? (
                <div>
                   <div className="flex gap-2 mb-2">
                      <span className="text-xs bg-cream-accent text-cream-text px-2 py-0.5 rounded">{wordData.grammar_type}</span>
                      <span className="text-xs text-gray-400 font-mono">[{wordData.pronunciation}]</span>
                   </div>
                   <p className="text-lg font-medium mb-2">{wordData.meaning}</p>
                   <p className="text-sm text-gray-500 mb-4">{wordData.note}</p>
                   <button 
                    onClick={addToVocab}
                    disabled={isCollected}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${isCollected ? 'bg-green-100 text-green-700' : 'bg-cream-text text-white'}`}
                   >
                     {isCollected ? <><CheckCircle size={18}/> 已收藏</> : <><PlusCircle size={18}/> 加入复习</>}
                   </button>
                </div>
              ) : null}
            </div>
          </CreamCard>
        </div>
      )}
    </Layout>
  );
};

export default ReaderPage;