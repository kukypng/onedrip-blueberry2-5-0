/**
 * VALIDAÇÃO SEGURA DE ARQUIVOS - FRONTEND
 * Sistema de validação rigorosa para uploads
 * Implementa múltiplas camadas de verificação
 */

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  sanitizedFile?: File;
}

export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  requireImageDimensions?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  scanForMalware?: boolean;
}

// Configurações padrão de segurança
const DEFAULT_OPTIONS: Required<FileValidationOptions> = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.txt', '.doc', '.docx'],
  requireImageDimensions: true,
  maxWidth: 4096,
  maxHeight: 4096,
  scanForMalware: true
};

// Assinaturas de arquivos conhecidas (magic numbers)
const FILE_SIGNATURES: Record<string, number[]> = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
};

// Padrões suspeitos que podem indicar malware
const SUSPICIOUS_PATTERNS = [
  /<script[^>]*>/i,
  /javascript:/i,
  /vbscript:/i,
  /onload=/i,
  /onerror=/i,
  /eval\(/i,
  /document\./i,
  /window\./i,
  /<iframe[^>]*>/i,
  /<object[^>]*>/i,
  /<embed[^>]*>/i
];

/**
 * Valida um arquivo com verificações de segurança rigorosas
 */
export async function validateFileSecurely(
  file: File, 
  options: Partial<FileValidationOptions> = {}
): Promise<FileValidationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const warnings: string[] = [];

  try {
    // 1. Verificações básicas
    const basicValidation = validateBasicProperties(file, opts);
    if (!basicValidation.isValid) {
      return basicValidation;
    }

    // 2. Verificar assinatura do arquivo
    const signatureValidation = await validateFileSignature(file);
    if (!signatureValidation.isValid) {
      return signatureValidation;
    }

    // 3. Verificar conteúdo suspeito
    if (opts.scanForMalware) {
      const malwareValidation = await scanForSuspiciousContent(file);
      if (!malwareValidation.isValid) {
        return malwareValidation;
      }
      if (malwareValidation.warnings) {
        warnings.push(...malwareValidation.warnings);
      }
    }

    // 4. Validar dimensões de imagem se necessário
    if (opts.requireImageDimensions && file.type.startsWith('image/')) {
      const dimensionValidation = await validateImageDimensions(file, opts);
      if (!dimensionValidation.isValid) {
        return dimensionValidation;
      }
      if (dimensionValidation.warnings) {
        warnings.push(...dimensionValidation.warnings);
      }
    }

    // 5. Sanitizar nome do arquivo
    const sanitizedFile = sanitizeFileName(file);

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      sanitizedFile
    };

  } catch (error) {
    console.error('Erro na validação de arquivo:', error);
    return {
      isValid: false,
      error: 'Erro interno na validação do arquivo'
    };
  }
}

/**
 * Validações básicas de propriedades do arquivo
 */
