import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Key, Calendar, MessageCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays, parseISO, format } from 'date-fns';
import { useLicenseValidation } from '@/hooks/useLicenseValidation';

export const UserLicenseCardIOS = () => {
  // Component removed - license status now handled by license system only
  return null;
};