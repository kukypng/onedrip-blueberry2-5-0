import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WhatsAppSettings {
  id: string;
  phone_number: string;
  welcome_message: string;
  message_template?: string;
  is_active: boolean;
  is_enabled?: boolean;
  enabled?: boolean;
  auto_open?: boolean;
  country_code?: string;
  created_at: string;
  updated_at: string;
}

export function useWhatsAppSettings() {
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsAppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWhatsAppSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

      setWhatsappSettings(data || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar configurações do WhatsApp';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createWhatsAppSettings = async (settings: Omit<WhatsAppSettings, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Desativar configurações existentes
      await supabase
        .from('whatsapp_settings')
        .update({ is_active: false })
        .eq('is_active', true);

      const { data, error } = await supabase
        .from('whatsapp_settings')
        .insert([settings])
        .select()
        .single();

      if (error) throw error;

      setWhatsappSettings(data);
      toast.success('Configurações do WhatsApp criadas com sucesso!');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar configurações do WhatsApp';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateWhatsAppSettings = async (updates: Partial<WhatsAppSettings>) => {
    try {
      if (!whatsappSettings) {
        throw new Error('Nenhuma configuração encontrada para atualizar');
      }

      const { data, error } = await supabase
        .from('whatsapp_settings')
        .update(updates)
        .eq('id', whatsappSettings.id)
        .select()
        .single();

      if (error) throw error;

      setWhatsappSettings(data);
      toast.success('Configurações do WhatsApp atualizadas com sucesso!');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar configurações do WhatsApp';
      toast.error(errorMessage);
      throw err;
    }
  };

  const generateShareLink = async (serviceOrderId: string, shareUrl: string): Promise<string> => {
    try {
      if (!whatsappSettings) {
        throw new Error('Configurações do WhatsApp não encontradas');
      }

      const message = whatsappSettings.message_template || whatsappSettings.welcome_message || 
        `Olá! Você pode acompanhar o status do seu serviço através deste link: ${shareUrl}`;
      
      return message.replace('{shareUrl}', shareUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar mensagem do WhatsApp';
      toast.error(errorMessage);
      throw err;
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Adiciona o código do país se não estiver presente
    if (!cleaned.startsWith('55') && cleaned.length === 11) {
      return `+55${cleaned}`;
    }
    
    if (!cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return cleaned;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    // Validação básica para números brasileiros
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const openWhatsApp = (message: string = '') => {
    if (!whatsappSettings) {
      toast.error('Configurações do WhatsApp não encontradas');
      return;
    }

    const phone = whatsappSettings.phone_number.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message || whatsappSettings.welcome_message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  useEffect(() => {
    fetchWhatsAppSettings();
  }, []);

  return {
    settings: whatsappSettings,
    loading,
    error,
    fetchWhatsAppSettings,
    refreshSettings: fetchWhatsAppSettings,
    createSettings: createWhatsAppSettings,
    updateSettings: updateWhatsAppSettings,
    generateShareLink,
    formatPhoneNumber,
    validatePhoneNumber,
    openWhatsApp
  };
}