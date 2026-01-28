import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Users, IndianRupee, FileText, Plus, Search, 
  Trash2, Printer, AlertTriangle, CheckCircle, Upload, X 
} from 'lucide-react';
import { dbService } from './services/db';
import { Member, Payment, Expense, ViewState, ModalType } from './types';
import { ReceiptTemplate } from './components/ReceiptTemplate';
import { LegalNoticeTemplate } from './components/LegalNoticeTemplate';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

// --- CONSTANTS ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const NAV_ITEMS = [
  { id: 'dashboard', icon: Home, label: 'Home' },
  { id: 'members', icon: Users, label: 'Members' },
  { id: 'finance', icon: IndianRupee, label: 'Money' },
  { id: 'notices', icon: FileText, label: 'Notice' },
] as const;

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
    try {
      const [m, p, e] = await Promise.all([
        dbService.getAllMembers(),
        dbService.getAllPayments(),
        dbService.getAllExpenses()
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

  // --- RENDER HELPERS ---
  
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 select-none">
      
      {/* 1. PRINT ONLY LAYERS */}
      <ReceiptTemplate payment={selectedPayment} />
      <LegalNoticeTemplate member={selectedMember} dues={5000} /> 
      {/* Note: Dues calculation is mocked for simplicity in this Architect view, realistically it needs month logic */}

      {/* 2. APP HEADER (No Print) */}
      <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10 no-print">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">Tulsi Apt Manager</h1>
          <div className="bg-blue-500 p-2 rounded-full text-xs font-mono">
            ₹ {balance.toLocaleString()}
          </div>
        </div>
      </header>

      {/* 3. MAIN CONTENT (No Print) */}
      <main className="p-4 no-print max-w-lg mx-auto md:max-w-4xl">
        
        {/* VIEW: DASHBOARD */}
        {view === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-semibold">Income</p>
                <p className="text-2xl font-bold text-green-600 mt-1">₹{totalCollected.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-semibold">Expense</p>
                <p className="text-2xl font-bold text-red-500 mt-1">₹{totalExpenses.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 h-64">
              <h3 className="text-sm font-semibold mb-4 text-slate-700">Expense Breakdown</h3>
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800 text-sm">Quick Action</h4>
                <p className="text-xs text-blue-600 mt-1">Generate maintenance notices for defaulters this month.</p>
                <button 
                  onClick={() => setView('notices')}
                  className="mt-2 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg active:bg-blue-700 transition"
                >
                  Go to Notices
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: MEMBERS */}
        {view === 'members' && (
          <div className="space-y-4 pb-20">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">Residents ({members.length})</h2>
              <button 
                onClick={() => { setFormData({}); setActiveModal('addMember'); }}
                className="bg-blue-600 text-white p-2 rounded-full shadow-lg android-ripple active:scale-95 transition"
              >
                <Plus size={24} />
              </button>
            </div>
            
            {members.length === 0 ? (
              <div className="text-center py-20 text-gray-400">No members found. Add one!</div>
            ) : (
              members.map(member => (
                <div key={member.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden">
                     {member.photoBase64 ? (
                       <img src={member.photoBase64} alt={member.name} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-400">
                         <Users size={20} />
                       </div>
                     )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{member.name}</h3>
                    <p className="text-sm text-slate-500">Flat: {member.flatNumber}</p>
                  </div>
                  <a href={`tel:${member.mobile}`} className="p-2 bg-green-50 text-green-600 rounded-full">
                    <CheckCircle size={18} />
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {/* VIEW: FINANCE */}
        {view === 'finance' && (
          <div className="space-y-4">
            <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm mb-4">
              <button className="flex-1 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg text-center">Collection</button>
              <button 
                className="flex-1 py-2 text-sm font-medium text-slate-500 text-center"
                onClick={() => setActiveModal('addExpense')} // Shortcut for demo
              >
                Expenses
              </button>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-700">Recent Transactions</h3>
              <button 
                onClick={() => { setFormData({}); setActiveModal('addPayment'); }}
                className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <Plus size={14} /> Log Payment
              </button>
            </div>

            {payments.slice().reverse().map(payment => (
              <div key={payment.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-800">{payment.memberName}</p>
                  <p className="text-xs text-slate-500">{payment.month} • {new Date(payment.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-green-600">+ ₹{payment.amount}</span>
                  <button 
                    onClick={() => { setSelectedPayment(payment); setActiveModal('viewReceipt'); }}
                    className="p-2 bg-slate-100 rounded-full text-slate-600"
                  >
                    <Printer size={16} />
                  </button>
                </div>
              </div>
            ))}
             <div className="mt-8">
               <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700">Expenses Log</h3>
                <button 
                  onClick={() => { setFormData({}); setActiveModal('addExpense'); }}
                  className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Expense
                </button>
               </div>
               {expenses.slice().reverse().map(exp => (
                 <div key={exp.id} className="bg-white p-3 rounded-lg border border-red-50 mb-2 flex justify-between">
                    <div>
                      <p className="text-sm font-medium">{exp.title}</p>
                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{exp.category}</span>
                    </div>
                    <span className="text-red-500 font-medium">- ₹{exp.amount}</span>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* VIEW: NOTICES */}
        {view === 'notices' && (
          <div className="space-y-6">
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-800">
              <h3 className="font-bold flex items-center gap-2"><AlertTriangle size={18}/> Legal Section</h3>
              <p className="text-sm mt-1">Generate formal demand notices based on the Apartment Ownership Act.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Defaulter Member</label>
              <select 
                className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-red-500 mb-4"
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

              <button 
                disabled={!selectedMember}
                onClick={() => setActiveModal('viewNotice')}
                className="w-full bg-red-600 disabled:bg-red-300 text-white py-3 rounded-xl font-medium shadow-md active:scale-95 transition flex justify-center items-center gap-2"
              >
                <FileText size={18} /> Generate Legal Notice
              </button>
            </div>
          </div>
        )}

      </main>

      {/* 4. MODALS (No Print) */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg">
                {activeModal === 'addMember' && 'Add New Member'}
                {activeModal === 'addPayment' && 'Record Payment'}
                {activeModal === 'addExpense' && 'Log Expense'}
                {activeModal === 'viewReceipt' && 'Payment Receipt'}
                {activeModal === 'viewNotice' && 'Legal Notice Preview'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-200 rounded-full">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              
              {/* Add Member Form */}
              {activeModal === 'addMember' && (
                <>
                  <input placeholder="Full Name" className="w-full p-3 bg-slate-50 rounded-xl border outline-none" 
                    onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input placeholder="Flat Number" className="w-full p-3 bg-slate-50 rounded-xl border outline-none"
                    onChange={e => setFormData({...formData, flatNumber: e.target.value})} />
                  <input placeholder="Mobile Number" type="tel" className="w-full p-3 bg-slate-50 rounded-xl border outline-none"
                    onChange={e => setFormData({...formData, mobile: e.target.value})} />
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50"
                    onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
                    {formData.photoBase64 ? (
                      <img src={formData.photoBase64} alt="Preview" className="h-20 w-20 object-cover rounded-full mx-auto" />
                    ) : (
                      <div className="text-slate-500 text-sm flex flex-col items-center">
                        <Upload size={24} className="mb-2" />
                        <span>Tap to upload photo</span>
                      </div>
                    )}
                  </div>
                  <button onClick={handleAddMember} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-2">Save Member</button>
                </>
              )}

              {/* Add Payment Form */}
              {activeModal === 'addPayment' && (
                <>
                  <select className="w-full p-3 bg-slate-50 rounded-xl border outline-none"
                    onChange={e => setFormData({...formData, memberId: e.target.value})}>
                    <option value="">Select Member</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name} - {m.flatNumber}</option>)}
                  </select>
                  <input type="month" className="w-full p-3 bg-slate-50 rounded-xl border outline-none"
                    onChange={e => setFormData({...formData, month: e.target.value})} />
                  <input type="number" placeholder="Amount (₹)" className="w-full p-3 bg-slate-50 rounded-xl border outline-none"
                    onChange={e => setFormData({...formData, amount: e.target.value})} />
                  <button onClick={handleAddPayment} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold mt-2">Record Payment</button>
                </>
              )}

               {/* Add Expense Form */}
               {activeModal === 'addExpense' && (
                <>
                  <input placeholder="Expense Title (e.g. Pump Repair)" className="w-full p-3 bg-slate-50 rounded-xl border outline-none"
                    onChange={e => setFormData({...formData, title: e.target.value})} />
                  <select className="w-full p-3 bg-slate-50 rounded-xl border outline-none"
                    onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="Other">Category</option>
                    <option value="Repair">Repair</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Water">Water</option>
                  </select>
                  <input type="number" placeholder="Amount (₹)" className="w-full p-3 bg-slate-50 rounded-xl border outline-none"
                    onChange={e => setFormData({...formData, amount: e.target.value})} />
                  <button onClick={handleAddExpense} className="w-full bg-red-500 text-white py-3 rounded-xl font-bold mt-2">Log Expense</button>
                </>
              )}

              {/* Receipt / Notice Preview */}
              {(activeModal === 'viewReceipt' || activeModal === 'viewNotice') && (
                <div className="text-center space-y-4">
                  <div className="bg-slate-100 p-8 rounded-xl border border-slate-200">
                    <p className="text-slate-500 italic">Content is ready for printing...</p>
                    <p className="text-xs text-slate-400 mt-2">Click print to see the formatted document.</p>
                  </div>
                  <button onClick={handlePrint} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2">
                    <Printer size={20} /> Print Document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium animate-bounce no-print z-50">
          {toast}
        </div>
      )}

      {/* 6. BOTTOM NAVIGATION (Android Style) */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around py-2 pb-safe no-print z-40">
        {NAV_ITEMS.map((item) => {
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`flex flex-col items-center w-full p-2 relative ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <item.icon size={24} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute -top-0.5 h-1 w-12 bg-blue-600 rounded-b-full"></span>
              )}
            </button>
          );
        })}
      </nav>

    </div>
  );
}