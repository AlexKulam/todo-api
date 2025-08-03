from fastapi import FastAPI
from .database import Base, engine
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .log_in import router as log_in_router
from .sign_up import router as sign_up_router
from .todo import router as todo_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Todo App API",
    description="API для управления задачами с авторизацией и регистрацией",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/", response_class=FileResponse)
async def read_index():
    return "frontend/index.html"

app.include_router(log_in_router)
app.include_router(sign_up_router)
app.include_router(todo_router)

