const { CONFIG } = require('../config');

const getTashkentDate = () =>
  new Date(new Date().toLocaleString('en-US', { timeZone: CONFIG.timezone }));

const getToday = () => {
  const d = getTashkentDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getTashkentHour = () => getTashkentDate().getHours();
const getTashkentTime = () => {
  const d = getTashkentDate();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const DAY_NAMES = ['Якшанба', 'Душанба', 'Сешанба', 'Чоршанба', 'Пайшанба', 'Жума', 'Шанба'];

/**
 * Вычисляет остаток времени до дедлайна (createdAt + 24 часа)
 * @param {Date} createdAt
 * @returns {{ expired: boolean, hours: number, minutes: number, text: string }}
 */
function getTimeLeft(createdAt) {
  const now = new Date();
  const deadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
  const diff = deadline - now;
  if (diff <= 0) return { expired: true, hours: 0, minutes: 0, text: '0 соат 0 дақиқа' };
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { expired: false, hours, minutes, text: `${hours} соат ${minutes} дақиқа` };
}

module.exports = { getTashkentDate, getToday, getTashkentHour, getTashkentTime, DAY_NAMES, getTimeLeft };
