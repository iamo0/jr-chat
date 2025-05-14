/**
 * Требования:
 * - Прозрачная обратная связь — в любой момент времени пользователь
 *   должен понимать что происходит с интерфейсомы
 *   - Можно ли писать текст сообщения?
 *   - Валидно ли сообщение, которое он отправляет и можно ли его отправить?
 *   - После отправки 
 *    - началась ли отправка?
 *    - пришло ли сообщение на сервер? удачно ли?
 *    - [отображение сообщения в списке]
 * 
 * 1. Я нажал на кнопку отправить
 * 2. На сервер ушел POST-запрос
 * 3. Сервер обработал этот запрос
 * 4. Вернул мне ответ
 * 5. Я обработал ответ, понял есть ли ошибка
 * 6. Если нет ошибки — показал это
 * 6.1 Если есть ошибка — показал это
 * 
 * Хорошо бы дать возможность пользователю не отправлять одно и то же сообщение
 * несколько раз
 * 
 * Способы обратной связи 
 * 1. Ничего не делать
 * 2. Все заблокировать
 *   1. Заблокировать поле ввода и кнопку и поменять текст на кнопке
 *   2. Если удачно — разблокировать и вернуть текст обратно, очистить форму и отобразить обновленный список сообщений
 *   3. Если ошибка — разблокировать и вернуть текст обратно, не сбрасывать форму и показать ошибку
 * 3. Optimistic UI
 *   1. Мгновенно обновляет список сообщений и показывает наше сообщение в списке
 *      Очищает форму и дает возможность отправить новое сообщение
 *      Вновь созданному сообщению добавляет визуальный индикатор о его состоянии
 * 
 * 
 * 
 * 
 * Ввод имени пользователя
 * - [x] изначально имя пользователя не задано - null
 * 
 * - [x] если имени пользователя нет — показываем соответствующий экран
 * - [ ] при вводе имя сохраняется в localStorage
 * - [ ] введенное имя отправляется в каждом сообщении
 * 
 * - при рендеринге списка сообщений, если имя пользователя совпадает с 
 *   введенным именем, это сообщение показывается справа
 */


{
  const USERNAME_REC = "username";
  let messagesInterval = null;
  let isMenuOpen = false; 

  let username = null;

  const chatContainer = document.querySelector(".messages");
  const usernameContainer = document.querySelector(".username");

  function renderMessages(messages) {
    chatContainer.innerHTML = "";

    for (const message of messages) {
      const messageElement = document.createElement("article");
      messageElement.className = "message";
      messageElement.classList.toggle("message-mine", username === message.username);
      messageElement.dataset.messageId = message.id;

      messageElement.innerHTML = `
      <div class="message-header">
        <div class="message-author">${message.username}</div>
        ${username === message.username ? 
          `<button class="message-menu-btn">⋯</button>
           <div class="message-menu">
             <button class="message-edit">Edit</button>
             <button class="message-delete">Delete</button>
           </div>` : ''}
      </div>
      <p class="message-text">${message.text}</p>
      <time class="message-time">${message.timestamp}</time>
    `;

      chatContainer.appendChild(messageElement);
    }
  }

  function getMessages(cb) {
    fetch("http://localhost:4000/messages", {
      method: "GET",
    })
      .then(function (messagesResponse) {
        if (messagesResponse.status !== 200) {
          throw new Error("Couldn't get messages from server");
        }

        return messagesResponse.json();
      })
      .then(function (messagesList) {
        // Сохраняем состояние открытых меню
      const openMenus = Array.from(document.querySelectorAll('.message-menu.show'))
        .map(menu => menu.closest('.message').dataset.messageId);

        renderMessages(messagesList);

        // Восстанавливаем открытые меню после рендера
      openMenus.forEach(id => {
        const message = document.querySelector(`[data-message-id="${id}"]`);
        if (message) {
          const menu = message.querySelector('.message-menu');
          menu?.classList.add('show');
        }
      });


        if (typeof cb === "function") {
          cb();
        }
      });
  }

  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function initForm() {
    const formContainer = document.querySelector("#message-form");

    const formTextField = formContainer.querySelector("textarea");
    const formSubmitButton = formContainer.querySelector("button");

    const usernameField = formContainer.querySelector("input[name=username]");
    usernameField.value = username;

    formContainer.onsubmit = function(evt) {
      evt.preventDefault();

      const formData = new FormData(evt.target);

      const messageData = {
        username: formData.get("username"),
        text: formData.get("text"),
      };

      formTextField.disabled = true;
      formSubmitButton.disabled = true;
      formSubmitButton.classList.add('sending');

      fetch("http://localhost:4000/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      })
        .then(response => {
        if (!response.ok) throw new Error('Ошибка отправки');
        formTextField.value = "";
        return getMessages(scrollToBottom);
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Не удалось отправить сообщение');
      })
      .finally(() => {
        formTextField.disabled = false;
        formSubmitButton.disabled = false;
        formSubmitButton.classList.remove('sending');
      });
    }
  }

  function initChat() {
    // HTTP
    // Request --> Response
    // Polling

    // Websocket
    // Message <--> Message
    getMessages();
    startPolling();
    initForm();

    // Как правильно скроллить?
    // - Когда мы сами отправили [новое сообщение]
    // - Когда мы находимся внизу списка и пришло [новое сообщение]
    // - Когда мы только загрузили страницу

    // | | | | | | | | | |
    //        | ||  ||| |

     chatContainer.addEventListener('click', async (e) => {
    const messageElement = e.target.closest('.message');
    const menuBtn = e.target.closest('.message-menu-btn');
    const editBtn = e.target.closest('.message-edit');
    const deleteBtn = e.target.closest('.message-delete');
    const menu = document.querySelector('.message-menu.show');

    // Обработка клика по кнопке меню
    if (menuBtn) {
      e.stopPropagation();
      document.querySelectorAll('.message-menu').forEach(m => m.classList.remove('show'));
      const menu = menuBtn.nextElementSibling;
      menu.classList.add('show');
      isMenuOpen = true;
      stopPolling();
      return;
    }

    // Закрытие меню при клике вне
    if (!e.target.closest('.message-menu') && menu) {
      menu.classList.remove('show');
      isMenuOpen = false;
      startPolling();
    }

    // Обработка редактирования
    if (editBtn) {
       const textElement = messageElement.querySelector('.message-text');
      const originalText = textElement.textContent;
      
      // Создаем поле редактирования
      const input = document.createElement('textarea');
      input.value = originalText;
      textElement.replaceWith(input);
      input.focus();

      // Сохраняем изменения
      input.addEventListener('blur', async () => {
        const newText = input.value.trim();
        if (newText && newText !== originalText) {
          try {
            await fetch(`http://localhost:4000/messages/${messageElement.dataset.messageId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: newText })
            });
            getMessages();
            menu.classList.remove('show');
isMenuOpen = false;
startPolling();
          } catch (error) {
            alert('Error updating message');
          }
        } else {
          textElement.textContent = originalText;
          input.replaceWith(textElement);
        }
      });
    }

    // Обработка удаления
    if (deleteBtn) {
      if (confirm('Delete this message?')) {
        try {
          await fetch(`http://localhost:4000/messages/${messageElement.dataset.messageId}`, {
            method: 'DELETE'
          });
          messageElement.remove();
          menu.classList.remove('show');
isMenuOpen = false;
startPolling();
        } catch (error) {
          alert('Error deleting message');
        }
      }
    }
  });

  // Добавьте этот обработчик для закрытия меню при клике вне
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.message-menu') && !e.target.closest('.message-menu-btn')) {
      document.querySelectorAll('.message-menu').forEach(menu => {
        menu.classList.remove('show');
        isMenuOpen = false;
        startPolling();
      });
    }
  });

    
  }

  function startPolling() {
  if (!messagesInterval) {
    messagesInterval = setInterval(() => {
      if (!isMenuOpen) getMessages();
    }, 3000);
  }
}

