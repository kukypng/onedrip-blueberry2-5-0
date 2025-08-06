interface BudgetData {
  id: string;
  device_model: string;
  device_type: string;
  
  part_type?: string;
  part_quality?: string;
  cash_price: number;
  installment_price?: number;
  installments?: number;
  total_price: number;
  warranty_months: number;
  payment_condition?: string;
  includes_delivery: boolean;
  includes_screen_protector: boolean;
  delivery_date?: string;
  notes?: string;
  status: string;
  workflow_status: string;
  created_at: string;
  valid_until: string;
  expires_at?: string;
}

export const generateWhatsAppMessage = (budget: BudgetData): string => {
  const createdDate = new Date(budget.created_at).toLocaleDateString('pt-BR');
  const validUntil = budget.valid_until ? new Date(budget.valid_until).toLocaleDateString('pt-BR') : 'Não definido';
  
  // Formatação de preços
  const totalPrice = (budget.total_price / 100).toLocaleString('pt-BR', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });
  
  const cashPrice = budget.cash_price ? (budget.cash_price / 100).toLocaleString('pt-BR', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }) : totalPrice;
  
  // Garantia
  const warrantyText = budget.warranty_months === 1 
    ? `${budget.warranty_months} mês` 
    : `${budget.warranty_months} meses`;

  // Seção de valores
  let valuesSection = `• *Total:* R$ ${totalPrice}`;
  if (budget.cash_price && budget.cash_price !== budget.total_price) {
    valuesSection += `\n• *À vista:* R$ ${cashPrice}`;
  }
  
  if (budget.installment_price && budget.installments && budget.installments > 1) {
    const installmentPrice = (budget.installment_price / 100).toLocaleString('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
    valuesSection += `\n• *Parcelado:* R$ ${installmentPrice} em até ${budget.installments}x no cartão`;
  }

  // Qualidade da peça e observações
  let qualityInfo = budget.part_quality ? `*Qualidade da peça:* ${budget.part_quality}` : '';
  let obsInfo = budget.notes ? `\n*Obs:* ${budget.notes}` : '';

  // Serviços inclusos
  let includedServices = '';
  const services = [];
  if (budget.includes_delivery) {
    services.push('▪︎ Busca e entrega');
  }
  if (budget.includes_screen_protector) {
    services.push('▪︎ Película 3D de brinde');
  }
  
  if (services.length > 0) {
    includedServices = `\n\n📦 *Serviços inclusos:*\n${services.join('\n')}`;
  }

  const message = `● *Criado em:* ${createdDate}
● *Válido até:* ${validUntil}

*Aparelho:* ${budget.device_model}
${qualityInfo}${obsInfo}

💰 *VALORES*
${valuesSection}

✅️ *Garantia:* ${warrantyText}
🚫 *Não cobre danos por água ou quedas*${includedServices}`;

  return message;
};

// Função para limpar referências antigas de abas do WhatsApp
export const cleanupWhatsAppTabReferences = () => {
  try {
    const whatsappTabKey = 'whatsapp_tab_reference';
    const storedTabId = sessionStorage.getItem(whatsappTabKey);
    
    if (storedTabId) {
      try {
        const existingTab = window.open('', storedTabId);
        if (!existingTab || existingTab.closed) {
          sessionStorage.removeItem(whatsappTabKey);
        } else {
          existingTab.close();
        }
      } catch (error) {
        sessionStorage.removeItem(whatsappTabKey);
      }
    }
  } catch (error) {
    console.warn('Erro ao limpar referências do WhatsApp:', error);
  }
};

// Função universal para abrir WhatsApp de forma otimizada
export const openWhatsApp = (url: string, message?: string) => {
  if (message) {
    // Se há uma mensagem, usar a função de compartilhamento otimizada
    shareViaWhatsApp(message);
  } else {
    // Para URLs diretas (como contato de suporte), tentar reutilizar aba
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasPWA = detectWhatsAppPWA();
    
    if (hasPWA) {
      window.location.href = url;
    } else if (isMobile && url.includes('wa.me')) {
      // Para mobile, tentar app nativo primeiro
      const nativeUrl = url.replace('https://wa.me/', 'whatsapp://send?phone=');
      window.location.href = nativeUrl;
      
      // Fallback para web após delay
      setTimeout(() => {
        if (!tryReuseWhatsAppTab(url)) {
          window.open(url, '_blank');
        }
      }, 1500);
    } else {
      // Para desktop ou URLs web, tentar reutilizar aba
      if (!tryReuseWhatsAppTab(url)) {
        window.open(url, '_blank');
      }
    }
  }
};

