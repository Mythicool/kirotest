import React, { useState } from 'react';
import { Invoice, InvoiceItem, Client, BusinessSettings, InvoiceTemplate } from '@/types/business-suite';
import Button from '@/components/ui/Button';

interface InvoicingSystemProps {
  invoices: Invoice[];
  clients: Client[];
  settings: BusinessSettings;
  onInvoiceUpdate: (invoices: Invoice[]) => void;
}

export const InvoicingSystem: React.FC<InvoicingSystemProps> = ({
  invoices,
  clients,
  settings,
  onInvoiceUpdate
}) => {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit' | 'preview'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    items: [],
    status: 'draft',
    date: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  });
  const [isLoading, setIsLoading] = useState(false);

  const generateInvoiceNumber = () => {
    const prefix = settings.invoiceSettings.invoicePrefix || 'INV';
    const nextNumber = settings.invoiceSettings.nextInvoiceNumber || 1;
    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
  };

  const calculateInvoiceTotal = (items: InvoiceItem[]) => {
    return items.reduce((total, item) => total + item.amount, 0);
  };

  const handleCreateInvoice = () => {
    const invoice: Invoice = {
      id: `invoice-${Date.now()}`,
      number: generateInvoiceNumber(),
      clientId: newInvoice.clientId || '',
      date: newInvoice.date || new Date(),
      dueDate: newInvoice.dueDate || new Date(),
      items: newInvoice.items || [],
      total: calculateInvoiceTotal(newInvoice.items || []),
      status: 'draft',
      template: getDefaultTemplate()
    };

    const updatedInvoices = [...invoices, invoice];
    onInvoiceUpdate(updatedInvoices);
    setNewInvoice({ items: [], status: 'draft' });
    setActiveView('list');
  };

  const getDefaultTemplate = (): InvoiceTemplate => ({
    id: 'default',
    name: 'Professional',
    layout: 'professional',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      text: '#1e293b'
    },
    fields: [
      { name: 'companyName', label: 'Company Name', type: 'text', required: true, position: { x: 0, y: 0 } },
      { name: 'clientName', label: 'Client Name', type: 'text', required: true, position: { x: 0, y: 1 } },
      { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true, position: { x: 1, y: 0 } },
      { name: 'date', label: 'Date', type: 'date', required: true, position: { x: 1, y: 1 } }
    ]
  });

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    };

    setNewInvoice(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const handleUpdateItem = (itemId: string, updates: Partial<InvoiceItem>) => {
    const updatedItems = (newInvoice.items || []).map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        return updatedItem;
      }
      return item;
    });

    setNewInvoice(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedItems = (newInvoice.items || []).filter(item => item.id !== itemId);
    setNewInvoice(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    setIsLoading(true);
    try {
      // Integration with InvoiceToMe
      const invoiceData = {
        invoice_number: invoice.number,
        client_name: clients.find(c => c.id === invoice.clientId)?.name || '',
        client_email: clients.find(c => c.id === invoice.clientId)?.email || '',
        items: invoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        })),
        total: invoice.total,
        due_date: invoice.dueDate.toISOString(),
        template: invoice.template.name
      };

      // Simulate API call to InvoiceToMe
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedInvoices = invoices.map(inv => 
        inv.id === invoice.id ? { ...inv, status: 'sent' as const } : inv
      );
      onInvoiceUpdate(updatedInvoices);
      
      console.log('Invoice sent via InvoiceToMe:', invoiceData);
    } catch (error) {
      console.error('Failed to send invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInvoiceList = () => (
    <div className="invoice-list">
      <div className="list-header">
        <h3>Invoices</h3>
        <Button onClick={() => setActiveView('create')} className="primary">
          Create Invoice
        </Button>
      </div>
      
      <div className="invoice-filters">
        <select className="status-filter">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
      
      <div className="invoice-table">
        <div className="table-header">
          <div>Invoice #</div>
          <div>Client</div>
          <div>Date</div>
          <div>Due Date</div>
          <div>Amount</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        
        {invoices.map(invoice => {
          const client = clients.find(c => c.id === invoice.clientId);
          return (
            <div key={invoice.id} className="table-row">
              <div>{invoice.number}</div>
              <div>{client?.name || 'Unknown Client'}</div>
              <div>{invoice.date.toLocaleDateString()}</div>
              <div>{invoice.dueDate.toLocaleDateString()}</div>
              <div>${invoice.total.toFixed(2)}</div>
              <div>
                <span className={`status-badge ${invoice.status}`}>
                  {invoice.status}
                </span>
              </div>
              <div className="action-buttons">
                <Button 
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setActiveView('preview');
                  }}
                  className="small"
                >
                  View
                </Button>
                {invoice.status === 'draft' && (
                  <Button 
                    onClick={() => handleSendInvoice(invoice)}
                    className="small primary"
                    disabled={isLoading}
                  >
                    Send
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCreateInvoice = () => (
    <div className="create-invoice">
      <div className="form-header">
        <h3>Create New Invoice</h3>
        <Button onClick={() => setActiveView('list')} className="secondary">
          Back to List
        </Button>
      </div>
      
      <div className="invoice-form">
        <div className="form-section">
          <h4>Invoice Details</h4>
          <div className="form-row">
            <div className="form-field">
              <label>Client</label>
              <select 
                value={newInvoice.clientId || ''}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, clientId: e.target.value }))}
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Due Date</label>
              <input 
                type="date"
                value={newInvoice.dueDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => setNewInvoice(prev => ({ 
                  ...prev, 
                  dueDate: new Date(e.target.value) 
                }))}
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <div className="section-header">
            <h4>Invoice Items</h4>
            <Button onClick={handleAddItem} className="small">
              Add Item
            </Button>
          </div>
          
          <div className="items-table">
            <div className="items-header">
              <div>Description</div>
              <div>Quantity</div>
              <div>Rate</div>
              <div>Amount</div>
              <div>Actions</div>
            </div>
            
            {(newInvoice.items || []).map(item => (
              <div key={item.id} className="item-row">
                <input 
                  type="text"
                  value={item.description}
                  onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                  placeholder="Item description"
                />
                <input 
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleUpdateItem(item.id, { quantity: Number(e.target.value) })}
                  min="1"
                />
                <input 
                  type="number"
                  value={item.rate}
                  onChange={(e) => handleUpdateItem(item.id, { rate: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                />
                <div className="amount">${item.amount.toFixed(2)}</div>
                <Button 
                  onClick={() => handleRemoveItem(item.id)}
                  className="small danger"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          
          <div className="invoice-total">
            <strong>Total: ${calculateInvoiceTotal(newInvoice.items || []).toFixed(2)}</strong>
          </div>
        </div>
        
        <div className="form-actions">
          <Button onClick={handleCreateInvoice} className="primary">
            Create Invoice
          </Button>
          <Button onClick={() => setActiveView('list')} className="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  const renderInvoicePreview = () => {
    if (!selectedInvoice) return null;
    
    const client = clients.find(c => c.id === selectedInvoice.clientId);
    
    return (
      <div className="invoice-preview">
        <div className="preview-header">
          <h3>Invoice Preview</h3>
          <div className="preview-actions">
            <Button onClick={() => setActiveView('list')} className="secondary">
              Back
            </Button>
            {selectedInvoice.status === 'draft' && (
              <Button 
                onClick={() => handleSendInvoice(selectedInvoice)}
                className="primary"
                disabled={isLoading}
              >
                Send Invoice
              </Button>
            )}
          </div>
        </div>
        
        <div className="invoice-document">
          <div className="invoice-header">
            <div className="company-info">
              <h2>{settings.companyInfo.name}</h2>
              <p>{settings.companyInfo.address.street}</p>
              <p>{settings.companyInfo.address.city}, {settings.companyInfo.address.state} {settings.companyInfo.address.zipCode}</p>
              <p>{settings.companyInfo.email}</p>
            </div>
            <div className="invoice-info">
              <h3>Invoice #{selectedInvoice.number}</h3>
              <p>Date: {selectedInvoice.date.toLocaleDateString()}</p>
              <p>Due: {selectedInvoice.dueDate.toLocaleDateString()}</p>
              <span className={`status-badge ${selectedInvoice.status}`}>
                {selectedInvoice.status}
              </span>
            </div>
          </div>
          
          <div className="client-info">
            <h4>Bill To:</h4>
            <p>{client?.name}</p>
            {client?.company && <p>{client.company}</p>}
            {client?.address && (
              <>
                <p>{client.address.street}</p>
                <p>{client.address.city}, {client.address.state} {client.address.zipCode}</p>
              </>
            )}
            <p>{client?.email}</p>
          </div>
          
          <div className="invoice-items">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>${item.rate.toFixed(2)}</td>
                    <td>${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}><strong>Total</strong></td>
                  <td><strong>${selectedInvoice.total.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="invoicing-system">
      {activeView === 'list' && renderInvoiceList()}
      {activeView === 'create' && renderCreateInvoice()}
      {activeView === 'preview' && renderInvoicePreview()}
    </div>
  );
};