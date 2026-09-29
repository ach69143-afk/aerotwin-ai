import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'AeroTwin Diagnostics Assistant initialized. How can I assist with engine analysis today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const telemetry = useStore(s => s.throttledTelemetry);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Mock API response based on telemetry
    setTimeout(() => {
      let responseContent = 'Engine telemetry indicates nominal performance.';
      
      if (telemetry) {
        if (telemetry.status === 'CRITICAL FAILURE' || telemetry.risk === 'CRITICAL') {
          responseContent = `CRITICAL ALERT: ${telemetry.status}. Engine RPM is ${telemetry.rpm.toFixed(0)}, CHT is ${telemetry.cht.toFixed(1)}°C. Immediate maintenance action required!`;
        } else if (telemetry.status === 'ANOMALY DETECTED' || telemetry.risk === 'WARNING') {
          responseContent = `WARNING: Anomaly detected. CHT is ${telemetry.cht.toFixed(1)}°C and Vibration is ${telemetry.vibration.toFixed(2)} mm/s. Recommend monitoring load.`;
        } else if (userMessage.content.toLowerCase().includes('status')) {
          responseContent = `Current engine status is ${telemetry.status}. RPM: ${telemetry.rpm.toFixed(0)}, CHT: ${telemetry.cht.toFixed(1)}°C, Oil Pressure: ${telemetry.oilPressure.toFixed(1)} bar.`;
        } else {
          responseContent = `Based on current telemetry (Health: ${telemetry.healthPct?.toFixed(1)}%), the engine is operating within expected parameters.`;
        }
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      {/* Sidebar Button */}
      <div style={{ padding: '0 16px' }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: '#4ADE80',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        >
          <MessageSquare size={18} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', fontFamily: 'Inter, system-ui, sans-serif' }}>AI Assistant</span>
            <span style={{ fontSize: '9px', color: '#8FA4B8', fontFamily: 'Inter, system-ui, sans-serif' }}>Diagnostics &amp; Insights</span>
          </div>
        </button>
      </div>

      {/* Slide-out Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                zIndex: 40,
                backdropFilter: 'blur(2px)'
              }}
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                maxWidth: '400px',
                backgroundColor: '#FFFFFF',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.1)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                borderLeft: '1px solid #E4E7EC'
              }}
            >
              {/* Header */}
              <div style={{ padding: '20px', borderBottom: '1px solid #E4E7EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EAF4EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E7D32' }}>
                    <Bot size={18} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1F2933', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>Diagnostics AI</h2>
                    <p style={{ fontSize: '11px', color: '#667085', margin: '2px 0 0 0', fontFamily: 'Inter, system-ui, sans-serif' }}>Live telemetry connected</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ color: '#667085', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Chat Area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#FFFFFF' }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                    <div style={{ 
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      backgroundColor: msg.role === 'user' ? '#102F4F' : '#EAF4EC',
                      color: msg.role === 'user' ? '#FFFFFF' : '#2E7D32',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div style={{
                      backgroundColor: msg.role === 'user' ? '#102F4F' : '#F4F8F4',
                      color: msg.role === 'user' ? '#FFFFFF' : '#1F2933',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      borderTopRightRadius: msg.role === 'user' ? '4px' : '12px',
                      borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      fontFamily: 'Inter, system-ui, sans-serif',
                      maxWidth: '85%'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#EAF4EC', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bot size={14} />
                    </div>
                    <div style={{ backgroundColor: '#F4F8F4', padding: '12px 16px', borderRadius: '12px', borderTopLeftRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Loader2 size={14} className="animate-spin" style={{ color: '#2E7D32' }} />
                      <span style={{ fontSize: '13px', color: '#667085' }}>Analyzing telemetry...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid #E4E7EC', backgroundColor: '#FFFFFF' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about engine health..."
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid #D0D5DD',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'Inter, system-ui, sans-serif'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2E7D32'}
                    onBlur={(e) => e.target.style.borderColor = '#D0D5DD'}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    style={{
                      backgroundColor: input.trim() && !isTyping ? '#2E7D32' : '#EAF4EC',
                      color: input.trim() && !isTyping ? '#FFFFFF' : '#A5D6A7',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0 16px',
                      cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
