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