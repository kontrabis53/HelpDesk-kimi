import { useState } from 'react';
import type { Ticket, Document, InventoryItem, KnowledgeGuide } from '@/types';
import { useTickets } from '@/hooks/useTickets';
import { useDocuments } from '@/hooks/useDocuments';
import { useInventory } from '@/hooks/useInventory';
import { useKnowledge } from '@/hooks/useKnowledge';
import { useTheme } from '@/hooks/useTheme';
import { useRoles } from '@/hooks/useRoles';
import { BottomNav } from '@/components/BottomNav';
import { TicketListScreen } from '@/screens/TicketListScreen';
import { TicketDetailScreen } from '@/screens/TicketDetailScreen';
import { CreateTicketScreen } from '@/screens/CreateTicketScreen';
import { EditTicketScreen } from '@/screens/EditTicketScreen';
import { DocumentsScreen } from '@/screens/DocumentsScreen';
import { CreateDocumentScreen } from '@/screens/CreateDocumentScreen';
import { InventoryScreen } from '@/screens/InventoryScreen';
import { CreateInventoryScreen } from '@/screens/CreateInventoryScreen';
import { KnowledgeScreen } from '@/screens/KnowledgeScreen';
import { GuideDetailScreen } from '@/screens/GuideDetailScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { AdminScreen } from '@/screens/AdminScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import './App.css';

