import { useState, useCallback, useMemo } from 'react';
import type { Ticket, TicketStatus, TicketFilter, TicketPriority, TicketCategory } from '@/types';
import { mockTickets, currentUser } from '@/data/mock';

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [filter, setFilter] = useState<TicketFilter>({});

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (filter.status && ticket.status !== filter.status) return false;
      if (filter.priority && ticket.priority !== filter.priority) return false;
      if (filter.category && ticket.category !== filter.category) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch = 
          ticket.number.toLowerCase().includes(searchLower) ||
          ticket.title.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tickets, filter]);

  const ticketsByStatus = useMemo(() => {
    return {
      all: filteredTickets,
      new: filteredTickets.filter(t => t.status === 'new'),
      in_progress: filteredTickets.filter(t => t.status === 'in_progress'),
      waiting: filteredTickets.filter(t => t.status === 'waiting'),
      resolved: filteredTickets.filter(t => t.status === 'resolved'),
    };
  }, [filteredTickets]);

  const getTicketById = useCallback((id: string) => {
    return tickets.find(t => t.id === id);
  }, [tickets]);

  const createTicket = useCallback((data: {
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
  }) => {
    const newTicket: Ticket = {
      id: Date.now().toString(),
      number: `#${1000 + tickets.length + 1}`,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: currentUser,
      comments: [],
    };
    setTickets(prev => [newTicket, ...prev]);
    return newTicket;
  }, [tickets.length]);

  const updateTicketStatus = useCallback((ticketId: string, newStatus: TicketStatus) => {
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return ticket;
    }));
  }, []);

  const assignTicket = useCallback((ticketId: string, _assigneeId: string) => {
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          assignee: currentUser,
          status: ticket.status === 'new' ? 'in_progress' : ticket.status,
          updatedAt: new Date().toISOString(),
        };
      }
      return ticket;
    }));
  }, []);

  const addComment = useCallback((ticketId: string, text: string) => {
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          comments: [
            ...ticket.comments,
            {
              id: Date.now().toString(),
              author: currentUser,
              text,
              createdAt: new Date().toISOString(),
            },
          ],
          updatedAt: new Date().toISOString(),
        };
      }
      return ticket;
    }));
  }, []);

  const getStats = useMemo(() => {
    return {
      total: tickets.length,
      new: tickets.filter(t => t.status === 'new').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      waiting: tickets.filter(t => t.status === 'waiting').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
    };
  }, [tickets]);

  return {
    tickets: filteredTickets,
    ticketsByStatus,
    filter,
    setFilter,
    getTicketById,
    createTicket,
    updateTicketStatus,
    assignTicket,
    addComment,
    stats: getStats,
  };
}
