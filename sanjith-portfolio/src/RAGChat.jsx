import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true, // Needed since we are calling it from frontend
});

const knowledgeBase = `
Name: Sanjith G
Title: AI/ML Engineer
Description: Building intelligent systems. Fresh BSc CS with DA grad with 8 months of production AI experience. I build RAG pipelines, fine-tune LLMs on 4GB VRAM, and merge models at midnight.

Skills: 
- Languages: Python (NumPy, Pandas, Matplotlib, Seaborn, and EDA) and SQL. 
- ML/DL: scikit-learn, TensorFlow, PyTorch, XGBoost, LightGBM, SMOTE, random forest, and statistical analysis. 
- Deep Learning Architectures: Transformers, BERT, Convolutional Neural Networks (CNNs), and Recurrent Neural Networks (RNNs). 
- AI/GenAI: LangChain, BERT, LLaMA, Hugging Face, RAG pipelines, prompt engineering. 
- MLOps: MLflow, Hyperparameter Tuning, Feature Engineering. 
- Deployment: FastAPI, Flask, Docker, Streamlit, Gradio, REST APIs 
- Data Handling & Analysis: Feature engineering, statistical analysis (KS Test, Chi-Square), handling imbalanced datasets (SMOTE), and exploratory data analysis (EDA). 
- AI Dev Tools & Automation: Claude Code, Cursor, n8n, Groq API, OpenAI API, Gemini API, LangGraph, agentic workflows,Google Colab.
Certificates:
- ICAC 2024 — Satellite Image Dehazing
- What Is Generative AI? (LinkedIn)
- Microsoft Azure AI Essentials
- Ethics in the Age of Generative AI
- Introduction to DevOps
- Peopleclick Internship
- TCS Big Data Analytics — Advanced
- TCS Data Modeling & Visualization
- Azure AI-900

Projects:
- PRISM-RAG: 5-layer anti-lost-in-middle RAG pipeline.
- GUARDIAN-AGENT: Self-healing ReAct agent with BudgetGuard.
- LENS: Multimodal document intelligence pipeline.
- FORGE: QLoRA fine-tuning for Llama-3.1-8B on 4GB VRAM.
- PHANTOM-3B: Custom model via SLERP + TIES+DARE merging.
- NEXUS: FastAPI + Docker + MLflow production deployment stack.
`;

async function getRAGResponse(question) {
  const systemPrompt = `You are Pixe, Sanjith's professional AI assistant. 
You are strictly limited to answering questions about Sanjith's skills, experience, projects, and certificates.
You can respond to greetings (e.g., "Hi", "Hello"). 
If the user asks ANY general question not related to Sanjith's portfolio, respond EXACTLY with: "I'm here to discuss Sanjith's professional experience and portfolio. I cannot answer general questions."
Always be friendly, confident, and concise.
CRITICAL INSTRUCTION: Format your answers beautifully using clear bullet points. Use standard dashes (-) for lists, NEVER use asterisks (*). You may use ** for bold text. Never output a single large block of text. Use spacing generously.

Knowledge Base:
${knowledgeBase}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      model: "llama-3.1-8b-instant", // using smaller/faster model
      temperature: 0.5,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error(error);
    return "I'm having trouble connecting to my brain right now. Please try again!";
  }
}

export default function RAGChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    const reply = await getRAGResponse(userMessage);
    setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    setIsLoading(false);
  };

  // Helper to safely render simple **bold** markdown without external dependencies
  const renderText = (text) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--accent1)' }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      {/* Chat Window (Glassmorphism, 16:9 roughly for portrait, e.g., 340x550) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 1000,
              width: '360px',
              height: '560px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--radius)',
              background: 'rgba(250, 250, 247, 0.75)',
              backdropFilter: 'blur(24px) saturate(200%)',
              WebkitBackdropFilter: 'blur(24px) saturate(200%)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 16px 40px rgba(124, 58, 237, 0.2)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.4)',
              background: 'rgba(255, 255, 255, 0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src="/images/robot-icon.png"
                  alt="Robot"
                  style={{ width: '38px', height: '38px', borderRadius: '50%' }}
                />
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--accent1)', margin: 0, lineHeight: 1 }}>Pixe AI</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--subtext)', fontWeight: 600, margin: '4px 0 0 0' }}>Resume • Skills • Projects</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: 'var(--subtext)', cursor: 'pointer', padding: '4px' }}
                onMouseEnter={(e) => e.target.style.color = 'var(--accent1)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--subtext)'}
              >
                ✕
              </button>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--subtext)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  Hi there! 👋<br /><br />
                  Ask me anything about Sanjith's skills, projects, or certificates.
                </div>
              )}

              {messages.map((msg, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  key={index} 
                  style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  {msg.role === 'assistant' && (
                    <img
                      src="/images/robot-thinking.png"
                      alt="AI"
                      style={{ width: '28px', height: '28px', marginRight: '12px', marginTop: '4px', flexShrink: 0 }}
                    />
                  )}
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                      borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      ...(msg.role === 'user' 
                        ? { background: 'linear-gradient(135deg, var(--accent1), #9333EA)', color: '#fff', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)' }
                        : { background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(255, 255, 255, 0.7)', color: 'var(--text)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' })
                    }}
                  >
                    {renderText(msg.content)}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src="/images/robot-answer.png"
                    alt="Thinking"
                    style={{ width: '32px', height: '32px' }}
                  />
                  <div style={{ color: 'var(--accent1)', fontWeight: 600, fontSize: '0.9rem' }}>Thinking...</div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.4)', background: 'rgba(255, 255, 255, 0.2)' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about my experience..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.7)',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    color: 'var(--text)',
                    outline: 'none',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid var(--accent1)'}
                  onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.7)'}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  style={{
                    background: isLoading || !input.trim() ? 'rgba(124, 58, 237, 0.3)' : 'var(--accent1)',
                    color: '#fff',
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)'
                  }}
                  onMouseEnter={(e) => { if (!isLoading && input.trim()) e.target.style.background = '#9333EA'; }}
                  onMouseLeave={(e) => { if (!isLoading && input.trim()) e.target.style.background = 'var(--accent1)'; }}
                >
                  ↑
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
