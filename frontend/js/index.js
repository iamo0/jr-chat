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

  let username = null;

  const chatContainer = document.querySelector(".messages");
  const usernameContainer = document.querySelector(".username");
  const usernameButton = document.querySelector("#logout");

  function renderMessages(messages) {
    chatContainer.innerHTML = "";

    for (const message of messages) {
      const messageElement = document.createElement("article");
      messageElement.className = "message";
      messageElement.classList.toggle("message-mine", username === message.username);

      messageElement.innerHTML = `
        <div class="message-header">
          <div class="message-author">${message.username}</div>
          <button class="message-control"></button>
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
        renderMessages(messagesList);

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
      formSubmitButton.textContent = "Сообщение отправляется...";

      fetch("http://localhost:4000/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      })
        .then(function(newMessageResponse) {
          if (newMessageResponse.status !== 200) {
            //
          }

          formTextField.disabled = false;
          formTextField.value = "";
          formSubmitButton.disabled = false;
          formSubmitButton.textContent = "Отправить";

          getMessages(scrollToBottom);
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
    setInterval(getMessages, 3000);
    initForm();

    // Как правильно скроллить?
    // - Когда мы сами отправили [новое сообщение]
    // - Когда мы находимся внизу списка и пришло [новое сообщение]
    // - Когда мы только загрузили страницу

    // | | | | | | | | | |
    //        | ||  ||| |
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
      usernameForm.reset();

      initApp();
    };

    usernameContainer.showModal();
  }

  function initLogoutButton() {
    usernameButton.hidden = username === null;
    usernameButton.textContent = username ?? "";

    usernameButton.onclick = username !== null
      ? function() {
        localStorage.removeItem(USERNAME_REC);
        initApp();
      }
      : null;
  }

  // Модальное приложение
  // Модальность — зависимость от состояния
  // В нашем случае режим переключается наличием username
  // - есть username — режим чата
  // - нет username — режим ввода username
  function initApp() {
    username = localStorage.getItem(USERNAME_REC);
    initLogoutButton();

    if (username === null) {
      initUsernameForm();
      return;
    }

    initChat();
  }

  initApp();
}
