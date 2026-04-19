export const calculateScore = (data, goals) => {
  if (!data) return 0;
  
  // Агар мақсадлар йўқ бўлса, стандарт қийматлар олинади
  const MAX_FA = goals?.firstAid || 15;
  const MAX_UW = goals?.uWorld || 40;
  const MAX_ANKI = goals?.anki || 50;
  const MAX_PRAYERS = 5;

  const academicScore = 
    ((Math.min(data.academic.firstAidDone, MAX_FA) / MAX_FA) * 15) + 
    ((Math.min(data.academic.uWorldDone, MAX_UW) / MAX_UW) * 15) +   
    ((Math.min(data.academic.ankiDone, MAX_ANKI) / MAX_ANKI) * 10);

  const spiritualScore = (data.spiritual.prayersDone / MAX_PRAYERS) * 20;
  
  // Қўшимча баллар
  const sportScore = data.sport.didSport ? 15 : 0;
  const englishScore = data.english.practiced ? 15 : 0;
  const planningScore = (data.planning.schedule && data.planning.schedule.length > 5) ? 10 : 0;

  return Math.min(100, Math.round(academicScore + spiritualScore + sportScore + englishScore + planningScore));
};

export const determineMode = (score, penaltyDebt) => {
  if (penaltyDebt > 0) return 'critical';
  if (score < 50) return 'critical';
  if (score >= 85) return 'legend';
  return 'stable';
};

export const getSportPenalty = (academicData, sportData, goals) => {
  const targetUW = goals?.uWorld || 40;
  // Фақат спорт қилинмаган ВА UWorld кам бўлганда штраф
  const sportDone = sportData?.didSport || false;
  if (!sportDone && academicData.uWorldDone < (targetUW * 0.5)) {
    return { active: true, task: "100 Берпи (Штраф за лень)", required: true };
  }
  return { active: false, task: null, required: false };
};
