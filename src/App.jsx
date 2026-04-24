import React, { useState, useEffect } from 'react'
import { Flower, Calendar, Users, FileText, LayoutDashboard, Plus, MapPin, Trash2, Printer, CheckCircle2, PlusCircle, XCircle, FileSpreadsheet, RotateCcw } from 'lucide-react'
import { supabase } from './lib/supabase'
import { QRCodeSVG } from 'qrcode.react'

// ==========================================
// 🎨 1. ส่วนประกอบหน้าตา (UI Components) - ต้องประกาศไว้บนสุด
// ==========================================

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} className={`flex items-center space-x-4 px-6 py-4 cursor-pointer rounded-2xl mb-1 transition-all duration-300 ${active ? 'bg-pink-600 text-white shadow-lg shadow-pink-200' : 'text-gray-400 hover:bg-gray-50'}`}>
      <div className={active ? 'text-white' : 'text-pink-200'}>{icon}</div>
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = { pending: 'bg-yellow-50 text-yellow-600 border-yellow-100', processing: 'bg-blue-50 text-blue-600 border-blue-100', completed: 'bg-green-50 text-green-600 border-green-100', cancelled: 'bg-red-50 text-red-600 border-red-100' }
  const l = { pending: 'รอจัดงาน', processing: 'กำลังทำ', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก' }
  return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${s[status] || s.pending}`}>{l[status] || l.pending}</span>
}

function StatCard({ t, v, c }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 border-l-[10px] border-l-pink-500">
      <h4 className="text-gray-400 text-[10px] font-black uppercase mb-2 tracking-widest">{t}</h4>
      <p className={`text-4xl font-black ${c} tracking-tighter`}>{v}</p>
    </div>
  )
}

// ==========================================
// 🛰️ 2. ส่วนหน้าลูกค้า (Tracking View)
// ==========================================

function TrackView({ id }) {
  const [o, setO] = useState(null);
  useEffect(() => {
    async function fetchOrder() {
      const { data } = await supabase.from('orders').select('*, customers (*), order_items (*)').eq('id', id).single();
      setO(data);
    }
    fetchOrder();
    const sub = supabase.channel('tr-'+id).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, p => setO(v => ({...v, ...p.new}))).subscribe();
    return () => supabase.removeChannel(sub);
  }, [id]);

  if (!o) return <div className="h-screen flex items-center justify-center bg-white font-black uppercase text-gray-400 animate-pulse"><Flower className="mr-4 animate-spin text-pink-500"/> Checking...</div>;

  return (
    <div className="min-h-screen bg-pink-50/20 flex flex-col items-center py-10 px-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-2xl overflow-hidden">
        <div className="bg-pink-600 p-12 text-white text-center">
          <Flower size={80} className="mx-auto mb-6" />
          <h1 className="text-3xl font-black uppercase tracking-tighter">Tracking</h1>
          <p className="text-[10px] font-bold uppercase text-pink-200 mt-3 font-black">Fortune Florist Official</p>
        </div>
        <div className="p-10 space-y-10">
          <div className="text-center"><p className="text-[10px] font-black text-gray-300 uppercase mb-2 tracking-widest">เรียน คุณลูกค้า</p><h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase leading-none">{o.customers?.name}</h2></div>
          <div className="bg-gray-50/80 p-10 rounded-[3rem] border border-gray-100 flex flex-col items-center shadow-inner text-center">
             <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-8">สถานะการจัดทำ</p>
             <div className={`p-8 rounded-full shadow-2xl ${o.status === 'completed' ? 'bg-green-500 text-white' : o.status === 'processing' ? 'bg-blue-500 text-white animate-pulse' : 'bg-yellow-500 text-white'}`}>{o.status === 'completed' ? <CheckCircle2 size={64}/> : <Calendar size={64}/>}</div>
             <h3 className="text-3xl font-black mt-8 text-gray-800 tracking-tighter leading-none">{o.status === 'completed' ? 'จัดส่งเรียบร้อย' : o.status === 'processing' ? 'กำลังดำเนินการ' : 'กำลังเตรียมงาน'}</h3>
          </div>
          <div className="space-y-6 border-t pt-8">
             <div className="flex items-start space-x-4"><div className="bg-pink-100 p-3 rounded-2xl text-pink-600"><MapPin size={20}/></div><div><p className="text-[10px] font-black text-gray-400 uppercase">สถานที่นัดหมาย</p><p className="font-bold text-gray-700">{o.location || 'จัดตกแต่งหน้างาน'}</p></div></div>
             <div className="flex items-start space-x-4"><div className="bg-blue-100 p-3 rounded-2xl text-blue-600"><Calendar size={20}/></div><div><p className="text-[10px] font-black text-gray-400 uppercase">วันที่จัดงาน</p><p className="font-black text-gray-800 text-xl tracking-tighter uppercase">{new Date(o.event_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 📄 3. หน้าพิมพ์เอกสาร (Print View)
// ==========================================

function PrintView({ doc, onBack }) {
  const o = doc.order; const net = Number(o.total_price) - Number(o.discount_amount || 0); const bal = net - Number(o.deposit_amount);
  const url = `https://fortune-florist-system.vercel.app?track=${o.id}`;

  return (
    <div className="min-h-screen bg-gray-500 flex flex-col items-center py-10 print:bg-white print:py-0 overflow-auto font-sans">
      <div className="bg-white p-4 w-full max-w-[210mm] mb-4 flex justify-between items-center rounded-2xl print:hidden shadow-2xl">
        <button onClick={onBack} className="bg-gray-100 px-8 py-3 rounded-2xl font-black text-gray-500 text-xs">← กลับโปรแกรม</button>
        <button onClick={() => window.print()} className="bg-gray-900 text-white px-10 py-3 rounded-2xl font-black flex items-center shadow-xl active:scale-95 text-xs"><Printer size={18} className="mr-2"/> พิมพ์เอกสาร / PDF</button>
      </div>

      <div className="bg-white w-[210mm] min-h-[297mm] p-[10mm] print:m-0 border-[10px] border-pink-50 shadow-2xl print:shadow-none">
        <div className="border-[1px] border-gray-200 p-8 h-full relative flex flex-col">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.015] pointer-events-none tracking-tighter"><Flower size={400} /></div>
          <div className="flex justify-between items-start border-b-2 border-pink-500 pb-6 mb-6 relative z-10">
            <div><div className="flex items-center space-x-2 text-pink-600 mb-1"><Flower size={36} strokeWidth={2.5} /><div><h1 className="text-2xl font-black tracking-tighter leading-none uppercase">Fortune Florist</h1></div></div><p className="text-xs font-black uppercase text-gray-700 leading-none">แอนด์ ญ.ภัทรเว็ดดิ้ง</p><p className="text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Premium Floral & Wedding Decoration</p></div>
            <div className="text-right min-w-[250px]">
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest mb-1 leading-none">{doc.type==='bill'?'ใบวางบิล/ใบแจ้งหนี้':doc.type==='receipt'?'ใบเสร็จรับเงิน':'ใบเสนอราคา / เสนองาน'}</h2>
              <p className="text-pink-500 font-black uppercase text-[9px] mb-4 uppercase">{doc.type.toUpperCase()} DOCUMENT</p>
              <div className="space-y-1 text-[9px] font-bold uppercase tracking-widest text-gray-600"><p>No. <span className="text-gray-800 font-black">FF-{o.id.substring(0,8).toUpperCase()}</span></p><p>Date <span className="text-gray-800 font-black">{new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-8 relative z-10 font-bold uppercase">
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col justify-center shadow-inner text-gray-800"><p className="text-[7px] font-black text-pink-500 uppercase tracking-widest mb-2 leading-none">BILL TO / ลูกค้า</p><h3 className="text-lg font-black leading-none">{o.customers?.name}</h3><p className="text-xs mt-2 font-bold">โทร: {o.customers?.phone || '-'}</p></div>
            <div className="p-6 border border-gray-100 rounded-3xl flex flex-col justify-center shadow-sm text-gray-700"><p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-2 leading-none">EVENT INFO / ข้อมูลงาน</p><p className="text-xs leading-none text-pink-600 font-black uppercase">📍 {o.location || 'จัดที่ร้านฟอร์จูนฟลอริส'}</p><p className="text-[10px] font-black flex items-center border-t pt-2 border-gray-100 mt-2"><Calendar size={12} className="mr-2" />{new Date(o.event_date).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
          </div>
          <div className="flex-1 relative z-10 overflow-hidden">
            <table className="w-full border-collapse"><thead><tr className="bg-gray-900 text-white text-[8px] font-black uppercase tracking-widest"><th className="px-6 py-3 text-left rounded-l-xl">รายละเอียด (DESCRIPTION)</th><th className="px-6 py-3 text-right rounded-r-xl">จำนวนเงิน (AMOUNT)</th></tr></thead><tbody className="divide-y divide-gray-100 font-bold text-gray-700">
              {o.order_items?.map((it, i) => (<tr key={i}><td className="px-6 py-5 uppercase"><span className="text-base font-black leading-none">{it.item_name}</span><p className="text-[8px] text-gray-400 mt-1 italic font-bold">Floral & Decoration Service</p></td><td className="px-6 py-5 text-right"><span className="text-lg font-black text-gray-800 tabular-nums font-black">฿{Number(it.item_price).toLocaleString()}</span></td></tr>))}
              <tr><td className="px-6 py-10"></td><td></td></tr>
            </tbody></table>
          </div>
          <div className="flex justify-between items-end mt-6 pt-4 border-t-2 border-dashed border-gray-100">
            <div className="p-3 border-2 border-pink-50 rounded-2xl text-center bg-white flex flex-col items-center shadow-sm"><QRCodeSVG value={url} size={75} level="H" /><p className="text-[6px] font-black text-pink-500 uppercase mt-2 tracking-widest">SCAN TO TRACK STATUS</p></div>
            <div className="w-[48%] space-y-2.5 font-bold uppercase tracking-tighter text-gray-700">
              <div className="flex justify-between text-[11px] text-gray-400 px-2 font-black"><span>รวมเงิน (SUB TOTAL)</span><span className="font-black">฿{Number(o.total_price).toLocaleString()}</span></div>
              {Number(o.discount_amount)>0 && (<div className="flex justify-between text-[11px] text-red-500 px-2 uppercase font-black"><span>ส่วนลด (DISCOUNT)</span><span className="font-black">- ฿{Number(o.discount_amount).toLocaleString()}</span></div>)}
              <div className="flex justify-between text-base font-black text-gray-900 pt-3 border-t border-gray-100 px-2 uppercase font-black"><span>ยอดสุทธิ (NET TOTAL)</span><span className="text-xl">฿{net.toLocaleString()}</span></div>
              {doc.type !== 'quotation' && <div className="flex justify-between text-[11px] text-blue-500 px-2 uppercase font-black"><span>หักเงินมัดจำ (DEPOSIT)</span><span className="font-black">- ฿{Number(o.deposit_amount).toLocaleString()}</span></div>}
              <div className="bg-gray-900 p-5 rounded-3xl text-white flex justify-between items-center shadow-lg border-l-[8px] border-pink-500 mt-2 leading-none"><div className="flex flex-col"><span className="text-[7px] uppercase tracking-[0.3em] font-black text-pink-400 mb-1 leading-none font-black uppercase">{doc.type==='bill'?'ยอดค้างชำระ':doc.type==='receipt'?'ยอดเงินคงเหลือ':'ยอดเสนอสุทธิ'}</span><span className="text-[9px] font-bold text-gray-400 uppercase leading-none">TOTAL AMOUNT</span></div><div className="text-right leading-none"><span className="text-4xl font-black tracking-tighter text-white tabular-nums font-black">฿{bal.toLocaleString()}</span></div></div>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-16 text-center font-bold uppercase text-gray-700">
            <div className="flex flex-col items-center"><div className="w-24 h-[1px] bg-gray-200 mb-4 font-black"></div><p className="text-[8px] text-gray-400 uppercase mb-2 font-black">Authorized Signature</p><p className="font-black text-xs border-b-2 border-pink-100 px-2 tracking-tighter leading-none uppercase font-black">FORTUNE FLORIST</p></div>
            <div className="flex flex-col items-center"><div className="w-24 h-[1px] bg-gray-200 mb-4 font-black"></div><p className="text-[8px] text-gray-400 uppercase mb-2 font-black">Customer Signature</p><p className="text-gray-300 italic text-[10px] leading-none mt-1">ลงชื่อ.........................................</p></div>
          </div>
          <div className="mt-10 text-center border-t border-gray-50 pt-4 leading-none"><p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.8em]">THANK YOU FOR YOUR BUSINESS</p></div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 🏢 4. แอปพลิเคชันหลัก (Admin Application)
// ==========================================

function DashboardView({ stats, orders }) {
  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard t="งานส่งวันนี้" v={stats.today} c="text-blue-600" />
        <StatCard t="งานเว็ดดิ้ง" v={stats.wedding} c="text-pink-600" />
        <StatCard t="ยอดค้างรวม" v={`฿${stats.pending.toLocaleString()}`} c="text-orange-600" />
      </div>
      <div className="bg-white rounded-[2.5rem] border p-8 shadow-sm">
        <h3 className="font-black text-gray-800 mb-6 flex items-center text-xl uppercase tracking-tighter"><Calendar className="mr-2 text-pink-500" size={20}/> คิวงานเร่งด่วน</h3>
        {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').slice(0, 5).map(o => (
          <div key={o.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl mb-2 border border-gray-100 transition-transform hover:scale-[1.01]"><div><p className="font-black text-gray-800 uppercase leading-none font-black">{o.customers?.name}</p><p className="text-[10px] text-gray-400 font-bold mt-1 uppercase font-black">{o.event_date}</p></div><StatusBadge status={o.status} /></div>
        ))}
      </div>
    </div>
  )
}

