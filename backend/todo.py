from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import crud, schemas
from .database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/users/{user_id}/tasks")
def create_task(user_id: int, task: schemas.TaskCreate, db: Session = Depends(get_db)):
    return crud.create_task(db, task, user_id)


@router.get("/users/{user_id}/tasks", response_model=list[schemas.TaskOut])
def get_tasks(user_id: int, db: Session = Depends(get_db)):
    return crud.get_user_tasks(db, user_id)


@router.put("/tasks/{task_id}", response_model=schemas.TaskOut)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db)):
    updated = crud.update_task(db, task_id, task)
    if not updated:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return updated
