import { addDaysToDate, getTodayRecife } from './date-utils';

export interface CalculatedInstallment {
  numero_da_parcela: number;
  valor_parcela: number;
  data_vencimento: string;
  status_pago: boolean;
}

/**
 * Calcula as parcelas de uma venda conforme RN01 e RN02 do PRD.
 *
 * RN01 - Arredondamento de Parcelas: Se a divisão não for exata (ex: 100 / 3 = 33.33),
 * a diferença de centavos (0.01) é somada à última parcela (33.34) para que a soma bata perfeitamente.
 *
 * RN02 - Vendas à Vista: Tratadas como 1 parcela com vencimento imediato (data da venda).
 */
export function calculateInstallments(
  valorTotal: number,
  totalParcelas: number,
  dataVenda?: string
): CalculatedInstallment[] {
  if (totalParcelas < 1) {
    throw new Error('O número de parcelas deve ser no mínimo 1.');
  }

  const baseDate = dataVenda || getTodayRecife();

  // Caso RN02: À vista (1 parcela)
  if (totalParcelas === 1) {
    return [
      {
        numero_da_parcela: 1,
        valor_parcela: Number(valorTotal.toFixed(2)),
        data_vencimento: baseDate,
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

    // Vencimentos: 1ª parcela a 30 dias, 2ª a 60 dias... ou conforme intervalo
    const dataVencimento = addDaysToDate(baseDate, i * 30);

    installments.push({
      numero_da_parcela: i,
      valor_parcela: Number(valorParcela.toFixed(2)),
      data_vencimento: dataVencimento,
      status_pago: false,
    });
  }

  return installments;
}
