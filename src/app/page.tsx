"use client";

import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(`web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleMicClick = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("ขออภัย เบราว์เซอร์ของคุณไม่รองรับการพิมพ์ด้วยเสียง"); return; }
    if (isRecording) { setIsRecording(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "th-TH";
    recognition.interimResults = false;
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      setInputText(event.results[0][0].transcript);
      setIsRecording(false);
    };
    recognition.start();
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const currentText = inputText;
    const userMsg = { role: "user", text: currentText };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      // 1. เรียกใช้งาน API route ของเรา
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentText,
          sessionId: sessionIdRef.current // ใช้ sessionId ที่สร้างไว้เพื่อรักษาบริบทแชท
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // 2. n8n อาจะส่งมาเป็น String (ผ่าน Respond to Webhook) จึงต้องเช็คและแปลงเป็น JSON Object
      let aiData = data;
      if (typeof data === 'string') {
        try { aiData = JSON.parse(data); } catch (e) { console.error("Parse error", e); }
      } else if (data.output && typeof data.output === 'string') {
        // กรณี n8n ห่อ response ไว้ในตัวแปร output
        try { aiData = JSON.parse(data.output); } catch (e) { console.error("Parse error", e); }
      }

      // 3. ดึงข้อมูลจากโครงสร้าง JSON ที่คุณตั้งค่าไว้ใน System Prompt ของ n8n
      const aiText = aiData.ai_reply || "ระบบกำลังประมวลผล โปรดลองใหม่อีกครั้งค่ะ";

      // 4. อัปเดต State แชท โดยส่ง stores, promotions และ quick_replies ให้ UI นำไปใช้
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: aiText,
          stores: aiData.stores || [],
          promotions: aiData.promotions || [],
          quick_replies: aiData.quick_replies || [],
        },
      ]);

    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "ขออภัยค่ะ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* ========== Animated Pastel Background ========== */}
      <div className="fixed inset-0 overflow-hidden -z-10" style={{ background: "linear-gradient(135deg, #fdf2f8 0%, #f0f4ff 30%, #faf5ff 60%, #ecfdf5 100%)" }}>
        {/* Floating blobs */}
        <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-pink-200/70 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-[10%] right-[-8%] w-[450px] h-[450px] bg-purple-200/70 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-sky-200/60 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] bg-amber-100/50 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-1000"></div>

        {/* Floating decorative shapes */}
        <div className="absolute top-[15%] left-[10%] w-4 h-4 bg-pink-300/60 rounded-full animate-float"></div>
        <div className="absolute top-[30%] right-[15%] w-3 h-3 bg-purple-300/60 rounded-full animate-float-reverse animation-delay-1000"></div>
        <div className="absolute bottom-[25%] left-[30%] w-5 h-5 bg-sky-300/40 rounded-full animate-float animation-delay-2000"></div>
        <div className="absolute top-[60%] right-[25%] w-3 h-3 bg-amber-300/50 rounded-full animate-float-reverse animation-delay-400"></div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle, #a78bfa 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}></div>

        {/* Glass overlay */}
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[100px]"></div>
      </div>

      <div className="flex flex-col lg:flex-row h-[100dvh] font-sans p-3 sm:p-4 lg:p-6 gap-4 lg:gap-6 items-center justify-center text-slate-800">

        {/* ========================================== */}
        {/* Left Panel (PC Only): Modern Info Panel   */}
        {/* ========================================== */}
        <div className="hidden lg:flex lg:w-[42%] xl:max-w-[420px] h-full flex-col glass-strong rounded-[2rem] shadow-xl shadow-purple-100/50 border border-white/80 overflow-hidden relative group animate-slide-up">

          {/* Decorative corner glow */}
          <div className="absolute top-0 right-0 w-52 h-52 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-sky-200/30 to-emerald-100/20 rounded-full blur-3xl opacity-40"></div>

          {/* Content */}
          <div className="flex-1 flex flex-col z-10 p-7">
            {/* Brand Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200/50 rounded-full px-4 py-1.5 mb-4 animate-fade-in">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></span>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-500">Smart Directory</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight leading-[1.1]">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-rose-400">CENTRAL</span>
                <br />
                <span className="text-slate-700">GRAND</span>
              </h1>
            </div>


            {/* Mall Image with overlay */}
            <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/80 shadow-lg group/img animate-slide-up animation-delay-600 min-h-[180px]">
              <img
                src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=800&auto=format&fit=crop"
                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
                alt="Mall View"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="glass rounded-xl p-3 border border-white/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <p className="text-white text-xs font-bold tracking-wide">เปิดบริการ 10:00 — 22:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* Right Panel: Modern Chat Interface        */}
        {/* ========================================== */}
        <div className="flex flex-col w-full max-w-2xl h-full lg:h-full glass rounded-[2rem] shadow-xl shadow-sky-100/40 border border-white/80 overflow-hidden relative animate-slide-up animation-delay-200">

          {/* Decorative top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-300 to-transparent opacity-60"></div>

          {/* Header */}
          <header className="glass-strong p-5 flex justify-between items-center border-b border-purple-50/80 z-10 relative">
            <div className="flex items-center gap-3.5">
              {/* Animated Avatar Icon */}
              <div className="relative group/logo">
                {/* Spinning outer ring */}
                <div className="absolute -inset-1.5 rounded-2xl animate-spin-slow opacity-40 group-hover/logo:opacity-70 transition-opacity duration-500" style={{ background: "conic-gradient(from 0deg, #818cf8, #a78bfa, #c084fc, #e879f9, #f472b6, #fb923c, #818cf8)" }}></div>
                {/* Main icon container */}
                <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-300/50 overflow-hidden" style={{ background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 25%, #c084fc 50%, #e879f9 75%, #f472b6 100%)" }}>
                  {/* Shimmer overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" style={{ backgroundSize: "200% 100%" }}></div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white drop-shadow-md relative z-10">
                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5z" clipRule="evenodd" />
                  </svg>
                </div>
                {/* Glow pulse */}
                <div className="absolute -inset-2 rounded-2xl opacity-20 blur-md animate-glow-pulse" style={{ background: "linear-gradient(135deg, #818cf8, #e879f9, #f472b6)" }}></div>
                {/* Sparkle dots */}
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-300 rounded-full shadow-sm shadow-amber-200 animate-float" style={{ animationDuration: "3s" }}></div>
                <div className="absolute -bottom-0.5 -left-1 w-2 h-2 bg-sky-300 rounded-full shadow-sm shadow-sky-200 animate-float-reverse" style={{ animationDuration: "4s" }}></div>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-700 tracking-tight">Mall Assistant</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Online • พร้อมช่วยเหลือ</p>
                </div>
              </div>
            </div>
            {/* Time badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-purple-50/80 border border-purple-100 rounded-xl px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-purple-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[11px] font-bold text-purple-500">{timeStr}</span>
            </div>
          </header>

          {/* Main Chat Area */}
          <main ref={scrollRef} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-transparent relative z-0">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-4">
                {/* Welcome Icon with Glow */}
                <div className="relative animate-slide-up">
                  <div className="w-24 h-24 bg-white/90 rounded-[1.75rem] flex items-center justify-center shadow-xl shadow-purple-100/60 border border-purple-50 rotate-6 hover:rotate-0 transition-transform duration-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-purple-400 -rotate-6">
                      <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
                    </svg>
                  </div>
                  {/* Glow ring */}
                  <div className="absolute -inset-3 bg-gradient-to-r from-purple-300/20 via-pink-300/20 to-sky-300/20 rounded-[2rem] blur-xl animate-glow-pulse"></div>
                  {/* Floating sparkles */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-float text-lg">✦</div>
                  <div className="absolute -bottom-1 -left-3 w-5 h-5 text-pink-400 animate-float-reverse animation-delay-1000 text-sm">✦</div>
                </div>

                {/* Welcome Text */}
                <div className="space-y-2.5 animate-slide-up animation-delay-200">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-700 leading-tight">
                    สวัสดีค่ะ! <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">ให้ช่วยอะไรดี?</span>
                  </h1>
                  <p className="text-slate-400 font-medium text-sm max-w-xs mx-auto leading-relaxed">สอบถามพิกัดร้านค้า โปรโมชัน แผนที่ชั้น หรือข้อมูลอื่นๆ ได้เลยค่ะ</p>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap justify-center gap-2.5 animate-slide-up animation-delay-400">
                  {[
                    { label: "หาร้านฮาจิบัง", emoji: "🍜", color: "pink" },
                    { label: "ห้องน้ำอยู่ไหน", emoji: "🚻", color: "sky" },
                    { label: "โปรโมชันวันนี้", emoji: "✨", color: "purple" },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setInputText(item.label)}
                      className={`group/btn flex items-center gap-2 px-4 py-2.5 bg-white/80 border rounded-2xl font-semibold hover:shadow-lg transition-all active:scale-95 text-sm backdrop-blur-sm
                        ${item.color === "pink" ? "border-pink-100 text-pink-600 hover:bg-pink-50 hover:border-pink-200 hover:shadow-pink-100/50" : ""}
                        ${item.color === "sky" ? "border-sky-100 text-sky-600 hover:bg-sky-50 hover:border-sky-200 hover:shadow-sky-100/50" : ""}
                        ${item.color === "purple" ? "border-purple-100 text-purple-600 hover:bg-purple-50 hover:border-purple-200 hover:shadow-purple-100/50" : ""}
                      `}
                    >
                      <span className="group-hover/btn:scale-125 transition-transform duration-300">{item.emoji}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Stats Chips */}
                <div className="flex gap-3 animate-slide-up animation-delay-600">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-white/60 border border-slate-100 rounded-full px-3 py-1.5">
                    <span className="text-purple-400">🏪</span> 200+ ร้านค้า
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-white/60 border border-slate-100 rounded-full px-3 py-1.5">
                    <span className="text-pink-400">🎁</span> 50+ โปรโมชัน
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-slide-up`}>
                  {/* Avatar */}
                  {msg.role === "ai" && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-sm shadow-pink-200/50 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                        <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} max-w-[80%]`}>
                    {/* Message Bubble */}
                    <div className={`p-4 rounded-2xl text-[15px] leading-relaxed font-medium transition-all hover:shadow-md ${msg.role === "user"
                      ? "bg-gradient-to-br from-purple-500 via-purple-500 to-pink-500 text-white rounded-br-lg shadow-md shadow-purple-200/50"
                      : "bg-white/90 text-slate-700 border border-purple-50/80 rounded-bl-lg shadow-sm"
                      }`}>
                      {msg.text}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] text-slate-400 font-medium mt-1.5 px-2">{timeStr}</span>

                    {/* Store Cards */}
                    {msg.stores && msg.stores.length > 0 && (
                      <div className="mt-3 flex flex-col gap-3 w-full max-w-[320px]">
                        {msg.stores.map((store: any, si: number) => (
                          <div key={si} className="rounded-2xl overflow-hidden border border-purple-50/80 shadow-md bg-white/95 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                            {/* Store Header */}
                            <div className="px-3.5 pt-3 pb-2 flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-sm">
                                <span className="text-white text-sm">🏪</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-700 truncate">{store.store_name || store.name}</p>
                                <p className="text-[11px] text-slate-400 font-medium">{store.location_text || `ชั้น ${store.floor}`} {store.category ? `• ${store.category}` : ''}</p>
                              </div>
                            </div>

                            {/* Store Image */}
                            {(store.image_url) && (
                              <div className="px-2 pb-1">
                                <div className="relative group/img cursor-pointer rounded-xl overflow-hidden">
                                  <div className="absolute top-2.5 left-2.5 z-10">
                                    <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] px-2.5 py-1 rounded-lg font-bold shadow-sm tracking-wider">📸 หน้าร้าน</span>
                                  </div>
                                  <img src={store.image_url} className="w-full h-36 object-cover rounded-xl group-hover/img:scale-[1.03] transition-transform duration-500" alt={store.store_name || store.name} />
                                </div>
                              </div>
                            )}

                            {/* Map Image */}
                            {(store.map_url || store.map_image_url) && (
                              <div className="px-2 pb-2">
                                <a href={store.map_url || store.map_image_url} target="_blank" rel="noopener noreferrer" className="block relative group/img cursor-pointer rounded-xl overflow-hidden">
                                  <div className="absolute top-2.5 left-2.5 z-10">
                                    <span className="bg-gradient-to-r from-sky-500 to-blue-500 text-white text-[9px] px-2.5 py-1 rounded-lg font-bold shadow-sm tracking-wider">🗺️ แผนผัง</span>
                                  </div>
                                  <div className="w-full h-28 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 flex flex-col items-center justify-center gap-1.5 border border-sky-100 group-hover/img:bg-sky-100/50 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-sky-400">
                                      <path fillRule="evenodd" d="M8.161 2.58a1.875 1.875 0 011.678 0l4.993 2.498c.106.052.23.052.336 0l3.869-1.935A1.875 1.875 0 0121.75 4.82v12.485c0 .71-.401 1.36-1.037 1.677l-4.875 2.437a1.875 1.875 0 01-1.676 0l-4.994-2.497a.375.375 0 00-.336 0l-3.869 1.935A1.875 1.875 0 012.25 19.18V6.695c0-.71.401-1.36 1.037-1.677l4.875-2.437zM9 6a.75.75 0 01.75.75V15a.75.75 0 01-1.5 0V6.75A.75.75 0 019 6zm6.75 3.75a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0v-8.25z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs font-semibold text-sky-500">ดูแผนผังชั้น</span>
                                  </div>
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Replies */}
                    {msg.quick_replies && msg.quick_replies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.quick_replies.map((qr: string, qi: number) => (
                          <button key={qi} onClick={() => setInputText(qr)} className="text-[12px] px-3 py-1.5 bg-purple-50/80 text-purple-600 border border-purple-100 rounded-xl font-semibold hover:bg-purple-100 hover:border-purple-200 transition-all active:scale-95">
                            {qr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 animate-slide-up">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-sm shadow-pink-200/50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex gap-2 items-center text-purple-500 text-sm font-semibold bg-white/90 p-4 rounded-2xl rounded-bl-lg w-fit shadow-sm border border-purple-50/80">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-[11px] ml-1.5 tracking-wide text-slate-400 font-medium">กำลังพิมพ์...</span>
                </div>
              </div>
            )}
          </main>

          {/* Footer Input */}
          <footer className="p-3 sm:p-4 bg-transparent z-10">
            <div className="glass-strong border border-purple-100/60 p-1.5 sm:p-2 pl-2 sm:pl-3 rounded-2xl shadow-lg shadow-purple-100/30 flex items-center gap-2 transition-all focus-within:shadow-xl focus-within:shadow-purple-200/40 focus-within:border-purple-200 animate-border-dance">
              {/* Mic Button */}
              <button
                onClick={handleMicClick}
                className={`p-2.5 sm:p-3 rounded-xl transition-all flex-shrink-0 ${isRecording
                  ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-200/50 animate-pulse"
                  : "text-slate-400 hover:bg-purple-50/80 hover:text-purple-500 active:scale-90"
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="พิมพ์ข้อความที่นี่..."
                className="flex-1 bg-transparent border-none focus:ring-0 outline-none font-medium text-slate-700 placeholder:text-slate-400/70 text-sm sm:text-base px-2"
              />

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="relative group/send overflow-hidden text-white p-2.5 sm:p-3 px-4 sm:px-5 rounded-2xl disabled:opacity-25 disabled:grayscale transition-all duration-300 active:scale-90 hover:scale-105 hover:shadow-xl hover:shadow-purple-300/40"
                style={{ background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 30%, #c084fc 50%, #e879f9 70%, #f472b6 100%)" }}
              >
                {/* Shimmer sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/send:opacity-100 group-hover/send:animate-shimmer transition-opacity" style={{ backgroundSize: "200% 100%" }}></div>
                {/* Glow ring on hover */}
                <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover/send:opacity-40 blur-md transition-opacity duration-300" style={{ background: "linear-gradient(135deg, #818cf8, #e879f9, #f472b6)" }}></div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 drop-shadow-sm">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}