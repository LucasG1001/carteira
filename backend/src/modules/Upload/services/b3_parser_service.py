import io
import openpyxl
from datetime import datetime
from src.modules.Portfolio.models.transaction_model import Transaction
from src.core.exceptions import BusinessException

class B3ParserService:
    @staticmethod
    def parse_excel(file_content: bytes, upload_id: int, user_id: str) -> list[Transaction]:
        try:
            wb = openpyxl.load_workbook(io.BytesIO(file_content), data_only=True)
            if "Movimentação" in wb.sheetnames:
                sheet = wb["Movimentação"]
            else:
                # If named differently, grab the first sheet
                sheet = wb.worksheets[0]
                
            transactions = []
            
            # Read header mapping
            headers = {}
            for idx, cell in enumerate(sheet[1]):
                if cell.value:
                    headers[cell.value.strip()] = idx
            
            required_cols = ["Entrada/Saída", "Data", "Movimentação", "Produto", "Instituição", "Quantidade", "Preço unitário", "Valor da Operação"]
            for col in required_cols:
                if col not in headers:
                    raise BusinessException(400, f"Coluna obrigatória não encontrada: {col}")

            for row in sheet.iter_rows(min_row=2, values_only=True):
                # Skip empty rows
                if not any(row):
                    continue
                
                movimentacao = str(row[headers["Movimentação"]]).strip()
                produto = str(row[headers["Produto"]]).strip()
                
                # Extract Ticker from "TICKER - NOME"
                ticker = produto.split(" - ")[0].strip()
                if not ticker:
                    continue

                raw_data = row[headers["Data"]]
                if isinstance(raw_data, datetime):
                    date_val = raw_data.date()
                else:
                    try:
                        date_val = datetime.strptime(str(raw_data), "%d/%m/%Y").date()
                    except ValueError:
                        continue # If date is invalid, skip

                # Parse quantities and values
                def safe_float(val):
                    if val is None or str(val).strip() == "-":
                        return 0.0
                    if isinstance(val, str):
                        # Some Brazilian files format number with comma
                        val = val.replace(".", "").replace(",", ".")
                    try:
                        return float(val)
                    except ValueError:
                        return 0.0

                quantidade = safe_float(row[headers["Quantidade"]])
                preco_unitario = safe_float(row[headers["Preço unitário"]])
                valor_operacao = safe_float(row[headers["Valor da Operação"]])

                transaction = Transaction(
                    upload_id=upload_id,
                    user_id=user_id,
                    ticker=ticker,
                    operation_type=movimentacao,
                    date=date_val,
                    quantity=quantidade,
                    unit_price=preco_unitario,
                    operation_value=valor_operacao
                )
                transactions.append(transaction)
            
            return transactions
        except openpyxl.utils.exceptions.InvalidFileException:
            raise BusinessException(400, "Arquivo inválido ou corrompido. Envie um arquivo Excel (.xlsx).")
        except BusinessException:
            raise
        except Exception as e:
            raise BusinessException(500, f"Erro inesperado ao processar arquivo B3: {str(e)}")
