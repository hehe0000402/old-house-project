import React, { useState, useEffect } from 'react';
import { Heart, Home, Shield, CheckCircle, Send, Phone, MapPin, ClipboardList, Info, ChevronRight, Star, Loader2, Database, Gift, AlertCircle, MessageCircle } from 'lucide-react';

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

  // 只有在有填寫 API Key 的情況下才初始化 Firebase
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

  // 串接 Google 表單函數
  const sendToGoogleForm = async (data) => {
    const FORM_ID = "1FAIpQLSchh1k7l7L6gG4ydGvsON9YzboWSoFS8M4OCdD16Byeu5BJhw";
    const GOOGLE_FORM_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;
    
    const formBody = new URLSearchParams();
    formBody.append('entry.238163847', data.name);    // 屋主姓名
    formBody.append('entry.1263271594', data.phone);  // 電話號碼
    formBody.append('entry.466549923', data.lineId);   // LINE ID
    formBody.append('entry.710276016', data.address);  // 房屋地址
    
    // 彙整修繕項目到最後一欄
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
      console.error("傳送至 Google 表單失敗：", e);
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
      console.error("送出過程出錯:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] font-sans text-gray-800 overflow-x-hidden flex flex-col">
      <header className="py-8 px-6 text-center shrink-0">
        <h1 className="text-3xl font-black text-gray-800 flex items-center justify-center gap-2">
          <Heart className="text-pink-400 fill-pink-400" /> 老屋延壽
        </h1>
        <div className="text-pink-500 font-bold text-sm tracking-widest mt-1">郡翔室內裝修有限公司</div>
      </header>

      <nav className="flex justify-center px-4 mb-6 shrink-0">
        <div className="bg-white p-1.5 rounded-3xl border border-pink-100 flex gap-1 shadow-sm w-full max-w-sm">
          {[
            { id: 'intro', label: '計畫' },
            { id: 'safety', label: '安全' },
            { id: 'apply', label: '預約' }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id)} 
              className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === t.id ? 'bg-pink-50 text-pink-500 shadow-sm' : 'text-gray-400 hover:text-pink-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="px-6 pb-12 max-w-lg mx-auto flex-grow w-full text-center">
        {submitted ? (
          <div className="bg-white p-10 rounded-3xl shadow-xl border border-pink-100 animate-bounceIn">
            <CheckCircle className="text-pink-500 mx-auto mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-800">送出成功！</h2>
            <p className="text-gray-500 text-sm mt-2 font-medium leading-relaxed">
              資料已同步傳送至 Google 表單，<br/>專業團隊將儘速聯繫您。✨
            </p>
            <button 
              onClick={() => {setSubmitted(false); setActiveTab('intro')}} 
              className="mt-6 px-8 py-3 bg-pink-50 text-pink-500 font-bold rounded-xl active:scale-95 transition-all shadow-sm"
            >
              返回首頁
            </button>
          </div>
        ) : (
          <div className="animate-fadeIn space-y-6">
            {activeTab === 'intro' && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100 text-left">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Home size={20} className="text-pink-400" /> 計畫介紹</h2>
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-4 rounded-2xl mb-4 border border-pink-100 shadow-inner">
                  <p className="text-rose-600 font-bold flex items-center gap-1"><Gift size={16} /> 政府補助老屋整修計畫</p>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                    提供報價單高達 <span className="text-xl font-black text-rose-500 underline decoration-pink-300">65%</span> 的補助金支援！
                  </p>
                </div>
                <div className="text-sm text-gray-600 space-y-3">
                  <p className="flex items-start gap-2"><Star size={14} className="text-yellow-400 fill-current shrink-0 mt-0.5" /> <span>屋齡需滿 30 年以上之合法建築物。</span></p>
                  <p className="flex items-start gap-2"><Star size={14} className="text-yellow-400 fill-current shrink-0 mt-0.5" /> <span>需為全棟住宅使用（非營業場所）。</span></p>
                  <p className="flex items-start gap-2 text-rose-500 font-bold"><Info size={14} className="shrink-0 mt-0.5" /> <span>違章建築部分不予補助。</span></p>
                </div>
              </div>
            )}

            {activeTab === 'safety' && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100 text-left">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Shield size={20} className="text-pink-400" /> 結構安全評估</h2>
                <div className="bg-amber-50 p-4 rounded-2xl mb-4 text-[11px] text-amber-700 leading-normal border border-amber-100 shadow-inner">
                   ⚠️ 特別說明：安全性評估之最終結果<span className="text-rose-500 font-bold underline">不影響補助申請</span>，請屋主放心評估。本公司僅提供初步評估服務。
                </div>
                <div className="border border-pink-50 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-pink-100/50 font-bold text-gray-700 text-xs">
                        <td className="p-3">項目</td>
                        <td className="p-3 text-right">收費標準</td>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      <tr className="border-b border-pink-50"><td className="p-3">初步評估費</td><td className="p-3 text-right font-bold text-pink-500">15,000 元起</td></tr>
                      <tr className="border-b border-pink-50"><td className="p-3 text-gray-400">掛號最低收費</td><td className="p-3 text-right text-gray-400">20,000 元</td></tr>
                      <tr><td className="p-3 text-gray-400">現場量測費</td><td className="p-3 text-right text-gray-400">5,000 元</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'apply' && (
              <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100 text-left space-y-5">
                <h2 className="text-xl font-bold flex items-center gap-2"><ClipboardList size={20} className="text-pink-400" /> 填寫預約</h2>
                
                <div className="space-y-6">
                  {/* 室外修繕 */}
                  <div>
                    <h3 className="text-sm font-bold text-pink-600 mb-3 border-l-4 border-pink-400 pl-2">室外修繕 (必選一項)</h3>
                    <div className="grid gap-2">
                      {outdoorOptions.map(opt => (
                        <label key={opt.id} className="flex items-center p-3 rounded-2xl bg-pink-50/30 border border-pink-100 cursor-pointer active:scale-95 transition-all">
                          <input type="checkbox" className="w-5 h-5 accent-pink-500 rounded" checked={formData.outdoor.includes(opt.id)} onChange={() => handleCheckbox('outdoor', opt.id)} />
                          <div className="ml-3">
                            <div className="text-sm font-bold text-gray-700">{opt.label}</div>
                            <div className="text-[10px] text-pink-400">{opt.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 室內修繕 */}
                  <div>
                    <h3 className="text-sm font-bold text-pink-600 mb-3 border-l-4 border-pink-400 pl-2">室內修繕 (可加選)</h3>
                    <div className="grid gap-2">
                      {indoorOptions.map(opt => (
                        <label key={opt.id} className="flex items-center p-3 rounded-2xl bg-pink-50/30 border border-pink-100 cursor-pointer active:scale-95 transition-all">
                          <input type="checkbox" className="w-5 h-5 accent-pink-500 rounded" checked={formData.indoor.includes(opt.id)} onChange={() => handleCheckbox('indoor', opt.id)} />
                          <div className="ml-3">
                            <div className="text-sm font-bold text-gray-700">{opt.label}</div>
                            <div className="text-[10px] text-pink-400">{opt.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 聯絡資訊 */}
                  <div className="space-y-4 pt-4 border-t border-pink-100">
                    <label className="text-xs font-bold text-pink-400 ml-2 mb-1 block">基本資料</label>
                    <input required type="text" placeholder="您的姓名" className="w-full p-4 rounded-2xl bg-pink-50/30 border-0 focus:ring-2 focus:ring-pink-300 outline-none transition-all shadow-inner" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <input required type="tel" placeholder="電話號碼" className="p-4 rounded-2xl bg-pink-50/30 border-0 focus:ring-2 focus:ring-pink-300 outline-none transition-all shadow-inner text-sm" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                      <input type="text" placeholder="LINE ID" className="p-4 rounded-2xl bg-pink-50/30 border-0 focus:ring-2 focus:ring-pink-300 outline-none transition-all shadow-inner text-sm" value={formData.lineId} onChange={(e) => setFormData({...formData, lineId: e.target.value})} />
                    </div>
                    
                    <input required type="text" placeholder="房屋地址" className="w-full p-4 rounded-2xl bg-pink-50/30 border-0 focus:ring-2 focus:ring-pink-300 outline-none transition-all shadow-inner" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                    
                    <label className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl cursor-pointer border border-rose-100 active:bg-rose-100 transition-colors shadow-sm">
                      <input type="checkbox" className="w-5 h-5 accent-rose-500 rounded border-pink-200" checked={formData.extra} onChange={(e) => setFormData({...formData, extra: e.target.checked})} />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-rose-600">符合長照需求或高齡弱勢</span>
                        <span className="text-[10px] text-rose-400">符合條件可額外加碼補助 10 萬</span>
                      </div>
                    </label>

                    <button 
                      disabled={isSending} 
                      type="submit" 
                      className="w-full py-4 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                      {isSending ? '資料傳送中' : '送出預約申請'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-[10px] text-gray-400 border-t border-pink-50 bg-white/30 mt-auto">
        © 2024 Jun Xiang Interior Decoration. <br/> 郡翔室內裝修有限公司
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounceIn { 0% { transform: scale(0.9); opacity: 0; } 70% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-bounceIn { animation: bounceIn 0.5s ease-out forwards; }
      ` }} />
    </div>
  );
};

export default App;
