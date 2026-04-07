import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserRegister, UserLogin, UserOut, UserProfileUpdate, Token
from services.auth_service import hash_password, verify_password, create_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

PROFILE_FIELDS = ["wake_time", "sleep_time", "work_style", "goal", "avoid", "extra"]


def _build_profile(data) -> str | None:
    profile = {k: getattr(data, k, None) for k in PROFILE_FIELDS}
    if any(v for v in profile.values()):
        return json.dumps(profile, ensure_ascii=False)
    return None


@router.post("/register", response_model=Token, status_code=201)
def register(body: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
        profile=_build_profile(body),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return Token(access_token=create_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return Token(access_token=create_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=UserOut)
def update_profile(
    body: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Merge with existing profile
    existing = json.loads(current_user.profile) if current_user.profile else {}
    updates = body.model_dump(exclude_none=True)
    existing.update(updates)
    current_user.profile = json.dumps(existing, ensure_ascii=False)
    db.commit()
    db.refresh(current_user)
    return current_user
