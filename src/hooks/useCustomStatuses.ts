import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomStatus {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  status_type: 'default' | 'custom';
  next_status_id?: string;
  created_at: string;
  updated_at: string;
}

export function useCustomStatuses() {
  const [customStatuses, setCustomStatuses] = useState<CustomStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomStatuses = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('custom_statuses')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setCustomStatuses(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar status personalizados';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createCustomStatus = async (status: Omit<CustomStatus, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('custom_statuses')
        .insert([status])
        .select()
        .single();

      if (error) throw error;

      setCustomStatuses(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
      toast.success('Status personalizado criado com sucesso!');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar status personalizado';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateCustomStatus = async (id: string, updates: Partial<CustomStatus>) => {
    try {
      const { data, error } = await supabase
        .from('custom_statuses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCustomStatuses(prev => 
        prev.map(item => item.id === id ? data : item)
          .sort((a, b) => a.sort_order - b.sort_order)
      );
      toast.success('Status personalizado atualizado com sucesso!');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar status personalizado';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteCustomStatus = async (id: string) => {
    try {
      // Verificar se é um status padrão do sistema
      const status = customStatuses.find(s => s.id === id);
      if (status?.status_type === 'default') {
        toast.error('Não é possível remover status padrão do sistema');
        return;
      }

      const { error } = await supabase
        .from('custom_statuses')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setCustomStatuses(prev => prev.filter(item => item.id !== id));
      toast.success('Status personalizado removido com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover status personalizado';
      toast.error(errorMessage);
      throw err;
    }
  };

  const reorderCustomStatuses = async (reorderedStatuses: CustomStatus[]) => {
    try {
      const updates = reorderedStatuses.map((status, index) => ({
        id: status.id,
        sort_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('custom_statuses')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      setCustomStatuses(reorderedStatuses);
      toast.success('Ordem dos status atualizada!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reordenar status';
      toast.error(errorMessage);
      throw err;
    }
  };

  const getNextStatus = (currentStatusId: string): CustomStatus | null => {
    const currentStatus = customStatuses.find(s => s.id === currentStatusId);
    if (!currentStatus?.next_status_id) return null;
    
    return customStatuses.find(s => s.id === currentStatus.next_status_id) || null;
  };

  const getStatusByName = (name: string): CustomStatus | null => {
    return customStatuses.find(s => s.name.toLowerCase() === name.toLowerCase()) || null;
  };

  const getDefaultStatuses = (): CustomStatus[] => {
    return customStatuses.filter(s => s.status_type === 'default');
  };

  const getCustomStatuses = (): CustomStatus[] => {
    return customStatuses.filter(s => s.status_type === 'custom');
  };

  useEffect(() => {
    fetchCustomStatuses();
  }, []);

  return {
    customStatuses,
    loading,
    error,
    fetchCustomStatuses,
    refreshCustomStatuses: fetchCustomStatuses, // Alias for compatibility
    createCustomStatus,
    updateCustomStatus,
    deleteCustomStatus,
    reorderCustomStatuses,
    getNextStatus,
    getStatusByName,
    getDefaultStatuses,
    getCustomStatuses
  };
}