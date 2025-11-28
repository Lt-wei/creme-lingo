import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, PlusCircle, CheckCircle, Loader2, BookOpen, Sparkles, RefreshCw, GraduationCap } from 'lucide-react';
import CreamCard from '../components/CreamCard';
import Layout from '../components/Layout';
import { explainWordInContext, analyzeFrenchText } from '../services/ai';

const ReaderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  
  // 查词相关
  const [selectedWordObj, setSelectedWordObj] = useState(null); // { word, index }
  const [wordData, setWordData] = useState(null);
  const [isLoadingWord, setIsLoadingWord] = useState(false);
  const [savedVocab, setSavedVocab] = useState([]);
  
  // 重新生成相关
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

  // 1. 获取粗糙语境 (扩大范围给 AI 判断)
  // 前后各取 40 个词，形成约 80 词的片段，足够 AI 找到句子边界
  const getRoughContext = (allWords, targetIndex) => {
    const start = Math.max(0, targetIndex - 40);
    const end = Math.min(allWords.length, targetIndex + 40);
    return allWords.slice(start, end).join(" ");
  };

  // 2. 点击单词处理
  const handleWordClick = async (word, index, allWords) => {
    const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").trim();
    if (!cleanWord || /^\d+$/.test(cleanWord)) return;

    // 获取粗糙语境传给 AI
    const roughContext = getRoughContext(allWords, index);

    setSelectedWordObj({ word: cleanWord, index });
    setWordData(null);
    setIsLoadingWord(true);

    const apiKey = localStorage.getItem('ai_apiKey');
    
    // 如果有 Key，调用 AI 进行智能重构
    if (apiKey) {
      const result = await explainWordInContext(cleanWord, roughContext, apiKey, localStorage.getItem('ai_baseUrl'));
      if (result) {
        setWordData({ 
          ...result, 
          // 重点：使用 AI 修复后的完美句子作为例句
          contextSentence: result.perfect_sentence 
        });
      } else {
        // AI 失败兜底
        setWordData({ meaning: "分析失败", contextSentence: "..." + roughContext.slice(0, 50) + "..." });
      }
    } else {
      // 没 Key 时的兜底
      setWordData({ meaning: "请配置 API Key", contextSentence: "..." + roughContext.slice(0, 50) + "..." });
    }
    
    setIsLoadingWord(false);
  };

  // 3. 加入生词本
  const addToVocab = () => {
    if (!wordData || !selectedWordObj) return;
    
    const newCard = {
      id: Date.now(),
      word: selectedWordObj.word,
      ...wordData, // 这里包含了 perfect_sentence
      lessonId: lesson.id,
      timestamp: Date.now(),
      reviewStage: 0 
    };

    const newVocab = [newCard, ...savedVocab];
    setSavedVocab(newVocab);
    localStorage.setItem('cremeVocab', JSON.stringify(newVocab));
  };

  // 4. 重新分析整篇文章
  const handleRegenerate = async () => {
    const apiKey = localStorage.getItem('ai_apiKey');
    if (!apiKey) return alert("请先去设置配置 API Key");
    if(!window.confirm("重新分析会覆盖当前的 AI 笔记，确定吗？")) return;

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
      alert("分析失败: " + error.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const playWordAudio = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    window.speechSynthesis.speak(u);
  };

  if (!lesson) return <Layout>Loading...</Layout>;

  // 将文本按空格切分
  const allWords = lesson.text.split(/\s+/);
  const isCollected = savedVocab.some(v => v.word === selectedWordObj?.word);
  const hasAnalysis = lesson.analysis && lesson.analysis.summary;

  return (
    <Layout>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow-cream"><ArrowLeft size={20}/></button>
        <h1 className="text-lg font-bold truncate flex-1">{lesson.title}</h1>
        <button onClick={() => navigate('/review')} className="p-2 bg-white rounded-full shadow-cream text-cream-accent hover:text-cream-text">
          <BookOpen size={20} />
        </button>
      </div>

      {/* 🔴 状态提示区 */}
      {!hasAnalysis && (
        <CreamCard className="mb-6 bg-red-50 border-red-100">
          <div className="text-center py-4">
            <h3 className="font-bold text-red-400 mb-2">暂无 AI 导读</h3>
            <button 
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="px-4 py-2 bg-white text-red-400 rounded-lg shadow-sm font-bold text-sm flex items-center justify-center gap-2 mx-auto active:scale-95 transition-transform"
            >
              {isRegenerating ? <Loader2 className="animate-spin" size={16}/> : <RefreshCw size={16}/>}
              {isRegenerating ? "正在分析..." : "点击重新生成"}
            </button>
          </div>
        </CreamCard>
      )}

      {/* AI 摘要 */}
      {hasAnalysis && (
        <CreamCard className="mb-6 !bg-cream-accent/10 border-cream-accent/30 relative group">
          <div className="flex items-center gap-2 mb-2 text-cream-text font-bold text-sm">
            <Sparkles size={16} /> AI 导读
          </div>
          <p className="text-sm leading-relaxed text-cream-text/80">{lesson.analysis.summary}</p>
          
          <button 
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="absolute top-2 right-2 p-2 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            title="重新分析"
          >
             {isRegenerating ? <Loader2 className="animate-spin" size={14}/> : <RefreshCw size={14}/>}
          </button>
        </CreamCard>
      )}

      {/* 📝 正文阅读区 */}
      <CreamCard className="!p-6 mb-8 pb-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-cream-accent"></div>
        <div className="text-lg leading-loose text-justify font-serif break-words">
          {allWords.map((word, index) => (
            <span key={index}>
              <span 
                onClick={() => handleWordClick(word, index, allWords)}
                className={`
                   rounded px-0.5 cursor-pointer transition-colors 
                   ${selectedWordObj?.index === index ? 'bg-cream-accent text-cream-text font-bold' : 'hover:bg-cream-accent/30'}
                `}
              >
                {word}
              </span>
              {' '} 
            </span>
          ))}
        </div>
      </CreamCard>

       {/* 🧩 句型解析 */}
       {hasAnalysis && lesson.analysis.sentence_patterns && (
        <div className="space-y-4 mb-8">
          <h3 className="font-bold ml-2 flex items-center gap-2 text-lg">
            <GraduationCap size={20}/> 核心句型
          </h3>
          {lesson.analysis.sentence_patterns.map((pat, i) => (
            <CreamCard key={i} className="!p-4 bg-white">
              <div className="font-mono text-cream-text font-bold mb-1 bg-gray-100 inline-block px-2 rounded text-xs">
                {pat.pattern}
              </div>
              <p className="text-xs text-cream-text/70 mb-2">{pat.explanation}</p>
              <div className="pl-2 border-l-2 border-cream-accent text-xs italic text-cream-text/50">
                {pat.example}
              </div>
            </CreamCard>
          ))}
        </div>
      )}

      {/* 底部查词卡片 */}
      {selectedWordObj && (
        <div className="fixed bottom-0 left-0 w-full z-50 p-4 animate-in slide-in-from-bottom duration-300">
          <CreamCard className="!p-0 overflow-hidden shadow-2xl border-t border-white/50">
            <div className="bg-cream-bg p-3 flex justify-between items-center border-b border-white">
               <div className="flex items-baseline gap-2">
                 <h3 className="text-xl font-bold text-cream-text">{selectedWordObj.word}</h3>
                 {wordData?.pronunciation && <span className="text-sm text-cream-text/50 font-mono">[{wordData.pronunciation}]</span>}
               </div>
               <div className="flex gap-2">
                 <button onClick={() => playWordAudio(selectedWordObj.word)} className="p-2 rounded-full bg-white shadow-sm active:scale-95"><Volume2 size={18}/></button>
                 <button onClick={() => setSelectedWordObj(null)} className="p-2 text-cream-text/50 hover:text-cream-text">关闭</button>
               </div>
            </div>

            <div className="p-4 bg-white/80 backdrop-blur-xl min-h-[120px]">
              {isLoadingWord ? (
                <div className="flex items-center justify-center py-4 text-cream-text/50 gap-2">
                  <Loader2 className="animate-spin" size={20} /> 正在智能提取例句...
                </div>
              ) : wordData ? (
                <div>
                   <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-cream-accent/30 text-cream-text px-2 py-0.5 rounded-full">{wordData.grammar_type}</span>
                   </div>
                   <p className="text-lg font-medium mb-3">{wordData.meaning}</p>
                   {wordData.note && <p className="text-sm text-cream-text/60 italic mb-4">{wordData.note}</p>}
                   
                   {/* 显示 AI 修复后的完美例句 */}
                   <p className="text-sm text-cream-text/70 mb-4 border-l-2 border-cream-accent pl-3 italic bg-cream-bg/50 p-2 rounded">
                     {wordData.contextSentence}
                   </p>

                   <button 
                    onClick={addToVocab}
                    disabled={isCollected}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${isCollected ? 'bg-green-100 text-green-700' : 'bg-cream-text text-white shadow-cream'}`}
                   >
                     {isCollected ? <><CheckCircle size={18}/> 已在生词本</> : <><PlusCircle size={18}/> 加入记忆卡片</>}
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