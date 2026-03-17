import React, { useState, useEffect } from 'react';
import { Heart, Home, Shield, CheckCircle, Send, Phone, MapPin, ClipboardList, Info, ChevronRight, Star, Loader2, Database, Gift, AlertCircle, MessageCircle } from 'lucide-react';

// Firebase 相關引入
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';

// --- Firebase 初始化 ---
const firebaseConfig = {
  apiKey: "", 
  authDomain: "default-app-id.firebaseapp.com",
  projectId: "default-app-id",
  storageBucket: "default-app-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefg"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

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

  useEffect(() => {
    signInAnonymously(auth).catch((err) => console.error("Auth Error:", err));
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 串接 Google 表單函數
  const sendToGoogleForm = async (data) => {
    // 您提供的最新 ID
    const FORM_ID = "1mrWxsBbWswnI6NBI6y7a5YXHyfT7tc_IoVY4Tb3KUlI";
    const GOOGLE_FORM_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;
    
    const formBody = new URLSearchParams();
    formBody.append('entry.238163847', data.name);    
    formBody.append('entry.1263271594', data.phone);  
    formBody.append('entry.466549923', data.lineId);   
    formBody.append('entry.710276016', data.address);  
    formBody.append('entry.170423975', `室外：${data.outdoor.join(', ')} | 室內：${data.indoor.join(', ')} | 加碼：${data.extra ? '是' : '否'}`); 

    console.log("開始送出資料到 Google 表單...");

    try {
      const response = await fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        mode: 'no-cors', // 重要：避免跨域錯誤
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody
      });
      console.log("送出指令已執行。");
      return true;
    } catch (e) {
      console.error("傳送至 Google 表單發生錯誤：", e);
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
    console.log("使用者點擊送出按鈕");

    try {
      // 嘗試送到 Google 表單
      const success = await sendToGoogleForm(formData);
      
      if (success) {
        setSubmitted(true);
        setFormData({ name: '', phone: '', lineId: '', address: '', outdoor: [], indoor: [], extra: false });
      }
    } catch (error) {
      console.error("送出過程中斷:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] font-sans text-gray-800 overflow-x-hidden flex flex-col">
      <header className="py-8 px-6 text-center shrink-0">
        <h1 className="text-3xl font-black text-gray-800 flex items-center justify-center gap-2"><Heart className="text-pink-400 fill-pink-400" /> 老屋延壽</h1>
        <div className="text-pink-500 font-bold text-sm">郡翔室內裝修有限公司</div>
      </header>

      <nav className="flex justify-center px-4 mb-6 shrink-0">
        <div className="bg-white p-1.5 rounded-3xl border border-pink-100 flex gap-1 shadow-sm w-full max-w-sm">
          {['intro', 'safety', 'apply'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === t ? 'bg-pink-50 text-pink-500 shadow-sm' : 'text-gray-400'}`}>
              {t === 'intro' ? '計畫' : t === 'safety' ? '安全' : '預約'}
            </button>
          ))}
        </div>
      </nav>

      <main className="px-6 pb-12 max-w-lg mx-auto flex-grow w-full text-center">
        {submitted ? (
          <div className="bg-white p-10 rounded-3xl shadow-xl border border-pink-100 animate-bounceIn">
            <CheckCircle className="text-pink-500 mx-auto mb-4" size={48} />
            <h2 className="text-2xl font-bold">送出成功！</h2>
            <p className="text-gray-500 text-sm mt-2 font-medium">資料已同步傳送至 Google 表單，專員將儘速聯繫您。✨</p>
            <button onClick={() => {setSubmitted(false); setActiveTab('intro')}} className="mt-6 px-8 py-3 bg-pink-50 text-pink-500 font-bold rounded-xl active:scale-95 transition-all">返回首頁</button>
          </div>
        ) : (
          <div className="animate-fadeIn space-y-6">
            {activeTab === 'intro' && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100 text-left">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Home size={20} className="text-pink-400" /> 計畫介紹</h2>
                <div className="bg-pink-50 p-4 rounded-2xl mb-4 border border-pink-100">
                  <p className="text-rose-600 font-bold flex items-center gap-1"><Gift size={16} /> 政府補助老屋整修計畫</p>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">提供報價單高達 <span className="text-xl font-black text-rose-500 underline decoration-pink-300">65%</span> 的補助金支援！</p>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <p className="flex items-center gap-2"><Star size={12} className="text-yellow-400 fill-current" /> 屋齡需滿 30 年以上之合法建築</p>
                  <p className="flex items-center gap-2"><Star size={12} className="text-yellow-400 fill-current" /> 需為全棟住宅使用（非營業場所）</p>
                </div>
              </div>
            )}

            {activeTab === 'safety' && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100 text-left">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Shield size={20} className="text-pink-400" /> 結構安全評估</h2>
                <div className="bg-amber-50 p-4 rounded-2xl mb-4 text-[11px] text-amber-700 leading-normal border border-amber-100">
                   ⚠️ 特別說明：安全性評估之最終結果<span className="text-rose-500 font-bold underline">不影響補助申請</span>，請屋主放心評估。本公司僅提供初步評估服務。
                </div>
                <div className="border border-pink-50 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <tr className="border-b border-pink-50 bg-pink-50/30 font-bold text-gray-700"><td className="p-3">項目</td><td className="p-3 text-right">收費標準</td></tr>
                    <tr className="border-b border-pink-50"><td className="p-3">初步評估費</td><td className="p-3 text-right font-bold text-pink-500">15,000 元起</td></tr>
                    <tr className="border-b border-pink-50"><td className="p-3">掛號最低收費</td><td className="p-3 text-right">20,000 元</td></tr>
                    <tr><td className="p-3">現場量測費</td><td className="p-3 text-right">5,000 元</td></tr>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'apply' && (
              <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100 text-left space-y-4">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ClipboardList size={20} className="text-pink-400" /> 填寫預約</h2>
                <div className="space-y-4">
                  <input required type="text" placeholder="您的姓名" className="w-full p-4 rounded-2xl bg-pink-50/30 border-0 focus:ring-2 focus:ring-pink-300 outline-none transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  <div className="grid grid-cols-2 gap-2">
                    <input required type="tel" placeholder="電話" className="p-4 rounded-2xl bg-pink-50/30 border-0 focus:ring-2 focus:ring-pink-300 outline-none transition-all" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                    <input type="text" placeholder="LINE ID" className="p-4 rounded-2xl bg-pink-50/30 border-0 focus:ring-2 focus:ring-pink-300 outline-none transition-all" value={formData.lineId} onChange={(e) => setFormData({...formData, lineId: e.target.value})} />
                  </div>
                  <input required type="text" placeholder="地址" className="w-full p-4 rounded-2xl bg-pink-50/30 border-0 focus:ring-2 focus:ring-pink-300 outline-none transition-all" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                  
                  <label className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl cursor-pointer border border-rose-100 active:bg-rose-100 transition-colors">
                    <input type="checkbox" className="w-5 h-5 accent-rose-500" checked={formData.extra} onChange={(e) => setFormData({...formData, extra: e.target.checked})} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-rose-600">符合長照需求或高齡弱勢</span>
                      <span className="text-[10px] text-rose-400">符合條件可額外加碼補助 10 萬</span>
                    </div>
                  </label>

                  <button disabled={isSending} type="submit" className="w-full py-4 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                    {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    {isSending ? '資料傳送中' : '送出預約申請'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-[10px] text-gray-400 border-t border-pink-50 bg-white/30 mt-auto">
        © 2024 Jun Xiang Interior Decoration. <br/> 郡翔室內裝修有限公司
      </footer>
    </div>
  );
};

export default App;
