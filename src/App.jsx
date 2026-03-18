import React, { useState, useEffect } from 'react';
import { Heart, Home, Shield, CheckCircle, Send, Phone, MapPin, ClipboardList, Info, ChevronRight, Star, Loader2, Gift, AlertCircle, MessageCircle, Mail, Hash, ExternalLink, FileText } from 'lucide-react';

// --- Firebase 初始化模擬 (確保預覽不報錯) ---
const App = () => {
  const [activeTab, setActiveTab] = useState('intro');
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
    { id: '管線更新', label: '管線修繕更新 (水電管線)', desc: '確保老屋用電安全，水管更新，不怕漏水' }
  ];

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
      console.error(e);
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
    const success = await sendToGoogleForm(formData);
    if (success) {
      setSubmitted(true);
      setFormData({ name: '', phone: '', lineId: '', address: '', outdoor: [], indoor: [], extra: false });
    }
    setIsSending(false);
  };

  return (
    <div className="min-h-screen bg-[#FFF8FA] font-sans text-gray-800 overflow-x-hidden flex flex-col text-left">
      {/* 頂部裝飾條 */}
      <div className="h-2 bg-gradient-to-r from-pink-300 via-rose-300 to-pink-300"></div>
      
      {/* 標題區 */}
      <header className="py-12 px-6 text-center shrink-0 relative">
        <div className="absolute top-6 left-6 opacity-10"><Home size={80} /></div>
        <div className="relative inline-block mb-4">
          <Heart className="text-rose-400 fill-rose-400 absolute -top-5 -right-6 rotate-12" size={28} />
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">老屋延壽申請</h1>
        </div>
        <div className="text-pink-500 font-bold text-base tracking-[0.2em] flex items-center justify-center gap-2">
          <ChevronRight size={18} className="text-pink-300" />
          郡翔室內裝修有限公司
          <ChevronRight size={18} className="text-pink-300" />
        </div>
      </header>

      {/* 導覽分頁按鈕 */}
      <nav className="flex justify-center px-4 mb-10 shrink-0">
        <div className="bg-white/70 backdrop-blur-md p-2 rounded-[2.5rem] border border-pink-100 flex gap-1 shadow-md w-full max-w-lg">
          {[
            { id: 'intro', label: '補助計畫', icon: <Info size={18} /> },
            { id: 'safety', label: '安全評估', icon: <Shield size={18} /> },
            { id: 'apply', label: '預約申請', icon: <ClipboardList size={18} /> }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id)} 
              className={`flex-1 py-4 rounded-[2rem] text-base font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                activeTab === t.id 
                ? 'bg-white text-rose-500 shadow-lg ring-1 ring-pink-50' 
                : 'text-gray-400 hover:text-pink-300'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* 內容區 */}
      <main className="px-6 pb-24 max-w-xl mx-auto flex-grow w-full">
        {submitted ? (
          <div className="bg-white p-14 rounded-[3rem] shadow-xl border border-pink-100 text-center animate-bounceIn">
            <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="text-rose-400" size={50} />
            </div>
            <h2 className="text-3xl font-black text-gray-800">申請已送出！</h2>
            <p className="text-gray-600 text-lg mt-4 leading-relaxed font-medium text-center">
              資料已同步傳送至您的 Google 表單，<br/>郡翔專業團隊將儘速聯繫您。✨
            </p>
            <button 
              onClick={() => {setSubmitted(false); setActiveTab('intro')}} 
              className="mt-10 px-12 py-4 bg-rose-50 text-rose-500 font-bold text-lg rounded-2xl active:scale-95 transition-all shadow-sm"
            >
              返回首頁
            </button>
          </div>
        ) : (
          <div className="animate-fadeIn space-y-8">
            {/* 分頁一：計畫介紹 */}
            {activeTab === 'intro' && (
              <div className="space-y-8">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-pink-100 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-pink-50 rounded-full -mr-20 -mt-20 opacity-50"></div>
                  <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3 relative">
                    <Star className="text-rose-400 fill-rose-400" size={24} />
                    政府補助概要
                  </h2>
                  <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-[2rem] mb-8 border border-pink-100 shadow-inner">
                    <p className="text-rose-600 font-bold flex items-center gap-2 text-base mb-3 text-left">
                      <Gift size={22} /> 這是您的起家厝大變身的機會
                    </p>
                    <div className="text-gray-700 font-bold text-lg leading-relaxed text-left">
                      工程報價單高達 <span className="text-4xl font-black text-rose-500 underline decoration-pink-300 decoration-4 underline-offset-4">65%</span> 的補助金支援！
                    </div>
                    <div className="text-sm text-rose-400 font-bold mt-3 text-left">
                      ※ 補助資格與撥付金額需經政府相關單位最終審核為準
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-base font-bold text-gray-400 uppercase tracking-widest border-b border-pink-50 pb-3">申請門檻</h3>
                    <ul className="space-y-4 text-left">
                      <li className="flex items-start gap-4 text-base text-gray-700 leading-relaxed">
                        <CheckCircle className="text-rose-400 shrink-0 mt-1" size={20} />
                        <span>屋齡需滿 <span className="font-bold text-rose-500">30 年以上</span> 之合法建築物。</span>
                      </li>
                      <li className="flex items-start gap-4 text-base text-gray-700 leading-relaxed">
                        <CheckCircle className="text-rose-400 shrink-0 mt-1" size={20} />
                        <span>需為 <span className="font-bold text-gray-900">全棟住宅使用</span> (排除營業性質場所)。</span>
                      </li>
                      <li className="flex items-start gap-4 text-base text-rose-400 font-bold leading-relaxed">
                        <AlertCircle className="shrink-0 mt-1" size={20} />
                        <span>特別注意：違章建築部分不予補助。</span>
                      </li>
                    </ul>
                  </div>

                  {/* 外部連結按鈕區域 */}
                  <div className="mt-10 pt-8 border-t border-pink-50 space-y-4">
                    {/* 內政部國土署官網 */}
                    <a 
                      href="https://twur.nlma.gov.tw/zh/theme/main/65" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-5 bg-white border-2 border-pink-100 rounded-2xl text-pink-500 font-bold hover:bg-pink-50 transition-all group shadow-sm active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-pink-50 rounded-lg text-pink-400 group-hover:bg-pink-400 group-hover:text-white transition-colors">
                          <ExternalLink size={20} />
                        </div>
                        <span className="text-base">內政部國土署：補助專案說明</span>
                      </div>
                      <ChevronRight size={20} className="text-pink-200 group-hover:translate-x-1 transition-transform" />
                    </a>

                    {/* 計畫摺頁下載 */}
                    <a 
                      href="https://twur.nlma.gov.tw/resources/website/theme_file/344/%E6%91%BA%E9%A0%81.pdf" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-5 bg-white border-2 border-pink-100 rounded-2xl text-rose-500 font-bold hover:bg-rose-50 transition-all group shadow-sm active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-rose-50 rounded-lg text-rose-400 group-hover:bg-rose-400 group-hover:text-white transition-colors">
                          <FileText size={20} />
                        </div>
                        <span className="text-base">下載補助計畫摺頁 (PDF)</span>
                      </div>
                      <ChevronRight size={20} className="text-pink-200 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* 分頁二：安全評估 */}
            {activeTab === 'safety' && (
              <div className="space-y-8 text-left">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-pink-100">
                  <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                    <Shield className="text-rose-400" size={26} />
                    結構安全性能評估
                  </h2>
                  
                  <div className="p-5 bg-amber-50 rounded-[1.5rem] mb-8 border border-amber-100 flex gap-4 shadow-inner">
                    <AlertCircle className="text-amber-500 shrink-0 mt-1" size={22} />
                    <p className="text-sm font-bold text-amber-700 leading-relaxed text-left">
                      重要備註：安全性評估之最終結果<span className="text-rose-500 underline mx-1 decoration-2 font-black">不影響補助申請</span>，請屋主安心進行評估程序。
                    </p>
                  </div>

                  <div className="mb-8 p-6 bg-gradient-to-r from-rose-500 to-pink-400 rounded-3xl text-white shadow-lg flex items-center justify-between overflow-hidden relative group">
                    <div className="relative z-10 text-left">
                      <div className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Safety Subsidy</div>
                      <div className="text-2xl font-black">此項目補助 <span className="text-3xl underline decoration-pink-200">15,000</span> 元</div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-2xl relative z-10">
                      <Gift size={32} className="animate-bounce" />
                    </div>
                  </div>

                  <p className="text-base text-gray-600 mb-8 font-bold flex items-center gap-3 text-left">
                    <Star size={20} className="text-pink-300 fill-current" />
                    合作單位：台中市土木技師公會
                  </p>

                  <div className="overflow-hidden rounded-[2rem] border border-pink-50 shadow-md">
                    <table className="w-full text-base">
                      <thead className="bg-pink-100/50">
                        <tr className="text-sm font-bold text-gray-500 text-left">
                          <td className="p-5">收費項目</td>
                          <td className="p-5 text-right">收費標準</td>
                        </tr>
                      </thead>
                      <tbody className="bg-white text-left">
                        <tr className="border-b border-pink-50">
                          <td className="p-5 font-bold text-gray-700">掛號費</td>
                          <td className="p-5 text-right font-black text-gray-800 text-lg">2,000 元/案</td>
                        </tr>
                        <tr className="border-b border-pink-50">
                          <td className="p-5 font-bold text-gray-700">初步評估費</td>
                          <td className="p-5 text-right font-black text-rose-500 text-lg">15,000 元/棟起</td>
                        </tr>
                        <tr className="border-b border-pink-50 bg-rose-50/30">
                          <td className="p-5 font-bold text-rose-600 italic">最低收費</td>
                          <td className="p-5 text-right font-black text-rose-500 text-lg">20,000 元/案</td>
                        </tr>
                        <tr>
                          <td className="p-5 font-bold text-gray-700 text-left">
                            現場量測費
                            <div className="text-xs text-gray-400 font-normal mt-2 leading-relaxed">※ 若原始無圖說需現場測繪</div>
                          </td>
                          <td className="p-5 text-right font-black text-gray-800 text-lg">5,000 元</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-6 text-right font-medium">※ 以上費用依台中市土木技師公會最終報價為準</p>
                </div>
              </div>
            )}

            {/* 分頁三：預約申請 */}
            {activeTab === 'apply' && (
              <form onSubmit={handleSubmit} className="space-y-8 text-left pb-12">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-pink-100">
                  <h2 className="text-2xl font-black text-gray-800 mb-8 flex items-center gap-3">
                    <ClipboardList className="text-rose-400" size={26} />
                    填寫預約資料
                  </h2>
                  
                  <div className="space-y-8">
                    {/* 室外修繕 */}
                    <div>
                      <h3 className="text-sm font-black text-pink-500 mb-4 ml-2 flex items-center gap-3 text-left">
                        <div className="w-2 h-4 bg-pink-300 rounded-full"></div>
                        室外修繕 (必選一項)
                      </h3>
                      <div className="space-y-3">
                        {outdoorOptions.map(opt => (
                          <label key={opt.id} className="flex items-center p-5 rounded-[1.5rem] bg-pink-50/30 border border-pink-100 cursor-pointer active:scale-[0.98] transition-all text-left">
                            <input 
                              type="checkbox" 
                              className="w-6 h-6 accent-rose-400 rounded-lg border-pink-200"
                              checked={formData.outdoor.includes(opt.id)}
                              onChange={() => handleCheckbox('outdoor', opt.id)}
                            />
                            <div className="ml-4">
                              <div className="text-base font-bold text-gray-700">{opt.label}</div>
                              <div className="text-xs text-rose-400 mt-1">{opt.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 室內修繕 */}
                    <div>
                      <h3 className="text-sm font-black text-pink-500 mb-2 ml-2 flex items-center gap-3 text-left">
                        <div className="w-2 h-4 bg-pink-300 rounded-full"></div>
                        室內修繕 (可加選)
                      </h3>
                      <div className="text-xs font-bold text-rose-400 mb-4 ml-8 text-left">
                        ※ 室內修繕項目補助 20 萬元
                      </div>
                      <div className="space-y-3 text-left">
                        {indoorOptions.map(opt => (
                          <label key={opt.id} className="flex items-center p-5 rounded-[1.5rem] bg-pink-50/30 border border-pink-100 cursor-pointer active:scale-[0.98] transition-all">
                            <input 
                              type="checkbox" 
                              className="w-6 h-6 accent-rose-400 rounded-lg"
                              checked={formData.indoor.includes(opt.id)}
                              onChange={() => handleCheckbox('indoor', opt.id)}
                            />
                            <div className="ml-4">
                              <div className="text-base font-bold text-gray-700">{opt.label}</div>
                              <div className="text-xs text-rose-400 mt-1">{opt.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 加碼補助 */}
                    <div>
                      <h3 className="text-sm font-black text-rose-500 mb-4 ml-2 flex items-center gap-3 text-left">
                        <div className="w-2 h-4 bg-rose-300 rounded-full"></div>
                        特殊補助對象 (可加選)
                      </h3>
                      <label className="flex items-center gap-5 p-6 bg-rose-50 rounded-[2rem] cursor-pointer border border-rose-100 active:bg-rose-100 transition-colors shadow-sm group text-left">
                        <input 
                          type="checkbox" 
                          className="w-7 h-7 accent-rose-500 rounded-lg"
                          checked={formData.extra}
                          onChange={(e) => setFormData({...formData, extra: e.target.checked})}
                        />
                        <div className="flex flex-col">
                          <span className="text-base font-black text-rose-600 flex items-center gap-2">
                            符合長照或高齡弱勢 <Star size={14} className="group-hover:rotate-45 transition-transform" />
                          </span>
                          <span className="text-xs text-rose-400 font-bold mt-1 leading-relaxed">符合條件者可額外補助 10 萬，最高補助 30 萬</span>
                        </div>
                      </label>
                    </div>

                    {/* 基本資料 */}
                    <div className="space-y-5 pt-8 border-t border-pink-50 text-left">
                      <h3 className="text-sm font-black text-gray-400 ml-2 text-left uppercase tracking-widest">屋主聯繫資訊</h3>
                      <input 
                        required 
                        type="text" 
                        placeholder="屋主姓名" 
                        className="w-full p-5 rounded-2xl bg-gray-50 border-0 outline-none text-base shadow-inner placeholder:text-gray-300"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          required 
                          type="tel" 
                          placeholder="電話號碼" 
                          className="p-5 rounded-2xl bg-gray-50 border-0 outline-none text-base shadow-inner placeholder:text-gray-300"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                        <input 
                          type="text" 
                          placeholder="LINE ID" 
                          className="p-5 rounded-2xl bg-gray-50 border-0 outline-none text-base shadow-inner placeholder:text-gray-300"
                          value={formData.lineId}
                          onChange={(e) => setFormData({...formData, lineId: e.target.value})}
                        />
                      </div>
                      <input 
                        required 
                        type="text" 
                        placeholder="房屋地址" 
                        className="w-full p-5 rounded-2xl bg-gray-50 border-0 outline-none text-base shadow-inner placeholder:text-gray-300"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>

                    <button 
                      disabled={isSending} 
                      type="submit" 
                      className="w-full py-6 bg-gradient-to-r from-rose-400 to-pink-400 text-white font-black text-xl rounded-[2rem] shadow-lg flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSending ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
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
      <footer className="py-12 px-6 border-t border-pink-100 bg-white/60 mt-auto shadow-inner">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-black text-gray-800 tracking-wider mb-1">郡翔室內裝修有限公司</h3>
            <p className="text-pink-400 font-bold text-[10px] tracking-[0.2em] uppercase">Jun Xiang Interior Decoration</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/40 p-6 rounded-[1.5rem] border border-pink-50">
            <a href="tel:0960396086" className="flex items-center gap-3 group transition-all text-left">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all shrink-0">
                <Phone size={18} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">聯絡電話</span>
                <span className="text-base font-black text-gray-700 group-hover:text-rose-500">0960-396-086</span>
              </div>
            </a>

            <a href="mailto:heheooo@hotmail.com" className="flex items-center gap-3 group transition-all text-left">
              <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all shrink-0">
                <Mail size={18} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">EMAIL</span>
                <span className="text-sm font-black text-gray-700 truncate group-hover:text-pink-500">heheooo@hotmail.com</span>
              </div>
            </a>

            <div className="flex items-center gap-3 group text-left">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-gray-500 group-hover:text-white transition-all shrink-0">
                <Hash size={18} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">統一編號</span>
                <span className="text-base font-black text-gray-700 tracking-widest">54756209</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-[10px] text-gray-300 font-medium tracking-widest leading-relaxed">
              專業室內設計與裝修諮詢 ． 老屋活化專家<br/>
              © 2024 郡翔室內裝修有限公司 ． 版權所有
            </p>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounceIn { 0% { transform: scale(0.9); opacity: 0; } 70% { transform: scale(1.02); opacity: 1; } 100% { transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-bounceIn { animation: bounceIn 0.7s cubic-bezier(0.2, 0.8, 0.2, 1.2) forwards; }
        ::-webkit-scrollbar { width: 0px; background: transparent; }
        input { font-size: 16px !important; }
      ` }} />
    </div>
  );
};

export default App;
