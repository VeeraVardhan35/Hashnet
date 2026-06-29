import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
  sources?: { chunk_id: string; summary: string; keywords: string[] }[];
};

export default function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hello! I am connected to the RAG knowledge base. Ask me any question about the documents you've uploaded!"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<"upload" | "choice" | "chat">("upload");
  const [documentId, setDocumentId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showBusyBanner, setShowBusyBanner] = useState(true);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:2567/api";
      const res = await fetch(`${apiUrl}/rag/chat/${documentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text })
      });

      if (!res.ok) throw new Error("Failed to get response");
      
      const data = await res.json();
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: data.reply || "No response received.",
        sources: data.relevant_chunks || []
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: "Sorry, I encountered an error communicating with the RAG server."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:2567/api";
      const res = await fetch(`${apiUrl}/rag/upload`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("Failed to upload document to RAG server");
      }

      const data = await res.json();
      setDocumentId(data.document_id);
      setStep("choice");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload document. Server might be busy.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#010103] text-white font-sans flex flex-col overflow-hidden relative">
      {/* Background Cyberpunk Elements */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-indigo-600/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Server Busy Banner */}
      {showBusyBanner && (
        <div className="flex items-center gap-3 px-5 py-3 bg-amber-500/15 border-b border-amber-500/30 relative z-20 shrink-0">
          <span className="text-amber-400 text-lg shrink-0">⚠️</span>
          <p className="flex-1 text-amber-300 text-sm font-semibold">
            <span className="font-black">AI Server Notice:</span> The RAG server may be busy or unavailable. Responses may be delayed. Ensure it is running at <code className="bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200 font-mono text-xs">localhost:8000</code>.
          </p>
          <button
            onClick={() => setShowBusyBanner(false)}
            className="shrink-0 text-amber-400 hover:text-white transition-colors text-lg"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center gap-6 p-6 border-b border-white/5 bg-[#010103]/80 backdrop-blur-md relative z-10 shrink-0">
        <button onClick={() => navigate("/home")} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-colors">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-black text-white tracking-wider flex items-center gap-3">
            AI KNOWLEDGE BASE
            <span className="text-blue-500">❖</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium text-xs uppercase tracking-widest">Query your uploaded documents</p>
        </div>
      </header>

      {/* Main Content Area */}
      {step === "upload" && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
          <div className="max-w-lg w-full rounded-3xl border border-blue-500/30 bg-[#12121a] p-8 shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)] relative overflow-hidden group text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-all duration-500" />
            
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-4xl shadow-lg shadow-blue-600/30 mb-6">
                📄
              </div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Upload Knowledge</h2>
              <p className="text-gray-400 mb-8 text-sm">
                Before you can chat, please upload a PDF or TXT document. This will be sent directly to the RAG server to build your custom knowledge base.
              </p>

              <div className="relative mb-6 text-left">
                <input 
                  type="file" 
                  accept=".pdf,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`w-full py-4 px-5 rounded-2xl border-2 border-dashed flex items-center justify-between transition-colors ${file ? 'bg-blue-500/10 border-blue-500/50 text-blue-300' : 'bg-[#010103] border-white/20 text-gray-400 hover:border-blue-500/50'}`}>
                  <span className="text-sm font-semibold truncate pr-4">{file ? file.name : "Select a document (.pdf, .txt)"}</span>
                  <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full py-4 rounded-xl font-black text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 uppercase tracking-wider"
              >
                {uploading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading to RAG...
                  </>
                ) : (
                  "Upload & Process"
                )}
              </button>
            </div>
          </div>
        </main>
      )}

      {step === "choice" && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
          <div className="max-w-2xl w-full text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-widest">Document Processed</h2>
            <p className="text-gray-400 text-lg">Your knowledge base has been generated. What would you like to do next?</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            {/* Chat Option */}
            <button
              onClick={() => setStep("chat")}
              className="group relative rounded-3xl border border-blue-500/30 bg-[#12121a] p-10 hover:border-blue-500 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center text-center shadow-lg hover:shadow-blue-500/20"
            >
              <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-blue-500/30 transition-all duration-500" />
              <div className="w-24 h-24 mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-5xl shadow-lg shadow-blue-600/30 relative z-10 group-hover:scale-110 transition-transform">
                💬
              </div>
              <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-wide relative z-10">Chat with AI</h3>
              <p className="text-gray-400 relative z-10">Ask direct questions and get answers with exact source citations from your document.</p>
            </button>

            {/* Play Option */}
            <button
              onClick={() => navigate(`/create-room?aiCategory=${documentId}`)}
              className="group relative rounded-3xl border border-fuchsia-500/30 bg-[#12121a] p-10 hover:border-fuchsia-500 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center text-center shadow-lg hover:shadow-fuchsia-500/20"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-fuchsia-500/30 transition-all duration-500" />
              <div className="w-24 h-24 mb-6 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-pink-600 flex items-center justify-center text-5xl shadow-lg shadow-fuchsia-600/30 relative z-10 group-hover:scale-110 transition-transform">
                🎮
              </div>
              <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-wide relative z-10">Create Match</h3>
              <p className="text-gray-400 relative z-10">Launch a multiplayer Quiz or Coding Battle using the AI-generated questions!</p>
            </button>
          </div>
        </main>
      )}

      {step === "chat" && (
        <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto relative z-10 p-6 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar pb-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-5 ${msg.sender === 'user' ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] rounded-br-sm' : 'bg-[#12121a] border border-white/10 text-gray-200 rounded-bl-sm'}`}>
                  {msg.sender === 'ai' && (
                    <div className="flex items-center gap-2 mb-3 text-blue-400 font-black text-xs uppercase tracking-widest border-b border-white/5 pb-2">
                      <span className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center text-sm">🤖</span>
                      Hashnet AI
                    </div>
                  )}
                  
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Sources:</p>
                      <div className="space-y-2">
                        {msg.sources.map((source, idx) => (
                          <div key={idx} className="bg-black/30 rounded p-2 text-xs border border-white/5">
                            <p className="text-gray-400 line-clamp-2 italic">"{source.summary}"</p>
                            {source.keywords && source.keywords.length > 0 && (
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {source.keywords.slice(0, 3).map((kw, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400">{kw}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5 rounded-bl-sm flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="shrink-0 mt-4 bg-[#12121a] border border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-xl">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question about your documents..."
              className="flex-1 bg-transparent border-none outline-none px-4 text-sm text-white placeholder:text-gray-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-12 h-12 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
