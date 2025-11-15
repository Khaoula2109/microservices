class ApiException(Exception):
    status_code = 500
    message = "Une erreur interne est survenue."

    def __init__(self, message=None, status_code=None):
        super().__init__(message)
        if message is not None:
            self.message = message
        if status_code is not None:
            self.status_code = status_code

    def to_dict(self):
        return {
            "status": self.status_code,
            "message": self.message
        }

class NotFoundException(ApiException):
    def __init__(self, message="Ressource non trouvée"):
        super().__init__(message, 404)

class ValidationException(ApiException):
    def __init__(self, message="Validation a échoué"):
        super().__init__(message, 400)

