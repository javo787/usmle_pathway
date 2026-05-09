// utils/streakLevels.js
const LEVELS = [
  { min: 100, name: 'Афсона', emoji: '🌟' },
  { min: 60,  name: 'Ҳақиқий Доктор', emoji: '🎓' },
  { min: 30,  name: 'Нейрохирург йўлида', emoji: '👑' },
  { min: 14,  name: 'Собит', emoji: '🏆' },
  { min: 7,   name: 'Мужоҳид', emoji: '🔥' },
  { min: 3,   name: 'Иродали', emoji: '🌱' },
  { min: 0,   name: 'Бошланиш', emoji: '🌿' }
];

function getCurrentLevel(streak) {
  for (const level of LEVELS) {
    if (streak >= level.min) return level;
  }
  return LEVELS[LEVELS.length - 1];
}

function getNextLevel(streak) {
  const current = getCurrentLevel(streak);
  const idx = LEVELS.indexOf(current);
  if (idx > 0) return LEVELS[idx - 1]; // следующий выше
  return null; // уже на максимальном
}

module.exports = { LEVELS, getCurrentLevel, getNextLevel };
