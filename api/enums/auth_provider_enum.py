import enum


class AuthProviderEnum(enum.Enum):
    local = 'local'
    google = 'google'
    github = 'github'