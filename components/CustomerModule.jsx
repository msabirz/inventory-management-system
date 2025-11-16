'use client';
import React, { useEffect, useState } from 'react';

export default function CustomerModule() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'view' | 'delete' | null
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name:'', phone:'', email:'', address:'' });
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

  useEffect(() => { fetchCustomers(); }, []);

  const openModal = (type, customer=null) => {
    setModal(type);
    setSelected(customer);
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
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', padding:20, width: '100%', maxWidth:520, borderRadius:8 }}>
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
          </div>
        </div>
      )}
    </div>
  );
}