type ScreenType = 'tickets' | 'documents' | 'inventory' | 'knowledge' | 'profile' | 'admin' | 'settings' |
                  'ticket_detail' | 'create_ticket' | 'edit_ticket' | 'document_detail' | 
                  'create_document' | 'inventory_detail' | 'create_inventory' |
                  'guide_detail';

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('knowledge');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<KnowledgeGuide | null>(null);
  
  const { theme, toggleTheme } = useTheme();
  
  // Roles & Permissions
  const {
    roles,
    users,
    logs,
    currentUserWithRole,
    availableModules,
    hasPermission,
    createRole,
    updateRole,
    deleteRole,
    createUser,
    updateUser,
    deleteUser,
    addLog,
  } = useRoles();
  
  // Hooks
  const { 
    tickets, 
    ticketsByStatus, 
    getTicketById,
    createTicket,
    updateTicket,
    updateTicketStatus,
    assignTicket,
    getAvailableAssignees,
    deleteTicket,
    addComment,
    setFilter: setTicketFilter,
    stats: ticketStats 
  } = useTickets();

  const {
    documents,
    documentsByType,
    createDocument,
    setFilter: setDocumentFilter,
  } = useDocuments();

  const {
    items: inventoryItems,
    lowStockItems,
    stats: inventoryStats,
    addMovement,
    createItem,
    setFilter: setInventoryFilter,
  } = useInventory();

  const {
    guides,
    guidesByCategory,
    incrementViews,
    setFilter: setKnowledgeFilter,
  } = useKnowledge();

  // Check if user can access admin
  const canAccessAdmin = hasPermission('admin', 'view');

  // Navigation handlers
  const handleTabChange = (tab: 'tickets' | 'documents' | 'inventory' | 'knowledge' | 'profile' | 'admin') => {
    if (tab === 'admin' && !canAccessAdmin) {
      toast.error('Нет доступа', { description: 'У вас нет прав для доступа к этому модулю' });
      return;
    }
    setCurrentScreen(tab);
    setSelectedTicket(null);
    setSelectedGuide(null);
  };

  const handleBack = () => {
    if (currentScreen === 'edit_ticket' && selectedTicket) {
      setCurrentScreen('ticket_detail');
    } else if (selectedTicket) {
      setCurrentScreen('tickets');
      setSelectedTicket(null);
    } else if (selectedGuide) {
      setCurrentScreen('knowledge');
      setSelectedGuide(null);
    } else {
      const mainScreens: ScreenType[] = ['knowledge', 'tickets', 'documents', 'inventory', 'profile'];
      const currentIndex = mainScreens.indexOf(currentScreen);
      if (currentIndex > 0) {
        setCurrentScreen(mainScreens[currentIndex - 1]);
      } else {
        setCurrentScreen('knowledge');
      }
    }
  };

  const handleOpenSettings = () => {
    setCurrentScreen('settings');
  };

  // Ticket handlers
  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setCurrentScreen('ticket_detail');
  };

  const handleCreateTicket = (data: {
    title: string;
    description: string;
    category: import('@/types').TicketCategory;
    priority: import('@/types').TicketPriority;
  }) => {
    const newTicket = createTicket(data);
    addLog('ticket.created', 'ticket', newTicket.id, newTicket.number, `Создана заявка: ${newTicket.title}`);
    toast.success('Заявка создана', {
      description: `Заявка ${newTicket.number} успешно создана`,
    });
    setCurrentScreen('tickets');
  };

  const handleStatusChange = (ticketId: string, status: import('@/types').TicketStatus) => {
    updateTicketStatus(ticketId, status);
    const statusLabels: Record<string, string> = {
      new: 'Новая', in_progress: 'В работе', waiting: 'Ожидание',
      resolved: 'Решена', cancelled: 'Отменена',
    };
    addLog('ticket.status_changed', 'ticket', ticketId, undefined, `Статус изменен на "${statusLabels[status]}"`);
    toast.success('Статус обновлен', {
      description: `Заявка переведена в статус "${statusLabels[status]}"`,
    });
    const updatedTicket = getTicketById(ticketId);
    if (updatedTicket) setSelectedTicket(updatedTicket);
  };

  const handleAssignTicket = (ticketId: string, assigneeId: string) => {
    if (!assigneeId) {
      // Снять назначение
      assignTicket(ticketId, '');
      addLog('ticket.unassigned', 'ticket', ticketId, undefined, 'Исполнитель снят');
      toast.success('Исполнитель снят');
    } else {
      assignTicket(ticketId, assigneeId);
      const assignee = getAvailableAssignees().find(u => u.id === assigneeId);
      addLog('ticket.assigned', 'ticket', ticketId, undefined, `Назначен исполнитель: ${assignee?.name}`);
      toast.success('Исполнитель назначен', {
        description: assignee ? `${assignee.name} назначен исполнителем` : undefined,
      });
    }
    const updatedTicket = getTicketById(ticketId);
    if (updatedTicket) setSelectedTicket(updatedTicket);
  };

  const handleAddComment = (ticketId: string, text: string) => {
    addComment(ticketId, text);
    addLog('ticket.comment_added', 'ticket', ticketId, undefined, 'Добавлен комментарий');
    toast.success('Комментарий добавлен');
    const updatedTicket = getTicketById(ticketId);
    if (updatedTicket) setSelectedTicket(updatedTicket);
  };

  const handleEditTicket = () => {
    if (!selectedTicket) return;
    if (!hasPermission('tickets', 'edit')) {
      toast.error('Нет прав', { description: 'У вас нет прав для редактирования заявок' });
      return;
    }
    setCurrentScreen('edit_ticket');
  };

  const handleUpdateTicket = (ticketId: string, data: {
    title: string;
    description: string;
    category: import('@/types').TicketCategory;
    priority: import('@/types').TicketPriority;
  }) => {
    updateTicket(ticketId, data);
    addLog('ticket.updated', 'ticket', ticketId, undefined, `Заявка обновлена: ${data.title}`);
    toast.success('Заявка обновлена', {
      description: 'Изменения успешно сохранены',
    });
    const updatedTicket = getTicketById(ticketId);
    if (updatedTicket) {
      setSelectedTicket(updatedTicket);
      setCurrentScreen('ticket_detail');
    }
  };

  const handleDeleteTicket = (ticketId: string) => {
    const ticket = getTicketById(ticketId);
    deleteTicket(ticketId);
    addLog('ticket.deleted', 'ticket', ticketId, ticket?.number, `Удалена заявка: ${ticket?.title}`);
    toast.success('Заявка удалена');
    setCurrentScreen('tickets');
    setSelectedTicket(null);
  };

  // Document handlers
  const handleDocumentClick = (doc: Document) => {
    toast.info(doc.title, {
      description: `${doc.number} • ${doc.description.slice(0, 100)}...`,
    });
  };

  const handleCreateDocumentClick = () => {
    if (!hasPermission('documents', 'create')) {
      toast.error('Нет прав', { description: 'У вас нет прав для создания документов' });
      return;
    }
    setCurrentScreen('create_document');
  };

  const handleCreateDocument = (data: Parameters<typeof createDocument>[0]) => {
    const newDoc = createDocument(data);
    addLog('document.created', 'document', newDoc.id, newDoc.number, `Создан документ: ${newDoc.title}`);
    toast.success('Документ создан', {
      description: `Документ ${newDoc.number} успешно создан`,
    });
    setCurrentScreen('documents');
  };

  // Inventory handlers
  const handleInventoryClick = (item: InventoryItem) => {
    toast.info(item.name, {
      description: `На складе: ${item.quantity} шт. • Минимум: ${item.minQuantity} шт. • ${item.location}`,
    });
  };

  const handleAddMovement = (itemId: string, type: 'in' | 'out', quantity: number, reason: string) => {
    addMovement({ itemId, type, quantity, reason });
    const item = inventoryItems.find(i => i.id === itemId);
    addLog('inventory.movement', 'inventory', itemId, item?.name, `${type === 'in' ? 'Приход' : 'Расход'}: ${quantity} шт. - ${reason}`);
    toast.success(type === 'in' ? 'Приход оформлен' : 'Расход оформлен', {
      description: `${quantity} ед. - ${reason}`,
    });
  };

  const handleCreateInventoryClick = () => {
    if (!hasPermission('inventory', 'create')) {
      toast.error('Нет прав', { description: 'У вас нет прав для добавления товаров' });
      return;
    }
    setCurrentScreen('create_inventory');
  };

  const handleCreateInventory = (data: Parameters<typeof createItem>[0]) => {
    const newItem = createItem(data);
    addLog('inventory.created', 'inventory', newItem.id, newItem.name, `Добавлен товар: ${newItem.name}`);
    toast.success('Товар добавлен', {
      description: `${newItem.name} (${newItem.sku}) добавлен на склад`,
    });
    setCurrentScreen('inventory');
  };

  // Knowledge handlers
  const handleGuideClick = (guide: KnowledgeGuide) => {
    setSelectedGuide(guide);
    incrementViews(guide.id);
    setCurrentScreen('guide_detail');
  };

  const handleCreateTicketFromGuide = () => {
    setCurrentScreen('create_ticket');
    setSelectedGuide(null);
  };

  // Search handlers
  const handleTicketSearch = (query: string) => setTicketFilter({ search: query });
  const handleDocumentSearch = (query: string) => setDocumentFilter({ search: query });
  const handleInventorySearch = (query: string) => setInventoryFilter({ search: query });
  const handleKnowledgeSearch = (query: string) => setKnowledgeFilter({ search: query });
  const handleInventoryLowStock = (show: boolean) => setInventoryFilter({ lowStock: show });

  // Render screens
  const renderScreen = () => {
    switch (currentScreen) {
      case 'tickets':
        return (
          <TicketListScreen
            tickets={tickets}
            ticketsByStatus={ticketsByStatus}
            onTicketClick={handleTicketClick}
            onSearch={handleTicketSearch}
          />
        );
      case 'ticket_detail':
        if (!selectedTicket) return null;
        return (
          <TicketDetailScreen
            ticket={selectedTicket}
            onBack={handleBack}
            onStatusChange={handleStatusChange}
            onAddComment={handleAddComment}
            onEdit={handleEditTicket}
            onAssign={handleAssignTicket}
            availableAssignees={getAvailableAssignees()}
          />
        );
      case 'edit_ticket':
        if (!selectedTicket) return null;
        return (
          <EditTicketScreen
            ticket={selectedTicket}
            onBack={handleBack}
            onUpdate={handleUpdateTicket}
            onDelete={handleDeleteTicket}
          />
        );
      case 'create_ticket':
        return (
          <CreateTicketScreen
            onBack={handleBack}
            onSubmit={handleCreateTicket}
          />
        );
      case 'documents':
        return (
          <DocumentsScreen
            documents={documents}
            documentsByType={documentsByType}
            onDocumentClick={handleDocumentClick}
            onCreateClick={handleCreateDocumentClick}
            onSearch={handleDocumentSearch}
          />
        );
      case 'create_document':
        return (
          <CreateDocumentScreen
            onBack={handleBack}
            onSubmit={handleCreateDocument}
          />
        );
      case 'inventory':
        return (
          <InventoryScreen
            items={inventoryItems}
            lowStockItems={lowStockItems}
            _lowStockItems={lowStockItems}
            stats={inventoryStats}
            onItemClick={handleInventoryClick}
            onAddMovement={handleAddMovement}
            onCreateClick={handleCreateInventoryClick}
            onSearch={handleInventorySearch}
            onFilterLowStock={handleInventoryLowStock}
          />
        );
      case 'create_inventory':
        return (
          <CreateInventoryScreen
            onBack={handleBack}
            onSubmit={handleCreateInventory}
          />
        );
      case 'knowledge':
        return (
          <KnowledgeScreen
            guides={guides}
            guidesByCategory={guidesByCategory}
            onGuideClick={handleGuideClick}
            onSearch={handleKnowledgeSearch}
          />
        );
      case 'guide_detail':
        if (!selectedGuide) return null;
        return (
          <GuideDetailScreen
            guide={selectedGuide}
            onBack={handleBack}
            onCreateTicket={handleCreateTicketFromGuide}
          />
        );
      case 'profile':
        return (
          <ProfileScreen 
            stats={ticketStats} 
            theme={theme} 
            onToggleTheme={toggleTheme}
            onOpenSettings={handleOpenSettings}
            userRole={currentUserWithRole.role}
          />
        );
      case 'admin':
        return (
          <AdminScreen
            roles={roles}
            users={users}
            logs={logs}
            onCreateRole={createRole}
            onUpdateRole={updateRole}
            onDeleteRole={deleteRole}
            onCreateUser={createUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            onBack={handleBack}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        );
      default:
        return (
          <KnowledgeScreen
            guides={guides}
            guidesByCategory={guidesByCategory}
            onGuideClick={handleGuideClick}
            onSearch={handleKnowledgeSearch}
          />
        );
    }
  };

  const getActiveTab = (): 'tickets' | 'documents' | 'inventory' | 'knowledge' | 'profile' | 'admin' => {
    if (currentScreen === 'ticket_detail' || currentScreen === 'create_ticket' || currentScreen === 'edit_ticket') return 'tickets';
    if (currentScreen === 'document_detail' || currentScreen === 'create_document') return 'documents';
    if (currentScreen === 'inventory_detail' || currentScreen === 'create_inventory') return 'inventory';
    if (currentScreen === 'guide_detail') return 'knowledge';
    if (['tickets', 'documents', 'inventory', 'knowledge', 'profile', 'admin'].includes(currentScreen)) {
      return currentScreen as any;
    }
    return 'knowledge';
  };

  const showBottomNav = !['ticket_detail', 'create_ticket', 'edit_ticket', 'create_document', 'create_inventory', 'guide_detail', 'settings'].includes(currentScreen);

  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-950 relative">
      <div className="max-w-7xl mx-auto">
        {renderScreen()}
      </div>
      
      {showBottomNav && (
        <BottomNav 
          activeTab={getActiveTab()} 
          onTabChange={handleTabChange}
          availableModules={availableModules}
          canAccessAdmin={canAccessAdmin}
        />
      )}
      
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
