import pandas as pd
from sqlalchemy import create_engine
from pathlib import Path

# 1. Configurações
# Nome do arquivo exatamente como baixado da B3 (extensão .xlsx)
nome_arquivo = Path('movimentacoes') / 'movimentacao-2026-02-06-14-07-09.xlsx'

# String de Conexão com o Banco (Neon PostgreSQL)
db_string = ""

def limpar_dados_b3(df):
    """
    Função para limpar e padronizar os dados vindos do Excel da B3.
    """
    # Renomear colunas para padrão de banco de dados (snake_case)
    # As colunas padrão da B3 costumam ser:
    # 'Entrada/Saída', 'Data', 'Movimentação', 'Produto', 'Instituição', 'Quantidade', 'Preço unitário', 'Valor da Operação'
    mapa_colunas = {
        'Entrada/Saída': 'entrada_saida',
        'Data': 'data',
        'Movimentação': 'movimentacao',
        'Produto': 'produto',
        'Instituição': 'instituicao',
        'Quantidade': 'quantidade',
        'Preço unitário': 'preco_unitario',
        'Valor da Operação': 'valor_operacao'
    }
    df = df.rename(columns=mapa_colunas)
    
    # Converter a coluna de Data
    df['data'] = pd.to_datetime(df['data'], dayfirst=True, errors='coerce')

    colunas_numericas = ['quantidade', 'preco_unitario', 'valor_operacao']

    for col in colunas_numericas:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        df[col] = df[col].fillna(0.0)

    return df

def main():
    print(f"Lendo arquivo Excel: {nome_arquivo}...")
    try:
        # AQUI ESTÁ A MUDANÇA: engine='openpyxl' é o padrão para xlsx moderno
        df = pd.read_excel(nome_arquivo)
        print(df)
    except FileNotFoundError:
        print(f"Erro: Arquivo '{nome_arquivo}' não encontrado na pasta.")
        return
    except Exception as e:
        print(f"Erro ao ler o Excel: {e}")
        return

    print("Tratando dados...")
    df_limpo = limpar_dados_b3(df)

    print("Conectando ao banco de dados...")
    try:
        engine = create_engine(db_string)
        
        # Salvar no banco
        # 'if_exists' define o comportamento se a tabela já existir:
        # 'fail': falha (padrão)
        # 'replace': apaga a tabela antiga e cria uma nova
        # 'append': adiciona os dados ao final da tabela existente
        df_limpo.to_sql('investimentos_extrato', engine, if_exists='replace', index=False)
        
        print(f"Sucesso! {len(df_limpo)} linhas salvas na tabela 'investimentos_extrato'.")
        
    except Exception as e:
        print(f"Erro ao salvar no banco: {e}")

if __name__ == "__main__":
    main()