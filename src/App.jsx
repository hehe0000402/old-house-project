import React, { useState, useEffect } from 'react';
import { Heart, Home, Shield, CheckCircle, Send, Phone, MapPin, ClipboardList, Info, ChevronRight, Star, Loader2, Database, Gift, AlertCircle, MessageCircle } from 'lucide-react';

// Firebase 相關引入 (用於雲端備份功能)
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';

// --- Firebase 安全初始化 ---
let db = null;
let auth = null;
let appId = 'old-house-app';
let firebaseEnabled = false;

try {
  const config = {
    apiKey: "", 
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  };

  if (config.apiKey && config.apiKey !== "") {
    const firebaseApp = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    firebaseEnabled = true;
  }
} catch (e) {
  console.log("Firebase 模式目前關閉，切換至 Google 表單模式。");
}

const App = () => {
  const [activeTab, setActiveTab] = useState('intro');
  const [user, setUser] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [records, setRecords] = useState([]); 
  const [showAdmin, setShowAdmin] = useState(false);

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

  // 1. 初始化匿名登入
  useEffect(() => {
    if (!firebaseEnabled || !auth) return;
    signInAnonymously(auth).catch(() => {});
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. 監聽數據 (僅在 Firebase 啟用時)
  useEffect(() => {
    if (!firebaseEnabled || !db || !user) return;
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'submissions');
    const q = query(colRef); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecords(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, () => {});
    return () => unsubscribe();
  }, [user]);

  // 3. 串接 Google 表單 (已填入您的真實 Entry ID)
  const sendToGoogleForm = async (data) => {
    const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfpX4W3zX_M8vXk_D-yL-l9-mU-n-E-v-Q/formResponse";
    const formBody = new URLSearchParams();
    formBody.append('entry.238163847', data.name);    // 姓名
    formBody.append('entry.1263271594', data.phone);  // 電話
    formBody.append('entry.466549923', data.lineId);   // LINE ID
    formBody.append('entry.710276016', data.address);  // 地址
    formBody.append('entry.170423975', `申請項目：室外(${data.outdoor.join(',')}) 室內(${data.indoor.join(',')}) 加碼(${data.extra ? '是' : '否'})`); 

    try {
      await fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody
      });
    } catch (e) {
      console.error("Google Form Submit Error");
    }
  };

  const handleCheckbox = (type, id) => {
    setFormData(prev => {
      const list = [...prev[type]];
      if (list.includes(id)) return { ...prev, [type]: list.filter(item => item !== id) };
      return { ...prev, [type]: [...list, id] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      if (firebaseEnabled && db) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'), {
          ...formData,
          createdAt: serverTimestamp(),
          userId: user?.uid || 'anonymous'
        });
      }
      await sendToGoogleForm(formData);
      setSubmitted(true);
      setFormData({ name: '', phone: '', lineId: '', address: '', outdoor: [], indoor: [], extra: false });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'intro':
        return (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-pink-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-pink-100 rounded-full text-pink-500"><Home size={20} /></div>
                <h2 className="text-xl font-bold text-gray-800">計畫介紹</h2>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-4 rounded-2xl border border-pink-100 mb-4">
                <p className="text-rose-600 font-bold text-sm flex items-center gap-2 mb-2"><Gift size={16} /> 政府補助老屋整修計畫</p>
                <p className="text-gray-600 text-sm leading-relaxed">主要是協助 <span className="text-pink-500 font-semibold">透天住宅</span> 的屋主進行大變身！改善居住安全與環境。</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-pink-200 mb-6 text-center shadow-inner">
                <p className="text-gray-500 text-xs mb-1">超強有感補助</p>
                <div className="text-2xl font-black text-rose-500">報價單 <span className="text-3xl underline decoration-pink-300">65%</span> 補助金</div>
                <p className="text-[10px] text-gray-400 mt-1">※ 需經政府審核通過後發放</p>
              </div>
              <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100 space-y-2 text-sm text-gray-700">
                <p>🌸 屋齡需滿 30 年以上</p>
                <p>🌸 需為全棟住宅使用 (不可作為營業場所)</p>
                <p className="text-rose-500 font-bold">🌸 違章建築不予補助</p>
              </div>
            </div>
          </div>
        );
      case 'safety':
        return (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-pink-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-pink-100 rounded-full text-pink-500"><Shield size={20} /></div>
                <h2 className="text-xl font-bold text-gray-800">結構安全性能評估</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4 font-bold underline decoration-pink-200 decoration-2 underline-offset-4">本公司僅提供初步評估的服務喔!</p>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-2 mb-6 shadow-inner">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                <p className="text-xs font-bold text-amber-700 leading-normal">安全性評估之最終結果<span className="text-rose-500 underline ml-1">不影響補助申請</span>，請放心評估。</p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-pink-100 shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-pink-100 text-pink-700 font-bold">
                    <tr><th className="p-3">項目</th><th className="p-3">收費標準</th></tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr className="border-b border-pink-50"><td className="p-3 font-medium text-gray-600">初步評估費</td><td className="p-3 font-bold text-pink-500">15,000 元/棟起</td></tr>
                    <tr className="border-b border-pink-50"><td className="p-3 text-gray-500">掛號費/最低收費</td><td className="p-3 text-gray-700">20,000 元/案</td></tr>
                    <tr><td className="p-3 text-gray-500">現場量測費</td><td className="p-3 text-gray-700">5,000 元</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'apply':
        return (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn pb-12 text-left">
            <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-pink-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><ClipboardList size={20} className="text-pink-500" /> 挑選修繕項目與資料</h2>
              
              <div className="space-y-4">
                {/* 室外修繕選單 */}
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-pink-600 mb-2 border-l-4 border-pink-400 pl-2">室外修繕 (必選一項)</h3>
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

                {/* 室內修繕選單 */}
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-pink-600 mb-2 border-l-4 border-pink-400 pl-2">室內修繕 (可加選)</h3>
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

                {/* 加碼補助 */}
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 shadow-inner mb-6">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 accent-rose-500 rounded" checked={formData.extra} onChange={(e) => setFormData({...formData, extra: e.target.checked})} />
                    <div className="ml-3">
                      <div className="text-sm font-bold text-rose-600">加碼補助：符合長照或高齡</div>
                      <div className="text-[10px] text-rose-400">額外補助 10 萬，一共 30 萬</div>
                    </div>
                  </label>
                </div>

                {/* 聯絡資料 */}
                <div className="space-y-3 pt-4 border-t border-pink-100">
                  <h3 className="text-sm font-bold text-gray-500 mb-2">屋主聯絡資訊</h3>
                  <input required type="text" placeholder="您的姓名" className="w-full p-4 rounded-2xl bg-white border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all shadow-sm" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  <div className="grid grid-cols-2 gap-3">
                    <input required type="tel" placeholder="電話號碼" className="w-full p-4 rounded-2xl bg-white border border-pink-100 text-sm focus:outline-none transition-all shadow-sm" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                    <input type="text" placeholder="LINE ID" className="w-full p-4 rounded-2xl bg-white border border-pink-100 text-sm focus:outline-none transition-all shadow-sm" value={formData.lineId} onChange={(e) => setFormData({...formData, lineId: e.target.value})} />
                  </div>
                  <input required type="text" placeholder="房屋地址" className="w-full p-4 rounded-2xl bg-white border border-pink-100 focus:outline-none transition-all shadow-sm" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>

              <button disabled={isSending} type="submit" className="w-full mt-8 py-4 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} {isSending ? '送出中' : '送出預約申請'}
              </button>
            </div>
          </form>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] font-sans text-gray-800 overflow-x-hidden flex flex-col">
      <header className="py-8 px-6 text-center shrink-0">
        <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center justify-center gap-2"><Heart className="text-pink-400 fill-pink-400" size={24} /> 老屋延壽申請</h1>
        <div className="text-pink-500 font-bold text-sm tracking-widest mt-1">郡翔室內裝修有限公司</div>
      </header>

      <nav className="flex justify-center px-4 mb-6 shrink-0">
        <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-3xl border border-pink-100 flex gap-1 shadow-sm w-full max-w-sm">
          {['intro', 'safety', 'apply'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === t ? 'bg-white text-pink-500 shadow-md' : 'text-gray-400 hover:text-pink-300'}`}>
              {t === 'intro' ? '計畫' : t === 'safety' ? '安全' : '預約'}
            </button>
          ))}
        </div>
      </nav>

      <main className="px-6 pb-12 max-w-lg mx-auto flex-grow w-full text-center">
        {submitted ? (
          <div className="bg-white p-10 rounded-3xl shadow-xl text-center border border-pink-100 animate-bounceIn">
            <CheckCircle className="text-pink-500 mx-auto mb-4" size={48} />
            <h2 className="text-2xl font-bold">送出成功！</h2>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed font-medium">資料已同步傳送至 Google 表單，專員將盡快聯繫您！✨</p>
            <button onClick={() => setSubmitted(false)} className="mt-6 px-8 py-3 bg-pink-50 text-pink-500 font-bold rounded-xl shadow-sm active:scale-95 transition-all">返回首頁</button>
          </div>
        ) : renderContent()}
      </main>

      <footer className="py-8 px-6 text-center border-t border-pink-100 mt-auto bg-white/50 text-[10px] text-gray-400 font-medium">
        © 2024 Jun Xiang Interior Decoration. All Rights Reserved.
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounceIn { 0% { transform: scale(0.9); opacity: 0; } 70% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-bounceIn { animation: bounceIn 0.5s ease-out forwards; }
      `}} />
    </div>
  );
};

export default App;
