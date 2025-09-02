const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// Helper function to build dynamic WHERE clause for invoices
function buildInvoiceWhereClause(filters, customerId) {
  const conditions = [`i.customer_id = ?`];
  const values = [customerId];

  if (filters.status) {
    conditions.push('i.status = ?');
    values.push(filters.status);
  }

  if (filters.date_from) {
    conditions.push('i.issue_date >= ?');
    values.push(filters.date_from);
  }

  if (filters.date_to) {
    conditions.push('i.issue_date <= ?');
    values.push(filters.date_to);
  }

  return {
    whereClause: 'WHERE ' + conditions.join(' AND '),
    values
  };
}

// Helper function to build ORDER BY clause for invoices
function buildInvoiceOrderByClause(sortBy, sortOrder) {
  const validSortFields = {
    'due_date': 'i.due_date',
    'issue_date': 'i.issue_date',
    'amount': 'i.total_amount',
    'created_at': 'i.created_at'
  };

  const field = validSortFields[sortBy] || 'i.due_date';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

  return `ORDER BY ${field} ${order}`;
}

// Get all invoices for the authenticated user
async function getInvoices(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      date_from,
      date_to,
      sort_by = 'due_date',
      sort_order = 'desc'
    } = req.query;

    const customerId = req.user.customerId;
    const offset = (page - 1) * limit;
    const filters = { status, date_from, date_to };
    
    const { whereClause, values } = buildInvoiceWhereClause(filters, customerId);
    const orderByClause = buildInvoiceOrderByClause(sort_by, sort_order);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM invoices i
      ${whereClause}
    `;
    
    const [countResult] = await mysql.execute(countQuery, values);
    const total = countResult[0].total;

    // Get paginated results
    const query = `
      SELECT 
        i.id,
        i.invoice_number,
        i.job_number,
        i.title,
        i.description,
        i.total_amount,
        i.status,
        i.issue_date,
        i.due_date,
        i.paid_date,
        i.payment_method,
        i.created_at
      FROM invoices i
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const [invoices] = await mysql.execute(query, [...values, parseInt(limit), offset]);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_invoices,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_invoices,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_invoices,
        SUM(COALESCE(total_amount, 0)) as total_amount,
        SUM(CASE WHEN status = 'paid' THEN COALESCE(total_amount, 0) ELSE 0 END) as total_paid,
        SUM(CASE WHEN status IN ('pending', 'overdue') THEN COALESCE(total_amount, 0) ELSE 0 END) as total_pending
      FROM invoices
      WHERE customer_id = ?
    `;

    const [summaryResult] = await mysql.execute(summaryQuery, [customerId]);
    const summary = summaryResult[0];

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    };

    res.json({
      success: true,
      message: 'Invoices retrieved successfully',
      data: {
        invoices,
        pagination,
        summary
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoices',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Get detailed information about a specific invoice
async function getInvoiceDetails(req, res) {
  try {
    const { id } = req.params;
    const customerId = req.user.customerId;

    // Get basic invoice information
    const invoiceQuery = `
      SELECT 
        i.*,
        c.first_name,
        c.last_name,
        c.company_name,
        j.title as job_title,
        j.description as job_description
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN jobs j ON i.job_id = j.id
      WHERE i.id = ? AND i.customer_id = ?
    `;

    const [invoices] = await mysql.execute(invoiceQuery, [id, customerId]);
    
    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
        error: 'INVOICE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const invoice = invoices[0];

    // Get line items
    const lineItemsQuery = `
      SELECT 
        description,
        quantity,
        unit,
        rate,
        amount,
        notes
      FROM invoice_line_items
      WHERE invoice_id = ?
      ORDER BY line_number ASC
    `;

    const [lineItems] = await mysql.execute(lineItemsQuery, [id]);

    // Get payment history
    const paymentHistoryQuery = `
      SELECT 
        payment_date,
        amount,
        payment_method,
        reference_number,
        notes
      FROM invoice_payments
      WHERE invoice_id = ?
      ORDER BY payment_date ASC
    `;

    const [paymentHistory] = await mysql.execute(paymentHistoryQuery, [id]);

    // Build comprehensive invoice object
    const invoiceData = {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      job_number: invoice.job_number,
      title: invoice.title || invoice.job_title,
      description: invoice.description || invoice.job_description,
      status: invoice.status,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      paid_date: invoice.paid_date,
      line_items: lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: parseFloat(item.rate || 0).toFixed(2),
        amount: parseFloat(item.amount || 0).toFixed(2)
      })),
      subtotal: parseFloat(invoice.subtotal || 0).toFixed(2),
      tax_amount: parseFloat(invoice.tax_amount || 0).toFixed(2),
      total_amount: parseFloat(invoice.total_amount || 0).toFixed(2),
      payment_terms: invoice.payment_terms || 'Net 14',
      payment_method: invoice.payment_method || 'not_specified',
      payment_reference: invoice.payment_reference || '',
      notes: invoice.notes || '',
      payment_history: paymentHistory.map(payment => ({
        payment_date: payment.payment_date,
        amount: parseFloat(payment.amount || 0).toFixed(2),
        payment_method: payment.payment_method,
        reference_number: payment.reference_number,
        notes: payment.notes
      }))
    };

    res.json({
      success: true,
      message: 'Invoice details retrieved successfully',
      data: {
        invoice: invoiceData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting invoice details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoice details',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Process payment for an invoice
async function payInvoice(req, res) {
  try {
    const { id } = req.params;
    const { payment_method, payment_reference, amount, notes } = req.body;
    const customerId = req.user.customerId;
    const userId = req.user.userId;

    // Check if invoice exists and belongs to user
    const invoiceQuery = `
      SELECT id, status, total_amount, paid_amount FROM invoices 
      WHERE id = ? AND customer_id = ?
    `;
    
    const [invoices] = await mysql.execute(invoiceQuery, [id, customerId]);
    
    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
        error: 'INVOICE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const invoice = invoices[0];

    // Check if invoice can be paid
    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid',
        error: 'INVOICE_ALREADY_PAID',
        timestamp: new Date().toISOString()
      });
    }

    if (invoice.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot pay cancelled invoice',
        error: 'INVALID_INVOICE_STATUS',
        timestamp: new Date().toISOString()
      });
    }

    // Validate payment amount
    const remainingAmount = parseFloat(invoice.total_amount || 0) - parseFloat(invoice.paid_amount || 0);
    if (amount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed remaining balance of $${remainingAmount.toFixed(2)}`,
        error: 'INVALID_PAYMENT_AMOUNT',
        timestamp: new Date().toISOString()
      });
    }

    // Record payment
    const paymentId = uuidv4();
    const recordPaymentQuery = `
      INSERT INTO invoice_payments (
        id, invoice_id, payment_date, amount, payment_method, 
        reference_number, notes, created_by, created_at
      ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, NOW())
    `;

    await mysql.execute(recordPaymentQuery, [
      paymentId,
      id,
      amount,
      payment_method,
      payment_reference || null,
      notes || null,
      userId
    ]);

    // Update invoice paid amount
    const newPaidAmount = parseFloat(invoice.paid_amount || 0) + parseFloat(amount);
    const updateInvoiceQuery = `
      UPDATE invoices 
      SET 
        paid_amount = ?,
        status = CASE WHEN ? >= total_amount THEN 'paid' ELSE 'partial' END,
        paid_date = CASE WHEN ? >= total_amount THEN NOW() ELSE paid_date END,
        updated_at = NOW()
      WHERE id = ?
    `;

    await mysql.execute(updateInvoiceQuery, [
      newPaidAmount,
      newPaidAmount,
      newPaidAmount,
      id
    ]);

    // Log activity
    const activityQuery = `
      INSERT INTO portal_activity_logs (id, user_id, customer_id, activity_type, description)
      VALUES (?, ?, ?, 'other', 'Invoice payment processed: $${amount} via ${payment_method}')
    `;

    await mysql.execute(activityQuery, [uuidv4(), userId, customerId]);

    res.json({
      success: true,
      message: 'Invoice payment processed successfully',
      data: {
        invoice_id: id,
        payment_status: newPaidAmount >= parseFloat(invoice.total_amount || 0) ? 'paid' : 'partial',
        paid_date: newPaidAmount >= parseFloat(invoice.total_amount || 0) ? new Date().toISOString() : null,
        payment_reference: payment_reference || paymentId,
        remaining_balance: Math.max(0, remainingAmount - amount).toFixed(2)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing invoice payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process invoice payment',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getInvoices,
  getInvoiceDetails,
  payInvoice
};
