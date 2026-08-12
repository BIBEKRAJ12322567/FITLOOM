export function calculateBMI(weightKg, heightCm) {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let category = 'Normal';
  let tone = 'success';
  if (bmi < 18.5) {
    category = 'Underweight';
    tone = 'warning';
  } else if (bmi >= 25 && bmi < 30) {
    category = 'Overweight';
    tone = 'warning';
  } else if (bmi >= 30) {
    category = 'Obese';
    tone = 'danger';
  }
  return { bmi: Math.round(bmi * 10) / 10, category, tone };
}

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Mifflin-St Jeor equation — the most widely validated BMR formula for
// general use (more accurate than the older Harris-Benedict for most people).
export function calculateCalories({ weightKg, heightCm, age, sex, activityLevel, goal }) {
  const bmr =
    sex === 'female'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

  const tdee = bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.2);

  let target = tdee;
  if (goal === 'weight_loss') target = tdee - 500; // ~0.45kg/week deficit
  if (goal === 'muscle_gain') target = tdee + 300; // modest surplus to limit fat gain

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    target: Math.round(target),
  };
}

// U.S. Navy circumference method — doesn't require calipers, reasonably
// accurate for general tracking purposes. All measurements in cm.
export function calculateBodyFat({ sex, heightCm, neckCm, waistCm, hipCm }) {
  let bodyFat;
  if (sex === 'female') {
    bodyFat =
      495 /
        (1.29579 -
          0.35004 * Math.log10(waistCm + hipCm - neckCm) +
          0.221 * Math.log10(heightCm)) -
      450;
  } else {
    bodyFat =
      495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
  }

  let category = 'Fitness';
  let tone = 'success';
  const male = sex !== 'female';
  if ((male && bodyFat < 6) || (!male && bodyFat < 14)) {
    category = 'Essential fat';
    tone = 'warning';
  } else if ((male && bodyFat < 14) || (!male && bodyFat < 21)) {
    category = 'Athletic';
    tone = 'success';
  } else if ((male && bodyFat < 18) || (!male && bodyFat < 25)) {
    category = 'Fitness';
    tone = 'success';
  } else if ((male && bodyFat < 25) || (!male && bodyFat < 32)) {
    category = 'Average';
    tone = 'warning';
  } else {
    category = 'Above average';
    tone = 'danger';
  }

  return { bodyFat: Math.round(bodyFat * 10) / 10, category, tone };
}
