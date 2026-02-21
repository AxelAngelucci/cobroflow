from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.security import get_password_hash, verify_password
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.schemas.auth import UserRegister


def get_user_by_email(db: Session, email: str) -> User | None:
    """Get a user by email."""
    stmt = select(User).where(User.email == email)
    return db.execute(stmt).scalar_one_or_none()


def get_user_by_id(db: Session, user_id: UUID) -> User | None:
    """Get a user by ID with organization."""
    stmt = (
        select(User)
        .options(joinedload(User.organization))
        .where(User.id == user_id)
    )
    return db.execute(stmt).scalar_one_or_none()


def register_user_with_organization(db: Session, user_data: UserRegister) -> User:
    """Register a new user and create their organization."""
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
    db.flush()  # Get the organization ID without committing
    
    # Create user with admin role (they're creating the organization)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        phone=user_data.phone,
        hashed_password=hashed_password,
        organization_id=organization.id,
        role=UserRole.ADMIN,  # Creator is admin
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Load the organization relationship
    db.refresh(user, ["organization"])
    
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Authenticate a user by email and password."""
    user = get_user_by_email(db, email)
    
    if not user:
        return None
    
    if not user.hashed_password:
        return None
    
    if not verify_password(password, user.hashed_password):
        return None
    
    return user
