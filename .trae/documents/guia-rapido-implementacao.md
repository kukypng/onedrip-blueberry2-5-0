# Guia Rápido - Implementação Mercado Pago Checkout Pro

## 🚀 Início Rápido (30 minutos)

### 1. Preparação (5 min)

```bash
# 1. Criar conta no Mercado Pago Developers
# https://www.mercadopago.com.br/developers

# 2. Obter credenciais de teste
# Public Key: APP_USR-76038cfd-697e-4b41-84c8-b18b9cd89718
# Access Token: APP_USR-8120023529844667-081209-830b7ffb7e3e12cf673c35d8b4385359-2495642905
```

### 2. Configuração Backend (10 min)

```bash
# Criar pasta backend
mkdir backend
cd backend
npm init -y

# Instalar dependências essenciais
npm install express cors dotenv mercadopago @supabase/supabase-js
npm install -D typescript @types/express @types/cors tsx

# Criar estrutura básica
mkdir src src/controllers src/services src/routes
```

**Arquivo mínimo:** `backend/src/app.ts`

```typescript
import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const app = express();
app.use(cors());
app.use(express.json());

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!
});

app.post('/api/payment/create-preference', async (req, res) => {
  try {
    const preference = new Preference(client);
    const { planType, isVip, userEmail } = req.body;
    
    const price = planType === 'monthly' ? 68.90 : 638.55;
    
    const result = await preference.create({
      body: {
        items: [{
          title: `OneDrip - Plano ${planType}`,
          quantity: 1,
          unit_price: price
        }],
        payer: { email: userEmail },
        back_urls: {
          success: 'http://localhost:5173/payment/success',
          failure: 'http://localhost:5173/payment/failure'
        }
      }
    });
    
    res.json({
      preferenceId: result.id,
      initPoint: result.init_point
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar preferência' });
  }
});

app.listen(3001, () => console.log('Backend rodando na porta 3001'));
```

**Variáveis de ambiente:** `backend/.env`

```bash
MERCADOPAGO_ACCESS_TOKEN=TEST-seu-access-token-aqui
PORT=3001
```

### 3. Configuração Frontend (10 min)

```bash
# No diretório do projeto React
npm install axios
```

**Serviço de pagamento:** `src/services/paymentService.ts`

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:3001';

export const createPayment = async (data: {
  planType: 'monthly' | 'yearly';
  isVip: boolean;
  userEmail: string;
}) => {
  const response = await axios.post(`${API_URL}/api/payment/create-preference`, data);
  return response.data;
};

export const redirectToCheckout = (initPoint: string) => {
  window.location.href = initPoint;
};
```

### 4. Modificar PlanCard (5 min)

**Atualizar:** `src/plans/components/PlanCard.tsx`

```typescript
// Adicionar no início do arquivo
import { createPayment, redirectToCheckout } from '../../services/paymentService';
import { useState } from 'react';

// Dentro do componente PlanCard
const [loading, setLoading] = useState(false);

const handlePayment = async () => {
  setLoading(true);
  try {
    const result = await createPayment({
      planType: plano.tipo, // 'monthly' ou 'yearly'
      isVip: isVip || false,
      userEmail: 'user@example.com' // Obter do contexto de auth
    });
    
    redirectToCheckout(result.initPoint);
  } catch (error) {
    console.error('Erro no pagamento:', error);
    alert('Erro ao processar pagamento');
  } finally {
    setLoading(false);
  }
};

// Substituir o botão existente por:
<button 
  onClick={handlePayment}
  disabled={loading}
  className="btn-primary"
>
  {loading ? 'Processando...' : plano.textoBotao}
</button>
```

## ⚡ Teste Rápido

### 1. Iniciar serviços

```bash
# Terminal 1 - Backend
cd backend
npx tsx src/app.ts

# Terminal 2 - Frontend
npm run dev
```

### 2. Testar fluxo

1. Abrir `http://localhost:5173/plans`
2. Clicar em "Assinar Agora"
3. Verificar redirecionamento para Mercado Pago
4. Usar cartão de teste: `4509 9535 6623 3704`

## 🔧 Configuração Completa (Opcional)

### Banco de Dados Supabase

```sql
-- Executar no SQL Editor do Supabase
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    mercadopago_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Webhook (Produção)

```typescript
// Adicionar no backend/src/app.ts
app.post('/api/webhook', (req, res) => {
  console.log('Webhook recebido:', req.body);
  
  // Processar notificação do Mercado Pago
  const { type, action, data } = req.body;
  
  if (type === 'payment' && action === 'payment.updated') {
    // Atualizar status do pagamento no banco
    console.log('Pagamento atualizado:', data.id);
  }
  
  res.status(200).json({ success: true });
});
```

### Páginas de Status

**Success:** `src/pages/PaymentSuccess.tsx`

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const PaymentSuccess = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          ✅ Pagamento Aprovado!
        </h1>
        <p className="mb-6">Seu plano foi ativado com sucesso.</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          Ir para Dashboard
        </button>
      </div>
    </div>
  );
};
```

**Failure:** `src/pages/PaymentFailure.tsx`

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const PaymentFailure = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          ❌ Pagamento Rejeitado
        </h1>
        <p className="mb-6">Houve um problema com seu pagamento.</p>
        <button 
          onClick={() => navigate('/plans')}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
};
```

### Rotas (React Router)

```typescript
// Adicionar no App.tsx ou router
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentFailure } from './pages/PaymentFailure';

// Adicionar rotas:
<Route path="/payment/success" element={<PaymentSuccess />} />
<Route path="/payment/failure" element={<PaymentFailure />} />
```

## 🚀 Deploy Rápido

### Backend (Vercel)

```bash
cd backend
npm install -g vercel
vercel

# Configurar variáveis de ambiente na Vercel:
# MERCADOPAGO_ACCESS_TOKEN=TEST-xxx
```

### Frontend (Vercel/Netlify)

```bash
# Atualizar .env
VITE_API_URL=https://kuky.pro

# Deploy
vercel
```

## 📋 Checklist Final

* [ ] ✅ Credenciais do Mercado Pago configuradas

* [ ] ✅ Backend rodando na porta 3001

* [ ] ✅ Frontend conectando com backend

* [ ] ✅ Botão de pagamento funcionando

* [ ] ✅ Redirecionamento para Mercado Pago

* [ ] ✅ Páginas de sucesso/erro criadas

* [ ] ✅ Teste com cartão de teste realizado

* [ ] ✅ Deploy em produção (opcional)

* [ ] ✅ Webhook configurado (produção)

## 🔍 Troubleshooting

### Erro CORS

```typescript
// backend/src/app.ts
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Erro de credenciais

```bash
# Verificar se as variáveis estão corretas
echo $MERCADOPAGO_ACCESS_TOKEN

# Deve começar com TEST- para ambiente de teste
```

### Erro de redirecionamento

```typescript
// Verificar se as back_urls estão corretas
back_urls: {
  success: 'http://localhost:5173/payment/success',
  failure: 'http://localhost:5173/payment/failure'
}
```

## 📞 Suporte

* **Documentação Mercado Pago:** <https://www.mercadopago.com.br/developers>

* **Cartões de teste:** <https://www.mercadopago.com.br/developers/pt/docs/testing/test-cards>

* **Status de pagamento:** <https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/payment-status>

***

**🎯 Meta:** Implementação funcional em 30 minutos para testes básicos, implementação completa em 2-3 horas.
