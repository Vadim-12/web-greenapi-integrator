import { expect, test } from '@playwright/test'

test('платформы переключаются и не смешивают чаты', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.app-shell')).toHaveAttribute('data-messenger', 'telegram')

  await page.getByRole('button', { name: 'WA' }).click()
  await expect(page.locator('.app-shell')).toHaveAttribute('data-messenger', 'whatsapp')
  await expect(page).toHaveTitle('WhatsApp — сообщения')

  await page.getByRole('button', { name: /Новый чат/ }).click()
  await page.getByLabel('Имя контакта').fill('E2E WhatsApp')
  await page.getByLabel('Идентификатор чата').fill('e2e-whatsapp-chat')
  await page.getByRole('button', { name: 'Создать чат' }).click()
  await expect(page.getByText('E2E WhatsApp').first()).toBeVisible()

  await page.getByRole('button', { name: 'TG' }).click()
  await expect(page.locator('.app-shell')).toHaveAttribute('data-messenger', 'telegram')
  await expect(page.getByText('E2E WhatsApp').first()).not.toBeVisible()

  await page.getByRole('button', { name: 'MAX' }).click()
  await expect(page.locator('.app-shell')).toHaveAttribute('data-messenger', 'max')
  await expect(page).toHaveTitle('MAX — сообщения')
})

test('подключает инстанс и отправляет сообщение в созданный чат', async ({ page }) => {
  let sentPayload = ''
  await page.route('**/receiveNotification**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })
  await page.route('**/sendMessage/**', async (route) => {
    sentPayload = route.request().postData() || ''
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ idMessage: 'message-id' }) })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByLabel('ID инстанса').fill('1100000001')
  await page.getByLabel('API-токен').fill('token')
  await page.getByRole('button', { name: 'Подключить' }).click()

  await page.getByRole('button', { name: /Новый чат/ }).click()
  await page.getByLabel('Имя контакта').fill('Тестовый контакт')
  await page.getByLabel('Идентификатор чата').fill('12345678')
  await page.getByRole('button', { name: 'Создать чат' }).click()
  await page.getByLabel('Текст сообщения').fill('Проверка отправки')
  await page.getByRole('button', { name: 'Отправить' }).click()

  await expect.poll(() => sentPayload).toContain('"chatId":"12345678"')
  expect(sentPayload).toContain('"message":"Проверка отправки"')
  await expect(page.locator('.message.mine', { hasText: 'Проверка отправки' })).toBeVisible()
})

test('на узком экране оставляет доступными основные действия', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Настройки' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Новый чат/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'WA' })).toBeVisible()
})

test('в демо-чате имитирует прочтение локального сообщения', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Текст сообщения').fill('Демо-проверка')
  await page.getByRole('button', { name: 'Отправить' }).click()

  const message = page.locator('.message.mine', { hasText: 'Демо-проверка' })
  await expect(message).toBeVisible()
  await expect(message.locator('em')).toHaveAttribute('title', 'Прочитано')
})

test('восстанавливает настройки инстанса после перезагрузки', async ({ page }) => {
  await page.route('**/receiveNotification**', (route) => route.abort())
  await page.goto('/')
  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByLabel('Адрес API').fill('https://test.api.green-api.com')
  await page.getByLabel('ID инстанса').fill('1100000001')
  await page.getByLabel('API-токен').fill('token-for-reload')
  await page.getByRole('button', { name: 'Подключить' }).click()
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('green-api-test:connection-settings:v1') || '')).toContain('token-for-reload')

  await page.reload()
  await page.getByRole('button', { name: 'Настройки' }).click()
  await expect(page.getByLabel('Адрес API')).toHaveValue('https://test.api.green-api.com')
  await expect(page.getByLabel('ID инстанса')).toHaveValue('1100000001')
  await expect(page.getByLabel('API-токен')).toHaveValue('token-for-reload')
})

test('после подключения заменяет демо-чаты списком из API', async ({ page }) => {
  await page.route('**/receiveNotification**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })
  await page.route('**/getChats/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ chatId: '12345678', name: 'Реальный чат' }]) }))
  await page.route('**/getChatHistory/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
    { idMessage: 'new', type: 'outgoing', timestamp: 1735725660, textMessage: 'Ответ из истории', statusMessage: 'read' },
    { idMessage: 'old', type: 'incoming', timestamp: 1735725600, textMessage: 'Сообщение из истории' },
  ]) }))
  await page.goto('/')
  await expect(page.locator('.chat-list').getByText('Алексей Смирнов')).toBeVisible()

  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByLabel('ID инстанса').fill('1100000001')
  await page.getByLabel('API-токен').fill('token')
  await page.getByRole('button', { name: 'Подключить' }).click()

  await expect(page.locator('.chat-list').getByText('Реальный чат')).toBeVisible()
  await expect(page.locator('.chat-list').getByText('Алексей Смирнов')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Выберите чат' })).toBeVisible()
  await page.locator('.chat-list').getByText('Реальный чат').click()
  await expect(page.locator('.messages').getByText('Сообщение из истории')).toBeVisible()
  await expect(page.locator('.messages').getByText('Ответ из истории')).toBeVisible()

  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByRole('button', { name: 'Подключить' }).click()
  await expect(page.locator('.chat-list').getByText('Реальный чат')).toBeVisible()
  await expect(page.getByLabel('Загрузка чатов')).not.toBeVisible()
})

test('показывает скелетоны во время загрузки чатов и истории', async ({ page }) => {
  await page.route('**/receiveNotification**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })
  await page.route('**/getChats/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ chatId: '42', name: 'Чат со скелетоном' }]) })
  })
  await page.route('**/getChatHistory/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ idMessage: '1', type: 'incoming', textMessage: 'История загружена' }]) })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByLabel('ID инстанса').fill('1100000001')
  await page.getByLabel('API-токен').fill('token')
  await page.getByRole('button', { name: 'Подключить' }).click()

  await expect(page.getByRole('complementary').getByLabel('Загрузка чатов')).toBeVisible()
  await page.getByText('Чат со скелетоном').click()
  await expect(page.getByLabel('Загрузка истории')).toBeVisible()
  await expect(page.getByText('История загружена')).toBeVisible()
})

test('переводит фокус в модалку и удерживает Tab-навигацию внутри неё', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Настройки' }).click()

  await expect(page.getByRole('button', { name: 'Закрыть' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Адрес API')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('ID инстанса')).toBeFocused()

  await page.getByRole('button', { name: 'Закрыть' }).focus()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('link', { name: /Как создать инстанс/ })).toBeFocused()
})
