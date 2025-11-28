import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CreamCard from '../components/CreamCard';
import Layout from '../components/Layout';

const ReaderPage = () => {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [highlightedIndices, setHighlightedIndices] = useState(new Set());

  useEffect(() => {
    const savedLessons = JSON.parse(localStorage.getItem('cremeLessons')) || [];
    const currentLesson = savedLessons.find(l => l.id.toString() === id);
    setLesson(currentLesson);
  }, [id]);

  const toggleHighlight = (index) => {
    const newSet = new Set(highlightedIndices);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setHighlightedIndices(newSet);
  };

  if (!lesson) return <Layout>Loading...</Layout>;
  const words = lesson.text.split(' ');

  return (
    <Layout showHomeBtn>
      <CreamCard className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
        <p className="text-sm text-cream-text/60">{lesson.date}</p>
      </CreamCard>

      <CreamCard className="!p-8 min-h-[50vh]">
        <div className="text-lg leading-relaxed text-justify">
          {words.map((word, index) => (
            <span 
              key={index}
              onClick={() => toggleHighlight(index)}
              className={`
                inline-block mx-[2px] px-[2px] rounded-md cursor-pointer transition-colors select-none
                ${highlightedIndices.has(index) ? 'bg-cream-accent font-semibold' : 'hover:bg-cream-bg'}
              `}
            >
              {word}
            </span>
          ))}
        </div>
      </CreamCard>
    </Layout>
  );
};

export default ReaderPage;