import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, X } from 'lucide-react';
import CreamCard from '../components/CreamCard';
import Layout from '../components/Layout';

const HomePage = () => {
  const [lessons, setLessons] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    const savedLessons = JSON.parse(localStorage.getItem('cremeLessons')) || [];
    setLessons(savedLessons);
  }, []);

  const handleSave = () => {
    if (!newText.trim()) return;
    const title = newTitle.trim() || `Lesson ${lessons.length + 1}`;
    const newLesson = {
      id: Date.now(),
      title: title,
      text: newText,
      date: new Date().toLocaleDateString('fr-FR')
    };
    const updatedLessons = [newLesson, ...lessons];
    setLessons(updatedLessons);
    localStorage.setItem('cremeLessons', JSON.stringify(updatedLessons));
    setNewText('');
    setNewTitle('');
    setShowAddModal(false);
  };

  return (
    <Layout>
      <h2 className="text-lg font-bold mb-4 ml-2">我的课程</h2>
      <div className="space-y-4">
        {lessons.length === 0 ? (
           <CreamCard className="text-center py-10 text-cream-text/50">
             点击下方 "+" 添加第一篇法语文本
           </CreamCard>
        ) : (
          lessons.map(lesson => (
            <Link to={`/read/${lesson.id}`} key={lesson.id}>
              <CreamCard className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-cream-accent/30 rounded-2xl flex items-center justify-center text-cream-text/70 group-hover:scale-110 transition-transform">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{lesson.title}</h3>
                  <p className="text-sm text-cream-text/50">{lesson.date}</p>
                </div>
              </CreamCard>
            </Link>
          ))
        )}
      </div>

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-cream-text text-cream-bg rounded-full shadow-cream-hover flex items-center justify-center transition-transform active:scale-95 z-10"
      >
        <Plus size={32} />
      </button>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <CreamCard className="w-full max-w-md !p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">New Text</h3>
              <button onClick={() => setShowAddModal(false)}><X size={20}/></button>
            </div>
            <input
              type="text"
              placeholder="标题 (可选)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full mb-4 p-3 bg-cream-bg rounded-xl outline-none"
            />
            <textarea
              placeholder="粘贴法语文本..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full h-48 p-3 bg-cream-bg rounded-xl outline-none resize-none mb-4"
            />
            <button onClick={handleSave} className="w-full py-3 bg-cream-text text-white rounded-xl font-bold shadow-cream">
              保存
            </button>
          </CreamCard>
        </div>
      )}
    </Layout>
  );
};

export default HomePage;