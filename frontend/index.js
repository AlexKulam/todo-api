// Refactored full Todo App code
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

const apiBaseUrl = 'http://localhost:8000';
async function login(login, password) {
    const formData = new FormData();
    formData.append('login', login);
    formData.append('password', password);
    const response = await fetch(`${apiBaseUrl}/login`, { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Неверные учетные данные');
    return response.json();
}
async function signup(login, email, password) {
    const formData = new FormData();
    formData.append('login', login);
    formData.append('email', email);
    formData.append('password', password);
    const response = await fetch(`${apiBaseUrl}/signup`, { method: 'POST', body: formData });
    if (!response.ok) throw new Error((await response.json()).detail || 'Ошибка регистрации');
    return response.json();
}
async function createTask(uid, task) {
    const res = await fetch(`${apiBaseUrl}/users/${uid}/tasks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(task)
    });
    if (!res.ok) throw new Error('Ошибка создания задачи');
    return res.json();
}
async function getTasks(uid) {
    const r = await fetch(`${apiBaseUrl}/users/${uid}/tasks`);
    if (!r.ok) throw new Error('Ошибка загрузки задач');
    return r.json();
}
async function updateTask(id, task) {
    const res = await fetch(`${apiBaseUrl}/tasks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(task) });
    if (!res.ok) throw new Error('Ошибка обновления');
    return res.json();
}
async function deleteTask(id) {
    const res = await fetch(`${apiBaseUrl}/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Ошибка удаления');
    return res.json();
}

let user = null;
let editingId = null;

function render() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    if (!user) {
        const path = location.hash.slice(1) || 'login';
        (path === 'signup' ? renderSignup : renderLogin)();
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
    <input id="login" placeholder="Логин" required>
    <input type="password" id="password" placeholder="Пароль" required>
    <p id="error" class="error"></p>
    <button>Войти</button>
  </form>
  <p>Нет аккаунта? <a href="#signup">Регистрация</a></p>
</div>`;
    const form = app.querySelector('#login-form');
    form.onsubmit = async (e) => {
        e.preventDefault();
        form.querySelector('#error').textContent = '';
        try {
            const data = await login(form.login.value, form.password.value);
            user = { id: data.user_id, login: form.login.value };
            location.hash = 'tasks';
            render();
        } catch (err) { form.querySelector('#error').textContent = err.message; }
    };
}

function renderSignup() {
    const app = document.getElementById('app');
    app.innerHTML = `
<div class="auth-container">
  <h2>Регистрация</h2>
  <form id="signup-form">
    <input id="login" placeholder="Логин" required>
    <input id="email" placeholder="Email" required>
    <input type="password" id="password" placeholder="Пароль" required>
    <p id="error" class="error"></p>
    <button>Зарегистрироваться</button>
  </form>
  <p>Уже есть аккаунт? <a href="#login">Войти</a></p>
</div>`;
    const form = app.querySelector('#signup-form');
    form.onsubmit = async (e) => {
        e.preventDefault();
        form.querySelector('#error').textContent = '';
        try {
            const data = await signup(form.login.value, form.email.value, form.password.value);
            user = { id: data.user_id, login: form.login.value };
            location.hash = 'tasks';
            render();
        } catch (err) { form.querySelector('#error').textContent = err.message; }
    };
}

function renderTasks() {
    const app = document.getElementById('app');
    app.innerHTML = `
<nav class="navbar">
  <h1>Todo App</h1>
  <div>
    <span>Привет, ${escapeHtml(user.login)}</span>
    <button id="logout">Выйти</button>
  </div>
</nav>
<div class="task-container">
  <h2>Ваши задачи</h2>
  <form id="task-form">
    <input id="title" placeholder="Название" required>
    <textarea id="description" placeholder="Описание"></textarea>
    <p id="task-error" class="error"></p>
    <button>Добавить</button>
  </form>
  <div id="task-list"></div>
</div>`;
    document.getElementById('logout').onclick = () => { user = null; location.hash = 'login'; render(); };
    document.getElementById('task-form').onsubmit = async (e) => {
        e.preventDefault();
        const t = title.value.trim(), d = description.value.trim();
        const err = document.getElementById('task-error');
        if (!t) { err.textContent = 'Название обязательно'; return; }
        try {
            await createTask(user.id, { title: t, description: d });
            title.value = ''; description.value = '';
            err.textContent = '';
            loadTasks();
        } catch (x) { err.textContent = x.message; }
    };
    attachTaskHandlers();
    loadTasks();
}

function attachTaskHandlers() {
    const list = document.getElementById('task-list');
    list.onclick = (e) => {
        const el = e.target.closest('.task-item');
        if (!el) return;
        const id = el.dataset.id;
        if (e.target.matches('.edit-task')) { editingId = id; loadTasks(); }
        else if (e.target.matches('.delete-task')) { if (confirm('Удалить?')) deleteTask(id).then(loadTasks); }
        else if (e.target.matches('.cancel-edit')) { editingId = null; loadTasks(); }
        else if (e.target.matches('input[type="checkbox"]')) {
            updateTask(id, { is_completed: e.target.checked }).catch(er => { alert(er); e.target.checked = !e.target.checked; });
        }
    };
    list.onsubmit = (e) => {
        const form = e.target.closest('.edit-form');
        if (form) {
            e.preventDefault();
            const id = form.dataset.id;
            const t = form.querySelector('.edit-title').value.trim();
            const d = form.querySelector('.edit-description').value;
            if (!t) { form.querySelector('.edit-error').textContent = 'Название обязательно'; return; }
            updateTask(id, { title: t, description: d }).then(() => { editingId = null; loadTasks(); }).catch(err => { form.querySelector('.edit-error').textContent = err.message; });
        }
    };
}

async function loadTasks() {
    const list = document.getElementById('task-list');
    try {
        const tasks = await getTasks(user.id);
        list.innerHTML = tasks.map(task => editingId == task.id ?
            `<div class="task-item" data-id="${task.id}">
              <form class="edit-form" data-id="${task.id}">
                <input class="edit-title" value="${escapeHtml(task.title)}" required>
                <textarea class="edit-description">${escapeHtml(task.description || '')}</textarea>
                <p class="edit-error error"></p>
                <button type="submit">Сохранить</button>
                <button type="button" class="cancel-edit">Отмена</button>
              </form>
            </div>`
            :
            `<div class="task-item" data-id="${task.id}">
              <h3>${escapeHtml(task.title)}</h3>
              <p>${escapeHtml(task.description || '')}</p>
              <input type="checkbox" ${task.is_completed ? 'checked' : ''}>
              <button class="edit-task">Редактировать</button>
              <button class="delete-task">Удалить</button>
            </div>`
        ).join('');
    } catch (err) {
        list.innerHTML = `<p class="error">Ошибка загрузки задач: ${escapeHtml(err.message)}</p>`;
    }
}

// Навигация
window.addEventListener('hashchange', render);
window.addEventListener('load', render);
