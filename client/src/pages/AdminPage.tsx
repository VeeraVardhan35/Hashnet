import { useState, useEffect } from "react";
import { useAuthStore } from "../store/auth.store";
import { api } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [topics, setTopics] = useState<any[]>([]);
  const [newTopicName, setNewTopicName] = useState("");
  
  // Quiz Form State
  const [quizText, setQuizText] = useState("");
  const [quizOptions, setQuizOptions] = useState(["", "", "", ""]);
  const [quizCorrectIndex, setQuizCorrectIndex] = useState(0);
  const [quizTopic, setQuizTopic] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await api.get("/admin/topics");
      setTopics(res.data);
      if (res.data.length > 0 && !quizTopic) {
        setQuizTopic(res.data[0].name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) return;
    setIsLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await api.post("/admin/topics", { name: newTopicName });
      setNewTopicName("");
      fetchTopics();
      setSuccessMsg("Topic created successfully!");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Error creating topic");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuiz = async () => {
    setIsLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await api.post("/admin/questions", {
        text: quizText,
        options: quizOptions,
        correctIndex: quizCorrectIndex,
        category: quizTopic,
      });
      setSuccessMsg("Quiz question added!");
      setQuizText("");
      setQuizOptions(["", "", "", ""]);
      setQuizCorrectIndex(0);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Error adding quiz");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-[#010103] flex flex-col items-center justify-center text-white p-4">
        <div className="w-24 h-24 rounded-full border-4 border-red-500/30 flex items-center justify-center mb-6 bg-red-500/10 text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">ACCESS DENIED</h1>
        <p className="text-gray-400 mb-8 text-center max-w-sm">You do not have the required permissions to view this sector.</p>
        <button onClick={() => navigate("/home")} className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-bold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Return to Base
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#010103] text-white font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#0d0d14] flex flex-col justify-between py-6 shrink-0 relative z-10 hidden md:flex">
        <div>
          <div className="flex items-center justify-between px-6 mb-8 mt-2 w-full">
            <img src="/logo.png" alt="Hashnet Logo" className="w-full h-28 object-contain scale-125 transform" />
            <span className="px-2 py-1 rounded-md text-[10px] font-black tracking-widest bg-cyan-500/20 text-cyan-400">ADMIN</span>
          </div>

          <nav className="flex flex-col gap-1 px-4">
            <button onClick={() => navigate("/home")} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium">
              <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to App
            </button>
            <div className="h-px bg-white/10 my-2 mx-4"></div>
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-500/10 text-cyan-400 font-semibold transition-colors border border-cyan-500/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Dashboard
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative p-8">
        {/* Background Cyberpunk Element */}
        <div className="absolute top-0 right-0 w-[600px] h-[300px] bg-cyan-600/10 blur-[120px] pointer-events-none rounded-full" />
        
        <header className="mb-10 relative z-10">
          <h1 className="text-4xl font-black text-white">System Override</h1>
          <p className="text-cyan-400 mt-2 font-medium">Manage game topics, questions, and content.</p>
        </header>

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 max-w-4xl relative z-10 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 max-w-4xl relative z-10 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl relative z-10">
          
          {/* TOPICS SECTION */}
          <div className="flex flex-col rounded-3xl border border-white/10 bg-[#12121a] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <span className="text-fuchsia-500">❖</span> Content Topics
              </h2>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex gap-3 mb-6">
                <input 
                  type="text" 
                  placeholder="Enter new topic name..." 
                  className="flex-1 bg-[#010103] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all placeholder:text-gray-600"
                  value={newTopicName}
                  onChange={e => setNewTopicName(e.target.value)}
                />
                <button 
                  onClick={handleCreateTopic} 
                  disabled={isLoading || !newTopicName.trim()}
                  className="px-6 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold transition-transform active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
                >
                  Create Topic
                </button>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Active Topics ({topics.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {topics.length === 0 ? (
                    <div className="text-gray-500 text-sm italic">No topics created yet.</div>
                  ) : (
                    topics.map(t => (
                      <span key={t._id} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {t.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* QUIZ SECTION */}
          <div className="flex flex-col rounded-3xl border border-white/10 bg-[#12121a] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <span className="text-cyan-500">❖</span> Add Quiz Question
              </h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Select Topic</label>
                  <select 
                    className="w-full bg-[#010103] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none cursor-pointer" 
                    value={quizTopic} 
                    onChange={e => setQuizTopic(e.target.value)}
                  >
                    <option value="" disabled>-- Choose a Topic --</option>
                    {topics.map(t => <option key={t._id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Question Text</label>
                  <textarea 
                    className="w-full bg-[#010103] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-gray-600 resize-y min-h-[100px]" 
                    placeholder="Enter the question here..."
                    value={quizText} 
                    onChange={e => setQuizText(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Options (Select the correct one)</label>
                  <div className="space-y-3">
                    {quizOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3 bg-[#010103] p-2 rounded-xl border border-white/5 focus-within:border-cyan-500/50 transition-colors">
                        <div className="pl-2">
                          <input 
                            type="radio" 
                            name="correctOption" 
                            checked={quizCorrectIndex === i}
                            onChange={() => setQuizCorrectIndex(i)}
                            className="w-5 h-5 accent-cyan-500 cursor-pointer"
                          />
                        </div>
                        <input 
                          type="text" 
                          className="flex-1 bg-transparent border-none text-white focus:outline-none focus:ring-0 placeholder:text-gray-600 text-sm" 
                          placeholder={`Option ${i + 1}`}
                          value={opt}
                          onChange={e => {
                            const newOpts = [...quizOptions];
                            newOpts[i] = e.target.value;
                            setQuizOptions(newOpts);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleAddQuiz} 
                  disabled={isLoading || !quizText.trim() || !quizTopic || quizOptions.some(o => !o.trim())}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/25 transition-transform active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  )}
                  ADD QUESTION
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
