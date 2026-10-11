import { formatDateBR } from './date-utils';

interface WhatsAppChargeParams {
  telefone: string;
  nomeCliente: string;
  valorParcela: number;
  numeroParcela: number;
  totalParcelas: number;
  dataVencimento: string;
  descricaoProdutos?: string;
  chavePix?: string;
  nomeConsultora?: string;
}

/**
 * Normaliza número de telefone brasileiro para formato internacional do WhatsApp (55DDXXXXXXXXX)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55')) {
    return digits;
  }
  return `55${digits}`;
}

/**
 * Gera o link wa.me dinâmico com mensagem personalizada e amigável para cobrança
 */
export function generateWhatsAppChargeLink({
  telefone,
  nomeCliente,
  valorParcela,
  numeroParcela,
  totalParcelas,
  dataVencimento,
  descricaoProdutos,
  chavePix = process.env.NEXT_PUBLIC_CONSULTANT_PIX || '',
  nomeConsultora = process.env.NEXT_PUBLIC_CONSULTANT_NAME || 'sua Consultora Mary Kay',
}: WhatsAppChargeParams): string {
  const cleanPhone = formatPhoneForWhatsApp(telefone);
  const valorFormatado = valorParcela.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const dataFormatada = formatDateBR(dataVencimento);

  const primeiroNome = nomeCliente.split(' ')[0];

  let mensagem = `Olá, ${primeiroNome}! Tudo bem? ✨\n\n`;
  mensagem += `Passando para lembrar da parcela *${numeroParcela}/${totalParcelas}* da sua comprinha Mary Kay`;
  
  if (descricaoProdutos) {
    mensagem += ` (${descricaoProdutos})`;
  }
  
  mensagem += `, no valor de *${valorFormatado}*, com vencimento para *${dataFormatada}*.\n\n`;

  if (chavePix) {
    mensagem += `🔑 *Chave Pix:* \`${chavePix}\`\n\n`;
  }

  mensagem += `Assim que realizar o pagamento, você pode me enviar o comprovante por aqui. Muito obrigada pelo carinho e preferência! 💖\n\n`;
  mensagem += `_– ${nomeConsultora}_`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensagem)}`;
}
