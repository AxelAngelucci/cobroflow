"""Authentication and registration business logic service.

Encapsulates operations that combine multiple persistence concerns
(Organization + User creation in a single transaction) and credential
verification, which do not belong in a simple CRUD layer.
"""

from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.crud.user import get_user_by_email
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.schemas.auth import UserRegister


def register_user_with_organization(db: Session, user_data: UserRegister) -> User:
    """Register a new user and create their organization in a single transaction.

    The registering user receives the ADMIN role — they are the owner of the
    newly created organization.
    """
    hashed_password = get_password_hash(user_data.password)

    # Create organization first
    organization = Organization(
        name=user_data.company_name,
        cuit=user_data.cuit,
        industry_type=user_data.industry_type,
        company_size=user_data.company_size,
        monthly_collection_volume=user_data.monthly_collection_volume,
    )
    db.add(organization)
    db.flush()  # Obtain the organization ID without committing yet

    # Create user with admin role (they are creating the organization)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        phone=user_data.phone,
        hashed_password=hashed_password,
        organization_id=organization.id,
        role=UserRole.ADMIN,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Ensure the organization relationship is loaded
    db.refresh(user, ["organization"])

    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Return the User if credentials are valid, otherwise None.

    Checks existence, presence of a hashed password, and bcrypt verification.
    """
    user = get_user_by_email(db, email)

    if not user:
        return None

    if not user.hashed_password:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user
