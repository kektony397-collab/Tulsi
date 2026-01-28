import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Users, IndianRupee, FileText, Plus, Search, 
  Trash2, Printer, AlertTriangle, CheckCircle, Upload, X 
} from 'lucide-react';
import { dbService } from './services/db';
import { Member, Payment, Expense, ViewState, ModalType } from './types';
import { ReceiptTemplate } from './components/ReceiptTemplate';
import { LegalNoticeTemplate } from './components/LegalNoticeTemplate';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// --- CONSTANTS ---
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const NAV_ITEMS = [
  { id: 'dashboard', icon: Home, label: 'Home' },
  { id: 'members', icon: Users, label: 'Members' },
  { id: 'finance', icon: IndianRupee, label: 'Money' },
  { id: 'notices', icon: FileText, label: 'Notice' },
] as const;

// --- SKELETON COMPONENT ---
const SkeletonDashboard = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-2 gap-4">
      <div className="h-24 bg-slate-200 rounded-2xl skeleton"></div>
      <div className="h-24 bg-slate-200 rounded-2xl skeleton"></div>
    </div>
    <div className="h-64 bg-slate-200 rounded-2xl skeleton"></div>
    <div className="h-24 bg-blue-100 rounded-xl skeleton opacity-50"></div>
  </div>
);

