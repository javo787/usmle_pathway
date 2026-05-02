export const calculateScore = (data, goals) => {
  if (!data) return 0;

  const MAX_GERMAN = goals?.germanMinutes || 45;  // минут немецкого в день
  const MAX_ANKI   = goals?.anki          || 50;
  const MAX_UNI    = goals?.uniHours      || 4;   // часов на учёбу/кафедру
  const MAX_PRAYERS = 5;

  // Академик: немецкий 20б + анки 15б + универ 10б
  const germanScore = (Math.min(data.academic.germanMinutes || 0, MAX_GERMAN) / MAX_GERMAN) * 20;
  const ankiScore   = (Math.min(data.academic.ankiDone      || 0, MAX_ANKI)   / MAX_ANKI)   * 15;
  const uniScore    = (Math.min(data.academic.uniHours      || 0, MAX_UNI)    / MAX_UNI)    * 10;

  // Дополнительные активности: публикация, отделение, науч.рук.
  const pubBonus      = (data.academic.pubHours   || 0) > 0 ? 5 : 0;
  const clinicBonus   = data.academic.clinicVisit      ? 3 : 0;
  const researchBonus = data.academic.researchMeeting  ? 2 : 0;

  const academicScore = germanScore + ankiScore + uniScore + pubBonus + clinicBonus + researchBonus;

  // Намозлар 20б
  const spiritualScore = (data.spiritual.prayersDone / MAX_PRAYERS) * 20;

  // Спорт 15б
  const sportScore    = data.sport.didSport ? 15 : 0;

  // Режа 10б
  const planningScore = (data.planning.schedule && data.planning.schedule.length > 5) ? 10 : 0;

  return Math.min(100, Math.round(academicScore + spiritualScore + sportScore + planningScore));
};

export const determineMode = (score, penaltyDebt) => {
  if (penaltyDebt > 0) return 'critical';
  if (score < 50)      return 'critical';
  if (score >= 85)     return 'legend';
  return 'stable';
};

export const getSportPenalty = (academicData, sportData, goals) => {
  const targetGerman = goals?.germanMinutes || 45;
  const sportDone    = sportData?.didSport || false;
  if (!sportDone && (academicData.germanMinutes || 0) < (targetGerman * 0.5)) {
    return { active: true, task: '100 Берпи (Штраф за лень)', required: true };
  }
  return { active: false, task: null, required: false };
};