function stopPolling() {
  clearInterval(messagesInterval);
  messagesInterval = null;
}

  // Форма может жить в двух состояниях — модальное окно показано и модальное окно
  // не показано
  // Режим когда окно не показано может быть инициализирован после того как 
  // имя пользователя было введено
  // При создании функционала некоего модуля, который описывает работу
  // с DOM, нужно описывать не только инициализацию, но и "разрушение"
  // этого модуля
  function initUsernameForm() {
    const usernameForm = usernameContainer.querySelector("form");

    usernameForm.onsubmit = function(evt) {
      evt.preventDefault();

      const formElement = evt.target;
      const formData = new FormData(formElement);
      const enteredUsername = formData.get("username");

      localStorage.setItem(USERNAME_REC, enteredUsername);

      usernameContainer.close();
      usernameForm.onsubmit = null;

      initApp();
    };

    usernameContainer.showModal();
  }

  // Модальное приложение
  // Модальность — зависимость от состояния
  // В нашем случае режим переключается наличием username
  // - есть username — режим чата
  // - нет username — режим ввода username
  function initApp() {
    username = localStorage.getItem(USERNAME_REC);

    // Скрываем/показываем форму чата
  const messageForm = document.querySelector('#message-form');
  if (messageForm) messageForm.style.display = username ? 'block' : 'none';

    if (username === null) {
    initUsernameForm();
  } else {
    initChat();
  }
  
  
  initLogoutButton();
  }

  initApp();

  function initLogoutButton() {
  const logoutButton = document.querySelector('.logout-button');
  if (!logoutButton) return;

  logoutButton.onclick = function() {
    // 1. Очищаем данные пользователя
    localStorage.removeItem(USERNAME_REC);
    username = null;
    
    // 2. Останавливаем опрос сообщений
    if (messagesInterval) {
      clearInterval(messagesInterval);
      messagesInterval = null;
    }
    
    // 3. Очищаем чат
    chatContainer.innerHTML = '';
    
    // 4. Закрываем текущий чат и показываем форму входа
    const messageForm = document.querySelector('#message-form');
    if (messageForm) messageForm.style.display = 'none';
    
    // 5. Переинициализируем приложение
    initApp();
  };
}

}