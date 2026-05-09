"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatDate } from '@/lib/utils';

export default function CustomerModule() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'view' | 'delete' | 'ledger' | null
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name:'', phone:'', email:'', address:'' });
  const [ledgerData, setLedgerData] = useState({ ledger: [], currentBalance: 0 });
  const [paymentForm, setPaymentForm] = useState({ amount: '', remarks: '', date: new Date().toISOString().split('T')[0], paymentMode: 'CASH', paymentRef: '' });
  const [savingPayment, setSavingPayment] = useState(false);
  const API = '/api/customers';

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const fetchLedger = async (id) => {
    try {
      const res = await fetch(`${API}/${id}/ledger`);
      const data = await res.json();
      setLedgerData(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const openModal = (type, customer=null) => {
    setModal(type);
    setSelected(customer);
    if (type === 'ledger' && customer) {
      fetchLedger(customer.id);
      setPaymentForm({ amount: '', remarks: '', date: new Date().toISOString().split('T')[0], paymentMode: 'CASH', paymentRef: '' });
    }
    setForm(customer ? { name: customer.name||'', phone: customer.phone||'', email: customer.email||'', address: customer.address||'' } : { name:'', phone:'', email:'', address:'' });
  };

  const closeModal = () => { setModal(null); setSelected(null); };

  const createCustomer = async () => {
    await fetch(API, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(form) });
    closeModal();
    fetchCustomers();
  };

  const updateCustomer = async () => {
    if (!selected) return;
    await fetch(`${API}/${selected.id}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(form) });
    closeModal();
    fetchCustomers();
  };

  const deleteCustomer = async () => {
    if (!selected) return;
    await fetch(`${API}/${selected.id}`, { method: 'DELETE' });
    closeModal();
    fetchCustomers();
  };

  const savePayment = async () => {
    if (!selected || !paymentForm.amount) return;
    setSavingPayment(true);
    try {
      await fetch(`${API}/${selected.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      });
      fetchLedger(selected.id);
      setPaymentForm({ amount: '', remarks: '', date: new Date().toISOString().split('T')[0], paymentMode: 'CASH', paymentRef: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomerModuleContent
        customers={customers}
        setCustomers={setCustomers}
        loading={loading}
        modal={modal}
        selected={selected}
        form={form}
        setForm={setForm}
        ledgerData={ledgerData}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        savingPayment={savingPayment}
        openModal={openModal}
        closeModal={closeModal}
        createCustomer={createCustomer}
        updateCustomer={updateCustomer}
        deleteCustomer={deleteCustomer}
        savePayment={savePayment}
        fetchCustomers={fetchCustomers}
      />
    </Suspense>
  );
}

function CustomerModuleContent({
  customers,
  setCustomers,
  loading,
  modal,
  selected,
  form,
  setForm,
  ledgerData,
  paymentForm,
  setPaymentForm,
  savingPayment,
  openModal,
  closeModal,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  savePayment,
  fetchCustomers,
}) {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('id');

  useEffect(() => {
    if (customerId && !loading && customers.length > 0) {
      const customer = customers.find(c => String(c.id) === String(customerId));
      if (customer) {
        openModal('edit', customer);
      }
    }
  }, [customerId, loading, customers]);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Customers</h1>

      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
        <input placeholder='Search (name/email/phone)' onChange={(e) => {
          const q = e.target.value.toLowerCase();
          if (!q) { fetchCustomers(); return; }
          setCustomers(prev => prev.filter(c => (c.name||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q) || (c.phone||'').toLowerCase().includes(q)));
        }} style={{ padding:8, flex:1, marginRight:8 }} />
        <button onClick={() => openModal('add')} style={{ padding:'8px 12px' }}>Add Customer</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f3f3f3' }}>
              <th style={{ padding:8, border:'1px solid #ddd' }}>Name</th>
              <th style={{ padding:8, border:'1px solid #ddd' }}>Phone</th>
              <th style={{ padding:8, border:'1px solid #ddd' }}>Email</th>
              <th style={{ padding:8, border:'1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id}>
                <td style={{ padding:8, border:'1px solid #ddd' }}>{c.name}</td>
                <td style={{ padding:8, border:'1px solid #ddd' }}>{c.phone}</td>
                <td style={{ padding:8, border:'1px solid #ddd' }}>{c.email}</td>
                <td style={{ padding:8, border:'1px solid #ddd' }}>
                  <button onClick={() => openModal('ledger', c)} style={{ marginRight:6, background:'#2563eb', color:'#fff', border:'none', padding:'4px 8px', borderRadius:4, cursor:'pointer' }}>Ledger</button>
                  <button onClick={() => openModal('view', c)} style={{ marginRight:6 }}>View</button>
                  <button onClick={() => openModal('edit', c)} style={{ marginRight:6 }}>Edit</button>
                  <button onClick={() => openModal('delete', c)} style={{ marginRight:6 }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 100 }}>
          <div style={{ background:'#fff', padding:20, width: '100%', maxWidth: modal === 'ledger' ? 800 : 520, borderRadius:8 }}>
            {(modal === 'add' || modal === 'edit') && (
              <>
                <h2>{modal === 'add' ? 'Add Customer' : 'Edit Customer'}</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:12 }}>
                  <input placeholder='Name' value={form.name} onChange={e=>setForm({...form, name:e.target.value})} style={{ padding:8 }} />
                  <input placeholder='Phone' value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} style={{ padding:8 }} />
                  <input placeholder='Email' value={form.email} onChange={e=>setForm({...form, email:e.target.value})} style={{ padding:8 }} />
                  <textarea placeholder='Address' value={form.address} onChange={e=>setForm({...form, address:e.target.value})} style={{ padding:8 }} />
                </div>
                <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
                  <button onClick={closeModal}>Cancel</button>
                  <button onClick={modal==='add'?createCustomer:updateCustomer}>{modal==='add'? 'Save':'Update'}</button>
                </div>
              </>
            )}

            {modal === 'view' && selected && (
              <>
                <h2>Customer Details</h2>
                <p><strong>Name:</strong> {selected.name}</p>
                <p><strong>Phone:</strong> {selected.phone}</p>
                <p><strong>Email:</strong> {selected.email}</p>
                <p><strong>Address:</strong> {selected.address}</p>
                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
                  <button onClick={closeModal}>Close</button>
                </div>
              </>
            )}

            {modal === 'delete' && selected && (
              <>
                <h2 style={{ color:'crimson' }}>Delete Customer?</h2>
                <p>Are you sure you want to delete <strong>{selected.name}</strong>?</p>
                <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
                  <button onClick={closeModal}>Cancel</button>
                  <button onClick={deleteCustomer} style={{ background:'crimson', color:'#fff' }}>Delete</button>
                </div>
              </>
            )}
            {modal === 'ledger' && selected && (
              <div style={{ maxHeight: '90vh', overflowY: 'auto', padding: '10px' }}>
                {/* Header with Customer Info */}
                <div style={{ borderBottom: '2px solid #eee', paddingBottom: 15, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2 style={{ fontSize: 24, margin: 0 }}>{selected.name}</h2>
                      <p style={{ color: '#666', margin: '5px 0 0 0' }}>{selected.phone || 'No phone'} • {selected.email || 'No email'}</p>
                    </div>
                    <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>✕</button>
                  </div>
                </div>

                {/* Summary Cards */}
                {(() => {
                  const totalCredit = ledgerData.ledger.reduce((acc, item) => acc + (item.credit || 0), 0);
                  const totalDebit = ledgerData.ledger.reduce((acc, item) => acc + (item.debit || 0), 0);
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 15, marginBottom: 20 }}>
                      <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: 15, borderRadius: 8 }}>
                        <p style={{ fontSize: 12, color: '#e11d48', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Credit (+)</p>
                        <h3 style={{ fontSize: 20, margin: '5px 0 0 0', color: '#9f1239' }}>₹{totalCredit.toLocaleString()}</h3>
                      </div>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 15, borderRadius: 8 }}>
                        <p style={{ fontSize: 12, color: '#16a34a', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Repaid (-)</p>
                        <h3 style={{ fontSize: 20, margin: '5px 0 0 0', color: '#14532d' }}>₹{totalDebit.toLocaleString()}</h3>
                      </div>
                      <div style={{ background: ledgerData.currentBalance > 0 ? '#fffbeb' : '#f0fdf4', border: ledgerData.currentBalance > 0 ? '1px solid #fef3c7' : '1px solid #bbf7d0', padding: 15, borderRadius: 8 }}>
                        <p style={{ fontSize: 12, color: ledgerData.currentBalance > 0 ? '#d97706' : '#16a34a', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding</p>
                        <h3 style={{ fontSize: 20, margin: '5px 0 0 0', color: ledgerData.currentBalance > 0 ? '#92400e' : '#14532d' }}>₹{ledgerData.currentBalance.toLocaleString()}</h3>
                      </div>
                    </div>
                  );
                })()}

                {/* Add Repayment Form */}
                {ledgerData.currentBalance > 0 && (
                  <div style={{ background: '#fafafa', padding: 15, borderRadius: 8, marginBottom: 20, border: '1px solid #eaeaea' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#333' }}>Record a Repayment</h4>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ flex: '1', minWidth: '120px' }}>
                        <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4 }}>Amount</label>
                        <input 
                          type="number" 
                          placeholder="0.00" 
                          value={paymentForm.amount} 
                          onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                          style={{ padding: '8px 10px', width: '100%', border: '1px solid #ddd', borderRadius: 4 }}
                          max={ledgerData.currentBalance}
                        />
                      </div>
                      <div style={{ flex: '1', minWidth: '130px' }}>
                        <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4 }}>Payment Date</label>
                        <input 
                          type="date" 
                          value={paymentForm.date} 
                          onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
                          style={{ padding: '8px 10px', width: '100%', border: '1px solid #ddd', borderRadius: 4 }}
                        />
                      </div>
                      <div style={{ flex: '1', minWidth: '130px' }}>
                        <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4 }}>Mode</label>
                        <select 
                          value={paymentForm.paymentMode} 
                          onChange={e => setPaymentForm({...paymentForm, paymentMode: e.target.value})}
                          style={{ padding: '8px 10px', width: '100%', border: '1px solid #ddd', borderRadius: 4 }}
                        >
                          <option value="CASH">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="CHEQUE">Cheque</option>
                        </select>
                      </div>
                      <div style={{ flex: '1', minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4 }}>
                          {paymentForm.paymentMode === 'CASH' ? 'Ref (e.g. Bill No)' : 
                           paymentForm.paymentMode === 'UPI' ? 'Transaction ID' : 'Cheque Number'}
                        </label>
                        <input 
                          placeholder="Reference..." 
                          value={paymentForm.paymentRef} 
                          onChange={e => setPaymentForm({...paymentForm, paymentRef: e.target.value})}
                          style={{ padding: '8px 10px', width: '100%', border: '1px solid #ddd', borderRadius: 4 }}
                        />
                      </div>
                      <div style={{ flex: '2', minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4 }}>Remarks</label>
                        <input 
                          placeholder="Optional remarks..." 
                          value={paymentForm.remarks} 
                          onChange={e => setPaymentForm({...paymentForm, remarks: e.target.value})}
                          style={{ padding: '8px 10px', width: '100%', border: '1px solid #ddd', borderRadius: 4 }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button 
                          onClick={savePayment} 
                          disabled={savingPayment || !paymentForm.amount || paymentForm.amount <= 0 || paymentForm.amount > ledgerData.currentBalance}
                          style={{ 
                            background: '#059669', 
                            color: '#fff', 
                            border: 'none', 
                            padding: '9px 20px', 
                            borderRadius: 4, 
                            cursor: 'pointer',
                            fontWeight: 600,
                            opacity: (savingPayment || !paymentForm.amount || paymentForm.amount <= 0 || paymentForm.amount > ledgerData.currentBalance) ? 0.6 : 1
                          }}
                        >
                          {savingPayment ? 'Processing...' : 'Save Payment'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction History Table */}
                <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', textAlign: 'left', borderBottom: '2px solid #eee' }}>
                        <th style={{ padding: '12px 10px' }}>Date</th>
                        <th style={{ padding: '12px 10px' }}>Details</th>
                        <th style={{ padding: '12px 10px' }}>Mode/Ref</th>
                        <th style={{ padding: '12px 10px', textAlign: 'right' }}>Credit (+)</th>
                        <th style={{ padding: '12px 10px', textAlign: 'right' }}>Debit (-)</th>
                        <th style={{ padding: '12px 10px', textAlign: 'right' }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerData.ledger.map((item) => {
                        const isSale = item.type === 'SALE';
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f5f5f5', background: isSale ? 'transparent' : '#f0fdf4' }}>
                            <td style={{ padding: '12px 10px', whiteSpace: 'nowrap', color: '#666' }}>{formatDate(item.date)}</td>
                            <td style={{ padding: '12px 10px' }}>
                              <div style={{ fontWeight: 500 }}>{item.description}</div>
                              {isSale && (
                                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                                  Net: ₹{item.amount?.toLocaleString()} | Paid: ₹{item.paid.toLocaleString()}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <div style={{ fontSize: 12, fontWeight: 500, color: '#4b5563' }}>{item.paymentMode || '-'}</div>
                              <div style={{ fontSize: 11, color: '#6b7280' }}>{item.paymentRef || '-'}</div>
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 600, color: '#e11d48' }}>
                              {item.credit > 0 ? `+₹${item.credit.toLocaleString()}` : ''}
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                              {item.debit > 0 ? `-₹${item.debit.toLocaleString()}` : ''}
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 600, fontSize: 14 }}>
                              ₹{item.balance.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                      {ledgerData.ledger.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                            No transaction history matches for this customer.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 25, paddingBottom: 10 }}>
                  <button onClick={closeModal} style={{ padding: '10px 30px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                    Close Ledger
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
