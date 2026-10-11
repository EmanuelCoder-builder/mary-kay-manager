import { addDaysToDate, getTodayRecife } from './date-utils';

export interface CalculatedInstallment {
  numero_da_parcela: number;
  valor_parcela: number;
  data_vencimento: string;
  status_pago: boolean;
}

/**
 * Calcula as parcelas de uma venda permitindo definir quando a cliente vai pagar
 * a 1ª parcela (ou pagamento à vista combinado para outra data, ex: sexta-feira).
 *
 * RN01 - Arredondamento de Parcelas: Se a divisão não for exata (ex: 100 / 3 = 33.33),
 * a diferença de centavos (0.01) é somada à última parcela (33.34).
 *
 * RN02 - Vendas à Vista / Parcela Única: Vencimento na data combinada (hoje ou data futura).
 */
export function calculateInstallments(
  valorTotal: number,
  totalParcelas: number,
  primeiroVencimento?: string,
  dataVenda?: string
): CalculatedInstallment[] {
  if (totalParcelas < 1) {
    throw new Error('O número de parcelas deve ser no mínimo 1.');
  }

  const baseDueDate = primeiroVencimento || dataVenda || getTodayRecife();

  // Caso RN02: Parcela única / à vista com data combinada
  if (totalParcelas === 1) {
    return [
      {
        numero_da_parcela: 1,
        valor_parcela: Number(valorTotal.toFixed(2)),
        data_vencimento: baseDueDate,
        status_pago: false,
      },
    ];
  }

  // Divisão em centavos para evitar imprecisões de ponto flutuante
  const totalCents = Math.round(valorTotal * 100);
  const baseInstallmentCents = Math.floor(totalCents / totalParcelas);
  const remainderCents = totalCents - baseInstallmentCents * totalParcelas;

  const installments: CalculatedInstallment[] = [];

  for (let i = 1; i <= totalParcelas; i++) {
    const isLast = i === totalParcelas;
    const centsForThis = isLast ? baseInstallmentCents + remainderCents : baseInstallmentCents;
    const valorParcela = centsForThis / 100;

    // A 1ª parcela vence na data combinada (baseDueDate).
    // As parcelas seguintes vencem a cada 30 dias a partir da 1ª.
    const dataVencimento = i === 1 
      ? baseDueDate 
      : addDaysToDate(baseDueDate, (i - 1) * 30);

    installments.push({
      numero_da_parcela: i,
      valor_parcela: Number(valorParcela.toFixed(2)),
      data_vencimento: dataVencimento,
      status_pago: false,
    });
  }

  return installments;
}
