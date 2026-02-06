import pandas as pd
import numpy as np
import psycopg2
from psycopg2 import extras

from config import Config
import psycopg2

def calcular_metricas():
    try:
        conn = psycopg2.connect(**Config.DB_PARAMS)
        
        query = """
        SELECT entrada_saida, data, movimentacao, produto, instituicao, quantidade, preco_unitario, valor_operacao 
        FROM investimentos_extrato
        """
        df = pd.read_sql(query, conn)
        conn.close()
        
        df['Ticker'] = df['produto'].str.split(' - ').str[0]

        df = df.sort_values(by='data')

        proventos_lista = ['Dividendo', 'Juros Sobre Capital Próprio', 'Rendimento', 'PAGAMENTO DE JUROS']
        compras_lista = ['Compra', 'APLICAÇÃO', 'Bonificação em Ativos', 'Transferência - Liquidação']

        resultados = []

        for ticker, grupo in df.groupby('Ticker'):
            qtd_atual = 0.0
            custo_total = 0.0
            dividendos_acumulados = 0.0
            
            for _, linha in grupo.iterrows():
                tipo = linha['movimentacao']
                valor = float(linha['valor_operacao'])
                qtd = float(linha['quantidade'])
                sentido = linha['entrada_saida']
                
                if tipo in proventos_lista:
                    dividendos_acumulados += valor
                    
                elif (tipo in compras_lista) or (tipo == 'COMPRA / VENDA' and sentido == 'Credito'):
                    custo_total += valor
                    qtd_atual += qtd
                    
                elif (tipo in ['Venda', 'Resgate', 'VENCIMENTO']) or (tipo == 'COMPRA / VENDA' and sentido == 'Debito'):
                    if qtd_atual > 0:
                        pm_atual = custo_total / qtd_atual
                        qtd_atual -= qtd
                        custo_total = qtd_atual * pm_atual 
                    else:
                        qtd_atual = 0
                        custo_total = 0

            if qtd_atual > 0 or dividendos_acumulados > 0:
                pm_final = custo_total / qtd_atual if qtd_atual > 0 else 0
                resultados.append({
                    'Ativo': ticker,
                    'Qtd': qtd_atual,
                    'Preço Médio': pm_final,
                    'Total Investido': custo_total,
                    'Dividendos': dividendos_acumulados,
                    'YoC (%)': (dividendos_acumulados / custo_total * 100) if custo_total > 0 else 0
                })

        df_final = pd.DataFrame(resultados).sort_values(by='Total Investido', ascending=False)
        
        pd.options.display.float_format = '{:,.2f}'.format
        print(df_final.to_string(index=False))
        
        return df_final

    except Exception as e:
        print(f"Erro ao processar dados: {e}")

if __name__ == "__main__":
    df_resultado = calcular_metricas()