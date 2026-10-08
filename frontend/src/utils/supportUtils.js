export const getSupportTickets = () => {
  try {
    const saved = localStorage.getItem('ic_support_tickets');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

export const saveSupportTicket = (ticket) => {
  try {
    const tickets = getSupportTickets();
    const newTicket = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'Open',
      ...ticket,
    };
    tickets.unshift(newTicket);
    localStorage.setItem('ic_support_tickets', JSON.stringify(tickets));
    return newTicket;
  } catch { return null; }
};

export const updateTicketStatus = (id, status) => {
  try {
    const tickets = getSupportTickets().map(t =>
      t.id === id ? { ...t, status, resolvedAt: new Date().toISOString() } : t
    );
    localStorage.setItem('ic_support_tickets', JSON.stringify(tickets));
  } catch {}
};
