from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.crud.user import get_user_by_email
from app.services.auth_service import authenticate_user, register_user_with_organization
from app.db.session import get_db
from app.schemas.auth import Token, UserAuthResponse, UserLogin, UserRegister
from app.api.deps import CurrentUser

router = APIRouter()


@router.post("/register", response_model=UserAuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserRegister,
    db: Annotated[Session, Depends(get_db)],
) -> UserAuthResponse:
    """
    Register a new user with their organization.
    
    The user who registers becomes the admin of the new organization.
    """
    # Check if user already exists
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create new user with organization
    user = register_user_with_organization(db, user_data)
    
    return user


@router.post("/login", response_model=Token)
def login(
    login_data: UserLogin,
    db: Annotated[Session, Depends(get_db)],
) -> Token:
    """Login and get JWT token."""
    user = authenticate_user(db, login_data.email, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=str(user.id))
    
    return Token(access_token=access_token)


@router.get("/me", response_model=UserAuthResponse)
def get_current_user_info(current_user: CurrentUser) -> UserAuthResponse:
    """Get current authenticated user info."""
    return current_user