// Função para detectar se o PWA do WhatsApp está disponível
const detectWhatsAppPWA = (): boolean => {
  try {
    // Verificar se está rodando como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;
    
    // Verificar se há evidências do PWA do WhatsApp
    const userAgent = navigator.userAgent.toLowerCase();
    const hasWhatsAppPWA = userAgent.includes('whatsapp') || 
                          document.title.toLowerCase().includes('whatsapp') ||
                          window.location.hostname.includes('web.whatsapp.com');
    
    return (isStandalone || isInWebAppiOS || isInWebAppChrome) && hasWhatsAppPWA;
  } catch (error) {
    return false;
  }
};

// Função para tentar reutilizar aba existente do WhatsApp
const tryReuseWhatsAppTab = (url: string): boolean => {
  try {
    // Verificar se há uma aba do WhatsApp já aberta
    const whatsappTabKey = 'whatsapp_tab_reference';
    const storedTabId = sessionStorage.getItem(whatsappTabKey);
    
    if (storedTabId) {
      try {
        // Tentar focar na aba existente (funciona apenas se for do mesmo domínio)
        const existingTab = window.open('', storedTabId);
        if (existingTab && !existingTab.closed) {
          existingTab.location.href = url;
          existingTab.focus();
          return true;
        }
      } catch (error) {
        // Se falhar, remover a referência inválida
        sessionStorage.removeItem(whatsappTabKey);
      }
    }
    
    // Se não conseguiu reutilizar, abrir nova aba e salvar referência
    const newTab = window.open(url, 'whatsapp_tab');
    if (newTab) {
      sessionStorage.setItem(whatsappTabKey, 'whatsapp_tab');
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('Erro ao tentar reutilizar aba do WhatsApp:', error);
    return false;
  }
};

export const shareViaWhatsApp = (message: string) => {
  const encodedMessage = encodeURIComponent(message);
  
  // Detectar se é mobile para usar o app nativo ou web
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hasPWA = detectWhatsAppPWA();
  
  // Se já estamos no PWA do WhatsApp, usar a mesma janela
  if (hasPWA) {
    const webUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
    window.location.href = webUrl;
    return;
  }
  
  if (isMobile) {
    // Para mobile, tentar app nativo primeiro
    const nativeUrl = `whatsapp://send?text=${encodedMessage}`;
    
    // Tentar abrir o app nativo
    window.location.href = nativeUrl;
    
    // Fallback para WhatsApp Web após um delay se o app não abrir
    setTimeout(() => {
      const webUrl = `https://wa.me/?text=${encodedMessage}`;
      if (!tryReuseWhatsAppTab(webUrl)) {
        window.open(webUrl, '_blank');
      }
    }, 1500);
  } else {
    // Para desktop, tentar reutilizar aba existente primeiro
    const webUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
    
    // Tentar reutilizar aba existente
    if (!tryReuseWhatsAppTab(webUrl)) {
      // Se não conseguir reutilizar, abrir normalmente
      window.open(webUrl, '_blank');
    }
  }
};

export const sharePDFViaWhatsApp = async (pdfBlob: Blob, message: string) => {
  try {
    // Verificar se a Web Share API está disponível
    if (navigator.share && navigator.canShare) {
      const file = new File([pdfBlob], 'orcamento.pdf', { type: 'application/pdf' });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Orçamento',
          text: message,
          files: [file]
        });
        return;
      }
    }

    // Fallback: criar URL temporária para download e abrir WhatsApp
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = pdfUrl;
    downloadLink.download = `orcamento-${new Date().toISOString().split('T')[0]}.pdf`;
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Aguardar um pouco e abrir WhatsApp
    setTimeout(() => {
      const encodedMessage = encodeURIComponent(`${message}\n\n `);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      
      // Tentar reutilizar aba existente
      if (!tryReuseWhatsAppTab(whatsappUrl)) {
        window.open(whatsappUrl, '_blank');
      }
      
      URL.revokeObjectURL(pdfUrl);
    }, 1000);
    
  } catch (error) {
    console.error('Erro ao compartilhar PDF:', error);
    // Fallback para o método tradicional
    shareViaWhatsApp(message);
  }
};
