import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useServiceTypes() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceTypes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setServiceTypes(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tipos de serviço';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createServiceType = async (serviceType: Omit<ServiceType, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('service_types')
        .insert([serviceType])
        .select()
        .single();

      if (error) throw error;

      setServiceTypes(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
      toast.success('Tipo de serviço criado com sucesso!');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar tipo de serviço';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateServiceType = async (id: string, updates: Partial<ServiceType>) => {
    try {
      const { data, error } = await supabase
        .from('service_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setServiceTypes(prev => 
        prev.map(item => item.id === id ? data : item)
          .sort((a, b) => a.sort_order - b.sort_order)
      );
      toast.success('Tipo de serviço atualizado com sucesso!');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar tipo de serviço';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteServiceType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('service_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setServiceTypes(prev => prev.filter(item => item.id !== id));
      toast.success('Tipo de serviço removido com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover tipo de serviço';
      toast.error(errorMessage);
      throw err;
    }
  };

  const reorderServiceTypes = async (reorderedTypes: ServiceType[]) => {
    try {
      const updates = reorderedTypes.map((type, index) => ({
        id: type.id,
        sort_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('service_types')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      setServiceTypes(reorderedTypes);
      toast.success('Ordem dos tipos de serviço atualizada!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reordenar tipos de serviço';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  return {
    serviceTypes,
    loading,
    error,
    fetchServiceTypes,
    refreshServiceTypes: fetchServiceTypes, // Alias para compatibilidade
    createServiceType,
    updateServiceType,
    deleteServiceType,
    reorderServiceTypes,
  };
}