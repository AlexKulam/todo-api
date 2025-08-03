// API helper
const apiBaseUrl = 'http://localhost:8000';

async function login(login, password) {
    const formData = new FormData();
    formData.append('login', login);
    formData.append('password', password);
    const response = await fetch(`${apiBaseUrl}/login`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) throw new Error('Неверные учетные данные');
    return response.json();
}

async function signup(login, email, password) {
    const formData = new FormData();
    formData.append('login', login);
    formData.append('email', email);
    formData.append('password', password);
    const response = await fetch(`${apiBaseUrl}/signup`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) throw new Error((await response.json()).detail || 'Ошибка регистрации');
    return response.json();
}

async function createTask(userId, task) {
    const response = await fetch(`${apiBaseUrl}/users/${userId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error('Ошибка создания задачи');
    return response.json();
}

async function getTasks(userId) {
    const response = await fetch(`${apiBaseUrl}/users/${userId}/tasks`);
    if (!response.ok) throw new Error('Ошибка загрузки задач');
    return response.json();
}

async function updateTask(taskId, task) {
    const response = await fetch(`${apiBaseUrl}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error('Ошибка обновления задачи');
    return response.json();
}

// State
let user = null;

// DOM manipulation
function render() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    if (!user) {
        const path = window.location.hash.slice(1) || 'login';
        if (path === 'signup') {
            renderSignup();
        } else {
            renderLogin();
        }
    } else {
        renderTasks();
    }
}

function renderLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="auth-container">
            <h2>Вход</h2>
            <form id="login-form">
                <input type="text" id="login" placeholder="Логин" required>
                <input type="password" id="password" placeholder="Пароль" required>
                <p id="error" class="error"></p>
                <button type="submit">Войти</button>
            </form>
            <p>Нет аккаунта? <a href="#signup">Зарегистрируйтесь</a></p>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginInput = document.getElementById('login').value;
        const password = document.getElementById('password').value;
        const error = document.getElementById('error');

        try {
            await login(loginInput, password);
            user = { id: 1, login: loginInput }; // Заглушка для ID
            window.location.hash = 'tasks';
            render();
        } catch (err) {
            error.textContent = err.message;
        }
    });
}

function renderSignup() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="auth-container">
            <h2>Регистрация</h2>
            <form id="signup-form">
                <input type="text" id="login" placeholder="Логин" required>
                <input type="email" id="email" placeholder="Email" required>
                <input type="password" id="password" placeholder="Пароль" required>
                <p id="error" class="error"></p>
                <button type="submit">Зарегистрироваться</button>
            </form>
            <p>Уже есть аккаунт? <a href="#login">Войдите</a></p>
        </div>
    `;

    document.getElementById('signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginInput = document.getElementById('login').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const error = document.getElementById('error');

        try {
            await signup(loginInput, email, password);
            window.location.hash = 'login';
            render();
        } catch (err) {
            error.textContent = err.message;
        }
    });
}

function renderTasks() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <nav class="navbar">
            <h1>Todo App</h1>
            <div>
                <span>Привет, ${user.login}</span>
                <button id="logout">Выйти</button>
            </div>
        </nav>
        <div class="task-container">
            <h2>Ваши задачи</h2>
            <form id="task-form">
                <input type="text" id="title" placeholder="Название задачи" required>
                <textarea id="description" placeholder="Описание"></textarea>
                <p id="task-error" class="error"></p>
                <button type="submit">Добавить задачу</button>
            </form>
            <div id="task-list" class="task-list"></div>
        </div>
    `;

    document.getElementById('logout').addEventListener('click', () => {
        user = null;
        window.location.hash = 'login';
        render();
    });

    document.getElementById('task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const error = document.getElementById('task-error');

        try {
            await createTask(user.id, { title, description });
            document.getElementById('title').value = '';
            document.getElementById('description').value = '';
            fetchTasks();
        } catch (err) {
            error.textContent = err.message;
        }
    });

    fetchTasks();
}

async function fetchTasks() {
    const taskList = document.getElementById('task-list');
    const error = document.getElementById('task-error');

    try {
        const tasks = await getTasks(user.id);
        taskList.innerHTML = tasks.map(task => `
            <div class="task-item">
                <h3>${task.title}</h3>
                <p>${task.description || ''}</p>
                <input type="checkbox" ${task.is_completed ? 'checked' : ''} data-id="${task.id}">
            </div>
        `).join('');

        taskList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', async (e) => {
                const taskId = e.target.dataset.id;
                try {
                    await updateTask(taskId, { is_completed: e.target.checked });
                    fetchTasks();
                } catch (err) {
                    error.textContent = err.message;
                }
            });
        });
    } catch (err) {
        error.textContent = err.message;
    }
}

// Handle navigation
window.addEventListener('hashchange', render);
window.addEventListener('load', render);