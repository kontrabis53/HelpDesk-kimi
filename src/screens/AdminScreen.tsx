import { useState } from 'react';
import type { Role, UserWithRole, ActivityLog } from '@/types/roles';
import { moduleLabels, actionLabels } from '@/types/roles';
import { 
  Users, 
  Shield, 
  ScrollText, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type AdminTab = 'users' | 'roles' | 'logs' | 'settings';

interface AdminScreenProps {
  roles: Role[];
  users: UserWithRole[];
  logs: ActivityLog[];
  onCreateRole: (_role: Omit<Role, 'id'>) => void;
  onUpdateRole: (_roleId: string, _data: Partial<Role>) => void;
  onDeleteRole: (roleId: string) => void;
  onCreateUser: (_user: Omit<UserWithRole, 'id' | 'createdAt'>) => void;
  onUpdateUser: (_userId: string, _data: Partial<UserWithRole>) => void;
  onDeleteUser: (userId: string) => void;
}

export function AdminScreen({
  roles,
  users,
  logs,
  onCreateRole: _onCreateRole,
  onUpdateRole: _onUpdateRole,
  onDeleteRole,
  onCreateUser: _onCreateUser,
  onUpdateUser: _onUpdateUser,
  onDeleteUser,
}: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [, setEditingRole] = useState<Role | null>(null);
  const [, setEditingUser] = useState<UserWithRole | null>(null);
  const [, setShowRoleForm] = useState(false);
  const [, setShowUserForm] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const tabs = [
    { id: 'users' as const, label: 'Пользователи', icon: Users },
    { id: 'roles' as const, label: 'Роли', icon: Shield },
    { id: 'logs' as const, label: 'Логи', icon: ScrollText },
  ];

  // Filter users
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter logs
  const filteredLogs = logs.filter(l =>
    l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.details?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 50);

  const getRoleById = (roleId: string) => roles.find(r => r.id === roleId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 pt-4 pb-2 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Управление</h1>
        
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-5xl mx-auto">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Пользователи ({filteredUsers.length})
              </h2>
              <Button onClick={() => setShowUserForm(true)} size="sm" className="bg-blue-600">
                <Plus className="w-4 h-4 mr-1" />
                Добавить
              </Button>
            </div>

            {filteredUsers.map((user) => {
              const role = getRoleById(user.roleId);
              return (
                <div
                  key={user.id}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{user.name}</span>
                          {!user.isActive && (
                            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded">
                              Неактивен
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {user.email} • {user.department}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span 
                            className="text-xs px-2 py-0.5 rounded text-white"
                            style={{ backgroundColor: role?.color || '#6B7280' }}
                          >
                            {role?.name || 'Нет роли'}
                          </span>
                          {user.lastLogin && (
                            <span className="text-xs text-slate-400">
                              Последний вход: {formatDate(user.lastLogin)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Роли ({roles.length})
              </h2>
              <Button onClick={() => setShowRoleForm(true)} size="sm" className="bg-blue-600">
                <Plus className="w-4 h-4 mr-1" />
                Создать роль
              </Button>
            </div>

            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden"
              >
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{role.name}</span>
                      {role.isSystem && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                          Системная
                        </span>
                      )}
                      <p className="text-sm text-slate-500 dark:text-slate-400">{role.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!role.isSystem && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRole(role);
                          }}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRole(role.id);
                          }}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </>
                    )}
                    {expandedRole === role.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Permissions */}
                {expandedRole === role.id && (
                  <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="pt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {role.permissions.map((perm) => (
                        <div 
                          key={perm.moduleId}
                          className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                        >
                          <div className="font-medium text-sm text-slate-700 dark:text-slate-200 mb-1">
                            {moduleLabels[perm.moduleId]}
                          </div>
                          <div className="flex gap-1">
                            {perm.canView && (
                              <span className="text-xs px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded">
                                <Eye className="w-3 h-3 inline" />
                              </span>
                            )}
                            {perm.canCreate && (
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                                +Созд
                              </span>
                            )}
                            {perm.canEdit && (
                              <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">
                                <Edit2 className="w-3 h-3 inline" />
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Журнал действий ({filteredLogs.length})
            </h2>

            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-700 dark:text-slate-200">
                          {log.userName}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {log.details || actionLabels[log.action] || log.action}
                      </p>
                      {log.entityName && (
                        <span className="text-xs text-slate-400 mt-1 inline-block">
                          {log.entityName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
