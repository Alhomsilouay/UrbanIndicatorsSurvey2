export function computePriority(r: Record<string, any>): 'عالية' | 'متوسطة' | 'منخفضة' {
  let score = 0;
  const bad = ['سيئ', 'سيئ جداً'];
  
  const check = (key: string, w: number) => {
    if (bad.includes(r[key])) score += w;
  };

  check('pavement', 2);
  check('sidewalk', 1);
  check('lighting', 1);
  check('cleanness', 1);
  check('drainage', 1);

  if (r.sensitivity === 'عالي') score += 2;
  else if (r.sensitivity === 'متوسط') score += 1;

  if (r.traffic === 'عالي') score += 2;
  else if (r.traffic === 'متوسط') score += 1;

  if (r.waste === 'يوجد كثيراً') score += 2;
  else if (r.waste === 'يوجد قليلاً') score += 1;

  if (r.sewage === 'لا يوجد') score += 1;

  if (score >= 8) return 'عالية';
  if (score >= 4) return 'متوسطة';
  return 'منخفضة';
}
