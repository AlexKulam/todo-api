from fastapi import APIRouter, HTTPException, Depends, Form
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import User
from passlib.hash import bcrypt

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/signup")
def register_user(login: str = Form(...), email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    if db.query(User).filter(User.login == login).first():
        raise HTTPException(status_code=400, detail="Login already exists")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_password = bcrypt.hash(password)

    new_user = User(login=login, email=email, password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully", "user_id": new_user.id}

