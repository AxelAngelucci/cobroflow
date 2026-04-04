from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.user import User


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
