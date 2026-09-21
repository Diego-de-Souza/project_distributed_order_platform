"""
Exceções de domínio/aplicação, sem nenhum import de FastAPI ou SQLAlchemy.
Igual à API Java: quem decide o status HTTP é a camada de apresentação
(app/presentation/error_handlers.py), não o domínio nem os casos de uso.
"""


class DomainError(Exception):
    """Base de toda exceção que carrega uma mensagem segura para o cliente."""


class NotFoundError(DomainError):
    """Recurso não encontrado -> HTTP 404."""


class BusinessRuleError(DomainError):
    """Violação de regra de negócio -> HTTP 400."""


class ConflictError(DomainError):
    """SKU duplicado ou perda de optimistic lock -> HTTP 409."""


class GatewayError(DomainError):
    """Falha de transporte ao falar com o gateway de pagamento (justifica retry)."""
