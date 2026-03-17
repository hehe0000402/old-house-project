import React, { useState, useEffect } from 'react';
import { Heart, Home, Shield, CheckCircle, Send, Phone, MapPin, ClipboardList, Info, ChevronRight, Star, Loader2, Gift, AlertCircle, MessageCircle, Ruler } from 'lucide-react';

// Firebase 相關引入 (保持預設配置，確保網頁穩定執行)
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';

// --- Firebase 初始化與安全檢查 ---
let db = null;
let auth = null;
let firebaseEnabled = false;

try {
  const firebaseConfig = {
    apiKey: "", // 目前為空，程式會自動跳過雲端儲存，確保網頁不會變白屏
    authDomain: "default-app-id.firebaseapp.com",
    projectId: "default-app-id",
    storageBucket: "default-app-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdefg"
  };

  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "") {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    firebaseEnabled = true;
  }
} catch (e) {
  console.log("Firebase 模式目前關閉，將使用 Google 表單模式。");
}

const App = () => {
  const [activeTab, setActiveTab] = useState('intro');
  const [user, setUser] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    lineId: '', 
    address: '',
    outdoor: [],
    indoor: [],
    extra: false
  });

  // 補助項目數據
  const outdoorOptions = [
    { id: '立面修繕', label: '立面修繕 (外牆美化)', desc: '最高補助 100~300 萬/棟' },
    { id: '屋頂防水', label: '屋頂防水及隔熱', desc: '最高補助 20 萬/棟' },
    { id: '空調改善', label: '外掛式空調管線安全改善', desc: '最高補助 5 萬/棟' },
    { id: '室外無障礙', label: '增設或改善室外無障礙設施', desc: '最高補助 5 萬/棟' }
  ];

  const indoorOptions = [
    { id: '居家安全', label: '居家安全及無障礙設備', desc: '改善老舊居住機能' },
    { id: '管線更新', label: '管線修繕更新 (水電管線)', desc: '確保老屋用電安全' }
  ];

  useEffect(() => {
    if (!firebaseEnabled || !auth) return;
    signInAnonymously(auth).catch((err) => console.error("Auth Error:", err));
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const sendToGoogleForm = async (data) => {
    const FORM_ID = "1FAIpQLSchh1k7l7L6gG4ydGvsON9YzboWSoFS8M4OCdD16Byeu5BJhw";
    const GOOGLE_FORM_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;
    
    const formBody = new URLSearchParams();
    formBody.append('entry.238163847', data.name);    
    formBody.append('entry.1263271594', data.phone);  
    formBody.append('entry.466549923', data.lineId);   
    formBody.append('entry.710276016', data.address);  
    const projectSummary = `室外：${data.outdoor.join(', ')} | 室內：${data.indoor.join(', ')} | 加碼補助：${data.extra ? '是' : '否'}`;
    formBody.append('entry.170423975', projectSummary); 

    try {
      await fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody
      });
      return true;
    } catch (e) {
      console.error("Submit Error:", e);
      return false;
    }
  };

  const handleCheckbox = (type, id) => {
    setFormData(prev => {
      const list = [...prev[type]];
      if (list.includes(id)) {
        return { ...prev, [type]: list.filter(item => item !== id) };
      } else {
        return { ...prev, [type]: [...list, id] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await sendToGoogleForm(formData);
      setSubmitted(true);
      setFormData({ name: '', phone: '', lineId: '', address: '', outdoor: [], indoor: [], extra: false });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8FA] font-sans text-gray-800 overflow-x-hidden flex flex-col">
      {/* 頂部裝飾 */}
      <div className="h-2 bg-gradient-to-r from-pink-300 via-rose-300 to-pink-300"></div>
      
      <header className="py-10 px-6 text-center shrink-0 relative">
        <div className="absolute top-4 left-4 opacity-10"><Home size={60} /></div>
        <div className="relative inline-block mb-3">
          <Heart className="text-rose-400 fill-rose-400 absolute -top-4 -right-4 rotate-12" size={24} />
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">老屋延壽申請</h1>
        </div>
        <div className="text-pink-500 font-bold text-sm tracking-[0.2em] flex items-center justify-center gap-2">
          <ChevronRight size={14} className="text-pink-300" />
          郡翔室內裝修有限公司
          <ChevronRight size={14} className="text-pink-300" />
        </div>
      </header>

      {/* 導覽分頁 */}
      <nav className="flex justify-center px-4 mb-8 shrink-0">
        <div className="bg-white/70 backdrop-blur-md p-1.5 rounded-[2rem] border border-pink-100 flex gap-1 shadow-sm w-full max-w-md">
          {[
            { id: 'intro', label: '補助計畫', icon: <Info size={16} /> },
            { id: 'safety', label: '安全評估', icon: <Shield size={16} /> },
            { id: 'apply', label: '預約申請', icon: <ClipboardList size={16} /> }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id)} 
              className={`flex-1 py-3 rounded-[1.5rem] text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                activeTab === t.id 
                ? 'bg-white text-rose-500 shadow-md ring-1 ring-pink-50' 
                : 'text-gray-400 hover:text-pink-300'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* 主要內容 */}
      <main className="px-6 pb-20 max-w-lg mx-auto flex-grow w-full">
        {submitted ? (
          <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-pink-100 text-center animate-bounceIn">
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-rose-400" size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-800">申請已送出！</h2>
            <p className="text-gray-500 text-sm mt-3 leading-relaxed">
              資料已同步傳送至您的 Google 表單，<br/>郡翔專業團隊將儘速聯繫您。✨
            </p>
            <button 
              onClick={() => {setSubmitted(false); setActiveTab('intro')}} 
              className="mt-8 px-10 py-3 bg-rose-50 text-rose-500 font-bold rounded-2xl active:scale-95 transition-all shadow-sm"
            >
              返回首頁
            </button>
          </div>
        ) : (
          <div className="animate-fadeIn space-y-6">
            {/* 計畫介紹分頁 */}
            {activeTab === 'intro' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-pink-100 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                  <h2 className="text-xl font-black text-gray-800 mb-5 flex items-center gap-2 relative">
                    <Star className="text-rose-400 fill-rose-400" size={20} />
                    政府補助概要
                  </h2>
                  <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-5 rounded-3xl mb-6 border border-pink-100 shadow-inner">
                    <p className="text-rose-600 font-bold flex items-center gap-2 text-sm mb-2">
                      <Gift size={18} /> 這是您的起家厝大變身的機會
                    </p>
                    <div className="text-gray-700 font-medium">
                      工程報價單高達 <span className="text-3xl font-black text-rose-500 underline decoration-pink-300 decoration-4 underline-offset-4">65%</span> 的補助金支援！
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-pink-50 pb-2">申請門檻</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3 text-sm text-gray-700">
                        <CheckCircle className="text-rose-400 shrink-0 mt-0.5" size={16} />
                        <span>屋齡需滿 <span className="font-bold text-rose-500">30 年以上</span> 之合法建築物。</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-700">
                        <CheckCircle className="text-rose-400 shrink-0 mt-0.5" size={16} />
                        <span>需為 <span className="font-bold">全棟住宅使用</span> (排除營業性質場所)。</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-rose-400 font-bold">
                        <AlertCircle className="shrink-0 mt-0.5" size={16} />
                        <span>特別注意：違章建築部分不予補助。</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 安全評估分頁 */}
            {activeTab === 'safety' && (
              <div className="space-y-6 text-left">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-pink-100">
                  <h2 className="text-xl font-black text-gray-800 mb-5 flex items-center gap-2">
                    <Shield className="text-rose-400" size={22} />
                    結構安全性能評估
                  </h2>
                  
                  <div className="p-4 bg-amber-50 rounded-2xl mb-6 border border-amber-100 flex gap-3 shadow-inner">
                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs font-bold text-amber-700 leading-normal">
                      重要備註：安全性評估之最終結果<span className="text-rose-500 underline mx-1 decoration-2">不影響補助申請</span>，請屋主安心進行評估程序。
                    </p>
                  </div>

                  <p className="text-sm text-gray-600 mb-6 font-bold flex items-center gap-2">
                    <Star size={16} className="text-pink-300 fill-current" />
                    合作單位：台中市土木技師公會
                  </p>

                  <div className="overflow-hidden rounded-[1.5rem] border border-pink-50 shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-pink-100/50">
                        <tr className="text-xs font-bold text-gray-500">
                          <td className="p-4">收費項目</td>
                          <td className="p-4 text-right">收費標準</td>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        <tr className="border-b border-pink-50">
                          <td className="p-4 font-bold text-gray-700">掛號費</td>
                          <td className="p-4 text-right font-black text-gray-800">2,000 元/案</td>
                        </tr>
                        <tr className="border-b border-pink-50">
                          <td className="p-4 font-bold text-gray-700">初步評估費</td>
                          <td className="p-4 text-right font-black text-rose-500">15,000 元/棟起</td>
                        </tr>
                        <tr className="border-b border-pink-50 bg-rose-50/20">
                          <td className="p-4 font-bold text-rose-600 italic">最低收費</td>
                          <td className="p-4 text-right font-black text-rose-500">20,000 元/案</td>
                        </tr>
                        <tr>
                          <td className="p-4 font-bold text-gray-700">
                            現場量測費
                            <div className="text-[10px] text-gray-400 font-normal mt-1">※ 若原始無圖說需現場測繪</div>
                          </td>
                          <td className="p-4 text-right font-black text-gray-800">5,000 元</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-4 text-right">※ 以上費用依台中市土木技師公會最終報價為準</p>
                </div>
              </div>
            )}

            {/* 預約申請分頁 */}
            {activeTab === 'apply' && (
              <form onSubmit={handleSubmit} className="space-y-6 text-left pb-10">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-pink-100">
                  <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                    <ClipboardList className="text-rose-400" size={22} />
                    填寫預約資料
                  </h2>
                  
                  <div className="space-y-6">
                    {/* 修繕項目勾選 */}
                    <div>
                      <h3 className="text-xs font-black text-pink-400 mb-3 ml-1 flex items-center gap-2">
                        <div className="w-1.5 h-3 bg-pink-300 rounded-full"></div>
                        室外修繕 (必選一項)
                      </h3>
                      <div className="space-y-2">
                        {outdoorOptions.map(opt => (
                          <label key={opt.id} className="flex items-center p-4 rounded-2xl bg-pink-50/30 border border-pink-100 cursor-pointer active:scale-[0.98] transition-all">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 accent-rose-400 rounded-lg border-pink-200"
                              checked={formData.outdoor.includes(opt.id)}
                              onChange={() => handleCheckbox('outdoor', opt.id)}
                            />
                            <div className="ml-3">
                              <div className="text-sm font-bold text-gray-700">{opt.label}</div>
                              <div className="text-[10px] text-rose-400">{opt.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-black text-pink-400 mb-3 ml-1 flex items-center gap-2">
                        <div className="w-1.5 h-3 bg-pink-300 rounded-full"></div>
                        室內修繕 (可加選)
                      </h3>
                      <div className="space-y-2">
                        {indoorOptions.map(opt => (
                          <label key={opt.id} className="flex items-center p-4 rounded-2xl bg-pink-50/30 border border-pink-100 cursor-pointer active:scale-[0.98] transition-all">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 accent-rose-400 rounded-lg border-pink-200"
                              checked={formData.indoor.includes(opt.id)}
                              onChange={() => handleCheckbox('indoor', opt.id)}
                            />
                            <div className="ml-3">
                              <div className="text-sm font-bold text-gray-700">{opt.label}</div>
                              <div className="text-[10px] text-rose-400">{opt.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 基本資料輸入 */}
                    <div className="space-y-4 pt-4 border-t border-pink-50">
                      <h3 className="text-xs font-black text-gray-400 ml-1">聯繫資訊</h3>
                      <input 
                        required 
                        type="text" 
                        placeholder="屋主姓名" 
                        className="w-full p-4 rounded-2xl bg-gray-50 border-0 focus:ring-2 focus:ring-pink-200 outline-none transition-all shadow-inner placeholder:text-gray-300"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          required 
                          type="tel" 
                          placeholder="電話號碼" 
                          className="w-full p-4 rounded-2xl bg-gray-50 border-0 focus:ring-2 focus:ring-pink-200 outline-none transition-all shadow-inner text-sm placeholder:text-gray-300"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                        <input 
                          type="text" 
                          placeholder="LINE ID" 
                          className="w-full p-4 rounded-2xl bg-gray-50 border-0 focus:ring-2 focus:ring-pink-200 outline-none transition-all shadow-inner text-sm placeholder:text-gray-300"
                          value={formData.lineId}
                          onChange={(e) => setFormData({...formData, lineId: e.target.value})}
                        />
                      </div>
                      <input 
                        required 
                        type="text" 
                        placeholder="房屋地址" 
                        className="w-full p-4 rounded-2xl bg-gray-50 border-0 focus:ring-2 focus:ring-pink-200 outline-none transition-all shadow-inner placeholder:text-gray-300"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>

                    {/* 加碼補助按鈕 */}
                    <label className="flex items-center gap-4 p-5 bg-rose-50 rounded-[1.5rem] cursor-pointer border border-rose-100 active:bg-rose-100 transition-colors shadow-sm group">
                      <input 
                        type="checkbox" 
                        className="w-6 h-6 accent-rose-500 rounded-lg"
                        checked={formData.extra}
                        onChange={(e) => setFormData({...formData, extra: e.target.checked})}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-rose-600 flex items-center gap-1">
                          符合長照或高齡弱勢 <Star size={12} className="group-hover:rotate-45 transition-transform" />
                        </span>
                        <span className="text-[11px] text-rose-400 font-medium">符合條件者可額外補助 10 萬，一共 30 萬</span>
                      </div>
                    </label>

                    <button 
                      disabled={isSending} 
                      type="submit" 
                      className="w-full py-5 bg-gradient-to-r from-rose-400 to-pink-400 text-white font-black rounded-3xl shadow-lg shadow-rose-100 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                      {isSending ? '資料傳送中...' : '送出預約申請'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      {/* 頁尾 */}
      <footer className="py-12 px-6 text-center text-[10px] text-gray-300 border-t border-pink-50 bg-white/50 mt-auto">
        <p className="tracking-widest mb-1 uppercase font-bold">Jun Xiang Interior Decoration</p>
        <p>© 2024 郡翔室內裝修有限公司．版權所有</p>
      </footer>

      {/* 動畫定義 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounceIn { 0% { transform: scale(0.92); opacity: 0; } 70% { transform: scale(1.02); opacity: 1; } 100% { transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-bounceIn { animation: bounceIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1.2) forwards; }
        
        /* 隱藏捲軸但保持滾動功能 */
        ::-webkit-scrollbar { width: 0px; background: transparent; }
      ` }} />
    </div>
  );
};

export default App;
