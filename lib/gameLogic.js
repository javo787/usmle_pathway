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

  // Ultradian rhythm (focus sessions): +2 per session, max 10
  const focusBonus    = Math.min((data.academic.focusSessions || 0) * 2, 10);
  // Teach-back bonus: +3 if not empty
  const teachBackBonus = (data.academic.teachBack && data.academic.teachBack.trim().length > 0) ? 3 : 0;

  const academicScore = germanScore + ankiScore + uniScore + pubBonus + clinicBonus + researchBonus + focusBonus + teachBackBonus;

  // Намозлар 20б
  let spiritualScore = (data.spiritual.prayersDone / MAX_PRAYERS) * 20;
  // Sleep quality bonus: +3 if >= 4
  if ((data.spiritual.sleepQuality || 0) >= 4) spiritualScore += 3;

  // Спорт 15б
  const sportScore    = data.sport.didSport ? 15 : 0;

  // Режа 10б + coreIdea 2б
  const hasSchedule = (data.planning.schedule && data.planning.schedule.length > 5);
  const coreIdeaBonus = (data.planning.coreIdea && data.planning.coreIdea.trim().length > 0) ? 2 : 0;
  const planningScore = (hasSchedule ? 10 : 0) + coreIdeaBonus;

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