// --- APP COMPONENT ---
export default function App() {
  // State
  const [view, setView] = useState<ViewState>('dashboard');
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Specific Modal State
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null); // For receipt
  
  // Forms State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<any>({});

  // --- INITIALIZATION ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // Simulate a slight delay to show off the skeleton animation (Architecture choice for perceived performance)
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 800)); 
    try {
      const [m, p, e, _] = await Promise.all([
        dbService.getAllMembers(),
        dbService.getAllPayments(),
        dbService.getAllExpenses(),
        minLoadTime
      ]);
      setMembers(m);
      setPayments(p);
      setExpenses(e);
    } catch (err) {
      console.error("DB Error", err);
      showToast("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- HANDLERS ---
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoBase64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMember = async () => {
    if (!formData.name || !formData.flatNumber) return;
    const newMember: Member = {
      id: crypto.randomUUID(),
      name: formData.name,
      flatNumber: formData.flatNumber,
      mobile: formData.mobile || '',
      photoBase64: formData.photoBase64 || null,
      createdAt: Date.now()
    };
    await dbService.addMember(newMember);
    setMembers([...members, newMember]);
    setActiveModal(null);
    setFormData({});
    showToast("Member Added Successfully");
  };

  const handleAddPayment = async () => {
    if (!formData.memberId || !formData.amount || !formData.month) return;
    const member = members.find(m => m.id === formData.memberId);
    if (!member) return;

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      memberId: member.id,
      memberName: member.name,
      month: formData.month,
      amount: Number(formData.amount),
      date: new Date().toISOString(),
      note: formData.note
    };
    await dbService.addPayment(newPayment);
    setPayments([...payments, newPayment]);
    setActiveModal(null);
    setFormData({});
    showToast("Payment Recorded");
  };

  const handleAddExpense = async () => {
    if (!formData.title || !formData.amount) return;
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      title: formData.title,
      amount: Number(formData.amount),
      date: new Date().toISOString(),
      category: formData.category || 'Other'
    };
    await dbService.addExpense(newExpense);
    setExpenses([...expenses, newExpense]);
    setActiveModal(null);
    setFormData({});
    showToast("Expense Logged");
  };

  const handlePrint = () => {
    window.print();
  };

  // --- CALCULATIONS ---
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const balance = totalCollected - totalExpenses;
  
  const expenseByCategory = expenses.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});
  const pieData = Object.keys(expenseByCategory).map(key => ({ name: key, value: expenseByCategory[key] }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 select-none font-sans">
      
      {/* 1. PRINT ONLY LAYERS */}
      <ReceiptTemplate payment={selectedPayment} />
      <LegalNoticeTemplate member={selectedMember} dues={5000} /> 

      {/* 2. APP HEADER (No Print) */}
      <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10 no-print transition-all duration-300">
        <div className="flex justify-between items-center max-w-lg mx-auto md:max-w-4xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Home size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Tulsi Apt</h1>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-sm font-mono font-medium shadow-sm">
            ₹ {loading ? '...' : balance.toLocaleString()}
          </div>
        </div>
      </header>

      {/* 3. MAIN CONTENT (No Print) */}
      <main className="p-4 no-print max-w-lg mx-auto md:max-w-4xl min-h-[80vh]">
        
        {loading ? (
          <SkeletonDashboard />
        ) : (
          <>
            {/* VIEW: DASHBOARD */}
            {view === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <IndianRupee size={48} className="text-green-600" />
                    </div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Income</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">₹{totalCollected.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-3 opacity-10">
                      <IndianRupee size={48} className="text-red-500" />
                    </div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Expense</p>
                    <p className="text-2xl font-bold text-red-500 mt-1">₹{totalExpenses.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-72">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                    Expense Analysis
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div 
                  onClick={() => setView('notices')}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div className="bg-white p-3 rounded-full shadow-sm text-blue-600">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900">Legal Notices</h4>
                    <p className="text-xs text-blue-600 mt-1 leading-relaxed">Generate official demand notices for defaulters instantly.</p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: MEMBERS */}
            {view === 'members' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center mb-2 px-1">
                  <h2 className="text-lg font-bold text-slate-800">Residents <span className="text-slate-400 text-sm font-normal">({members.length})</span></h2>
                  <button 
                    onClick={() => { setFormData({}); setActiveModal('addMember'); }}
                    className="bg-blue-600 text-white w-10 h-10 rounded-full shadow-lg shadow-blue-200 flex items-center justify-center android-ripple active:scale-95 transition"
                  >
                    <Plus size={24} />
                  </button>
                </div>
                
                {members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
                    <Users size={48} className="opacity-20" />
                    <p>No members found. Add one!</p>
                  </div>
                ) : (
                  members.map(member => (
                    <div key={member.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 active:bg-slate-50 transition-colors">
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                        {member.photoBase64 ? (
                          <img src={member.photoBase64} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Users size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 truncate">{member.name}</h3>
                        <p className="text-sm text-slate-500 font-medium">Flat: {member.flatNumber}</p>
                      </div>
                      <a 
                        href={`tel:${member.mobile}`} 
                        className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center hover:bg-green-100 transition-colors"
                      >
                        <CheckCircle size={20} />
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* VIEW: FINANCE */}
            {view === 'finance' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex p-1 bg-white rounded-xl shadow-sm border border-slate-100">
                  <button className="flex-1 py-2.5 text-sm font-bold bg-blue-50 text-blue-700 rounded-lg shadow-sm transition-all">Transactions</button>
                  <button 
                    className="flex-1 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-all"
                    onClick={() => setActiveModal('addExpense')}
                  >
                    Expenses
                  </button>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="font-bold text-slate-800">Recent Payments</h3>
                    <button 
                      onClick={() => { setFormData({}); setActiveModal('addPayment'); }}
                      className="text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-lg shadow-md active:scale-95 transition flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Log Payment
                    </button>
                  </div>

                  <div className="space-y-3">
                    {payments.length === 0 ? (
                       <div className="text-center py-10 text-slate-400 text-sm">No transactions yet</div>
                    ) : (
                      payments.slice().reverse().map(payment => (
                        <div key={payment.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-800">{payment.memberName}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{payment.month} • {new Date(payment.date).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md text-sm">+ ₹{payment.amount}</span>
                            <button 
                              onClick={() => { setSelectedPayment(payment); setActiveModal('viewReceipt'); }}
                              className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-600 active:bg-slate-200"
                            >
                              <Printer size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-200">
                   <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="font-bold text-slate-800">Expenses Log</h3>
                    <button 
                      onClick={() => { setFormData({}); setActiveModal('addExpense'); }}
                      className="text-xs font-bold bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-100 active:bg-red-100 transition flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Add Expense
                    </button>
                   </div>
                   <div className="space-y-2">
                     {expenses.slice().reverse().map(exp => (
                       <div key={exp.id} className="bg-white p-3 rounded-xl border border-red-50 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                            <div>
                              <p className="text-sm font-bold text-slate-700">{exp.title}</p>
                              <span className="text-[10px] uppercase font-bold tracking-wide text-slate-400">{exp.category}</span>
                            </div>
                          </div>
                          <span className="text-red-500 font-bold text-sm">- ₹{exp.amount}</span>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}

            {/* VIEW: NOTICES */}
            {view === 'notices' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-red-50 p-5 rounded-2xl border border-red-100 text-red-900">
                  <h3 className="font-bold flex items-center gap-2 text-lg"><AlertTriangle size={20} className="text-red-600"/> Legal Desk</h3>
                  <p className="text-sm mt-2 opacity-80 leading-relaxed">Generate formal demand notices compliant with the Apartment Ownership Act 1972.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Defaulter Member</label>
                  <div className="relative">
                    <select 
                      className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium text-slate-700"
                      onChange={(e) => {
                        const m = members.find(x => x.id === e.target.value);
                        setSelectedMember(m || null);
                      }}
                    >
                      <option value="">-- Choose Member --</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.flatNumber})</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Search size={20} />
                    </div>
                  </div>

                  <button 
                    disabled={!selectedMember}
                    onClick={() => setActiveModal('viewNotice')}
                    className="w-full mt-6 bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-200 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                  >
                    <FileText size={20} /> Generate Notice
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 4. MODALS */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 no-print animate-fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col sm:animate-none animate-[slide-up_0.3s_ease-out]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="font-bold text-xl text-slate-800">
                {activeModal === 'addMember' && 'New Resident'}
                {activeModal === 'addPayment' && 'New Payment'}
                {activeModal === 'addExpense' && 'Log Expense'}
                {activeModal === 'viewReceipt' && 'Receipt Preview'}
                {activeModal === 'viewNotice' && 'Notice Preview'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto bg-white">
              
              {/* Add Member Form */}
              {activeModal === 'addMember' && (
                <>
                  <input placeholder="Full Name" className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium" 
                    onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input placeholder="Flat Number" className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    onChange={e => setFormData({...formData, flatNumber: e.target.value})} />
                  <input placeholder="Mobile Number" type="tel" className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    onChange={e => setFormData({...formData, mobile: e.target.value})} />
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
                    {formData.photoBase64 ? (
                      <img src={formData.photoBase64} alt="Preview" className="h-24 w-24 object-cover rounded-full mx-auto shadow-md" />
                    ) : (
                      <div className="text-slate-400 text-sm flex flex-col items-center gap-2">
                        <div className="bg-slate-100 p-3 rounded-full">
                          <Upload size={24} />
                        </div>
                        <span className="font-medium">Tap to upload photo</span>
                      </div>
                    )}
                  </div>
                  <button onClick={handleAddMember} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 mt-2 active:scale-[0.98] transition">Save Member</button>
                </>
              )}

              {/* Add Payment Form */}
              {activeModal === 'addPayment' && (
                <>
                  <select className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    onChange={e => setFormData({...formData, memberId: e.target.value})}>
                    <option value="">Select Member</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name} - {m.flatNumber}</option>)}
                  </select>
                  <input type="month" className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    onChange={e => setFormData({...formData, month: e.target.value})} />
                  <input type="number" placeholder="Amount (₹)" className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    onChange={e => setFormData({...formData, amount: e.target.value})} />
                  <button onClick={handleAddPayment} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-green-200 mt-2 active:scale-[0.98] transition">Record Payment</button>
                </>
              )}

               {/* Add Expense Form */}
               {activeModal === 'addExpense' && (
                <>
                  <input placeholder="Expense Title (e.g. Pump Repair)" className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    onChange={e => setFormData({...formData, title: e.target.value})} />
                  <select className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="Other">Category</option>
                    <option value="Repair">Repair</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Water">Water</option>
                  </select>
                  <input type="number" placeholder="Amount (₹)" className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    onChange={e => setFormData({...formData, amount: e.target.value})} />
                  <button onClick={handleAddExpense} className="w-full bg-red-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-200 mt-2 active:scale-[0.98] transition">Log Expense</button>
                </>
              )}

              {/* Receipt / Notice Preview */}
              {(activeModal === 'viewReceipt' || activeModal === 'viewNotice') && (
                <div className="text-center space-y-6">
                  <div className="bg-slate-50 p-10 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                    <Printer size={48} className="text-slate-300 mb-4" />
                    <p className="text-slate-600 font-medium">Document generated successfully.</p>
                    <p className="text-xs text-slate-400 mt-1">Ready for thermal or A4 printing.</p>
                  </div>
                  <button onClick={handlePrint} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 active:scale-[0.98] transition shadow-xl">
                    <Printer size={20} /> Print Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3.5 rounded-full shadow-2xl text-sm font-medium animate-bounce no-print z-[60] flex items-center gap-2">
          <CheckCircle size={16} className="text-green-400" /> {toast}
        </div>
      )}

      {/* 6. BOTTOM NAVIGATION (Android Style) */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 flex justify-around py-3 pb-safe no-print z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {NAV_ITEMS.map((item) => {
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`flex flex-col items-center w-full relative ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <div className={`transition-all duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                <item.icon size={26} className={isActive ? 'fill-current opacity-20 stroke-[2.5px]' : 'stroke-2'} />
                <div className={`absolute inset-0 flex items-center justify-center ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                   <item.icon size={26} className="stroke-[2.5px]" />
                </div>
              </div>
              <span className={`text-[10px] mt-1 font-bold tracking-wide transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}