function validateBasicProperties(
  file: File, 
  options: Required<FileValidationOptions>
): FileValidationResult {
  // Verificar se o arquivo existe
  if (!file) {
    return { isValid: false, error: 'Nenhum arquivo fornecido' };
  }

  // Verificar tamanho
  if (file.size === 0) {
    return { isValid: false, error: 'Arquivo está vazio ou corrompido' };
  }

  if (file.size > options.maxSize) {
    const maxSizeMB = Math.round(options.maxSize / (1024 * 1024));
    return { 
      isValid: false, 
      error: `Arquivo muito grande. Tamanho máximo permitido: ${maxSizeMB}MB` 
    };
  }

  // Verificar tipo MIME
  if (!options.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Tipo de arquivo não permitido: ${file.type}. Tipos aceitos: ${options.allowedTypes.join(', ')}`
    };
  }

  // Verificar extensão
  const extension = getFileExtension(file.name).toLowerCase();
  if (!options.allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `Extensão de arquivo não permitida: ${extension}. Extensões aceitas: ${options.allowedExtensions.join(', ')}`
    };
  }

  // Verificar nome do arquivo
  if (file.name.length > 255) {
    return {
      isValid: false,
      error: 'Nome do arquivo muito longo (máximo 255 caracteres)'
    };
  }

  // Verificar caracteres suspeitos no nome
  if (/[<>:"|?*\x00-\x1f]/.test(file.name)) {
    return {
      isValid: false,
      error: 'Nome do arquivo contém caracteres inválidos'
    };
  }

  return { isValid: true };
}

/**
 * Valida a assinatura do arquivo (magic numbers)
 */
async function validateFileSignature(file: File): Promise<FileValidationResult> {
  const expectedSignature = FILE_SIGNATURES[file.type];
  
  if (!expectedSignature) {
    // Se não temos assinatura conhecida, permitir mas com aviso
    return { 
      isValid: true, 
      warnings: ['Tipo de arquivo sem validação de assinatura disponível'] 
    };
  }

  try {
    const buffer = await file.slice(0, expectedSignature.length).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    for (let i = 0; i < expectedSignature.length; i++) {
      if (bytes[i] !== expectedSignature[i]) {
        return {
          isValid: false,
          error: `Arquivo ${file.type} inválido ou corrompido (assinatura não confere)`
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Erro ao verificar assinatura do arquivo'
    };
  }
}

/**
 * Escaneia o arquivo em busca de conteúdo suspeito
 */
async function scanForSuspiciousContent(file: File): Promise<FileValidationResult> {
  try {
    // Para arquivos de texto, verificar conteúdo
    if (file.type.startsWith('text/') || file.type === 'application/pdf') {
      const text = await file.text();
      
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(text)) {
          return {
            isValid: false,
            error: 'Arquivo contém conteúdo suspeito ou potencialmente malicioso'
          };
        }
      }
    }

    // Para imagens, verificar metadados EXIF suspeitos
    if (file.type.startsWith('image/')) {
      const buffer = await file.arrayBuffer();
      const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(text)) {
          return {
            isValid: false,
            error: 'Imagem contém metadados suspeitos'
          };
        }
      }
    }

    return { isValid: true };
  } catch (error) {
    // Se não conseguir ler o arquivo, permitir mas com aviso
    return { 
      isValid: true, 
      warnings: ['Não foi possível escanear o arquivo completamente'] 
    };
  }
}

/**
 * Valida dimensões de imagem
 */
async function validateImageDimensions(
  file: File, 
  options: Required<FileValidationOptions>
): Promise<FileValidationResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const warnings: string[] = [];
      
      if (img.width > options.maxWidth || img.height > options.maxHeight) {
        resolve({
          isValid: false,
          error: `Dimensões da imagem muito grandes. Máximo: ${options.maxWidth}x${options.maxHeight}px, atual: ${img.width}x${img.height}px`
        });
        return;
      }

      // Avisos para imagens muito pequenas
      if (img.width < 32 || img.height < 32) {
        warnings.push('Imagem muito pequena, pode ter qualidade ruim');
      }

      // Avisos para proporções estranhas
      const aspectRatio = img.width / img.height;
      if (aspectRatio > 10 || aspectRatio < 0.1) {
        warnings.push('Proporção da imagem incomum');
      }

      resolve({ 
        isValid: true, 
        warnings: warnings.length > 0 ? warnings : undefined 
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        error: 'Não foi possível carregar a imagem (arquivo corrompido?)'
      });
    };

    img.src = url;
  });
}

/**
 * Sanitiza o nome do arquivo
 */
function sanitizeFileName(file: File): File {
  // Remover caracteres perigosos e normalizar
  let sanitizedName = file.name
    .replace(/[<>:"|?*\x00-\x1f]/g, '_') // Caracteres inválidos
    .replace(/\s+/g, '_') // Espaços
    .replace(/_{2,}/g, '_') // Múltiplos underscores
    .replace(/^_+|_+$/g, '') // Underscores no início/fim
    .toLowerCase();

  // Garantir que tenha extensão
  const extension = getFileExtension(file.name);
  if (!sanitizedName.endsWith(extension.toLowerCase())) {
    sanitizedName += extension.toLowerCase();
  }

  // Limitar tamanho do nome
  if (sanitizedName.length > 100) {
    const ext = getFileExtension(sanitizedName);
    const nameWithoutExt = sanitizedName.slice(0, sanitizedName.lastIndexOf('.'));
    sanitizedName = nameWithoutExt.slice(0, 100 - ext.length) + ext;
  }

  // Criar novo arquivo com nome sanitizado
  return new File([file], sanitizedName, { type: file.type });
}

/**
 * Extrai a extensão do arquivo
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot);
}

/**
 * Valida múltiplos arquivos
 */
export async function validateMultipleFiles(
  files: FileList | File[], 
  options: Partial<FileValidationOptions> = {}
): Promise<{ valid: File[]; invalid: { file: File; error: string }[] }> {
  const valid: File[] = [];
  const invalid: { file: File; error: string }[] = [];

  for (const file of Array.from(files)) {
    const result = await validateFileSecurely(file, options);
    
    if (result.isValid && result.sanitizedFile) {
      valid.push(result.sanitizedFile);
    } else {
      invalid.push({ file, error: result.error || 'Erro desconhecido' });
    }
  }

  return { valid, invalid };
}

/**
 * Configurações específicas por tipo de upload
 */
export const UPLOAD_CONFIGS = {
  COMPANY_LOGO: {
    maxSize: 3 * 1024 * 1024, // 3MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    requireImageDimensions: true,
    maxWidth: 1024,
    maxHeight: 1024
  },
  
  SERVICE_ATTACHMENT: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.txt', '.doc', '.docx'],
    requireImageDimensions: false
  },
  
  ADMIN_ASSET: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    requireImageDimensions: true,
    maxWidth: 2048,
    maxHeight: 2048
  }
} as const;

/**
 * Hook para validação de arquivos em componentes React
 */
export function useFileValidation(config: keyof typeof UPLOAD_CONFIGS) {
  const validateFiles = async (files: FileList | File[]) => {
    return validateMultipleFiles(files, UPLOAD_CONFIGS[config]);
  };

  const validateSingleFile = async (file: File) => {
    return validateFileSecurely(file, UPLOAD_CONFIGS[config]);
  };

  return { validateFiles, validateSingleFile };
}