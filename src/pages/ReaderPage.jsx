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
  const [selectedWordObj, setSelectedWordObj] = useState(null); 
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
        setWordData({ 
          ...result, 
          contextSentence: result.perfect_sentence 
        });
      } else {
        setWordData({ meaning: "分析失败", contextSentence: "..." + roughContext.slice(0, 50) + "..." });
      }
    } else {
      setWordData({ meaning: "请配置 API Key", contextSentence: "..." + roughContext.slice(0, 50) + "..." });
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
    if (!apiKey) return alert("请先去设置配置 API Key");
    if(!window.confirm("重新分析会覆盖当前的笔记，确定吗？")) return;

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

  const isCollected = savedVocab.some(v => v.word === selectedWordObj?.word);
  const isSmartMode = lesson.analysis && lesson.analysis.sentences;

  // 辅助函数：根据笔记类型给颜色
  const getNoteColor = (text) => {
    if (text.includes("语法")) return "bg-blue-50 text-blue-600 border-blue-100";
    if (text.includes("发音") || text.includes("连诵")) return "bg-purple-50 text-purple-600 border-purple-100";
    if (text.includes("词汇") || text.includes("变位")) return "bg-green-50 text-green-600 border-green-100";
    return "bg-gray-50 text-gray-500 border-gray-100";
  };

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
        <div className="space-y-6 pb-20">
          
          {/* 摘要 */}
          <CreamCard className="bg-cream-accent/10 border-cream-accent/30 relative group">
            <div className="flex items-center gap-2 mb-2 font-bold text-sm text-cream-text">
              <Sparkles size={16}/> 全文摘要
            </div>
            <p className="text-sm leading-relaxed">{lesson.analysis.summary}</p>
            <button 
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="absolute top-2 right-2 p-2 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="重新分析"
            >
             {isRegenerating ? <Loader2 className="animate-spin" size={14}/> : <RefreshCw size={14}/>}
            </button>
          </CreamCard>

          {/* 🟢 逐句精讲列表 (升级版) */}
          {lesson.analysis.sentences.map((sent, idx) => (
            <div key={idx} className="relative pl-4 border-l-2 border-cream-accent/30 hover:border-cream-accent transition-colors py-3">
              
              {/* 原句 */}
              <div className="text-lg leading-relaxed text-justify mb-2 font-serif text-cream-text">
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
                  className="inline-block ml-2 p-1 text-cream-text/20 hover:text-cream-accent align-middle"
                >
                  <Volume2 size={16}/>
                </button>
              </div>

              {/* 翻译 */}
              <p className="text-sm font-medium text-cream-text/80 mb-3">
                {sent.trans}
              </p>

              {/* 🟢 笔记胶囊区 (显示多条笔记) */}
              {sent.notes && sent.notes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sent.notes.map((note, nIdx) => (
                    <div 
                      key={nIdx} 
                      className={`text-xs px-2 py-1 rounded border ${getNoteColor(note)}`}
                    >
                      {note}
                    </div>
                  ))}
                </div>
              ) : (
                /* 兼容旧版单一 grammar 字段 */
                sent.grammar && (
                  <div className="text-xs bg-white/60 p-1.5 rounded mt-1 text-cream-text/50 italic inline-block">
                    💡 {sent.grammar}
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      ) : (
        /* 兜底模式 */
        <CreamCard className="!p-6 mb-8 relative">
           <div className="mb-4 text-center">
              <button 
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="px-4 py-2 bg-cream-accent/20 text-cream-text rounded-lg font-bold text-sm flex items-center justify-center gap-2 mx-auto"
              >
                {isRegenerating ? <Loader2 className="animate-spin" size={16}/> : <RefreshCw size={16}/>}
                升级为精读教材
              </button>
           </div>
           <div className="text-lg leading-loose text-justify font-serif">
             {lesson.text}
           </div>
        </CreamCard>
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
                  <Loader2 className="animate-spin" size={20} /> 正在深度解析...
                </div>
              ) : wordData ? (
                <div>
                   <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-cream-accent/30 text-cream-text px-2 py-0.5 rounded-full">{wordData.grammar_type}</span>
                   </div>
                   <p className="text-lg font-medium mb-3">{wordData.meaning}</p>
                   {wordData.note && <p className="text-sm text-cream-text/60 italic mb-4">{wordData.note}</p>}
                   
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