function WorkflowView({ orders, onRefresh, onPrint }) {
  const [showForm, setShowForm] = useState(false); const [showCost, setShowCost] = useState(null); const [costs, setCosts] = useState([]);
  const [items, setItems] = useState([{ name: 'งานดอกไม้สด', price: '' }]); const [f, setF] = useState({ name: '', phone: '', event_date: '', location: '', dep: '' });

  async function fetchCosts(id) { const { data } = await supabase.from('order_costs').select('*').eq('order_id', id); setCosts(data || []) };
  useEffect(() => { if (showCost) fetchCosts(showCost.id) }, [showCost]);

  async function addOrder(e) {
    e.preventDefault(); const { data: cu } = await supabase.from('customers').insert([{ name: f.name, phone: f.phone }]).select().single();
    const total = items.reduce((a, c) => a + Number(c.price || 0), 0);
    const { data: ord } = await supabase.from('orders').insert([{ customer_id: cu.id, event_date: f.event_date, location: f.location, total_price: total, deposit_amount: Number(f.dep || 0), status: 'pending' }]).select().single();
    await supabase.from('order_items').insert(items.map(it => ({ order_id: ord.id, item_name: it.name, item_price: Number(it.price || 0) })));
    setShowForm(false); setItems([{ name: 'งานดอกไม้สด', price: '' }]); onRefresh();
  }
  return (
    <div className="space-y-8 animate-in fade-in leading-none">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border shadow-sm"><div><h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Management</h3><p className="text-gray-400 text-xs mt-1 font-bold">คิวงานและใบเสนอราคา</p></div><button onClick={() => setShowForm(!showForm)} className="bg-pink-600 text-white px-10 py-4 rounded-[1.5rem] font-black shadow-xl hover:bg-pink-700 active:scale-95 transition-all uppercase text-xs tracking-widest leading-none">{showForm ? 'ยกเลิก' : '+ รับงานใหม่'}</button></div>
      {showForm && (
        <form onSubmit={addOrder} className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-4 border-pink-50 grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-top-4">
          <div className="space-y-6"><h4 className="font-black text-pink-600 uppercase text-xs border-b pb-2">ลูกค้า & รายละเอียด</h4><input type="text" required placeholder="ชื่อลูกค้า" className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold shadow-inner" onChange={e => setF({...f, name: e.target.value})} /><input type="text" placeholder="เบอร์โทร" className="w-full p-5 bg-gray-100 rounded-2xl outline-none" onChange={e => setF({...f, phone: e.target.value})} /><input type="date" required className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-black" onChange={e => setF({...f, event_date: e.target.value})} /><textarea placeholder="สถานที่จัดงาน" className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold" onChange={e => setF({...f, location: e.target.value})} /></div>
          <div className="space-y-6"><h4 className="font-black text-pink-600 uppercase text-xs border-b pb-2 flex justify-between font-black font-bold">รายการงาน <button type="button" onClick={() => setItems([...items, { name: '', price: '' }])} className="text-blue-500 hover:scale-110"><PlusCircle size={20}/></button></h4>
            <div className="space-y-2 max-h-48 overflow-auto pr-2">{items.map((it, i) => (<div key={i} className="flex space-x-2 animate-in slide-in-from-right-4"><input type="text" required value={it.name} placeholder="ระบุงาน..." className="flex-1 p-4 bg-gray-50 rounded-xl outline-none text-sm font-bold border" onChange={e => { const ni = [...items]; ni[i].name = e.target.value; setItems(ni); }} /><input type="number" required value={it.price} placeholder="ราคา" className="w-28 p-4 bg-gray-50 rounded-xl outline-none font-black text-pink-600 border tabular-nums" onChange={e => { const ni = [...items]; ni[i].price = e.target.value; setItems(ni); }} /></div>))}</div>
            <div className="bg-gray-900 p-6 rounded-[2rem] text-white flex justify-between items-center mt-4 shadow-lg"><div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-black uppercase">ยอดรวมเสนอ</p><p className="text-3xl font-black text-pink-500 tracking-tighter leading-none mt-1">฿{items.reduce((a,c)=>a+Number(c.price||0),0).toLocaleString()}</p></div><div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-right leading-none mb-1 font-black uppercase">มัดจำ</p><input type="number" placeholder="0" className="w-24 bg-transparent text-right text-2xl font-black text-blue-400 outline-none tabular-nums" onChange={e => setF({...f, dep: e.target.value})} /></div></div>
            <button className="w-full bg-pink-600 text-white py-5 rounded-[2.5rem] font-black uppercase text-xl shadow-xl hover:bg-pink-700 transition-all uppercase">บันทึกข้อมูลงาน</button>
          </div>
        </form>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').map(o => {
          const net = Number(o.total_price) - Number(o.discount_amount || 0); const bal = net - Number(o.deposit_amount);
          return (
            <div key={o.id} className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 relative group hover:border-pink-300 transition-all font-bold">
              <button onClick={async () => { if(confirm('ต้องการลบงานนี้?')) { await supabase.from('orders').delete().eq('id', o.id); onRefresh(); } }} className="absolute top-8 right-8 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all leading-none font-black"><Trash2 size={20}/></button>
              <div className="mb-6 leading-none font-black uppercase"><p className="text-[10px] font-black text-pink-400 uppercase mb-2">{o.event_date}</p><h4 className="text-3xl font-black text-gray-800 tracking-tighter leading-none uppercase">{o.customers?.name}</h4><div className="flex items-center space-x-3 mt-6 leading-none"><StatusBadge status={o.status}/><span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[150px]">📍 {o.location || 'จัดที่ร้าน'}</span></div></div>
              <div className="space-y-1.5 mb-8 border-l-4 border-pink-100 pl-6 py-2 uppercase text-xs">{o.order_items?.map((it, idx) => (<div key={idx} className="flex justify-between text-gray-600 font-black"><span>• {it.item_name}</span><span className="text-gray-400 font-black tabular-nums font-black uppercase">฿{Number(it.item_price).toLocaleString()}</span></div>))}</div>
              <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-50 p-6 rounded-[2.5rem] shadow-inner font-black uppercase"><div><p className="text-[10px] text-gray-400 font-black mb-1 leading-none font-black">ราคาเสนอ</p><p className="text-2xl font-black text-gray-800 tracking-tighter leading-none">฿{net.toLocaleString()}</p></div><div><p className="text-[10px] text-orange-400 font-black text-right mb-1 leading-none font-black">ค้างจ่าย</p><p className="text-2xl font-black text-orange-600 tracking-tighter text-right leading-none">฿{bal.toLocaleString()}</p></div></div>
              <div className="flex space-x-2">
                <button onClick={() => onPrint('quotation', o)} className="bg-white border-2 border-gray-100 text-gray-500 p-4 rounded-2xl hover:border-pink-300 hover:text-pink-600 shadow-sm transition-all" title="ใบเสนอราคา"><FileSpreadsheet size={20}/></button>
                <button onClick={() => setShowCost(o)} className="flex-1 bg-gray-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-black font-black uppercase">📦 สรุปกำไร</button>
                <button onClick={async () => { await supabase.from('orders').update({ status: 'processing' }).eq('id', o.id); onRefresh(); }} className="px-6 bg-blue-50 text-blue-600 border border-blue-100 py-4 rounded-2xl text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all font-black uppercase">เริ่ม</button>
                <button onClick={async () => { await supabase.from('orders').update({ status: 'completed' }).eq('id', o.id); onRefresh(); }} className="px-6 bg-green-50 text-green-600 border border-green-200 py-4 rounded-2xl text-[10px] font-black hover:bg-green-600 hover:text-white transition-all font-black uppercase">จบงาน</button>
              </div>
            </div>
          )
        })}
      </div>
      {showCost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in-95 text-center border-4 border-gray-100 uppercase">
            <div className="flex justify-between items-center mb-10 border-b pb-6 leading-none"><div><h4 className="text-2xl font-black tracking-tighter uppercase text-gray-800 font-black">จัดซื้อ & ต้นทุน</h4><p className="text-pink-500 font-bold text-xs uppercase mt-2 tracking-widest font-black uppercase">PROJ: {showCost.customers?.name}</p></div><button onClick={() => setShowCost(null)} className="text-gray-300 hover:text-red-500 text-3xl font-light">✕</button></div>
            <div className="flex space-x-2 mb-10"><input type="text" placeholder="ซื้ออะไร..." className="flex-1 p-5 bg-gray-100 rounded-3xl outline-none font-bold" id="iIn" /><input type="number" placeholder="ราคา" className="w-28 p-5 bg-gray-100 rounded-3xl outline-none font-black tabular-nums text-red-500 font-black" id="aIn" /><button onClick={async () => { const i=document.getElementById('iIn'), a=document.getElementById('aIn'); if(!i.value || !a.value) return; await supabase.from('order_costs').insert([{ order_id: showCost.id, item_description: i.value, cost_amount: Number(a.value) }]); i.value=''; a.value=''; fetchCosts(showCost.id); }} className="bg-gray-900 text-white px-8 rounded-3xl font-black shadow-lg">เพิ่ม</button></div>
            <div className="max-h-52 overflow-auto mb-10 space-y-3 pr-2">
              {costs.map(c => <div key={c.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all font-black uppercase font-bold"><div><span className="text-gray-700 block text-left leading-none uppercase text-xs">{c.item_description}</span><span className="text-[10px] text-gray-400 font-black block text-left mt-1 tabular-nums">฿{Number(c.cost_amount).toLocaleString()}</span></div><button onClick={async () => { await supabase.from('order_costs').delete().eq('id', c.id); fetchCosts(showCost.id); }} className="text-red-200 hover:text-red-500"><Trash2 size={16}/></button></div>)}
            </div>
            <div className="bg-green-50 p-8 rounded-[2.5rem] flex justify-between items-center border border-green-100 shadow-sm shadow-green-50"><span className="text-green-800 font-black text-sm uppercase tracking-widest font-black uppercase tracking-tighter">กำไรสุทธิงานนี้</span><span className="text-4xl font-black text-green-700 tracking-tighter leading-none font-black">฿{(Number(showCost.total_price) - Number(showCost.discount_amount || 0) - costs.reduce((a,c)=>a+Number(c.cost_amount),0)).toLocaleString()}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}

function CustomersView({ customers, onRefresh }) { return (
  <div className="bg-white rounded-[3.5rem] border overflow-hidden shadow-sm animate-in fade-in max-w-4xl mx-auto uppercase font-black">
    <div className="p-10 border-b bg-gray-50 flex justify-between items-center leading-none"><h3 className="text-2xl font-black uppercase tracking-widest text-gray-800">ฐานข้อมูลลูกค้า</h3><span className="text-[10px] font-black bg-pink-600 text-white px-6 py-2.5 rounded-full uppercase tracking-widest">{customers.length} คน</span></div>
    <table className="w-full text-left font-bold text-gray-700 tracking-widest uppercase font-black">
      <thead className="bg-gray-50 text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]"><tr><th className="px-10 py-7 uppercase font-black">ชื่อ-นามสกุล</th><th className="px-10 py-7 text-center font-black">เบอร์โทรศัพท์</th><th className="px-10 py-7 text-right font-black">จัดการ</th></tr></thead>
      <tbody className="divide-y divide-gray-100">{customers.map(c => <tr key={c.id} className="hover:bg-gray-50/50 transition-colors font-black uppercase leading-none"><td className="px-10 py-10 font-black text-gray-800 text-2xl tracking-tighter leading-none">{c.name}</td><td className="px-10 py-10 text-center font-bold text-gray-500 text-xl tracking-tight leading-none tabular-nums font-black">{c.phone || '-'}</td><td className="px-10 py-10 text-right"><button onClick={async () => { if(confirm(`ต้องการลบข้อมูลคุณ ${c.name}? \n*คำเตือน: ข้อมูลงานที่เกี่ยวข้องอาจได้รับผลกระทบ`)) { await supabase.from('customers').delete().eq('id', c.id); onRefresh(); } }} className="text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={24}/></button></td></tr>)}</tbody>
    </table>
  </div>
)}

function BillingView({ orders, onRefresh, onPrint }) {
  const [editingId, setEditingId] = useState(null); const [val, setVal] = useState(0);
  const done = orders.filter(o => o.status === 'completed'); const total = done.reduce((a, o) => a + (Number(o.total_price || 0) - Number(o.discount_amount || 0)), 0);
  return (
    <div className="space-y-10 animate-in fade-in overflow-hidden uppercase font-bold text-gray-800 uppercase font-black uppercase">
      <div className="bg-gray-900 p-12 rounded-[3.5rem] text-white text-center shadow-2xl relative overflow-hidden leading-none font-black font-black uppercase"><p className="text-gray-400 font-black text-[10px] tracking-[0.5em] mb-4 text-pink-500 uppercase">ยอดรับสุทธิงานที่เสร็จสมบูรณ์</p><p className="text-7xl font-black text-white tracking-tighter leading-none tabular-nums font-black leading-none font-black leading-none">฿{total.toLocaleString()}</p></div>
      <div className="bg-white rounded-[3.5rem] border overflow-hidden shadow-sm uppercase tracking-widest font-black uppercase font-black uppercase tracking-widest font-black font-black uppercase tracking-widest">
        <div className="p-10 border-b bg-gray-50 flex justify-between items-center print:hidden leading-none font-black uppercase"><div><h3 className="text-xl font-black uppercase tracking-widest text-gray-800 tracking-tighter font-black font-black uppercase">รายการออกเอกสาร</h3><p className="text-xs text-pink-500 font-bold mt-3 uppercase tracking-widest animate-pulse font-black uppercase tracking-widest font-black uppercase animate-pulse">• จบงานแล้วเท่านั้น</p></div><button onClick={() => window.print()} className="bg-gray-800 text-white px-10 py-4 rounded-[1.5rem] font-black shadow-lg hover:bg-black uppercase tracking-widest leading-none font-black uppercase font-black uppercase"><Printer size={20} className="mr-3"/> พิมพ์รายงานรวม</button></div>
        <div className="overflow-x-auto font-black uppercase"><table className="w-full text-left border-collapse"><thead className="bg-gray-50 text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]"><tr><th className="px-10 py-8">ลูกค้า</th><th className="px-10 py-8 text-right">ยอดงาน</th><th className="px-10 py-8 text-right text-red-500">ส่วนลด</th><th className="px-10 py-8 text-right text-green-600">ยอดรับ</th><th className="px-10 py-8 text-right text-orange-500 font-black">ค้างจ่าย</th><th className="px-10 py-8 text-center font-black">เอกสาร</th></tr></thead><tbody className="divide-y divide-gray-100 font-black tracking-widest uppercase">
          {done.map(o => {
            const net = Number(o.total_price) - Number(o.discount_amount || 0); const bal = net - Number(o.deposit_amount);
            return (
              <tr key={o.id} className="hover:bg-gray-50/50 transition-all group font-black uppercase leading-none font-black uppercase font-black uppercase">
                <td className="px-10 py-10 font-black text-gray-800 text-2xl tracking-tighter leading-none uppercase font-black uppercase font-black">{o.customers?.name}</td>
                <td className="px-10 py-10 text-right font-bold text-gray-400 tracking-tighter text-lg uppercase font-bold font-black uppercase font-black text-lg leading-none font-black uppercase">฿{Number(o.total_price).toLocaleString()}</td>
                <td className="px-10 py-10 text-right font-black leading-none font-black uppercase font-black uppercase font-black uppercase">{editingId === o.id ? (<div className="flex justify-end space-x-1 font-black uppercase"><input type="number" autoFocus className="w-24 p-2 border-2 border-pink-200 rounded-xl outline-none text-right font-black text-xs" value={val} onChange={e => setVal(e.target.value)} /><button onClick={async () => { await supabase.from('orders').update({ discount_amount: Number(val) }).eq('id', o.id); setEditingId(null); onRefresh(); }} className="bg-pink-600 text-white p-2 rounded-xl shadow-lg font-black uppercase"><CheckCircle2 size={16}/></button></div>) : (<button onClick={() => { setEditingId(o.id); setVal(o.discount_amount); }} className="text-red-400 font-bold border-b-2 border-dashed border-red-100 hover:border-red-400 transition-all font-black uppercase font-black tabular-nums leading-none font-black uppercase font-black uppercase font-black uppercase tracking-widest font-black font-black uppercase tracking-widest font-black font-black uppercase tracking-widest font-black font-black uppercase font-black">฿{Number(o.discount_amount || 0).toLocaleString()}</button>)}</td>
                <td className="px-10 py-10 text-right font-black text-green-600 text-2xl tracking-tighter leading-none font-black uppercase font-black font-black uppercase font-black text-2xl font-black tracking-tighter font-black">฿{net.toLocaleString()}</td>
                <td className="px-10 py-10 text-right font-black text-orange-600 text-4xl tracking-tighter group-hover:scale-105 transition-transform font-black uppercase font-black leading-none font-black uppercase font-black font-black uppercase font-black text-4xl font-black tracking-tighter font-black">฿{bal.toLocaleString()}</td>
                <td className="px-10 py-10 text-center leading-none font-black uppercase"><div className="flex justify-center space-x-2 font-black uppercase">
                  <button onClick={async () => { if(confirm('ดึงงานนี้กลับไปแก้ไข?')) { await supabase.from('orders').update({ status: 'processing' }).eq('id', o.id); onRefresh(); } }} className="bg-gray-100 text-gray-500 px-4 py-3 rounded-2xl hover:bg-orange-100 hover:text-orange-600 transition-all" title="ดึงงานกลับไปแก้ไข"><RotateCcw size={18}/></button>
                  <button onClick={() => onPrint('bill', o)} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-black leading-none">วางบิล</button>
                  <button onClick={() => onPrint('receipt', o)} className="bg-pink-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-pink-600 leading-none">ใบเสร็จ</button>
                </div></td>
              </tr>
            )
          })}
          {done.length === 0 && <tr><td colSpan="6" className="py-32 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest font-black uppercase tracking-widest font-black uppercase font-black uppercase tracking-widest font-black font-black uppercase tracking-widest font-black font-black uppercase tracking-widest font-black font-black uppercase font-black">ยังไม่มีงานที่จบงานเพื่อออกเอกสาร</td></tr>}
        </tbody></table></div>
      </div>
    </div>
  )
}

// ==========================================
// 🏢 5. แอปหลัก (Root Application)
// ==========================================

export default function App() {
  const [trackingId] = useState(() => new URLSearchParams(window.location.search).get('track'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ today: 0, wedding: 0, pending: 0 });
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printDoc, setPrintDoc] = useState(null);

  useEffect(() => {
    if (!trackingId) {
      fetchData();
      const channel = supabase.channel('db-all').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, [trackingId]);

  async function fetchData() {
    setLoading(true);
    const { data: all } = await supabase.from('orders').select('*, customers (*), order_items (*)');
    const { data: cu } = await supabase.from('customers').select('*').order('name');
    const td = new Date().toISOString().split('T')[0];
    setStats({
      today: all?.filter(o => o.event_date === td).length || 0,
      wedding: all?.filter(o => o.order_items?.some(i => i.item_name.includes('เว็ดดิ้ง'))).length || 0,
      pending: all?.reduce((a, o) => a + (Number(o.total_price || 0) - Number(o.discount_amount || 0) - Number(o.deposit_amount || 0)), 0) || 0
    });
    setOrders(all || []);
    setCustomers(cu || []);
    setLoading(false);
  }

  // แยกหน้าเด็ดขาด
  if (trackingId) return <TrackView id={trackingId} />;
  if (printDoc) return <PrintView doc={printDoc} onBack={() => setPrintDoc(null)} />;
  if (loading) return <div className="h-screen flex items-center justify-center bg-white font-black uppercase text-gray-400 animate-pulse"><Flower className="mr-4 animate-spin text-pink-500"/> Loading System...</div>;

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden font-black">
      <aside className="w-64 bg-white shadow-xl z-10 border-r flex flex-col font-black">
        <div className="p-8 border-b text-center font-black"><Flower className="mx-auto text-pink-600 mb-2" size={40} /><h1 className="text-xl font-black text-pink-600 uppercase tracking-tighter leading-none font-black">Fortune<br/>Florist</h1><p className="text-[10px] text-gray-400 font-bold uppercase mt-3 tracking-widest font-black leading-none text-center">Admin v4.6 Official</p></div>
        <nav className="mt-4 px-3 space-y-1 flex-1 overflow-y-auto font-black uppercase font-black uppercase font-black uppercase font-black font-black font-black uppercase font-black font-black uppercase font-black uppercase font-black">
          <NavItem icon={<LayoutDashboard size={20}/>} label="DASHBOARD" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Calendar size={20}/>} label="จัดการคิวงาน" active={activeTab === 'workflow'} onClick={() => setActiveTab('workflow')} />
          <NavItem icon={<Users size={20}/>} label="ฐานลูกค้า" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
          <NavItem icon={<FileText size={20}/>} label="วางบิล/ใบเสร็จ" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-10 font-black uppercase font-black uppercase font-black uppercase font-black font-black font-black font-black uppercase font-black font-black uppercase font-black uppercase font-black">
        <header className="flex justify-between items-center mb-10 bg-white p-5 rounded-[2rem] shadow-sm px-10 border leading-none font-black uppercase">{activeTab}<div className="flex bg-green-50 px-3 py-1 rounded-full border border-green-200 text-green-700 text-[10px] uppercase font-black tracking-widest font-black uppercase tracking-widest font-black font-black uppercase tracking-widest font-black font-black font-black uppercase tracking-widest font-black font-black uppercase tracking-widest font-black uppercase font-black font-black uppercase tracking-widest font-black font-black uppercase tracking-widest font-black uppercase font-black">Admin Active</div></header>
        {activeTab === 'dashboard' && <DashboardView stats={stats} orders={orders} />}
        {activeTab === 'workflow' && <WorkflowView orders={orders} onRefresh={fetchData} onPrint={(t, o) => setPrintDoc({type:t, order:o})} />}
        {activeTab === 'customers' && <CustomersView customers={customers} onRefresh={fetchData} />}
        {activeTab === 'billing' && <BillingView orders={orders} onRefresh={fetchData} onPrint={(t, o) => setPrintDoc({type:t, order:o})} />}
      </main>
    </div>
  )
}
