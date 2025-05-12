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
 */

document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('username');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const messagesContainer = document.getElementById('messages');

const savedUsername = localStorage.getItem('chatUsername');
  if (savedUsername) {
    usernameInput.value = savedUsername;
  }
  usernameInput.addEventListener('change', () => {
    localStorage.setItem('chatUsername', usernameInput.value);
  });
{
  const container = document.querySelector(".messages");

  function renderMessages(messages) {
    container.innerHTML = "";

    for (const message of messages) {
      const messageElement = document.createElement("article");
      messageElement.className = "message";

      messageElement.innerHTML = `
        <div class="message-header">
          <div class="message-author">${message.username}</div>
          <button class="message-control"></button>
        </div>
        <p class="message-text">${message.text}</p>
        <time class="message-time">${message.timestamp}</time>
      `;

      container.appendChild(messageElement);
    }
  }

  function getMessages() {
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
        console.log(messagesList);
        renderMessages(messagesList);
      });
  }

  function initForm() {
    const formContainer = document.querySelector("form");

    const formTextField = formContainer.querySelector("textarea");
    const formSubmitButton = formContainer.querySelector("button");

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
          console.log(newMessageResponse.status);

          if (newMessageResponse.status !== 200) {
            //
          }

          formTextField.disabled = false;
          formTextField.value = "";
          formSubmitButton.disabled = false;
          formSubmitButton.textContent = "Отправить";

          getMessages();
        });
    }
  }

  function initChat() {
    getMessages();
    initForm();
  }

  initChat();
}
