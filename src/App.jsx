import React, { useState, useEffect } from 'react';
import { Heart, Home, Shield, CheckCircle, Send, Phone, MapPin, ClipboardList, Info, ChevronRight, Star, Loader2, Database, Gift, AlertCircle, MessageCircle } from 'lucide-react';

// Firebase 相關引入 (用於雲端備份)
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';

// --- Firebase 初始化 ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "",
  authDomain: "default-app-id.firebaseapp.com",
  projectId: "default-app-id",
  storageBucket: "default-app-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefg"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'old-house-app';

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

  // 1. 初始化匿名登入
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. 監聽雲端數據 (管理區域使用)
  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'submissions');
    const q = query(colRef); 
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecords(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (error) => {
      console.error("Firestore Listen Error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. 串接 Google 表單函數 (已填入您提供的真實編號)
  const sendToGoogleForm = async (data) => {
    // ⚠️ 請確保您的 Google Form ID 是正確的，這串網址需替換成您自己的 formResponse 連結
    const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfpX4W3zX_M8vXk_D-yL-l9-mU-n-E-v-Q/formResponse";
    
    const formBody = new URLSearchParams();
    formBody.append('entry.238163847', data.name);    // 屋主姓名
    formBody.append('entry.1263271594', data.phone);  // 電話號碼
    formBody.append('entry.466549923', data.lineId);   // LINE ID
    formBody.append('entry.710276016', data.address);  // 房屋地址
    formBody.append('entry.170423975', `室外：${data.outdoor.join(', ')} | 室內：${data.indoor.join(', ')} | 加碼：${data.extra ? '是' : '否'}`); 

    try {
      await fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody
      });
    } catch (e) {
      console.error("Google Form Submit Error:", e);
    }
  };

  // 4. 補助項目數據
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

  // 5. 送出資料
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSending(true);
    try {
      // (1) 儲存至雲端資料庫
      const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'submissions');
      await addDoc(colRef, {
        ...formData,
        createdAt: serverTimestamp(),
        userId: user.uid
      });

      // (2) 同步發送到 Google 表單
      await sendToGoogleForm(formData);

      setSubmitted(true);
      setFormData({ name: '', phone: '', lineId: '', address: '', outdoor: [], indoor: [], extra: false });
    } catch (error) {
      console.error("Save Error:", error);
    } finally {
      setIsSending(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'intro':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-pink-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-pink-100 rounded-full text-pink-500">
                  <Home size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 font-sans">計畫介紹</h2>
              </div>
              
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-4 rounded-2xl border border-pink-100 mb-4">
                <p className="text-rose-600 font-bold text-sm flex items-center gap-2 mb-2">
                  <Gift size={16} /> 這是政府補助老屋整修的計畫
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  想讓您的老家煥然一新嗎？本計畫專為改善老舊住宅安全與環境而生。我們主要協助 <span className="text-pink-500 font-semibold">透天住宅</span> 的屋主進行大變身！
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-pink-200 mb-6 text-center shadow-inner">
                <p className="text-gray-500 text-xs mb-1">超強有感補助</p>
                <div className="text-2xl font-black text-rose-500">
                  報價單 <span className="text-3xl underline decoration-pink-300">65%</span> 補助金
                </div>
                <p className="text-[10px] text-gray-400 mt-1">※ 需經政府審核通過後發放</p>
              </div>
              
              <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100">
                <h3 className="font-bold text-pink-600 mb-2 text-base">🌸 申請必要條件</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-pink-400 mt-1 flex-shrink-0" size={14} />
                    <span>屋齡需滿 <span className="font-bold">30 年以上</span> 之合法建築物。</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-pink-400 mt-1 flex-shrink-0" size={14} />
                    <span>需為 <span className="font-bold">全棟住宅使用</span> (不可作為營業場所)。</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-pink-400 mt-1 flex-shrink-0" size={14} />
                    <span><span className="text-rose-500 font-bold">違章建築不予補助</span>。</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white/80 p-6 rounded-3xl shadow-sm border border-pink-100">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Star size={18} className="text-yellow-400 fill-current" />
                為什麼選擇郡翔？
              </h3>
              <p className="text-sm text-gray-600">
                我們提供從評估、設計到施工作業的一條龍服務，用最溫柔的心，協助您爭取政府補助，照顧您的起家厝。
              </p>
            </div>
          </div>
        );

      case 'safety':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white/80 p-6 rounded-3xl shadow-sm border border-pink-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-pink-100 rounded-full text-pink-500">
                  <Shield size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">結構安全性能評估</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                在修繕之前，必須先幫房子做「健康檢查」。<span className="text-pink-500 font-bold underline decoration-pink-200 decoration-2 underline-offset-4">本公司僅提供初步評估的服務喔!</span>
              </p>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 mb-6 shadow-inner">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs font-bold text-amber-700 leading-normal">
                  特別說明：安全性評估之最終結果<span className="text-rose-500 underline decoration-rose-300 ml-1">不影響補助申請</span>，請屋主放心評估。
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-pink-100 mb-4">
                <table className="w-full text-left text-sm">
                  <thead className="bg-pink-100 text-pink-700 font-bold">
                    <tr>
                      <th className="p-3">項目</th>
                      <th className="p-3">收費標準 (台中技師公會)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr className="border-b border-pink-50">
                      <td className="p-3 font-medium text-gray-600">基本掛號費</td>
                      <td className="p-3">2,000 元/案</td>
                    </tr>
                    <tr className="border-b border-pink-50">
                      <td className="p-3 font-medium text-pink-600 font-bold underline decoration-pink-200 decoration-2">初步評估費</td>
                      <td className="p-3 font-bold text-pink-500">15,000 元/棟起<br/><span className="text-[10px] text-gray-400 font-normal">(未滿 3,000㎡)</span></td>
                    </tr>
                    <tr className="border-b border-pink-50">
                      <td className="p-3 font-medium text-gray-600">基本最低收費</td>
                      <td className="p-3">20,000 元/案</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-gray-600">現場量測費</td>
                      <td className="p-3">5,000 元<br/><span className="text-[10px] text-gray-400 font-normal">(若無圖說需現場測繪)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-gray-400 italic text-right">※ 實際費用依台中市土木技師公會公告與最終規模為準</p>
            </div>
          </div>
        );

      case 'apply':
        return (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn pb-12">
            <div className="bg-white/80 p-6 rounded-3xl shadow-sm border border-pink-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ClipboardList size={20} className="text-pink-500" />
                挑選您的修繕清單
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-pink-600 text-sm mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-pink-400 rounded-full"></div>
                    室外修繕 (必選一項)
                  </h3>
                  <div className="space-y-3">
                    {outdoorOptions.map(opt => (
                      <label key={opt.id} className="flex items-center p-3 rounded-2xl bg-white border border-gray-100 shadow-sm active:scale-95 transition-transform cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 accent-pink-400 rounded-lg"
                          checked={formData.outdoor.includes(opt.id)}
                          onChange={() => handleCheckbox('outdoor', opt.id)}
                        />
                        <div className="ml-3 text-left">
                          <div className="text-sm font-semibold text-gray-700">{opt.label}</div>
                          <div className="text-[10px] text-pink-400">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-pink-600 text-sm mb-3 flex items-center gap-2 flex-wrap">
                    <div className="w-1.5 h-4 bg-pink-400 rounded-full"></div>
                    室內修繕 (可加選)
                    <span className="text-[10px] font-normal text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">最高補助 20 萬/戶</span>
                  </h3>
                  <div className="space-y-3">
                    {indoorOptions.map(opt => (
                      <label key={opt.id} className="flex items-center p-3 rounded-2xl bg-white border border-gray-100 shadow-sm active:scale-95 transition-transform cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 accent-pink-400 rounded-lg"
                          checked={formData.indoor.includes(opt.id)}
                          onChange={() => handleCheckbox('indoor', opt.id)}
                        />
                        <div className="ml-3 text-left">
                          <div className="text-sm font-semibold text-gray-700">{opt.label}</div>
                          <div className="text-[10px] text-pink-400">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-6 h-6 accent-rose-500 rounded-lg"
                      checked={formData.extra}
                      onChange={(e) => setFormData({...formData, extra: e.target.checked})}
                    />
                    <div className="ml-3 text-left">
                      <div className="text-sm font-bold text-rose-600">✨ 加碼補助申請</div>
                      <div className="text-xs text-rose-400 leading-tight font-semibold">符合長照需求 2 級以上或高齡弱勢，可額外補助 10 萬，一共 30 萬</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white/80 p-6 rounded-3xl shadow-sm border border-pink-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Phone size={20} className="text-pink-500" />
                屋主聯絡資訊
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 ml-2 mb-1 text-left">您的姓名</label>
                  <input 
                    required
                    type="text" 
                    placeholder="例如：王小明" 
                    className="w-full p-4 rounded-2xl bg-pink-50/30 border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all placeholder:text-gray-300"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 ml-2 mb-1 text-left">電話號碼</label>
                    <input 
                      required
                      type="tel" 
                      placeholder="0912-345-678" 
                      className="w-full p-4 rounded-2xl bg-pink-50/30 border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all placeholder:text-gray-300 text-sm"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 ml-2 mb-1 text-left">LINE ID</label>
                    <input 
                      type="text" 
                      placeholder="方便聯繫用" 
                      className="w-full p-4 rounded-2xl bg-pink-50/30 border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all placeholder:text-gray-300 text-sm"
                      value={formData.lineId}
                      onChange={(e) => setFormData({...formData, lineId: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 ml-2 mb-1 text-left">房屋地址</label>
                  <input 
                    required
                    type="text" 
                    placeholder="台中市..." 
                    className="w-full p-4 rounded-2xl bg-pink-50/30 border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all placeholder:text-gray-300"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>

              <button 
                disabled={isSending || !user}
                type="submit"
                className="w-full mt-8 py-4 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold rounded-2xl shadow-lg shadow-pink-200 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                {isSending ? '處理中...' : '送出預約申請'}
              </button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] font-sans text-gray-800 selection:bg-pink-200 overflow-x-hidden flex flex-col">
      <header className="relative py-8 px-6 text-center overflow-hidden shrink-0">
        <div className="absolute top-[-20px] left-[-20px] w-32 h-32 bg-pink-200 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-[-20px] w-24 h-24 bg-rose-200 rounded-full blur-2xl opacity-40"></div>
        
        <div className="relative inline-block mb-2">
          <Heart className="text-pink-400 fill-pink-400 absolute -top-4 -right-4 rotate-12" size={20} />
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">老屋延壽申請</h1>
        </div>
        <div className="text-pink-500 font-bold text-sm flex items-center justify-center gap-1">
          <ChevronRight size={14} className="text-pink-300" />
          郡翔室內裝修有限公司
          <ChevronRight size={14} className="text-pink-300" />
        </div>
      </header>

      <nav className="flex justify-center px-4 mb-6 shrink-0">
        <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-3xl border border-pink-100 flex gap-1 shadow-sm overflow-hidden w-full max-w-sm">
          {[
            { id: 'intro', label: '計畫', icon: <Info size={16} /> },
            { id: 'safety', label: '安全', icon: <Shield size={16} /> },
            { id: 'apply', label: '預約', icon: <ClipboardList size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === tab.id 
                ? 'bg-white text-pink-500 shadow-md ring-1 ring-pink-100' 
                : 'text-gray-400 hover:text-pink-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="px-6 pb-12 max-w-lg mx-auto overflow-x-hidden flex-grow w-full">
        {submitted ? (
          <div className="bg-white p-10 rounded-3xl shadow-xl text-center space-y-4 animate-bounceIn border border-pink-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-100 rounded-full text-pink-500 mb-2">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">資料已成功送出！</h2>
            <p className="text-gray-500 text-sm italic leading-relaxed">郡翔的專業團隊與 Google 表單皆已同步接收到您的需求，將盡快指派專員聯繫您！✨</p>
            <button 
              onClick={() => {setSubmitted(false); setActiveTab('intro')}}
              className="mt-4 px-8 py-3 bg-pink-50 text-pink-500 font-bold rounded-xl"
            >
              返回首頁
            </button>
          </div>
        ) : renderContent()}

        {/* 管理區域 */}
        <div className="mt-12 pt-8 border-t border-pink-100/50">
          <button 
            onClick={() => setShowAdmin(!showAdmin)}
            className="text-[10px] text-pink-300 flex items-center gap-1 mx-auto hover:text-pink-500 transition-colors"
          >
            <Database size={10} />
            {showAdmin ? '隱藏管理區域' : '管理員入口 (查看雲端名單)'}
          </button>
          
          {showAdmin && (
            <div className="mt-4 space-y-4 animate-fadeIn">
              <h3 className="text-xs font-bold text-pink-500 mb-2 text-left">已收到的申請名單 ({records.length})</h3>
              {records.length === 0 ? (
                <p className="text-[10px] text-gray-300 text-center">目前尚無資料</p>
              ) : (
                records.map(record => (
                  <div key={record.id} className="bg-white/40 p-3 rounded-xl border border-pink-50 text-[10px] space-y-1 text-left">
                    <div className="flex justify-between font-bold text-gray-700">
                      <span>{record.name} - {record.phone}</span>
                      <span className="text-gray-300">{record.createdAt?.toDate()?.toLocaleString() || '處理中...'}</span>
                    </div>
                    <div className="text-gray-500 truncate flex items-center gap-1">
                      <MessageCircle size={10} className="text-green-400" /> LINE ID: {record.lineId || '未填寫'} | 地址: {record.address}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {(record.outdoor || []).map(o => <span key={o} className="bg-blue-50 text-blue-400 px-1 rounded">室外</span>)}
                      {(record.indoor || []).map(i => <span key={i} className="bg-green-50 text-green-400 px-1 rounded">室內</span>)}
                      {record.extra && <span className="bg-rose-50 text-rose-400 px-1 rounded font-bold">加碼補助</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="py-8 px-6 text-center border-t border-pink-100 mt-auto bg-white/50 shrink-0">
        <div className="flex justify-center gap-4 mb-4">
          <div className="p-2 bg-pink-50 rounded-xl"><MapPin size={18} className="text-pink-400" /></div>
          <div className="p-2 bg-pink-50 rounded-xl"><Phone size={18} className="text-pink-400" /></div>
        </div>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-sans">
          © 2024 Jun Xiang Interior Decoration. All Rights Reserved.
        </p>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.9); opacity: 0; }
          70% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-bounceIn { animation: bounceIn 0.5s ease-out forwards; }
        input[type="checkbox"] {
          appearance: none;
          background-color: #fff;
          margin: 0;
          font: inherit;
          color: currentColor;
          width: 1.25em;
          height: 1.25em;
          border: 1.5px solid #FBCFE8;
          border-radius: 0.35em;
          transform: translateY(-0.075em);
          display: grid;
          place-content: center;
        }
        input[type="checkbox"]::before {
          content: "";
          width: 0.65em;
          height: 0.65em;
          transform: scale(0);
          transition: 120ms transform ease-in-out;
          box-shadow: inset 1em 1em #F472B6;
          background-color: CanvasText;
          clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
        }
        input[type="checkbox"]:checked::before {
          transform: scale(1);
        }
      `}} />
    </div>
  );
};

export default App;
