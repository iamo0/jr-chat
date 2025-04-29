document.addEventListener('DOMContentLoaded', function() {
  // DOM элементы
  const messagesContainer = document.getElementById('messagesContainer');
  const usernameInput = document.getElementById('usernameInput');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const headerMenuButton = document.getElementById('headerMenuButton');
  const headerDropdown = document.getElementById('headerDropdown');
  const editNameOption = document.getElementById('editNameOption');
  const logoutOption = document.getElementById('logoutOption');
  const nameModal = document.getElementById('nameModal');
  const newNameInput = document.getElementById('newNameInput');
  const saveNameButton = document.getElementById('saveNameButton');
  const cancelNameButton = document.getElementById('cancelNameButton');
  const currentDateElement = document.getElementById('currentDate');

  // Константы и переменные
  const API_URL = 'http://localhost:4000';
  const POLLING_INTERVAL = 3000; // 3 секунды
  let lastMessageId = 0;
  let pollingTimeout;
  let lastClickedMessage = null;
  let activeDropdown = null;

  // Установка текущей даты
  const today = new Date();
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  currentDateElement.textContent = today.toLocaleDateString('en-GB', options);

  // Сохранение имени пользователя в localStorage
  function saveUsername(username) {
    localStorage.setItem('chatUsername', username);
    usernameInput.value = username;
  }

  // Загрузка имени пользователя из localStorage при загрузке страницы
  function loadUsername() {
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
      usernameInput.value = savedUsername;
    }
  }

  // Форматирование времени сообщения
  function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Создание элемента сообщения
  function createMessageElement(message) {
    const messageElement = document.createElement('article');
    messageElement.className = 'message';
    messageElement.dataset.id = message.id;

    // Определяем, является ли сообщение нашим
    const currentUsername = usernameInput.value;
    if (message.username === currentUsername) {
      messageElement.classList.add('own');
    }

    // Формирование классов для автора сообщения
    let authorClass = '';
    if (message.username.toLowerCase() === 'junior') {
      authorClass = 'junior';
    } else if (message.username.toLowerCase() === 'senior') {
      authorClass = 'senior';
    }

    // Создаем содержимое сообщения
    messageElement.innerHTML = `
            <div class="message-author ${authorClass}">${message.username}</div>
            <button class="message-control" data-id="${message.id}"></button>
            <div class="message-dropdown" id="dropdown-${message.id}">
                <div class="dropdown-item view-option">View</div>
                <div class="dropdown-item edit-option">Edit</div>
                <div class="dropdown-item delete delete-option">Delete</div>
                <div class="dropdown-item item-option last-item">Item</div>
            </div>
            <p class="message-text">${formatMessageText(message.text)}</p>
            <time>${formatMessageTime(message.timestamp)}</time>
        `;

    return messageElement;
  }

  // Форматирование текста сообщения (добавление смайликов и т.д.)
  function formatMessageText(text) {
    // Заменяем простые смайлики на эмодзи
    const formattedText = text
        .replace(/:\)/g, '😊')
        .replace(/:\(/g, '😔')
        .replace(/:D/g, '😁')
        .replace(/;\)/g, '😉')
        .replace(/<3/g, '❤️');

    // Можно добавить больше замен для других смайликов

    return formattedText;
  }

  // Рендеринг сообщений
  function renderMessages(messages) {
    // Сохраняем текущую позицию прокрутки
    const isScrolledToBottom = messagesContainer.scrollHeight - messagesContainer.clientHeight <= messagesContainer.scrollTop + 10;

    // Добавляем новые сообщения
    for (const message of messages) {
      // Проверяем, есть ли уже сообщение с таким ID
      const existingMessage = document.querySelector(`.message[data-id="${message.id}"]`);
      if (!existingMessage) {
        const messageElement = createMessageElement(message);
        messagesContainer.appendChild(messageElement);

        // Обновляем lastMessageId
        if (message.id > lastMessageId) {
          lastMessageId = message.id;
        }
      }
    }

    // Прокручиваем вниз, если пользователь был внизу до добавления новых сообщений
    if (isScrolledToBottom) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // Отправка сообщения
  function sendMessage() {
    const username = usernameInput.value.trim();
    const messageText = messageInput.value.trim();

    // Проверка длины имени пользователя и текста сообщения
    if (username.length < 2 || username.length > 50) {
      alert('Username must be between 2 and 50 characters');
      return;
    }

    if (messageText.length < 1 || messageText.length > 500) {
      alert('Message must be between 1 and 500 characters');
      return;
    }

    // Сохраняем имя пользователя
    saveUsername(username);

    // Создаем объект сообщения
    const message = {
      username: username,
      text: messageText,
      timestamp: new Date().toISOString()
    };

    // Отправляем на сервер
    fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to send message');
          }
          // Очищаем поле ввода сообщения
          messageInput.value = '';

          // Получаем новые сообщения немедленно
          fetchMessages();
        })
        .catch(error => {
          console.error('Error sending message:', error);
          alert('Failed to send message. Please try again.');
        });
  }

  // Получение сообщений с сервера
  function fetchMessages() {
    // Отменяем предыдущий запрос, если он есть
    if (pollingTimeout) {
      clearTimeout(pollingTimeout);
    }

    // Запрашиваем сообщения с сервера, начиная с последнего известного ID
    fetch(`${API_URL}/messages?since=${lastMessageId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch messages');
          }
          return response.json();
        })
        .then(messages => {
          if (messages.length > 0) {
            renderMessages(messages);
          }

          // Устанавливаем таймер для следующего запроса
          pollingTimeout = setTimeout(fetchMessages, POLLING_INTERVAL);
        })
        .catch(error => {
          console.error('Error fetching messages:', error);
          // Повторяем попытку через интервал
          pollingTimeout = setTimeout(fetchMessages, POLLING_INTERVAL);
        });
  }

  // Инициализация чата
  function initChat() {
    // Загружаем имя пользователя
    loadUsername();

    // Запрашиваем первоначальные сообщения
    fetch(`${API_URL}/messages`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch messages');
          }
          return response.json();
        })
        .then(messages => {
          renderMessages(messages);

          // Прокручиваем до последнего сообщения
          messagesContainer.scrollTop = messagesContainer.scrollHeight;

          // Запускаем регулярный опрос сервера
          pollingTimeout = setTimeout(fetchMessages, POLLING_INTERVAL);
        })
        .catch(error => {
          console.error('Error initializing chat:', error);
          alert('Failed to load messages. Please refresh the page.');
        });
  }

  // Обработка клика по кнопке отправки сообщения
  sendButton.addEventListener('click', sendMessage);

  // Обработка нажатия Enter в поле ввода сообщения
  messageInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  // Обработка клика по кнопке меню в заголовке
  headerMenuButton.addEventListener('click', function(event) {
    event.stopPropagation();
    toggleDropdown(headerDropdown);
  });

  // Обработка клика по опции изменения имени
  editNameOption.addEventListener('click', function() {
    newNameInput.value = usernameInput.value;
    nameModal.style.display = 'flex';
    closeAllDropdowns();
  });

  // Обработка клика по опции выхода
  logoutOption.addEventListener('click', function() {
    localStorage.removeItem('chatUsername');
    usernameInput.value = '';
    closeAllDropdowns();
  });

  // Обработка клика по кнопке сохранения имени
  saveNameButton.addEventListener('click', function() {
    const newName = newNameInput.value.trim();
    if (newName.length >= 2 && newName.length <= 50) {
      saveUsername(newName);
      nameModal.style.display = 'none';
    } else {
      alert('Username must be between 2 and 50 characters');
    }
  });

  // Обработка клика по кнопке отмены изменения имени
  cancelNameButton.addEventListener('click', function() {
    nameModal.style.display = 'none';
  });

  // Обработка клика вне модального окна для его закрытия
  nameModal.addEventListener('click', function(event) {
    if (event.target === nameModal) {
      nameModal.style.display = 'none';
    }
  });

  // Обработка клика по кнопке меню сообщения
  messagesContainer.addEventListener('click', function(event) {
    const controlButton = event.target.closest('.message-control');
    if (controlButton) {
      event.stopPropagation();
      const messageId = controlButton.dataset.id;
      const dropdown = document.getElementById(`dropdown-${messageId}`);
      toggleDropdown(dropdown);
    }
  });

  // Функция для переключения видимости выпадающего меню
  function toggleDropdown(dropdown) {
    // Закрываем предыдущее открытое меню
    if (activeDropdown && activeDropdown !== dropdown) {
      activeDropdown.style.display = 'none';
    }

    // Переключаем текущее меню
    if (dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
      activeDropdown = null;
    } else {
      dropdown.style.display = 'block';
      activeDropdown = dropdown;
    }
  }

  // Закрытие всех выпадающих меню
  function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-menu, .message-dropdown');
    dropdowns.forEach(dropdown => {
      dropdown.style.display = 'none';
    });
    activeDropdown = null;
  }

  // Обработка клика вне выпадающих меню для их закрытия
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.dropdown-menu') && !event.target.closest('.message-dropdown') &&
        !event.target.closest('.menu-button') && !event.target.closest('.message-control')) {
      closeAllDropdowns();
    }
  });

  // Инициализация чата
  initChat();
});